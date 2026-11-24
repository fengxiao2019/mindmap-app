import type { MindNode, TopicDocument } from "../types";

const sampleTree: MindNode = {
  id: "root", title: "CS50网络安全导论", kicker: "CS50 · CYBERSECURITY", detail: "账号、数据、系统、软件、隐私五个维度", color: "#148fa0",
  children: [
    {
      id: "acct", side: "left", title: "账号安全", kicker: "ACCOUNTS", detail: "证明你是你，只给该给的权限", color: "#2f8b68",
      children: [
        { id: "acct-password", title: "密码强度与暴力破解", detail: "拉高攻击者所需的时间，同时在安全与好用之间取得平衡", facts: [{ label: "用户名与密码", value: "两种证明你有权访问账号的方式；理论上只有你能同时给出有效的用户名和密码" }, { label: "字典攻击与暴力破解", value: "攻击者拿很长的候选密码列表逐个去试" }, { label: "密码空间", value: "4 位数字只有 10×10×10×10 = 10,000 种，几毫秒就能穷举；4 个大小写字母是 52⁴，超过 700 万种；再加上数字和标点超过 7,800 万种，穷举明显更慢" }, { label: "核心", value: "只要拉高攻击者所需的时间，他就越没有时间破解你的密码" }, { label: "权衡", value: "更长更复杂的密码更难输入、更难记，安全与可用性之间要取舍；越安全的服务可能越不好用" }] },
        { id: "acct-nist", title: "NIST 密码建议", detail: "美国国家标准与技术研究院给出的账号保护建议（讲义为意译）", facts: [{ label: "长度", value: "记忆型秘密（密码）至少 8 个字符" }, { label: "字符", value: "校验方应允许所有可打印的 ASCII 字符和 Unicode 符号，长度可达 64 个字符" }, { label: "对照黑名单", value: "校验方应把候选密码与字典词、重复序列、已泄露的密码列表和与上下文相关的词做比对" }, { label: "密码提示", value: "不应让未认证的人看到密码提示" }, { label: "定期更换", value: "不应要求定期更换密码" }, { label: "失败次数", value: "应限制认证失败的次数，并锁定潜在的攻击者" }] },
        { id: "auth", title: "认证与授权", detail: "身份、权限与最小权限", facts: [{ label: "参考视频", value: "https://www.youtube.com/watch?v=iX8g4LqF8p8" }], children: [
          { id: "mfa", title: "多因素认证（MFA）：密码 + 验证器 / 硬件密钥", detail: "2FA / MFA：同时要求多种互不相同的证明", facts: [{ label: "知识", value: "只有你知道的东西" }, { label: "持有", value: "只有授权用户才持有的物品或设备" }, { label: "固有", value: "只有你本人才能提供的因素，比如指纹、面容或其他生物特征" }] },
          { id: "rbac", title: "RBAC、ABAC 与最小权限" },
          { id: "access", title: "水平越权、垂直越权" },
          { id: "token", title: "Token 过期、撤销与刷新" }
        ] },
        { id: "acct-otp", title: "一次性密码（OTP）", detail: "来自令牌设备或应用的一次性口令", facts: [{ label: "来源", value: "可以是专用的密钥牌 / 设备，也常常来自设备或 App" }, { label: "短信 OTP", value: "很容易被 SIM 卡交换（SIM swapping）攻击骗过：攻击者获取并克隆你的 SIM 卡，拿到你的短信" }, { label: "更安全", value: "来自安全设备上的验证器应用，比如手机上的身份验证 App" }] },
        { id: "acct-attacks", title: "常见账号攻击", detail: "技术手段与社会工程并存", children: [
          { id: "acct-keylogging", title: "键盘记录（Keylogging）", detail: "记录你的按键，用户名、密码和 OTP 都可能被偷", facts: [{ label: "做法", value: "在电脑上安装恶意软件来记录按键" }, { label: "对策", value: "只在只有你能访问的设备上登录" }] },
          { id: "acct-stuffing", title: "凭证填充（Credential Stuffing）", detail: "拿某个被攻破的网站泄露的账号密码，去别的网站试", facts: [{ label: "做法", value: "把从某个被入侵网站得到的用户名和密码列表，用在另一个网站上" }, { label: "对策", value: "如果你在多个网站用同一个密码，就改成各自唯一的密码" }] },
          { id: "acct-social", title: "社会工程（Social Engineering）", detail: "不靠技术，靠社交压力和信任", facts: [{ label: "做法", value: "冒充可信的一方，套取凭证或你生活中的细节" }, { label: "套取信息", value: "攻击者还会打听你的生活细节，比如宠物的名字" }] },
          { id: "acct-phishing", title: "钓鱼（Phishing）", detail: "用技术手段实施的社会工程，伪装成可信网站", facts: [{ label: "例子", value: "你被引到一个看起来像 Google 登录页、实际是攻击者页面的地方" }, { label: "对策", value: "不要盲目相信邮件里的链接；直接在浏览器里输入可信的网址" }] },
          { id: "acct-mitm", title: "中间人攻击（Machine-in-the-Middle）", detail: "你和数据来源之间的设备被攻陷", facts: [{ label: "风险", value: "你和下载来源之间的路由器、交换机等设备，可能被非常老练的攻击者攻陷" }] }
        ] },
        { id: "acct-session", title: "会话、令牌与单点登录", detail: "登录之后，服务端如何记住你", children: [
          { id: "web-cookie", title: "Cookie", detail: "浏览器保存的小数据；注意 HttpOnly、Secure、SameSite" },
          { id: "web-session", title: "Session", detail: "服务端保存的登录状态，客户端只持有会话 ID" },
          { id: "web-jwt", title: "JWT", detail: "自包含的签名令牌；难以撤销，务必校验签名并设置过期时间" },
          { id: "web-oauth2", title: "OAuth2", detail: "授权框架：第三方无需拿到密码，就能获得受限的访问权限" },
          { id: "acct-sso", title: "单点登录（SSO）", detail: "用 Google 或 Facebook 登录其他服务", facts: [{ label: "为什么需要", value: "服务太多、密码要求各不相同，而又不该给不同服务用同一个密码" }, { label: "做法", value: "用 Google 或 Facebook 账号登录并非由它们提供的服务" }, { label: "好处", value: "摩擦更少、安全性更高" }] }
        ] },
        { id: "acct-pwmanager", title: "密码管理器", detail: "替你生成并保存复杂密码", facts: [{ label: "作用", value: "管理复杂的密码并替你保存，你不用背下来" }, { label: "防钓鱼", value: "许多密码管理器能识别钓鱼网站" }, { label: "和浏览器存密码的区别", value: "浏览器保存密码已有多年；密码管理器是独立的软件，可以在多个服务里提供你的密码" }, { label: "代价", value: "等于把鸡蛋都放进一个篮子里：你得记住一个密码，去打开所有其他密码" }] },
        { id: "crypto-passkey", title: "通行密钥（Passkeys）", detail: "基于 WebAuthn，设备端公私钥取代密码", facts: [{ label: "标准", value: "WebAuthn / FIDO2" }, { label: "注册", value: "在设备上创建账号时，设备生成公私钥对，只把公钥发给网站；私钥不离开设备" }, { label: "登录", value: "用私钥对网站发来的挑战值（challenge）签名；可以是这台设备，或同步通行密钥的服务" }, { label: "好处", value: "抗钓鱼，服务器泄露也没有可用的密码" }, { label: "解锁方式", value: "指纹、面容或设备 PIN" }] }
      ]
    },
    {
      id: "datasec", side: "left", title: "数据安全", kicker: "CS50 · SECURE DATA", detail: "哈希、加密、签名、存储与脱敏", color: "#148fa0",
      children: [
        { id: "crypto-hash", title: "哈希与加盐", detail: "明文密码 → 固定长度哈希；加盐防彩虹表，相同密码哈希也不同", facts: [{ label: "哈希", value: "把明文密码交给哈希函数，得到难以阅读的哈希值；服务器只存用户名和哈希，登录时对输入再哈希并比对" }, { label: "单向哈希函数", value: "任意长度的输入 → 固定长度的输出；无法从哈希还原出密码，不同的密码也可能得到相同的哈希" }, { label: "典型算法", value: "SHA-256 等通用哈希；存密码用 bcrypt / scrypt / Argon2" }, { label: "攻击方式", value: "字典攻击（逐个尝试字典里的词）、暴力破解（逐字符穷举）、彩虹表（预先算好的哈希对照表）" }, { label: "加盐", value: "每个用户一个随机盐，和密码一起哈希，盐可以明文保存；相同的密码也会得到不同的哈希" }, { label: "NIST 建议", value: "记忆型秘密（密码）既要哈希，也要加盐" }, { label: "常见错误", value: "只用一次 SHA-256 存密码，或所有用户共用同一个盐" }] },
        { id: "crypto-sym", title: "对称加密", detail: "AES、3DES：收发双方用同一密钥；难点是密钥管理", facts: [{ label: "编码与加密", value: "编码把明文转换成码文，解码则相反；加密把明文变成密文，解密则相反" }, { label: "密钥", value: "一串很长的数据，参与加密和解密" }, { label: "典型算法", value: "AES-128 / 192 / 256" }, { label: "特点", value: "加解密同一把密钥，速度快，适合大量数据；收发双方共享这把密钥" }, { label: "难点", value: "密钥如何安全地分发和保存" }, { label: "已不推荐", value: "3DES、DES；不要自己发明加密算法" }, { label: "密码分析", value: "研究如何加密、如何破解数据的学科" }] },
        { id: "crypto-asym", title: "非对称加密", detail: "RSA、Diffie-Hellman：公钥 / 私钥，无需提前共享密钥", facts: [{ label: "典型算法", value: "RSA（建议 2048 位以上）、椭圆曲线（ECDH / ECDSA）、Diffie-Hellman" }, { label: "特点", value: "公钥可公开，私钥必须保密" }, { label: "解决的问题", value: "双方可能素未谋面，也无需提前共享密钥就能建立加密通信" }, { label: "加密流程", value: "发送方用公钥加密明文得到密文，接收方用自己的私钥解密；RSA 就是这类标准" }, { label: "密钥交换", value: "Diffie-Hellman 的目标是交换密钥：双方用约定的 g、素数 p 和各自的私钥，算出同一个共享秘密 s" }, { label: "常见用法", value: "TLS 握手中协商会话密钥，之后改用对称加密" }] },
        { id: "crypto-sign", title: "数字签名", detail: "私钥签名、公钥验证，保证真实性与完整性", facts: [{ label: "签名两步", value: "先把文档内容交给哈希函数得到哈希值，再把私钥和哈希值交给签名算法，得到数字签名" }, { label: "验证", value: "收件人对文档内容同样做哈希，再用公钥和签名还原出哈希值，两者一致才算通过" }, { label: "保证", value: "真实性（谁签的）与完整性（没被改过）" }, { label: "不保证", value: "机密性，签名本身不加密内容" }, { label: "典型算法", value: "RSA-PSS、ECDSA、Ed25519" }] },
        { id: "crypto-transit", title: "传输加密与端到端加密", detail: "TLS 与 E2EE 的区别；数据要正确删除", facts: [{ label: "传输加密（TLS）", value: "保护数据在网络中往返时不被中途截获；服务器能看到明文" }, { label: "中间方的风险", value: "邮件服务商等中间服务可能读取你的邮件或消息" }, { label: "端到端加密", value: "只有通信双方能解密，中间的任何第三方都看不到内容" }, { label: "普通删除", value: "操作系统通常只是「忘记」文件在哪，旧文件的痕迹可能残留在磁盘的空闲空间里" }, { label: "安全删除", value: "把残留内容改写成全 0、全 1 或随机序列" }, { label: "删除数据", value: "删除要考虑备份和副本；加密数据可通过销毁密钥来「删除」" }] },
        { id: "crypto-rest", title: "静态加密与未来挑战", detail: "全盘加密、勒索软件、量子计算对加密算法的冲击；数据脱敏", facts: [{ label: "静态加密", value: "全盘加密（如 FileVault、BitLocker）加密整块硬盘，设备丢失或转卖时别人读不到数据" }, { label: "代价", value: "忘记密码，或面容变化到无法解锁，自己也会失去数据" }, { label: "勒索软件", value: "黑客用同样的技术加密你的硬盘并勒索赎金；对策是离线、不可改写的备份" }, { label: "量子计算", value: "可能大幅缩短猜密码、破解加密所需的时间，并可能破解 RSA / 椭圆曲线；NIST 2024 年已发布 ML-KEM、ML-DSA 等抗量子标准" }] }
      ]
    },
    {
      id: "syssec", side: "right", title: "系统安全", kicker: "SYSTEMS", detail: "网络、架构、云与事件响应：局部失守时仍能限制影响", color: "#4a78b5",
      children: [
        { id: "web", title: "网络与 Web 基础", detail: "协议、会话与浏览器机制", children: [
          { id: "web-tcpip", title: "TCP/IP", detail: "网络通信的基础协议族：IP 负责寻址，TCP 负责可靠传输" },
          { id: "web-dns", title: "DNS", detail: "把域名解析成 IP；常见风险是劫持与缓存投毒" },
          { id: "web-http", title: "HTTP / HTTPS", detail: "Web 的应用层协议；HTTPS 就是 HTTP 加上 TLS", facts: [{ label: "HTTP", value: "不加密的数据传输方式" }, { label: "中间人攻击", value: "攻击者可以往你下载的页面里注入额外的 HTML，比如广告，甚至恶意代码" }, { label: "抓包（Packet sniffing）", value: "攻击者查看双方传输的数据，比如未加密数据包里的信用卡号" }, { label: "Cookie 的风险", value: "网站用 Cookie 识别你；Cookie 让人容易遭受会话劫持，攻击者甚至可以注入超级 Cookie 来追踪你" }, { label: "对策", value: "改用 HTTPS，让双方之间的流量被加密" }] },
          { id: "web-cors", title: "CORS", detail: "浏览器的跨域访问策略；不要对敏感接口随意放开 *" },
          { id: "web-tls", title: "TLS 的作用与基本配置", detail: "HTTPS 靠 TLS 和公钥密码学加密双方之间的流量", facts: [{ label: "证书", value: "网站有一把公钥，并由第三方签名，形成 X.509 类型的证书；网站另有一把私钥" }, { label: "证书颁发机构（CA）", value: "受信任的第三方公司，负责签发证书" }, { label: "浏览器如何验证", value: "下载网站证书并计算出哈希，再用公钥和证书上的签名验证；结果与先前的哈希一致，浏览器才认为这是安全的网站" }, { label: "SSL 剥离（SSL Stripping）", value: "攻击者利用网站上的 HTTP，把流量重定向到恶意网站，甚至是另一个 HTTPS 域名" }, { label: "HSTS", value: "HTTP 严格传输安全：服务器告诉浏览器，所有流量都走安全连接" }] }
        ] },
        { id: "net-wifi", title: "Wi-Fi 与无线网络", detail: "加密的网络保护你与其他设备之间的数据", facts: [{ label: "安全与不安全的网络", value: "安全的网络用加密保护你与其他设备之间的数据" }, { label: "WPA", value: "Wi-Fi Protected Access，用来加密保护无线网络的协议" }, { label: "对策", value: "在不安全的网络上，用 HTTPS 或 VPN 再加一层加密" }] },
        { id: "net-vpn", title: "VPN", detail: "在两点之间建立加密通道", facts: [{ label: "作用", value: "在两点之间建立加密通道，通道内的所有流量都被加密" }, { label: "IP 地址", value: "网站看到的是对端的 IP 地址，而不是你原来的 IP 地址" }, { label: "常见用途", value: "伪装成身处另一个国家" }] },
        { id: "net-ssh", title: "SSH", detail: "安全地在远程服务器上执行命令", facts: [{ label: "作用", value: "一种安全协议，用来在远程服务器上执行命令" }, { label: "示例", value: "ssh stanford.edu；仍需要有相应的凭证和权限才能连上" }, { label: "默认端口", value: "22" }] },
        { id: "net-ports", title: "端口与防火墙", detail: "端口把流量导向服务器上的特定服务；防火墙挡住未授权的访问", facts: [{ label: "常见端口", value: "80 对应 HTTP，443 对应 HTTPS，22 对应 SSH；服务器监听这些端口接收流量" }, { label: "端口扫描", value: "攻击者尝试所有可能的端口，看哪些在接收流量" }, { label: "渗透测试", value: "专业人员检查端口相关漏洞的活动；合法地测试这类漏洞的业务称为道德黑客（ethical hacking）" }, { label: "防火墙", value: "通过阻止未授权访问来保护各种服务，包括来自设备上已被攻陷服务的访问；用 IP 地址阻止外部人员参与流量" }, { label: "深度包检测", value: "防火墙检查数据包内的内容，比如公司检查你是否把邮件发给了被视为对手的一方" }, { label: "代理", value: "深度包检测靠代理实现：流量进出网络都经过中间设备，学校或公司可以借此修改 URL、记录你访问的 URL，并拦截有害行为" }] },
        { id: "net-malware", title: "恶意软件", detail: "破坏电脑或危及其安全的恶意软件", children: [
          { id: "net-virus", title: "病毒", detail: "附着在你电脑上的软件；一旦装上，几乎什么都能做" },
          { id: "net-worm", title: "蠕虫", detail: "能借助安全漏洞从一台电脑传播到另一台电脑的恶意软件" },
          { id: "net-botnet", title: "僵尸网络", detail: "装到你的电脑上后会去感染其他电脑，攻击者可以向成千上万台受感染的电脑下达命令", facts: [{ label: "用途", value: "被感染的电脑可以用来发起拒绝服务攻击" }] },
          { id: "net-ddos", title: "分布式拒绝服务（DDoS）", detail: "向服务器发出大量请求，使其变慢或瘫痪", facts: [{ label: "为什么是「分布式」", value: "僵尸网络里的电脑很多，请求来自成千上万个 IP 地址" }] }
        ] },
        { id: "net-av", title: "杀毒软件", detail: "检测病毒，并尽可能清除", facts: [{ label: "自动更新", value: "必须开启，才能修补旧版本软件里的安全漏洞" }, { label: "零日攻击", value: "在软件厂商来得及修复之前，利用未知漏洞发起的攻击；即使装了杀毒软件也可能中招" }] },
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
    },
    {
      id: "swsec", side: "right", title: "软件安全", kicker: "SOFTWARE", detail: "写不出明显不安全的代码，守住依赖与交付", color: "#b86a2c",
      children: [
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
        { id: "sw-phishing", title: "钓鱼（Phishing）", detail: "骗你交出信息：链接显示的和实际指向的不是同一个地方", facts: [{ label: "链接欺骗", value: "<a> 标签显示的文字和 href 可以不同：显示 https://harvard.edu，点击后实际跳到 yale.edu" }, { label: "看清去向", value: "把鼠标移到链接上，就能看到它真正指向哪里" }, { label: "假网站", value: "攻击者仿造网站，诱使你输入用户名、密码等敏感信息" }] },
        { id: "sw-inject", title: "注入攻击与防御", detail: "不可信输入被当成代码执行；转义、安全头和预处理语句是主要防线", children: [
          { id: "sw-xss", title: "跨站脚本（XSS）", detail: "网站被用户输入骗得去运行恶意代码", facts: [{ label: "示例", value: "在搜索框里输入 <script>alert('attack')</script>" }, { label: "风险", value: "网站如果不加甄别地照搬并输出用户输入，就是严重的安全隐患" }] },
          { id: "sw-reflected", title: "反射型攻击", detail: "诱骗用户的浏览器发出请求，把攻击「反射」回用户自己", facts: [{ label: "原理", value: "利用网站接收输入的方式，让用户自己的浏览器把攻击反射回来" }, { label: "示例", value: "诱导用户点击一个链接，链接的查询参数里编码了 <script>alert('attack')</script>" }] },
          { id: "sw-stored", title: "存储型攻击", detail: "网站被骗着把恶意代码存下来", facts: [{ label: "示例", value: "往邮件里发恶意代码；邮件服务商如果不加甄别地接受，每个收到它的人都可能中招" }] },
          { id: "sw-escape", title: "字符转义", detail: "把可能造成威胁的字符转成纯文本再输出", facts: [{ label: "做法", value: "软件应转义那些代表常见代码符号的字符，输出就成了恶意代码的纯文本表示，不会被执行" }, { label: "常见需转义的字符", value: "<（小于号）、>（大于号）、&（和号）、\"（双引号）、'（单引号）" }] },
          { id: "sw-csp", title: "HTTP 头：内容安全策略（CSP）", detail: "用响应头告诉浏览器哪些脚本和样式可以加载", facts: [{ label: "script-src", value: "Content-Security-Policy: script-src https://example.com/ ；只允许通过单独的 .js 文件加载 JavaScript，HTML 里内联的 <script> 不会被浏览器执行" }, { label: "style-src", value: "Content-Security-Policy: style-src https://example.com/ ；只允许来自 .css 文件的 CSS" }] },
          { id: "sw-sqli", title: "SQL 注入", detail: "用户输入被拼进 SQL 语句，攻击者借此执行恶意命令", facts: [{ label: "原则", value: "永远不要相信用户输入；所有输入都要转义" }, { label: "删库示例", value: "用户名填 malan'; DELETE FROM users; --，查询后面就多出一条 DELETE，所有用户账号都被删掉" }, { label: "绕过登录", value: "密码填 ' OR '1'='1，条件恒为真，返回所有用户，包括管理员" }] },
          { id: "sw-prepared", title: "预处理语句（Prepared Statements）", detail: "预先设计好、能正确处理用户输入的代码片段", facts: [{ label: "做法", value: "把 WHERE username = '{username}' 换成 WHERE username = ?，由预处理语句负责填入并转义用户输入" }, { label: "转义", value: "把输入里的 ' 替换成 ''，前面那段恶意代码就失效了" }, { label: "效果", value: "恶意字符被转义，恶意代码无法运行" }] },
          { id: "sw-cmdi", title: "命令注入", detail: "用户输入被传到命令行，在底层系统上执行命令", facts: [{ label: "危险的地方", value: "system 和 eval：如果不经净化就传入用户输入，攻击者就能在系统上执行恶意命令" }, { label: "后果", value: "可能是灾难性的" }, { label: "对策", value: "读文档，学会如何转义用户输入" }] },
          { id: "sw-validation", title: "客户端与服务端校验", detail: "永远不要只信客户端校验", facts: [{ label: "开发者工具", value: "HTML 就在用户自己的电脑上，用户可以用开发者工具修改它" }, { label: "例子", value: "去掉输入框的 disabled 属性，或去掉文本框的 required 属性" }, { label: "服务端校验", value: "在服务端验证用户输入是否合适且安全；永远不要相信用户输入" }] }
        ] },
        { id: "sw-csrf", title: "跨站请求伪造（CSRF）", detail: "诱骗用户在另一个网站上执行命令", facts: [{ label: "GET 的风险", value: "如果「立即购买」只是一个 GET 链接，一次点击就能下单；攻击者放一个 <img src=\"…\">，浏览器会自动发出这个 GET 请求" }, { label: "POST 也不安全", value: "表单里带 hidden 值会让程序员误以为安全；攻击者在自己的网站放同样的表单，再加一行 document.forms[0].submit() 就能自动提交" }, { label: "本质", value: "诱骗用户去执行另一个网站上的命令" }, { label: "CSRF token", value: "服务器为每个用户生成一个秘密值，提交时服务器验证令牌与预期一致；通常放在 HTTP 头里提交" }] },
        { id: "sw-ace", title: "任意代码执行（ACE）", detail: "执行了软件本不该执行的代码", facts: [{ label: "缓冲区溢出", value: "输入压垮软件，溢出到内存的其他区域，使程序出错；比如软件预期很短的输入，用户却输入了极长的内容" }, { label: "栈溢出", value: "类似的威胁，可以借溢出来插入并执行恶意代码" }, { label: "用途", value: "破解或绕过软件的注册与付费；也可用于逆向工程，看代码是如何运作的" }] },
        { id: "supply", title: "依赖与供应链安全", detail: "构建、依赖与交付", children: [
          { id: "dependency", title: "依赖漏洞与第三方组件" },
          { id: "cicd", title: "CI/CD 安全与 Secret 管理" },
          { id: "testing", title: "SAST、DAST、API 安全测试" },
          { id: "sw-opensource", title: "开源软件", detail: "代码公开，人人可以审计", facts: [{ label: "做法", value: "代码公开发布在网上，任何人都能查看" }, { label: "好处", value: "可以审计代码，减少安全威胁" }, { label: "局限", value: "开源软件仍然会受到攻击" }] },
          { id: "sw-closedsource", title: "闭源软件", detail: "代码不公开，可能更不容易被攻击者利用", facts: [{ label: "特点", value: "代码不对公众开放" }, { label: "权衡", value: "开源有成千上万双眼睛在找漏洞，闭源则把代码藏起来" }] },
          { id: "sw-appstore", title: "应用商店", detail: "Google、Apple 等运营方审查提交的代码", facts: [{ label: "审查", value: "运营方检查提交的代码是否怀有恶意" }, { label: "签名", value: "只接受授权开发者签名的软件，商店再用数字签名签发软件，操作系统由此确保只安装已授权、已签名的软件" }, { label: "对比", value: "只安装授权软件，比从任意开发者处安装安全得多" }] },
          { id: "sw-pkgmgr", title: "包管理器", detail: "用类似的签名机制确保下载的东西可信", facts: [{ label: "签名机制", value: "和应用商店类似，确保你从第三方下载的东西可信" }, { label: "局限", value: "不能保证完全安全" }, { label: "目标", value: "不断抬高攻击者安装恶意代码的门槛" }] }
        ] },
        { id: "sw-track", title: "漏洞发现与追踪", detail: "鼓励人们报告漏洞，并追踪全球正在发生的利用", children: [
          { id: "sw-bounty", title: "漏洞赏金（Bug Bounty）", detail: "有偿发现并报告软件漏洞", facts: [{ label: "做法", value: "付费让人去发现并报告软件中的漏洞" }, { label: "作用", value: "促使潜在攻击者选择拿赏金，而不是当攻击者" }] },
          { id: "sw-cve", title: "CVE、CVSS、EPSS 与 KEV", detail: "开发者用来了解漏洞、排优先级的公开数据库", facts: [{ label: "CVE", value: "常见漏洞与暴露的编号数据库，可以看到全球的攻击者在做什么" }, { label: "CVSS", value: "通用漏洞评分系统，衡量这些威胁有多严重" }, { label: "EPSS", value: "漏洞利用预测评分系统，预测漏洞在全球被利用的可能性，帮助排安全工作的优先级" }, { label: "KEV", value: "已知被利用漏洞（Known Exploited Vulnerabilities）清单" }] }
        ] }
      ]
    },
    {
      id: "privacy", side: "left", title: "隐私保护", kicker: "PRIVACY", detail: "控制谁能看到你的数据，以及你能被追踪到什么程度", color: "#7a5aa6",
      children: [
        { id: "privacy-history", title: "浏览历史与服务器日志", detail: "清掉浏览器历史，服务器那边的记录仍在", facts: [{ label: "清除历史的代价", value: "可以清除浏览器历史，但可能会被所有服务登出" }, { label: "服务器日志", value: "服务器通常有日志记录用户活动，所以即使清掉浏览器历史，服务器仍记着你访问过什么" }, { label: "日志里有什么", value: "combined 日志格式包含 IP 地址、用户、本地时间、请求、状态码、发送字节数、来源页（referer）和 User-Agent" }] },
        { id: "privacy-referer", title: "HTTP 头：Referer", detail: "浏览器默认把「你从哪里点过来」告诉网站", facts: [{ label: "默认行为", value: "点击链接时，浏览器默认把来源页告诉目标网站，比如 Referer: https://www.google.com/search?q=cats，连你搜了什么都带上了" }, { label: "只给来源", value: "Referer: https://www.google.com/ 只透露来源网站，不含具体搜索内容" }, { label: "网站可设置", value: "<meta name=\"referrer\" content=\"origin\"> 只分享来源；content=\"none\" 则完全不提供来源信息" }] },
        { id: "privacy-fingerprint", title: "浏览器指纹", detail: "即使你限制了共享，第三方仍可凭线索识别你", facts: [{ label: "为什么", value: "无论你选哪个浏览器，服务器都会记录你的活动；不同浏览器暴露的身份和行为信息多少不一" }, { label: "User-Agent", value: "请求头里描述你的设备：浏览器、操作系统版本和设备型号" }, { label: "其他线索", value: "IP 地址、屏幕分辨率、已安装的扩展、已安装的字体等" }, { label: "累积效应", value: "这些信息随时间汇集起来，你会越来越容易被识别" }] },
        { id: "privacy-cookies", title: "Cookie 与追踪", detail: "Cookie 像一枚用来逐个识别你的虚拟手印", children: [
          { id: "privacy-session-cookie", title: "会话 Cookie", detail: "服务器放在你电脑上用来识别你的信息", facts: [{ label: "示例", value: "Set-Cookie: session=1234abcd 告诉服务器你的会话是 1234abcd" }, { label: "特点", value: "每个用户的会话编号都不同，通常在服务器决定的一段时间后过期" }] },
          { id: "privacy-tracking-cookie", title: "追踪 Cookie", detail: "专门用来追踪你的 Cookie", facts: [{ label: "谁在用", value: "第三方用它追踪你在网站上的行为" }, { label: "示例", value: "Set-Cookie: _ga=GA1.2.0123456789.0; max-age=63072000 是 Google Analytics 的 Cookie，有效期两年，你每到一个新网站它都会跟着出现" }] },
          { id: "privacy-params", title: "追踪参数", detail: "Cookie 藏在浏览器内部，追踪参数就写在你点的链接里", facts: [{ label: "示例", value: "https://example.com/ad_engagement?click_id=YmVhODI1MmZmNGU4&campaign_id=23 里的 click_id 专门追踪你" }, { label: "趋势", value: "浏览器越来越多地清理追踪参数；清理后只剩 campaign_id=23，只能看出你响应的是哪次活动" }] },
          { id: "privacy-3p-cookie", title: "第三方 Cookie", detail: "第三方想了解你在网站之间怎么跳转", facts: [{ label: "过程", value: "你在 harvard.edu 上加载了 example.com 的 ad.gif，服务器用 Set-Cookie: id=1234abcd 设置了有效期一年的 Cookie；之后你在 yale.edu 再次请求同一个广告，带上了 id=1234abcd，example.com 就知道你访问过这两个网站" }, { label: "后果", value: "第三方 Cookie 可以用来追踪我们，并把关于我们的信息变现" }] },
          { id: "privacy-supercookie", title: "超级 Cookie", detail: "运营商在你不知情时注入的 Cookie", facts: [{ label: "原理", value: "提供你上网服务的运营商，可以在你不知情的情况下，往你的 HTTP 头里注入自己的 Cookie" }, { label: "对策", value: "也许可以向运营商申请退出超级 Cookie" }] }
        ] },
        { id: "privacy-private", title: "隐私浏览", detail: "保护活动的一种方法，但保护有限", facts: [{ label: "效果", value: "在隐私窗口或标签页里，过去的 Cookie 会被清除" }, { label: "局限", value: "新的 Cookie 仍然可以产生；服务器仍然可以在这一次浏览会话里追踪你的活动" }] },
        { id: "privacy-network", title: "网络层隐私：DNS、VPN 与 Tor", detail: "你的流量去了哪里，谁能看到", children: [
          { id: "privacy-dns", title: "DNS 与加密 DNS", detail: "DNS 请求默认不加密，等于告诉别人你要访问哪个网站", facts: [{ label: "DNS", value: "把 harvard.edu 这样的网站名解析成具体的 IP 地址" }, { label: "默认不加密", value: "等于向全世界宣告你想访问哪个网站；运营商和 DNS 服务清楚地知道你要去哪里" }, { label: "对策", value: "DNS over HTTPS（DoH）和 DNS over TLS（DoT）可以加密 DNS 请求" }] },
          { id: "privacy-vpn", title: "VPN（隐私角度）", detail: "让流量看起来来自另一台设备", facts: [{ label: "原理", value: "在你的电脑 A 和可信的服务器 B 之间建立加密连接；B 代你向互联网发出请求，看起来流量来自 B 而不是 A" }, { label: "IP 地址", value: "网站看到的是 VPN 的 IP 地址，而不是你自己电脑的" }, { label: "做不到", value: "如果你的电脑已经感染了恶意软件，VPN 保护不了你" }] },
          { id: "privacy-tor", title: "Tor", detail: "让流量经过许多加密节点", facts: [{ label: "原理", value: "把你的流量重定向到一组 Tor 服务器节点，流量经过许多加密节点" }, { label: "设计", value: "软件在设计上不会记住你太多活动" }, { label: "效果", value: "很有可能几乎无法识别出你的身份" }, { label: "局限", value: "如果你是工作或学校本地网络里唯一使用 Tor 的人，通过其他手段仍有可能识别出你；没有任何技术能提供绝对保护" }] }
        ] },
        { id: "privacy-permissions", title: "权限", detail: "操作系统越来越常见地请求使用设备权限", facts: [{ label: "位置服务", value: "默认会提供你的地理位置" }, { label: "提醒", value: "只要你授予了权限，Apple 地图和 Google 地图随时都知道你在哪里" }] }
      ]
    }
  ]
};

export const SAMPLE: Omit<TopicDocument, "format" | "version"> = {
  title: "CS50 网络安全导论",
  intro: "按 CS50 网络安全导论的五个主题整理：账号、数据、系统、软件、隐私。目标不是成为安全专家，而是识别风险、设计防护、写出安全代码，并在出问题时控制影响范围。",
  sources: [
    { title: "roadmap.sh Cyber Security Roadmap", url: "https://roadmap.sh/cyber-security" },
    { title: "OWASP Top 10:2025", url: "https://owasp.org/Top10/2025/" },
    { title: "CS50 网络安全导论 · 第 0 讲：Securing Accounts", url: "https://cs50.harvard.edu/cybersecurity/notes/0/" },
    { title: "CS50 网络安全导论 · 第 1 讲：Securing Data", url: "https://cs50.harvard.edu/cybersecurity/notes/1/" },
    { title: "CS50 网络安全导论 · 第 2 讲：Securing Systems", url: "https://cs50.harvard.edu/cybersecurity/notes/2/" },
    { title: "CS50 网络安全导论 · 第 3 讲：Securing Software", url: "https://cs50.harvard.edu/cybersecurity/notes/3/" },
    { title: "CS50 网络安全导论 · 第 4 讲：Preserving Privacy", url: "https://cs50.harvard.edu/cybersecurity/notes/4/" }
  ],
  tree: sampleTree
};

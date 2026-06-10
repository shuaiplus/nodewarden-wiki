# Passkey 登录

NodeWarden 支持使用 Passkey（WebAuthn/FIDO2）登录账户，提供无密码登录体验。

## 什么是 Passkey

Passkey 是基于 FIDO2/WebAuthn 标准的现代身份认证方式：

- **无需密码** - 使用生物识别（指纹、Face ID）或 PIN 码
- **防钓鱼** - 密钥绑定到域名，无法被钓鱼网站窃取
- **多设备同步** - 支持云同步（iCloud、Google Password Manager 等）
- **用户验证** - 内置第二因素验证

## 功能概览

NodeWarden 的 Passkey 功能：

- ✅ 创建和管理多个 Passkey credentials
- ✅ 使用 Passkey 登录账户
- ✅ PRF（伪随机函数）解锁保险库密钥
- ✅ 与官方 Bitwarden 浏览器扩展兼容（Chromium 系）
- ✅ Passkey 作为第二因素（满足 2FA 要求）
- ⚠️ 最多 5 个 Passkey per 账户

## 如何使用

### 创建 Passkey

1. 登录 NodeWarden Web 应用
2. 进入 `设置` → `安全` → `Passkey 登录`
3. 点击 `添加 Passkey`
4. 输入主密码进行验证
5. 为 Passkey 命名（如"iPhone"、"YubiKey"等）
6. 选择是否启用用于保险库解锁
7. 按照浏览器提示完成 Passkey 创建

**创建选项：**

- **仅用于登录** - Passkey 只能验证身份，登录后仍需主密码解锁保险库
- **用于保险库解锁** - Passkey 可直接解锁保险库，无需输入主密码（推荐）

### 使用 Passkey 登录

**NodeWarden Web：**

1. 访问登录页面
2. 点击 `使用 Passkey 登录`
3. 浏览器弹出 Passkey 选择器
4. 选择要使用的 Passkey 并验证（指纹/Face ID/PIN）
5. 自动进入保险库

**官方浏览器扩展（仅 Chromium）：**

1. 打开浏览器扩展登录页
2. 点击 `Login with passkey`
3. 完成 Passkey 验证
4. 自动进入保险库

### 管理 Passkey

**查看 Passkey 列表：**
- `设置` → `安全` → `Passkey 登录`

**删除 Passkey：**
1. 在 Passkey 列表中找到要删除的项
2. 点击删除按钮
3. 输入主密码确认

**启用保险库解锁：**

如果创建时未启用，可以后续开启：

1. 在 Passkey 列表中找到对应项
2. 点击 `启用用于解锁`
3. 输入主密码验证
4. 按提示完成 PRF 密钥创建

## 浏览器兼容性

### NodeWarden Web 应用

| 浏览器 | 创建 Passkey | 登录 | 保险库解锁 |
|--------|-------------|------|-----------|
| Chrome (Desktop) | ✅ | ✅ | ✅ |
| Edge (Desktop) | ✅ | ✅ | ✅ |
| Safari (macOS) | ✅ | ✅ | ✅ |
| Safari (iOS) | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ⚠️ PRF 支持有限 |
| Chrome (Android) | ✅ | ✅ | ✅ |

### 官方 Bitwarden 客户端

| 客户端 | Passkey 登录支持 |
|--------|----------------|
| Browser Extension (Chromium) | ✅ |
| Browser Extension (Firefox) | ❌ |
| Browser Extension (Safari) | ❌ |
| Desktop App | ❌ 当前版本 |
| Mobile App | ❌ 当前版本 |
| Web Vault | ✅ |

**限制说明：**

- Firefox/Safari 扩展环境无法按官方要求覆盖 RP ID，因此官方扩展未开放 Passkey 功能
- 桌面和移动客户端的 Passkey 支持取决于官方 Bitwarden 更新

## Passkey 设备支持

### 平台认证器

**Windows Hello：**
- Windows 10/11 内置
- 支持指纹、面部识别、PIN

**Touch ID / Face ID：**
- macOS 和 iOS 设备
- iCloud 钥匙串同步

**Android：**
- Android 9+ 内置
- Google Password Manager 同步

### 安全密钥

支持 FIDO2 硬件安全密钥：

- YubiKey 5 系列
- Google Titan Security Key
- 其他符合 FIDO2 标准的密钥

## 安全考虑

### Passkey vs 主密码

| 特性 | Passkey | 主密码 |
|------|---------|-------|
| 防钓鱼 | ✅ 域名绑定 | ❌ 用户易上当 |
| 防暴力破解 | ✅ 硬件限速 | ⚠️ 取决于强度 |
| 多设备同步 | ✅ 平台同步 | ❌ 需手动记忆 |
| 离线可用 | ✅ | ✅ |
| 服务端不存储秘密 | ✅ 仅公钥 | ⚠️ 存储哈希 |

### PRF 密钥机制

启用保险库解锁时，NodeWarden 使用 PRF（Pseudo-Random Function）：

1. 在 Passkey 验证时，authenticator 生成一个伪随机输出
2. 该输出派生出对称密钥（PRF Key）
3. PRF Key 解密封装的保险库密钥（User Key）
4. **PRF 输出永不传输到服务器**

这确保：
- 服务器无法解密保险库
- 即使服务器被攻破，保险库仍安全
- Passkey 丢失可通过主密码恢复

### 最佳实践

1. **注册多个 Passkey** - 避免单点故障
   - 主设备 Passkey（如 iPhone）
   - 备用设备 Passkey（如 iPad）
   - 硬件安全密钥作为终极备份

2. **保留主密码** - Passkey 是补充，不是替代
   - 主密码用于密钥轮换
   - Passkey 全部丢失时的恢复手段

3. **妥善保管安全密钥**
   - 硬件密钥单独存放
   - 记录恢复码（如有）

4. **定期审查**
   - 删除不再使用的设备 Passkey
   - 更新 Passkey 名称以反映当前设备

## 故障排除

### 创建 Passkey 失败

**可能原因：**
- 浏览器不支持 WebAuthn
- Authenticator 不支持 PRF extension
- 已达到 5 个 Passkey 上限

**解决方法：**
- 更新浏览器到最新版本
- 删除不再使用的旧 Passkey
- 使用不同的 authenticator

### Passkey 登录失败

**可能原因：**
- Passkey 已被删除
- 网络连接问题
- Credential ID 不匹配

**解决方法：**
- 尝试主密码登录
- 检查网络连接
- 联系管理员检查账户状态

### 保险库解锁失败

**症状：**
- Passkey 验证成功，但保险库仍锁定
- 提示"需要主密码"

**可能原因：**
- 该 Passkey 未启用保险库解锁
- PRF 密钥生成失败
- 浏览器不支持 PRF extension

**解决方法：**
- 删除该 Passkey 并重新创建，确保勾选"用于保险库解锁"
- 使用支持 PRF 的浏览器（Chrome、Edge、Safari）
- 改用主密码登录

### 官方扩展不显示 Passkey 选项

**可能原因：**
- 使用的是 Firefox 或 Safari 扩展
- 扩展版本过旧
- 服务器配置问题

**解决方法：**
- 在 Chromium 系浏览器（Chrome、Edge、Brave）中使用
- 更新扩展到最新版本
- 在 NodeWarden Web 应用中使用 Passkey

## 技术细节

### WebAuthn 参数

**注册（Registration）：**
- `residentKey: required` - 可发现 credential
- `userVerification: required` - 必须用户验证
- `attestation: none` - 无需设备证明

**认证（Authentication）：**
- `allowCredentials: []` - 空列表，使用可发现模式
- `userVerification: required` - 必须用户验证

### PRF 扩展

**Salt：**
```
SHA-256("passwordless-login")
```

**密钥派生：**
```
PRF output (32 bytes)
  ↓ HKDF-Expand
  ├─ enc key (32 bytes)
  └─ mac key (32 bytes)
```

### 数据库架构

Passkey credentials 存储在 `webauthn_credentials` 表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | UUID |
| user_id | TEXT | 所属用户 |
| name | TEXT | 用户定义名称 |
| credential_id | TEXT | Base64url encoded |
| public_key | TEXT | COSE 格式公钥 |
| counter | INTEGER | 签名计数器 |
| supports_prf | INTEGER | 是否支持 PRF |
| encrypted_user_key | TEXT | PRF 加密的 User Key |
| encrypted_public_key | TEXT | 用于密钥轮换 |
| encrypted_private_key | TEXT | 用于密钥轮换 |

### API Endpoints

**公开接口：**
- `GET /identity/accounts/webauthn/assertion-options` - 获取认证选项
- `POST /identity/connect/token` - `grant_type=webauthn`

**认证接口（需登录）：**
- `GET /api/webauthn` - 列出 Passkey
- `POST /api/webauthn/attestation-options` - 获取注册选项
- `POST /api/webauthn` - 保存新 Passkey
- `POST /api/webauthn/:id/delete` - 删除 Passkey
- `PUT /api/webauthn` - 更新 PRF keyset

详见 [API 参考](../core/api-reference.md)。

## 相关文档

- [账户安全](../security/accounts.md)
- [双因素认证](../security/two-factor-devices.md)
- [离线使用](../client/offline-usage.md#passkey-prf-解锁)
- [前端架构](../architecture/frontend.md)

## 参考资料

- [WebAuthn 标准](https://www.w3.org/TR/webauthn-3/)
- [FIDO2 规范](https://fidoalliance.org/fido2/)
- [Passkeys.dev](https://passkeys.dev/)

# 备份服务商

NodeWarden 支持通过 WebDAV 和 S3 协议将备份远程保存到云存储服务。

## 支持的协议

### WebDAV

WebDAV（Web Distributed Authoring and Versioning）被许多云存储提供商支持。NodeWarden 通过标准 WebDAV 客户端协议连接。

**连接要求：**
- WebDAV 服务器 URL
- 用户名
- 密码或应用专用密码
- 可选：备份目录的基础路径

### S3（Amazon S3 兼容）

NodeWarden 支持任何 S3 兼容的存储服务，包括 AWS S3 和第三方实现。

**连接要求：**
- Endpoint URL
- Region
- Access Key ID
- Secret Access Key
- Bucket 名称
- 可选：路径前缀

## 推荐服务商

### OneDrive（通过 Koofr）

**为什么通过 Koofr：**
- Microsoft 不提供 OneDrive 的原生 WebDAV 访问
- Koofr 提供免费的 WebDAV 桥接到 OneDrive
- Koofr 上不占用实际存储空间，直接访问你的 OneDrive

**设置步骤：**

1. **创建 Koofr 账户** - 访问 [https://koofr.eu/](https://koofr.eu/) 注册免费账户
2. **连接 OneDrive 到 Koofr** - 在 Koofr 设置中选择 OneDrive 并授权
3. **获取 WebDAV 凭证** - 生成应用专用密码
4. **在 NodeWarden 中配置** - URL: `https://app.koofr.net/dav/OneDrive`

**免费额度：** OneDrive 容量限制（免费账户通常 5GB）

---

### Google Drive（通过 Koofr）

与 OneDrive 类似，通过 Koofr 访问 Google Drive。

**WebDAV URL:** `https://app.koofr.net/dav/GoogleDrive`  
**免费额度：** 15GB（与 Gmail 共享）

---

### Cloudflare R2（S3 兼容）

如果已经用 Cloudflare 部署 NodeWarden，R2 是自然选择。

**免费额度：** 每月 10GB 存储，无出站流量费用  
**优点：** 零出站费用，快速的全球网络

---

### Backblaze B2（S3 兼容）

性价比高的 S3 兼容存储。

**定价：** 前 10GB 免费，之后 $0.005/GB/月
---

### Tigris（S3 兼容）

S3 兼容对象存储，可按任意 S3 目标配置；应用内预设包含推荐端点模式。

---

## 对比表

| 服务商 | 协议 | 免费额度 | 最适合 |
|--------|------|---------|--------|
| OneDrive (Koofr) | WebDAV | 5GB | 现有 OneDrive 用户 |
| Google Drive (Koofr) | WebDAV | 15GB | 现有 Google 用户 |
| Cloudflare R2 | S3 | 10GB/月 | Cloudflare 上的 NodeWarden |
| Backblaze B2 | S3 | 10GB | 注重成本的用户 |

## 相关文档

- [备份概览](./overview.md)
- [远程备份流程](./remote-flow.md)
- [还原流程](./restore.md)
- [备份加密](./settings-crypto.md)

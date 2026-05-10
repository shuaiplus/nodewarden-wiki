# 备份配置加密设计

备份目标里会保存 WebDAV 密码、S3 Access Key、S3 Secret Key 等敏感信息。NodeWarden 没有把这些内容当普通 JSON 明文塞进 D1，而是使用 v2 加密信封。

相关代码在 `src/services/backup-settings-crypto.ts`。

## v2 信封结构

```json
{
  "version": 2,
  "runtime": {
    "iv": "...",
    "ciphertext": "..."
  },
  "portable": {
    "iv": "...",
    "ciphertext": "...",
    "wraps": [
      {
        "userId": "...",
        "wrappedKey": "..."
      }
    ]
  }
}
```

这个结构有两个目标：

- runtime：当前服务器定时任务能自动解密并运行备份。
- portable：备份恢复或迁移后，管理员可以重新修复备份配置。

## runtime 加密

runtime 部分使用：

- HKDF-SHA256
- 输入密钥：`JWT_SECRET`
- salt：`nodewarden.backup-settings.runtime.v2`
- info：`runtime`
- 派生 256-bit AES-GCM key
- AES-GCM 随机 12 字节 IV 加密配置 JSON

这意味着只要 JWT_SECRET 没变，服务器就能自动解密备份设置，并在 cron 里运行远程备份。

如果 JWT_SECRET 变了，runtime 解密会失败，备份中心会提示需要管理员重新激活或修复。

## portable 加密

portable 部分使用随机 DEK：

1. 生成 32 字节随机 DEK。
2. 用 DEK 作为 AES-GCM key 加密同一份配置 JSON。
3. 找出所有 active admin 且有 publicKey 的用户。
4. 用管理员公钥 RSA-OAEP 包装 DEK。
5. 每个管理员得到一个 `wrappedKey`。

这样导出的备份里不会出现可直接给当前服务器使用的 runtime 密文，但保留了“管理员可恢复”的 portable 数据。

## 为什么需要双层

只有 runtime 不够：恢复到新实例后，如果 JWT_SECRET 不同，备份配置就完全解不开。

只有 portable 也不够：定时任务不能每次都要求管理员私钥参与，否则服务器无法自动运行备份。

双层信封把这两个需求分开：

- 日常运行靠 runtime。
- 跨实例恢复靠 portable。

## 导出时如何处理

实例备份导出 `backup.settings.v1` 时，会调用 `exportPortableBackupSettingsEnvelope()`。导出的配置只保留 portable 部分，runtime 会被清空。

恢复后，`normalizeImportedBackupSettingsValue()` 会尝试重新生成当前实例可用的 runtime 信封。如果当前 JWT_SECRET 解不开，就保留 portable 数据，等管理员进入备份中心修复。

## 没有管理员公钥怎么办

如果系统还没有 active admin 公钥，保存备份设置时会退回普通 JSON。这个情况主要出现在早期初始化或兼容状态。正常注册流程要求用户公钥和加密私钥存在，因此正式实例一般会使用加密信封。

## 实践建议

- 不要手改 `backup.settings.v1`。
- 不要丢 JWT_SECRET。
- 恢复后第一时间进入备份中心，看是否提示需要修复。
- 至少保留一个 active admin 账号，并确保它有 publicKey。


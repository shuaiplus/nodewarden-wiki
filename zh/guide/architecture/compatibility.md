# 兼容性策略

NodeWarden 的兼容性目标是：常用官方 Bitwarden 客户端可以登录、同步、读写、上传附件和使用 Send。

## 不追求完整企业版协议

当前明确不实现：

- 组织
- 集合
- 成员权限
- SSO
- SCIM
- 企业策略

因此同步响应里 `collections` 和 `policies` 为空是预期行为。

## EncString 校验

密码项里的加密字段必须符合 Bitwarden EncString 形状。服务端会校验一些关键字段，避免坏数据进入 sync 响应。

例如：

- cipher name 必须是有效 EncString，sync 才会返回。
- login username/password/totp/uri 会被规范化。
- fields name/value 会被规范化。
- attachments fileName 必须有效，否则不会输出。

## Android 兼容点

当前代码里专门保留了一些 Android 客户端需要的字段：

- token payload 的 `email_verified`、`amr`。
- `UserDecryptionOptions` 和 camelCase `userDecryption`。
- SSH key 的 `keyFingerprint`。
- 附件对象的非空 `url`。
- 2FA 恢复码 provider 兼容不同历史值。

## 未知字段透传

密码项保存时会保留未知字段，输出时也会透传。这样客户端新增字段后，只要字段不和服务端控制字段冲突，就不会被 NodeWarden 吃掉。

服务端覆盖的字段主要是身份、归属、时间、权限、附件、删除/归档状态等。

## stale update 防护

客户端提交更新时如果带 `lastKnownRevisionDate`，服务端会判断客户端副本是否太旧。若服务端现有 `updatedAt` 比客户端已知时间新超过阈值，会拒绝更新，避免旧副本覆盖新数据。

## 发现兼容问题时怎么排查

优先看：

- 客户端版本。
- 出错前最后一次 `/api/sync` 响应。
- 失败的 cipher 是否有无效 EncString。
- 是否是 SSH key、FIDO2、附件或 UserDecryption 字段变化。
- 是否只有某个平台失败。


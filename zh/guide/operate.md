# 维护 NodeWarden

这条路线给已经部署好 NodeWarden、需要长期维护实例的人看。

## 日常维护路线

1. [更新与维护](/zh/guide/deployment/update) - 更新 fork，同时保持 schema、密钥和全局域名规则稳定。
2. [配置与密钥](/zh/guide/deployment/configuration) - 保持 `JWT_SECRET`、绑定和备份目标配置稳定。
3. [限制与边界](/zh/guide/operations/limitations) - 理解 Cloudflare 限制、存储选择和暂不支持的功能。

## 备份与恢复路线

1. [备份能力总览](/zh/guide/backup/overview) - 理解本地导出、远程备份、上传校验、保留策略和运行锁。
2. [备份内容边界](/zh/guide/backup/scope) - 确认实例备份会包含哪些表和字段。
3. [配置加密设计](/zh/guide/backup/settings-crypto) - 理解远程备份凭据如何被保护。
4. [远程备份流程](/zh/guide/backup/remote-flow) - 查看定时和手动 WebDAV/S3 备份流程。
5. [还原与校验](/zh/guide/backup/restore) - 校验备份 ZIP，并恢复到安全目标实例。

## 事故处理路线

- [排错清单](/zh/guide/operations/troubleshooting) 处理日常故障。
- [备份事故处理](/zh/guide/operations/backup-incidents) 处理远程备份损坏、附件部分恢复、误删远程附件目录、误换 `JWT_SECRET` 等情况。

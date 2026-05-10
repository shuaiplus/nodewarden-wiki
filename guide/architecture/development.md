# 开发与代码约定

## 推荐检查命令

后端或共享代码改动：

```powershell
npx tsc -p tsconfig.json --noEmit
npm run build
```

前端文案或 i18n 改动：

```powershell
npm run i18n:validate
npx tsc -p webapp/tsconfig.json --noEmit
npm run build
```

wiki 改动：

```powershell
cd wiki
npm run build
```

## 高风险区域

这些区域改动要特别小心：

- `src/handlers/ciphers.ts`
- `src/handlers/sync.ts`
- `src/services/storage-cipher-repo.ts`
- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `src/services/backup-settings-crypto.ts`
- `src/handlers/identity.ts`
- `src/handlers/accounts.ts`
- `src/services/storage-schema.ts`

## i18n 原则

前端 locale 是独立完整包，不是英文包加增量覆盖。新增文案要同步所有 locale，并运行 i18n 校验。

## 备份变更原则

备份导出和导入是契约。新增持久数据时不要只改导出，也不要只改导入。至少要同步：

- payload 类型
- SQL 查询
- manifest tableCounts
- 内容验证
- shadow 表导入
- 前端计数类型

## 密码库字段原则

不要随意删未知字段。官方客户端可能已经依赖它们。密码项逻辑应继续遵守：

- 保留未知字段。
- 覆盖服务端拥有字段。
- 对关键加密字段做兼容规范化。
- 同步前过滤明显坏数据。


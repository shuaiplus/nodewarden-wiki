# 远程备份流程

远程备份由 `src/handlers/backup.ts` 调度，传输适配在 `src/services/backup-uploader.ts`。

## 定时扫描

Cloudflare cron 每 5 分钟进入 scheduled handler。服务端会：

1. 初始化数据库。
2. 获取备份运行锁。
3. 读取备份设置。
4. 找出当前时间窗口内到期的目标。
5. 对每个目标执行备份。

是否到期由这些字段决定：

- `schedule.enabled`
- `schedule.timezone`
- `schedule.startTime`
- `schedule.intervalHours`
- `runtime.lastAttemptAt`

调度窗口默认 5 分钟。代码还会检查上次扫描到本次扫描之间是否错过了某个备份 slot，减少 Worker cron 延迟带来的漏跑。

## 执行步骤

远程备份执行顺序：

1. 标记 `lastAttemptAt` 和本地日期。
2. 构建备份 ZIP。
3. 如果包含附件，先同步远程附件 blob。
4. 上传 ZIP。
5. 下载 ZIP 并校验 hash 与大小。
6. 按保留策略删除旧 ZIP。
7. 写入 `lastSuccessAt`、文件名、大小、远程路径。
8. 写审计日志。

失败时会写入：

- `runtime.lastErrorAt`
- `runtime.lastErrorMessage`
- `admin.backup.remote.manual.failed` 或 `admin.backup.remote.scheduled.failed` 审计动作

## WebDAV 传输

WebDAV 使用：

- `MKCOL` 创建目录。
- `PUT` 上传文件。
- `PROPFIND` 列目录。
- `GET` 下载。
- `DELETE` 删除。
- `HEAD` 判断存在。

WebDAV 路径会做规范化，拒绝 `.` 和 `..`，避免路径穿越。

## S3 兼容传输

S3 使用 AWS Signature V4 签名。上传、下载、列目录、删除都会用 access key 和 secret key 生成签名请求。

配置项包括：

- endpoint
- bucket
- region，默认 `auto`
- accessKeyId
- secretAccessKey
- rootPath

S3 对象路径会拼接 `rootPath` 和相对路径。

## 附件索引

远程附件索引文件：

```text
attachments/.nodewarden-attachment-index.v1.json
```

格式大致是：

```json
{
  "version": 1,
  "blobs": {
    "cipherId/attachmentId": {
      "sizeBytes": 1234,
      "updatedAt": "2026-05-10T00:00:00.000Z"
    }
  }
}
```

如果索引不存在，WebDAV 某些服务可能返回 404、403、530 或非标准“not found”文本。NodeWarden 会把这些情况当作空索引，保证首次备份可以继续。

## 保留策略

`retentionCount` 控制保留多少份 ZIP。清理时只处理备份根目录下的 `.zip` 文件，不清理 `attachments/`。附件目录是跨多个 ZIP 复用的，随意删除会破坏历史备份。

如果清理失败，备份本身仍可成功，只会记录 `pruneError`。


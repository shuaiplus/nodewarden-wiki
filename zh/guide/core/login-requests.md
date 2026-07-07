# 登录请求与 Fill-Assist

NodeWarden 支持 Bitwarden 风格的**登录请求**（在另一台设备上批准免密登录）和 **fill-assist**（客户端内联凭据辅助）。无需 Bitwarden 云服务即可配合官方桌面端与移动端。

## 登录请求

客户端发起免密或跨设备登录时会创建 **auth request**。已登录的另一台设备（或 Web 保险库）可批准或拒绝。通知中心通过推送更新状态；客户端仍以 `/api/sync` 与令牌响应为最终一致来源。

主要代码路径：

- 已认证管理：`src/handlers/auth-requests.ts`、`webapp/src/lib/api/auth-requests.ts`
- Web 保险库：待处理请求面板与批准对话框
- 实时通道：[实时通知](/zh/guide/architecture/realtime-notifications)

**用户侧预期：**

- 批准方需要已解锁的可信设备，或具备保险库访问权限的 Web 会话。
- 拒绝或过期的请求不会发放令牌。
- 存在面向管理员/客户端探测的兼容端点；NodeWarden 仍不实现完整组织功能。

## 跨设备解锁

与解锁请求相关的客户端流程共用 auth request 存储与通知模式。维护时需与设备记录、`securityStamp` 变更一并考虑。

## Fill-assist

官方客户端可能请求：

```text
POST /fill-assist
```

`src/handlers/fill-assist.ts` 按 Bitwarden 兼容形状返回凭据辅助数据。v1.7.2 起设备响应包含 fill-assist 所需字段。

Fill-assist **不能**替代主密码或 2FA 完成完整保险库解锁，仅辅助自动填充相关步骤。

## 设备注册与验证设置

v1.7.x 增加**设备注册**与**设备验证设置**路由，便于移动端/桌面端完成初始化。未实现的流程（如服务端邮件验证、服务端 KDF 注册）会返回明确的不支持响应。

## 推送中继安装

部分客户端在安装阶段注册 push relay。NodeWarden 返回兼容响应以免阻塞登录；实际推送仍经 Durable Object 通知中心（如已配置）。

## 排错

登录请求卡住时：

1. 确认两台设备使用同一服务器地址且客户端版本较新。
2. 检查通知 hub 的 WebSocket / SignalR 握手（[排错清单](/zh/guide/operations/troubleshooting)）。
3. 确认批准账号已完成 2FA 且保险库已解锁。
4. 查看审计日志中的批准/拒绝记录（[权限、限流与审计](/zh/guide/security/rate-limit-audit)）。

另见 [客户端连接](/zh/guide/core/clients) 与 [API 参考](/zh/guide/core/api-reference)。
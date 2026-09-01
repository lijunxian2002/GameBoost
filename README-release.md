# GameBoost 版本发布与自动更新底座（P0）

> 目标：官网永远从同一个地址下载最新版；已安装用户能拿到可校验、可回滚的版本信息。

## 架构

```text
固定下载入口  GET /download/gameboost        → 302 到当前 stable 版本安装包
最新版 API    GET /api/v1/releases/latest    → 版本、URL、SHA-256、签名、大小、时间
发布接口      POST /api/v1/admin/releases    → 只接受带令牌的发布脚本
下载地址      /releases/<R2 对象路径>          → 直接流式返回，R2 对象不可变
```

- 数据：D1 表 `releases` 与 `request_limits`（迁移在 `drizzle/`）
- 文件：R2 桶 `FILES`，对象路径 `releases/gameboost/{channel}/windows-x64/{version}/GameBoost-{version}-windows-x64.exe`
- 旧版本永远不被覆盖：每个版本是独立对象，只有数据库的 `is_active` 指向"最新"
- 版本选择按 SemVer 而不是发布时间；发布端拒绝同版本覆盖与版本降级
- 只有服务器验证为 Windows PE 的安装包才可作为下载版本；所有旧的未验证记录不会再被下载入口返回

## 第一次发布前（一次性）

```bash
# 1. 生成发布签名密钥（ed25519），只在服务器上保存私钥
node scripts/release-keygen.mjs
```

输出两样东西，按提示配置到控制平面（Sites 环境值）：

- `RELEASE_SIGNING_KEY` = base64 的 PKCS8 私钥（**只放服务器**）
- `RELEASE_PUBLIC_KEY` = base64 公钥（将来烘焙进 EXE 更新客户端）
- `RELEASE_TOKEN` = 一个长随机字符串，发布脚本用（例如 `openssl rand -hex 32` 生成）
- `RATE_LIMIT_SALT` = 另一条长随机字符串，用于将访问地址变成不可逆的限流键
- `DEEPSEEK_API_KEY` = 官网 Agent 的服务端密钥；绝不写进 HTML、EXE 或仓库

在部署新代码前，先通过部署平台执行 `drizzle/0001_overjoyed_ulik.sql`。它会增加安装包格式标记与公共接口限流表；没有这次迁移，Agent、教程与下载接口会保护性失败。

部署后确认 `/api/v1/releases/latest` 返回 `{"error":"release_not_found",...}`（404），说明服务已就绪。

## 发布一个新版本

```bash
node scripts/publish-release.mjs \
  --file "D:\GameBoost\dist\GameBoost-0.2.0-windows-x64.exe" \
  --channel stable \
  --version 0.2.0 \
  --minimum-supported-version 0.1.0 \
  --notes-url https://xiaotongcn.mom/changelog/gameboost/0.2.0
```

（令牌优先读环境变量 `RELEASE_TOKEN`，避免进命令行历史。）安装包上限为 25 MB；脚本会先检查它确实是 Windows PE 文件，再上传。

脚本做的事：本机算 SHA-256 → 上传 → 服务器再算一遍、用 `RELEASE_SIGNING_KEY` 签名 → 写入 D1 但不激活 → 从 R2 重新读回校验哈希 → 全部通过才激活为 latest。任何一步失败，旧版本不受影响。

## 验证

```bash
# 最新版信息
curl -s "https://xiaotongcn.mom/api/v1/releases/latest?product=gameboost&channel=stable&platform=windows-x64"

# 固定下载入口（跟随 302）
curl -sIL "https://xiaotongcn.mom/download/gameboost"

# beta 通道隔离：stable 请求永远拿不到 beta 版本
curl -s "https://xiaotongcn.mom/api/v1/releases/latest?channel=beta"
```

## 安全边界

- 私钥、令牌只在服务器环境值里，不在代码、日志或仓库里
- 发布接口拒绝没有令牌的请求；令牌比较是常数时间的
- 发布接口拒绝随机文件、网页、压缩包等非 Windows PE 内容；同版本不可覆写，低版本不可覆盖新版
- 下载地址只在响应里按请求来源生成，不把域名写死在页面里
- 校验失败（哈希不一致）的版本永远不会成为 latest
- 官网 Agent 每个地址 10 分钟最多 12 次，教程生成每 30 分钟最多 4 次；限流依赖失效时会暂停高成本接口，而不是继续扣模型额度

## 已知边界（P1 再做）

- EXE 更新客户端（检查 / 下载 / 校验 / 安装 / 回滚）还没有实现
- `notes_url` 指向的 changelog 页面还没有做
- 发布记录没有管理后台，撤销发布需在 D1 手动把 `is_active` 置 0
- 扁平下载地址 `/releases/GameBoost-0.2.0-windows-x64.exe` 按文件名回查，只支持 `windows-x64`

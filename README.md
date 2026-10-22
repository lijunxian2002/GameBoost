# GameBoost

Windows 游戏网络加速器。桌面客户端 + 官网 + 服务端，覆盖客户端配置、版本发布、
自动更新底座与在线诊断案例。

## 这个仓库是什么

源码公开，供审阅与参考。**这不是开源项目。**

版权归作者所有。未经书面许可，不得再分发、修改后发布、或用于商业用途。
具体见下方 License。

## 结构

| 目录 | 内容 |
|---|---|
| `app/` | Next.js 应用：官网、Agent 对话、案件查询、发布 API |
| `components/` | UI 组件 |
| `lib/` | 发布签名、限流、Agent 调用 |
| `db/` | Drizzle schema 与迁移（Cloudflare D1） |
| `scripts/` | 发布脚本、签名密钥生成、验证脚本 |
| `docs/` | 审计与 API 文档 |
| `release-keys/` | 仅公钥（`release-signing-public.pem`），用于客户端校验 |

## 环境变量

部署需要以下环境值，**均不在仓库中**：

| 变量 | 用途 |
|---|---|
| `RELEASE_SIGNING_KEY` | base64 PKCS8 Ed25519 私钥，只放服务器 |
| `RELEASE_TOKEN` | 发布接口令牌 |
| `DEEPSEEK_API_KEY` | 官网 Agent 服务端密钥 |
| `RATE_LIMIT_SALT` | 限流哈希盐 |

仓库里只有对这些变量的引用（`env.RELEASE_TOKEN` 等），没有任何实际值。
私钥、令牌、API key 一律不写进代码、日志或提交历史。

## 发布流程

安装包经 `scripts/publish-release.mjs` 上传：本机算 SHA-256 → 上传到 R2 →
服务器重算并签名 → 写入 D1 但不激活 → 从 R2 读回校验 → 全部通过才置为 latest。
任何一步失败，旧版本不受影响。

## License

Copyright (c) 2026 Junxian Li. **All rights reserved.**

This source is published for inspection and reference only. It is **not** open
source. No permission is granted to redistribute, sublicense, publish modified
versions, or use it commercially without a written agreement from the author.

Third-party dependencies remain under their own licenses.

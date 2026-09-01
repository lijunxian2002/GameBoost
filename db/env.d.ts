declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    FILES: R2Bucket;
    /** 只配置在部署环境，绝不提交到仓库。 */
    RELEASE_TOKEN?: string;
    RELEASE_SIGNING_KEY?: string;
    DEEPSEEK_API_KEY?: string;
    /** 用于把访客 IP 变成不可逆限流键的随机盐。 */
    RATE_LIMIT_SALT?: string;
  }
}

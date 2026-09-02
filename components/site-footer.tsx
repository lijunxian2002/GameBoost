import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <b>小同实验室</b>
        <span>XIAOTONG LAB · EVIDENCE BEFORE ACTION</span>
      </div>
      <nav aria-label="站点规则">
        <Link href="/service">服务说明</Link>
        <Link href="/privacy">隐私政策</Link>
        <Link href="/terms">用户协议</Link>
        <Link href="/data-rights">数据权利与投诉</Link>
      </nav>
      <p>GameBoost 诊断与建议不替代硬件维修；优化动作须经用户确认。</p>
    </footer>
  );
}

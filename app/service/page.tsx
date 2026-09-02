import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';

export default function ServicePage() {
  return (
    <LegalPage
      eyebrow="GAMEBOOST / SERVICE BOUNDARY"
      title="先回答：卡在哪里？"
      lead="GameBoost 先记录真实游玩数据，再把电脑问题讲清楚。收费服务是人工审核后的专属配置与指导，不是承诺让每一台电脑都变快。"
    >
      <section>
        <h2>服务如何进行</h2>
        <ol>
          <li><b>采样。</b> GameBoost 在用户主动开始后记录帧时间、温度、功耗、频率、内存、显存与显示环境；监测阶段不擅自修改系统。</li>
          <li><b>免费判断。</b> 报告说明卡顿更像温度、功耗、内存、显存、后台干扰、游戏设定，还是硬件与游戏本身的限制。</li>
          <li><b>人工交付。</b> 只有确认有合理改善空间时，才提供收费的专属 CFG、操作说明和一次反馈复查。</li>
        </ol>
      </section>
      <section>
        <h2>什么情况不会建议购买 CFG</h2>
        <p>采样若显示显存、内存、散热器件、供电、游戏优化或硬件规格本身是主要限制，GameBoost 会如实说明。无法靠软件合理改善时，不应以“优化”为名收费。</p>
      </section>
      <section>
        <h2>安全边界</h2>
        <ul>
          <li>不在未经用户确认时执行 BIOS、超频、降压、驱动替换、拆机或硬件维修。</li>
          <li>不承诺固定帧率、温度、功耗、硬件寿命或特定游戏表现。</li>
          <li>每个交付配置都应标明适用对象、版本和还原方式；用户可决定是否应用。</li>
        </ul>
      </section>
      <aside className="legal-callout"><b>现在的样本流程</b><p>官网的报告生成工具目前只在浏览器本地读取 `.gbsample`，不会自动上传原始样本。公开上传功能启用前，会单独提供上传同意、保存期限与删除入口。</p><Link href="/privacy">查看数据如何处理 →</Link></aside>
    </LegalPage>
  );
}

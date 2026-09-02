import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="TERMS / HONEST SERVICE"
      title="先把边界说清楚。"
      lead="使用 GameBoost、动态报告或 Agent，代表你理解：它们帮助分析和沟通，不会替代硬件维修、厂商技术支持或你对电脑的最终决定。"
    >
      <section>
        <h2>免费与收费服务</h2>
        <p>免费监测与报告用于说明可观察到的现象和证据。收费项目须经人工确认服务范围后再交付，通常包括专属配置、操作指导及约定范围内的一次反馈。支付前应确认价格、交付内容、适用设备和服务边界。</p>
      </section>
      <section>
        <h2>不作出的承诺</h2>
        <ul>
          <li>不保证任何游戏的帧率、温度、噪声、稳定性或硬件寿命达到特定数值。</li>
          <li>不把数据分析结论当作硬件故障、散热器件损坏或安全风险的最终判定。</li>
          <li>不保证第三方游戏、驱动、系统更新或硬件状态变化后仍保持同样效果。</li>
        </ul>
      </section>
      <section>
        <h2>用户需要确认的事</h2>
        <p>请只提交你有权提供的样本与内容。涉及 BIOS、超频、降压、驱动、拆机、清灰、硅脂和硬件维修等高风险操作时，必须由你自行决定并承担相应风险；不确定时优先联系设备品牌售后或专业维修人员。</p>
      </section>
      <section>
        <h2>AI 的角色</h2>
        <p>Agent 是辅助沟通工具，可能出错或需要补充采样。它不自动修改系统，也不替代人工审核；对重要操作，请以采样证据、官方说明和人工确认共同判断。</p>
      </section>
      <aside className="legal-callout"><b>需要真人处理？</b><p>请通过案例编号联系李俊贤。涉及付款、交付、数据删除或争议时，会以双方已确认的服务范围为准。</p><Link href="/data-rights">联系与投诉入口 →</Link></aside>
    </LegalPage>
  );
}

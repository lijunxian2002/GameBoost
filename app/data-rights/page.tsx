'use client';

import { Check, Copy, MessageCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { LegalPage } from '@/components/legal-page';

const contact = '17695989770';

export default function DataRightsPage() {
  const [copied, setCopied] = useState(false);
  async function copyContact() {
    await navigator.clipboard.writeText(contact);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <LegalPage
      eyebrow="DATA RIGHTS / CONTACT"
      title="你的案例，由你决定。"
      lead="申请删除、查询或更正资料，或对服务提出投诉，都可以在这里联系到真人。请不要在公开页面发送身份证、密码、支付验证码等敏感信息。"
    >
      <section>
        <h2>可以申请什么</h2>
        <div className="rights-grid">
          <div><ShieldCheck /><b>删除资料</b><p>删除原始样本、案例摘要、公开报告或联系记录中可定位到你的资料。</p></div>
          <div><Check /><b>查询与更正</b><p>查询已保存的案例内容，或要求更正明显错误的称呼、设备与联系方式。</p></div>
          <div><MessageCircle /><b>投诉与建议</b><p>反馈服务、数据处理、报告展示或 Agent 回复的问题。</p></div>
        </div>
      </section>
      <section>
        <h2>怎么提交</h2>
        <p>通过微信或电话联系李俊贤，并写明：<b>“数据请求 / 投诉” + 案例编号 + 你的诉求</b>。如果没有案例编号，请提供游戏名称、采样日期等最少信息协助定位。我们会先核验请求，通常在 7 个工作日内确认收到，并在 15 个工作日内说明处理结果或原因。</p>
        <button className="contact-copy" onClick={copyContact}>{copied ? <Check /> : <Copy />}{copied ? '已复制微信号' : `复制微信号 ${contact}`}</button>
        <a className="legal-action" href={`tel:${contact}`}>拨打电话 →</a>
      </section>
      <section>
        <h2>删除后的影响</h2>
        <p>删除案例可能使你无法继续查看报告、复用专属 CFG 或获得后续复查。若法律法规要求保留特定记录，我们会停止其他处理并采取必要保护，而不是继续用于服务或展示。</p>
      </section>
    </LegalPage>
  );
}

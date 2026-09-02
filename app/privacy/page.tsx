import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="PRIVACY / LOCAL FIRST"
      title="你的数据，只为解释这台电脑。"
      lead="小同实验室（运营者：李俊贤）遵循最少收集原则。原始采样不会被公开，任何用于案例展示或改进 Agent 的数据都需要另行取得你的同意。"
    >
      <section>
        <h2>当前会处理什么</h2>
        <ul>
          <li><b>网站访问与限流信息：</b>为防止滥用，服务端会短暂处理经哈希处理的网络地址限流标识；不以它建立用户画像。</li>
          <li><b>聊天内容：</b>当你使用 Agent 时，输入内容会发送给模型服务 DeepSeek，用于生成当前回复。本站当前不会自动把聊天内容存为案例资料。</li>
          <li><b>本地报告生成：</b>`/reports/new` 中选择的 `.gbsample` 只由当前浏览器读取；当前版本不会自动上传原始文件。</li>
        </ul>
      </section>
      <section>
        <h2>未来开放样本上传前的承诺</h2>
        <p>在开放上传前，页面会明确写出收集字段、处理目的、存储位置、保存期限、可访问人员与删除方式；用户必须主动勾选同意。原始样本、完整设备指纹、本地路径和无关进程不会作为公开报告内容。</p>
      </section>
      <section>
        <h2>公开报告与 Agent 改进</h2>
        <p>公开案例只使用脱敏后的摘要。若希望使用去除联系方式后的反馈改进 Agent，会单独征得同意；不同意不影响获得本次服务。不会把原始聊天或样本直接拿去训练公开模型。</p>
      </section>
      <section>
        <h2>你的权利与联系我们</h2>
        <p>你可以申请查阅、更正、删除与停止使用与你有关的服务资料。请提供案例编号或足以定位资料的最少信息；我们会先核验请求来源，避免误删他人的资料。</p>
        <Link className="legal-action" href="/data-rights">申请删除数据或提交投诉 →</Link>
      </section>
    </LegalPage>
  );
}

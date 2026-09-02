import {
  Activity,
  ArrowRight,
  AudioWaveform,
  Blocks,
  Check,
  Code2,
  Cpu,
  Gauge,
  Headphones,
  Radio,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';

const disciplines = [
  {
    id: 'mixing', index: '01', eyebrow: 'MIXING / SOUND', title: '混音与声音翻译',
    copy: '让作品在耳机、音箱、汽车和手机上都能保持正确的重心、空间与情绪。',
    tags: ['混音服务', '监听翻译', '频响校正'], icon: Headphones, color: 'gold', stat: 'HONESTMIX',
  },
  {
    id: 'plugins', index: '02', eyebrow: 'PLUGIN / SOFTWARE', title: '音频插件与工具开发',
    copy: '把声音工作流里的真实痛点，做成可以反复使用、持续迭代的软件与插件。',
    tags: ['音频插件', '桌面工具', '交互原型'], icon: Blocks, color: 'blue', stat: 'PLUGIN LAB',
  },
  {
    id: 'gameboost', index: '03', eyebrow: 'GAME / PERFORMANCE', title: '游戏电脑诊断与优化',
    copy: '不靠玄学开关。记录帧时间、温度、显存、内存、磁盘与限频原因，告诉玩家真正卡在哪。',
    tags: ['免费性能监测', '动态诊断报告', '专属优化 ¥50/台'], icon: Cpu, color: 'green', stat: 'GAMEBOOST',
  },
];

export default function Home() {
  return (
    <main className="xt-site">
      <div className="xt-stars" aria-hidden="true" />
      <header className="xt-header">
        <a className="xt-logo" href="#top" aria-label="小同实验室首页"><span>XT</span><div><b>小同实验室</b><small>XIAOTONG LAB</small></div></a>
        <nav><a href="#mixing">混音</a><a href="#plugins">插件开发</a><a href="#gameboost">GameBoost</a><Link href="/r/8K3F7A">报告演示</Link></nav>
        <div className="xt-online"><i /> LAB ONLINE</div>
      </header>

      <section className="xt-hero" id="top">
        <div className="xt-hero-copy">
          <span className="xt-kicker"><Sparkles /> SOUND · SOFTWARE · PERFORMANCE</span>
          <h1>声音、软件、性能。<br />把复杂技术，<em>调到真正好用。</em></h1>
          <p>这里不是一个 AI 聊天页面，而是俊贤持续开发和交付作品的技术工作室：混音、音频插件，以及面向玩家的电脑性能诊断。</p>
          <div className="xt-hero-actions"><a href="#work">查看正在做的事 <ArrowRight /></a><Link className="quiet" href="/r/8K3F7A">打开 GameBoost 报告</Link></div>
        </div>
        <div className="xt-signal-console" aria-label="工作室实时状态">
          <div className="xt-console-head"><span><i /> SIGNAL ROUTER</span><b>3 MODULES ACTIVE</b></div>
          <div className="xt-console-line gold"><AudioWaveform /><span>MIX BUS</span><i><b style={{ width: '72%' }} /></i><strong>-8.2 dB</strong></div>
          <div className="xt-console-line blue"><Code2 /><span>PLUGIN LAB</span><i><b style={{ width: '58%' }} /></i><strong>BUILD</strong></div>
          <div className="xt-console-line green"><Activity /><span>GAMEBOOST</span><i><b style={{ width: '84%' }} /></i><strong>READY</strong></div>
          <div className="xt-console-foot"><span>LOCAL FIRST</span><span>EVIDENCE BACKED</span><span>HUMAN REVIEWED</span></div>
        </div>
      </section>

      <section className="xt-work" id="work">
        <div className="xt-section-title"><span>WORKING MODULES / 03</span><h2>三个方向，一套方法</h2><p>先充分测量，再解释问题，最后只做必要的调整。</p></div>
        <div className="xt-discipline-grid">
          {disciplines.map((item) => {
            const Icon = item.icon;
            return (
              <article className={`xt-discipline ${item.color}`} id={item.id} key={item.id}>
                <div className="xt-discipline-top"><span>{item.index}</span><b>{item.stat}</b></div>
                <div className="xt-module-icon"><Icon /></div><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.copy}</p>
                <ul>{item.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                {item.id === 'gameboost' ? <div className="xt-card-links"><Link href="/gameboost">打开控制台 <ArrowRight /></Link><Link href="/r/8K3F7A">查看报告</Link></div> : <a className="xt-coming" href={`#${item.id}-detail`}>查看工作方向 <ArrowRight /></a>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="xt-method">
        <div className="xt-method-copy"><span>THE METHOD</span><h2>不是堆功能，<br />是把问题真正听懂。</h2><p>混音要听懂作品，插件要听懂工作流，GameBoost 要读懂电脑。三种业务看起来不同，底层都是测量、解释与定制。</p></div>
        <div className="xt-method-steps"><div><span>01</span><Radio /><b>充分采样</b><p>收集真正决定结果的信号，不只看一个漂亮数字。</p></div><div><span>02</span><Gauge /><b>翻译问题</b><p>把复杂数据变成创作者和玩家一眼能懂的结论。</p></div><div><span>03</span><SlidersHorizontal /><b>专属调整</b><p>保留个人需求与设备差异，只做有证据的改变。</p></div></div>
      </section>

      <section className="xt-service-detail" id="mixing-detail">
        <div className="xt-detail-number">MIX / 01</div>
        <div className="xt-detail-copy"><span>FOR MUSIC MAKERS</span><h2>混音不是让声音更响，<br />而是让表达更准确。</h2><p>从平衡、动态、空间到不同播放设备上的翻译度，围绕作品本身完成判断。HonestMix 将继续承担耳机频响校正与监听翻译工具的角色。</p></div>
        <div className="xt-detail-list"><div><Check />混音与修改建议</div><div><Check />耳机监听校正</div><div><Check />多设备翻译检查</div></div>
      </section>

      <section className="xt-service-detail reverse" id="plugins-detail">
        <div className="xt-detail-number">DEV / 02</div>
        <div className="xt-detail-copy"><span>FOR REAL WORKFLOWS</span><h2>从一个真实痛点，<br />长成一件可靠工具。</h2><p>音频插件、桌面应用和交互原型都归入 Plugin Lab。视觉会保持同一套克制、精密的仪器语言，但每个产品仍拥有自己的功能性格。</p></div>
        <div className="xt-detail-list"><div><Check />音频插件原型</div><div><Check />桌面工具开发</div><div><Check />产品与界面设计</div></div>
      </section>

      <section className="xt-report-cta">
        <div className="xt-report-screen"><div className="xt-report-head"><span><i /> GAMEBOOST REPORT</span><b>CASE 8K3F7A</b></div><small>一句话结论</small><h2>平均帧率不低，<br />真正卡在<em>低谷帧稳定性。</em></h2><div className="xt-report-metrics"><span><small>MEDIAN</small><b>109.3</b></span><span><small>1% LOW</small><b>36.7</b></span><span><small>MEM PEAK</small><b>97.4%</b></span></div></div>
        <div className="xt-report-copy"><span>GAMEBOOST / 03</span><h2>免费监测建立信任，<br />专属优化完成交付。</h2><p>玩家回传一次样本，我们给出完整动态报告。确认需要人工优化后，按每台电脑 ¥50 提供专属配置、应用与可还原保障。</p><div className="xt-pricing"><div><Activity /><span><b>性能监测 + 报告</b><small>免费</small></span></div><div><Wrench /><span><b>专属人工优化</b><small>¥50 / 台</small></span></div></div><Link href="/r/8K3F7A">查看第一份演示报告 <ArrowRight /></Link></div>
      </section>

      <SiteFooter />
    </main>
  );
}

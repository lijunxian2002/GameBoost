'use client';

import {
  Activity,
  ArrowDown,
  Check,
  Copy,
  ChevronRight,
  Cpu,
  Download,
  Gauge,
  HardDrive,
  Gift,
  Laptop,
  MemoryStick,
  ShieldCheck,
  Share2,
  Thermometer,
  Wrench,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const fpsData = [
  { name: '平均 FPS', fps: 99.8 },
  { name: '中位 FPS', fps: 109.3 },
  { name: '1% LOW', fps: 36.7 },
];

const chartConfig = {
  fps: { label: '帧率', color: '#9fcf47' },
} satisfies ChartConfig;

export default function CustomerReport() {
  const [copied, setCopied] = useState(false);
  const shareText = '我用 GameBoost 给自己的游戏本做了一次完整性能体检：不是只看平均 FPS，而是找出了低谷帧、内存压力和热限制。免费监测报告真的能告诉你电脑卡在哪，专属优化 50 元/台。xiaotongcn.mom';

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="report-workbench">
      <article className="report-machine">
        <i className="screw screw-nw" />
        <i className="screw screw-ne" />
        <i className="screw screw-sw" />
        <i className="screw screw-se" />

        <header className="report-header">
          <div className="brand-block">
            <div className="brand-mark"><span>GB</span></div>
            <div>
              <h1>GAMEBOOST</h1>
              <p>PERSONAL PERFORMANCE REPORT</p>
            </div>
          </div>
          <div className="report-identity">
            <span>CASE-001</span>
            <b>DEADLOCK · 专属诊断</b>
          </div>
          <div className="unit-state report-status">
            <span className="state-lamp ready" />
            <div><small>REPORT STATUS</small><strong>DIAGNOSIS COMPLETE</strong></div>
          </div>
        </header>

        <section className="report-screen" aria-labelledby="diagnosis-title">
          <div className="scanlines" aria-hidden="true" />
          <div className="report-screen-top">
            <span>PLAYER VIEW / EVIDENCE BACKED</span>
            <span>DEVICE 0A4C-25CB · LOCAL SAMPLE</span>
          </div>

          <div className="report-verdict">
            <div className="verdict-copy">
              <span className="eyebrow"><i /> 一句话结论</span>
              <h2 id="diagnosis-title">你的电脑主要卡在<br /><em>帧时间稳定性</em></h2>
              <p>平均帧率并不低，但低谷帧会突然掉到 <b>36.7 FPS</b>。内存长期偏满，加上间歇性的显卡热限制，让你感到的是“偶尔猛卡一下”，而不是一直跑不动。</p>
            </div>

            <div className="verdict-dial" aria-label="改善潜力：可改善">
              <div className="dial-ring"><b>可改善</b><span>OPTIMIZABLE</span></div>
              <dl>
                <div><dt>严重程度</dt><dd>中等</dd></div>
                <div><dt>诊断可信度</dt><dd>中等</dd></div>
                <div><dt>硬件是否太弱</dt><dd>不是主因</dd></div>
              </dl>
            </div>
          </div>

          <div className="report-command">
            <span>GB&gt;</span>
            <p>不是玄学优化：本次结论来自 937,206 帧与 8,894 个硬件遥测点。</p>
            <i />
          </div>
        </section>

        <nav className="report-controls" aria-label="报告快捷导航">
          <a href="#experience" className="report-key amber"><span><b>A</b><Activity /></span><strong>卡顿发生在哪<small>PLAYER EXPERIENCE</small></strong></a>
          <a href="#evidence" className="report-key steel"><span><b>B</b><Gauge /></span><strong>查看诊断证据<small>MEASURED DATA</small></strong></a>
          <a href="#share" className="report-key green"><span><b>X</b><Share2 /></span><strong>朋友圈分享卡<small>PLAYER REFERRAL</small></strong></a>
        </nav>

        <section className="report-section" id="experience">
          <div className="section-heading">
            <span>01 / PLAYER EXPERIENCE</span>
            <h3>把数据翻译成你的游玩感受</h3>
            <p>我们不只告诉你温度和 FPS，而是说明它们怎样变成你眼睛看到的“卡”。</p>
          </div>

          <div className="experience-flow">
            <ExperienceStep icon={<Gauge />} index="01" title="大部分时候很顺" value="109.3 FPS" note="中位帧率" />
            <ChevronRight />
            <ExperienceStep icon={<Thermometer />} index="02" title="压力逐渐叠加" value="87°C / 97%" note="GPU 峰值 / 内存峰值" warn />
            <ChevronRight />
            <ExperienceStep icon={<Zap />} index="03" title="突然出现低谷" value="36.7 FPS" note="1% LOW" danger />
          </div>

          <div className="plain-language">
            <span>你会怎么感觉？</span>
            <p>转身、团战或资源切换时偶尔顿一下；顿完以后平均 FPS 看起来又恢复，所以普通 FPS 计数器很容易把问题掩盖掉。</p>
          </div>
        </section>

        <section className="report-section evidence-section" id="evidence">
          <div className="section-heading">
            <span>02 / MEASURED EVIDENCE</span>
            <h3>为什么我们这样判断</h3>
            <p>三条证据互相印证，才会进入顾客报告；单个数字不会直接下结论。</p>
          </div>

          <div className="evidence-grid">
            <div className="chart-card">
              <div className="card-label"><Activity /> 帧率落差</div>
              <ChartContainer config={chartConfig} className="report-chart" initialDimension={{ width: 560, height: 260 }}>
                <BarChart accessibilityLayer data={fpsData} layout="vertical" margin={{ left: 10, right: 30, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke="#26352c" />
                  <XAxis type="number" domain={[0, 120]} tick={{ fill: '#6f856d', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={78} tick={{ fill: '#9bb18f', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ChartTooltip cursor={{ fill: 'rgba(159,207,71,.05)' }} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="fps" radius={[0, 3, 3, 0]} barSize={22}>
                    {fpsData.map((item) => <Cell key={item.name} fill={item.name === '1% LOW' ? '#e7a72e' : '#9fcf47'} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <p>平均值很好看，但 1% LOW 只有平均帧率的约 37%。真正影响手感的是这段落差。</p>
            </div>

            <div className="sensor-stack">
              <SensorEvidence icon={<MemoryStick />} label="内存压力" value="85.7% 平均" peak="97.4% 峰值" level={86} tone="amber" />
              <SensorEvidence icon={<Thermometer />} label="显卡温度" value="77.1°C 平均" peak="87°C 峰值" level={77} tone="orange" />
              <SensorEvidence icon={<Gauge />} label="显卡忙碌度" value="73.8% 平均" peak="没有持续跑满" level={74} tone="green" />
            </div>
          </div>

          <div className="evidence-note">
            <ShieldCheck />
            <div><b>为什么不是“显卡性能太弱”？</b><p>显卡平均忙碌度只有 73.8%，没有长期跑满。数据更支持内存压力与间歇热限制，而不是单纯更换显卡。</p></div>
          </div>
        </section>

        <section className="report-section optimization-section" id="optimization">
          <div className="section-heading">
            <span>03 / PERSONAL OPTIMIZATION</span>
            <h3>这次我们为你改变了什么</h3>
            <p>只做一项证据充分、可还原的改变；不碰电压，不乱关系统服务。</p>
          </div>

          <div className="action-module">
            <div className="action-icon"><Wrench /></div>
            <div className="action-copy">
              <span>已应用 · 可还原</span>
              <h4>Deadlock 帧率上限</h4>
              <p>把无意义的高帧波动压住，降低温度与功耗尖峰，把性能预算留给真正容易卡顿的瞬间。</p>
            </div>
            <div className="value-change"><small>BEFORE</small><b>300</b><ArrowDown /><small>AFTER</small><strong>100 FPS</strong></div>
          </div>

          <div className="safety-grid">
            <div><Check /><span><b>没有修改电压</b><small>硬件安全边界不变</small></span></div>
            <div><Check /><span><b>没有关闭安全功能</b><small>不靠玄学系统精简</small></span></div>
            <div><Check /><span><b>随时可以还原</b><small>本机已保存应用收据</small></span></div>
          </div>
        </section>

        <section className="report-section share-section" id="share">
          <div className="section-heading">
            <span>04 / PLAYER SHARE CARD</span>
            <h3>我的电脑，被认真优化过一次</h3>
            <p>这是给玩家主动分享的“性能成就卡”。它展示真实发现与真实动作，不编造没有复测过的提升百分比。</p>
          </div>

          <div className="share-layout">
            <div className="social-card" id="moments-card" aria-label="GameBoost 玩家朋友圈分享卡">
              <div className="social-scanlines" aria-hidden="true" />
              <div className="social-card-head">
                <div className="social-brand"><span>GB</span><div><b>GAMEBOOST</b><small>专属游戏性能诊断</small></div></div>
                <span className="verified-chip"><ShieldCheck /> 真实游玩数据</span>
              </div>

              <div className="social-device-chip"><Laptop /><span>笔记本 · DEADLOCK 实测</span><b>CASE 001</b></div>
              <h4>游戏为什么卡？<br /><em>打一局，就给你讲清楚。</em></h4>
              <p className="social-lead">GameBoost 不靠跑分猜问题。它记录你真正玩游戏时的帧时间、温度、功耗、内存与硬件限制，再由优化师给出一台电脑一份的处理方案。</p>

              <div className="social-promise"><span>采样一局</span><ChevronRight /><span>定位卡顿</span><ChevronRight /><b>专属优化</b></div>

              <div className="social-metrics">
                <div><small>平时表现</small><b>109.3</b><span>中位 FPS</span></div>
                <div className="social-warn"><small>卡顿低谷</small><b>36.7</b><span>1% LOW</span></div>
                <div><small>内存峰值</small><b>97.4%</b><span>存在压力</span></div>
              </div>

              <div className="social-diagnosis">
                <span>这台电脑卡在哪里</span>
                <p><b>高帧不等于稳定</b><i />关键时刻低谷明显<i />内存与热限制叠加</p>
              </div>

              <div className="social-bottom">
                <div className="social-offer">
                  <small>先看懂，再决定要不要优化</small>
                  <h5>免费监测 + 动态 HTML 报告</h5>
                  <p><Wrench />专属人工优化 <b>¥50 / 台</b></p>
                  <blockquote>不是玄学清理。<br />是你的电脑、你的游戏、你的数据。</blockquote>
                  <span>xiaotongcn.mom</span>
                </div>
                <div className="social-qr">
                  <img src="/assets/wechat-qr-lijunxian.jpg" alt="李俊贤的微信好友二维码" />
                  <b>扫码添加优化师</b>
                  <small>免费领取一次性能诊断</small>
                </div>
              </div>
            </div>

            <aside className="share-panel">
              <span className="share-panel-label">SHARE & INVITE</span>
              <h4>朋友圈只讲一件事：<br />“你的卡顿，可以被讲清楚。”</h4>
              <p>第一眼是问题，第二眼是真实案例，第三眼才是价格与二维码。玩家分享的是自己的诊断成果，不是硬广。</p>

              <div className="offer-stack">
                <div><Activity /><span><b>性能监测 + 回传报告</b><small>免费 · 建立信任</small></span><strong>¥0</strong></div>
                <div><Wrench /><span><b>人工分析 + 专属应用</b><small>一台电脑 · 一份配置</small></span><strong>¥50</strong></div>
              </div>

              <div className="referral-reward">
                <Gift />
                <div><b>建议的分享奖励</b><p>分享后领取 1 个“朋友免费体检码”，或获得一次配置复查。让传播是福利，不是强迫。</p></div>
              </div>

              <button className={copied ? 'copy-share copied' : 'copy-share'} onClick={copyShareText}>
                {copied ? <Check /> : <Copy />}
                {copied ? '分享文案已复制' : '复制朋友圈分享文案'}
              </button>
              <button className="save-report" onClick={() => window.print()}><Download />保存完整报告 / PDF</button>
            </aside>
          </div>
        </section>

        <footer className="report-footer">
          <div className="footer-brand"><div className="brand-mark"><span>GB</span></div><div><b>GAMEBOOST</b><small>你的电脑 · 你的游戏 · 你的专属方案</small></div></div>
          <div className="footer-meta"><span>REPORT CASE-001</span><span>SAMPLE 4AEB-66D6</span><span>GENERATED LOCALLY</span></div>
        </footer>
      </article>
      <p className="report-preview-note">CUSTOMER REPORT PREVIEW · 基于真实 Deadlock 样本</p>
    </main>
  );
}

function ExperienceStep({ icon, index, title, value, note, warn = false, danger = false }: {
  icon: React.ReactNode; index: string; title: string; value: string; note: string; warn?: boolean; danger?: boolean;
}) {
  return <div className={`experience-step ${warn ? 'warn' : ''} ${danger ? 'danger' : ''}`}><span className="step-index">{index}</span><div className="step-icon">{icon}</div><h4>{title}</h4><b>{value}</b><small>{note}</small></div>;
}

function SensorEvidence({ icon, label, value, peak, level, tone }: {
  icon: React.ReactNode; label: string; value: string; peak: string; level: number; tone: 'green' | 'amber' | 'orange';
}) {
  return <div className={`sensor-evidence ${tone}`}><div className="sensor-head">{icon}<span>{label}</span><b>{value}</b></div><div className="sensor-track"><i style={{ width: `${level}%` }} /></div><small>{peak}</small></div>;
}

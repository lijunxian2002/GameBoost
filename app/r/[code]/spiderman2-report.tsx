'use client';

import { Activity, Check, ChevronRight, Cpu, Download, Gauge, MemoryStick, Monitor, ShieldCheck, Thermometer, Zap } from 'lucide-react';

const timeline = [
  { label: '00–02', fps: 109.5, note: '开局 / 加载' }, { label: '04–06', fps: 43.2, note: '进入负载' },
  { label: '08–10', fps: 45.1, note: '热限制持续' }, { label: '12–14', fps: 40.9, note: '频率继续下降' },
  { label: '16–18', fps: 34.2, note: '过场前' }, { label: '18–20', fps: 9.0, note: '连续卡顿' },
  { label: '20–22', fps: 32.5, note: '短暂恢复' }, { label: '22–24', fps: 29.9, note: '再次恶化' },
  { label: '24–26', fps: 26.1, note: '过场后' }, { label: '26–28', fps: 39.7, note: '仍不稳定' },
  { label: '28–30', fps: 32.6, note: '持续掉帧' },
];

export default function SpiderMan2Report() {
  const shareText = '我的 Y7000P 用 GameBoost 实测了《漫威蜘蛛侠 2》：平均 41.5 FPS，但 1% Low 只有 8.9。报告定位到 GPU 长时间热降频、16GB 内存压力和 4GB 显存压力。免费监测，专属优化 50 元/台。xiaotongcn.mom/r/FB66CC';
  async function copyShare() { try { await navigator.clipboard.writeText(shareText); } catch { /* clipboard may be unavailable */ } }

  return <main className="case-workbench"><article className="case-machine">
    <header className="case-header">
      <a href="/" className="case-brand"><span>GB</span><div><b>GAMEBOOST</b><small>PLAYER PERFORMANCE REPORT</small></div></a>
      <div className="case-title"><span><i /> ANALYSIS COMPLETE</span><b>CASE FB66CC</b></div>
      <div className="case-model"><small>DEVICE</small><b>Y7000P 2021</b></div>
    </header>

    <section className="case-hero">
      <div className="case-hero-copy"><span>SPIDER-MAN 2 / 30:39 REAL GAMEPLAY</span><h1>过场卡完，游戏还在卡。<br /><em>这不是错觉。</em></h1><p>这台电脑不是“完全带不动”，而是高负载持续后同时撞上 <b>GPU 热降频</b> 与 <b>16GB 内存压力</b>。显卡仍保持 95% 左右负载，但后段频率与功耗被温度压下去，因此过场出现连续低帧，回到操作后也难以立即恢复。</p></div>
      <div className="case-score"><div><span>8.9</span><small>1% LOW FPS</small></div><p>严重不稳定</p><b>平均 41.5 FPS 不能代表真实手感</b></div>
    </section>

    <section className="case-stats">
      <CaseStat label="平均 FPS" value="41.5" note="表面看尚可" icon={<Gauge />} />
      <CaseStat label="1% LOW" value="8.9" note="关键时刻近似卡住" tone="danger" icon={<Zap />} />
      <CaseStat label="最大帧时间" value="616 ms" note="一次停顿约 0.62 秒" tone="warn" icon={<Activity />} />
      <CaseStat label="卡顿簇" value="133 次" note="不是单个偶发点" icon={<Activity />} />
      <CaseStat label="GPU 热限制" value="94.6%" note="1361 / 1439 秒" tone="danger" icon={<Thermometer />} />
      <CaseStat label="内存均值" value="93.6%" note="长期接近满载" tone="warn" icon={<MemoryStick />} />
    </section>

    <section className="case-section case-timeline-section">
      <SectionTitle index="01" eyebrow="WHAT THE PLAYER FELT" title="卡顿发生在哪些时刻" copy="报告不只说帧率低，而是把朋友描述的‘过场特别卡、过场后还卡’还原成时间线。" />
      <div className="case-event-grid">
        <CaseEvent time="00:20 / 01:32" title="开局已经出现重卡" value="493 / 616 ms" copy="加载阶段出现两次肉眼可见的长停顿，但这还不是最严重的问题。" />
        <CaseEvent time="17:48 → 21:03" title="第一段连续卡顿" value="平均 9.2 FPS" copy="持续约 194 秒，P99 帧时间 143 ms；这就是过场像幻灯片的核心区间。" danger />
        <CaseEvent time="23:00 → 24:44" title="第二段连续卡顿" value="约 9–11 FPS" copy="显卡 89°C、约 612 MHz、约 28W；负载仍高，性能却被温度压住。" danger />
        <CaseEvent time="24:44 之后" title="回到游玩仍未恢复" value="约 36 FPS" copy="后续仍有 36 次明显卡顿簇；所以‘过场后游戏也跟着卡’有明确数据证据。" />
      </div>
      <div className="case-bars" aria-label="每两分钟平均帧率">{timeline.map((item) => <div key={item.label}><span><i style={{ height: `${Math.max(7, Math.min(100, item.fps / 1.15))}%` }} /></span><b>{item.fps.toFixed(1)}</b><small>{item.label}</small><em>{item.note}</em></div>)}</div>
    </section>

    <section className="case-section case-cause-section">
      <SectionTitle index="02" eyebrow="ROOT CAUSE" title="真正卡在哪里" copy="主次原因已经能分开：GPU 热墙是第一现场，内存与显存压力让过场资源切换更加难受。" />
      <div className="case-cause-grid">
        <CauseCard rank="主因" icon={<Thermometer />} title="GPU 长时间撞温度墙" value="87.3°C 平均 / 89°C 峰值" copy="94.6% 的遥测秒数报告 SW/HW Thermal Slowdown。开局前两分钟显卡约 1634 MHz / 46.8W，后段只剩约 612 MHz / 27.8W，而 GPU 负载仍约 95%。这是典型的热降频，不是显卡没在工作。" danger />
        <CauseCard rank="第二原因" icon={<MemoryStick />} title="16GB 内存长期满载" value="93.6% 平均 / 99.0% 峰值" copy="90.8% 的时间内存超过 90%，44.1% 的时间可用内存不足 1GB。第一段连续卡顿时平均只剩 598MB，可明显放大过场资源加载与页面换入造成的停顿。" warn />
        <CauseCard rank="叠加压力" icon={<Gauge />} title="4GB 显存 + 1440p 目标" value="显存约 90.4% 平均" copy="显卡为 RTX 3050 Ti Laptop 4GB，样本记录的显示目标为 2560×1440 @ 179Hz。显存 94.5% 的时间超过 90%，建议降低纹理与渲染分辨率。" />
        <CauseCard rank="已排除" icon={<Cpu />} title="CPU 与磁盘不是主因" value="CPU 39.8% / 磁盘队列低" copy="连续卡顿区间 CPU 没有满载，磁盘活动约 4–5%、队列约 0.14–0.16。磁盘读写存在，但不足以解释持续数分钟的 9 FPS。" good />
      </div>
      <div className="case-display-note"><Monitor /><div><b>外接屏状态：这份样本未记录</b><p>样本只记录到 2560×1440 @ 179Hz；它很像外接高刷屏的工作模式，但不能据此直接确认。新版 GameBoost 已加入显示拓扑扫描，下次会明确写出内屏、外屏、连接类型与屏幕数量。</p></div></div>
    </section>

    <section className="case-section case-plan-section">
      <SectionTitle index="03" eyebrow="PERSONAL PLAN" title="这台 Y7000P 应该怎么处理" copy="先阻止它继续撞墙，再降低资源压力；硬件维护与 32GB 内存升级的价值，高于任何玄学系统精简。" />
      <div className="case-plan-grid">
        <PlanStep number="01" title="先用 40 FPS 稳定目标" copy="不要追 180Hz。先把帧率上限设为 40，减少无意义的功耗尖峰，观察 GPU 是否能从 89°C 热墙退下来。" />
        <PlanStep number="02" title="降到 1080p / 中等纹理" copy="关闭光线追踪，纹理先用中等；再选择游戏内可用的质量或平衡型上采样，给 4GB 显存留余量。" />
        <PlanStep number="03" title="清散热 + 抬高进风" copy="2021 年机器若长期未维护，应优先清灰、检查风扇与导热材料。目标是让高负载 GPU 不再长期 88–89°C。" />
        <PlanStep number="04" title="升级 32GB 双通道" copy="当前 16GB 是明确压力点。2×16GB 3200MHz 是最直接、最可持续的硬件改善之一。" />
      </div>
      <div className="case-boundary"><ShieldCheck /><div><b>安全边界</b><p>不改电压，不盲目解锁功率，不关闭安全功能。散热没解决前继续加功率，只会更快撞温度墙。</p></div></div>
    </section>

    <section className="case-section case-conclusion">
      <div><span>OPTIMIZER VERDICT</span><h2>这台电脑的硬伤不是“完全没性能”，<br />而是<em>性能无法长时间维持。</em></h2><p>最值得做的顺序：散热维护 → 40 FPS / 1080p 稳定方案 → 32GB 内存。做完后再采样一局，我们才有资格判断还剩多少是游戏本身的问题。</p></div>
      <div className="case-service"><b>本次完整监测报告</b><strong>免费</strong><span>专属配置与人工应用</span><strong>¥50 / 台</strong><small>一台电脑 · 一个游戏 · 一份可解释方案</small></div>
    </section>

    <section className="case-share-simple">
      <div><span>GAMEBOOST</span><h3>游戏卡顿，<br />打一局就能知道<em>卡在哪。</em></h3><p>真实游戏采样 · 温度 / 功耗 / 内存 / 帧时间完整诊断</p><div><b>免费</b> 性能监测 + HTML 报告　 <b>¥50</b> 专属优化 / 台</div><small>xiaotongcn.mom/r/FB66CC</small></div>
      <div className="case-share-qr"><img src="/assets/wechat-qr-lijunxian.jpg" alt="李俊贤微信二维码" /><b>扫码添加优化师</b><small>发回一局数据，先免费诊断</small></div>
    </section>

    <footer className="case-footer"><span>Spider-Man2.exe · i5-11400H · RTX 3050 Ti Laptop 4GB · 16GB RAM</span><span>SAMPLE FB66CC · RAW DATA NOT PUBLISHED</span><b>xiaotongcn.mom</b></footer>
  </article><div className="case-actions"><button onClick={copyShare}><Check />复制朋友分享文案</button><button onClick={() => window.print()}><Download />保存报告 / PDF</button></div></main>;
}

function SectionTitle({ index, eyebrow, title, copy }: { index: string; eyebrow: string; title: string; copy: string }) { return <div className="case-section-title"><span>{index}</span><div><small>{eyebrow}</small><h2>{title}</h2><p>{copy}</p></div></div>; }
function CaseStat({ icon, label, value, note, tone = '' }: { icon: React.ReactNode; label: string; value: string; note: string; tone?: string }) { return <div className={`case-stat ${tone}`}>{icon}<span><small>{label}</small><b>{value}</b><em>{note}</em></span></div>; }
function CaseEvent({ time, title, value, copy, danger = false }: { time: string; title: string; value: string; copy: string; danger?: boolean }) { return <div className={`case-event ${danger ? 'danger' : ''}`}><span>{time}</span><h3>{title}</h3><b>{value}</b><p>{copy}</p></div>; }
function CauseCard({ rank, icon, title, value, copy, danger = false, warn = false, good = false }: { rank: string; icon: React.ReactNode; title: string; value: string; copy: string; danger?: boolean; warn?: boolean; good?: boolean }) { return <div className={`cause-card ${danger ? 'danger' : ''} ${warn ? 'warn' : ''} ${good ? 'good' : ''}`}><div>{icon}<span>{rank}</span></div><h3>{title}</h3><b>{value}</b><p>{copy}</p></div>; }
function PlanStep({ number, title, copy }: { number: string; title: string; copy: string }) { return <div className="plan-step"><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div><ChevronRight /></div>; }

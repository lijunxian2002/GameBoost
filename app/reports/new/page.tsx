'use client';

import { Activity, Check, Cpu, Download, FileUp, Gauge, Laptop, MemoryStick, Monitor, ShieldCheck, Thermometer } from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';

type Summary = {
  sampleId: string;
  game: string;
  device: string;
  averageFps: number;
  medianFps: number;
  lowFps: number;
  gpuBusy: number;
  memoryPeak: number;
  gpuTempPeak: number;
  displayKnown: boolean;
  displayCount: number;
  externalDisplay: boolean;
  displayTopology: string;
  displayConnections: string;
  framePoints: number;
  telemetryPoints: number;
};

export default function ReportGenerator() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState('玩家朋友');
  const [headline, setHeadline] = useState('平均帧率不低，真正卡在低谷帧稳定性。');
  const [diagnosis, setDiagnosis] = useState('内存压力与间歇性的硬件限制叠加，让画面偶尔出现明显的帧时间尖峰。');

  async function loadSample(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const sample = JSON.parse(await file.text());
      if (!String(sample.Schema || '').startsWith('gameboost.sample/')) throw new Error('这不是可识别的 GameBoost 采样包');
      const timeline: Record<string, number>[] = Array.isArray(sample.Timeline) ? sample.Timeline : [];
      const max = (key: string) => timeline.reduce((value, point) => Math.max(value, Number(point[key]) || 0), 0);
      const device = sample.Device || {};
      const frames = sample.Frames || {};
      const displayKnown = Object.prototype.hasOwnProperty.call(device, 'DisplayTopology') ||
        Object.prototype.hasOwnProperty.call(device, 'DisplayCount') ||
        Object.prototype.hasOwnProperty.call(device, 'HasExternalDisplay');
      setSummary({
        sampleId: String(sample.SampleId || ''),
        game: String(sample.Game?.DisplayName || sample.Game?.ProcessName || '未知游戏'),
        device: `${device.CpuName || '未知 CPU'} · ${device.GpuName || '未知 GPU'}`,
        averageFps: Number(frames.AverageFps) || 0,
        medianFps: Number(frames.MedianFps) || 0,
        lowFps: Number(frames.TailFps99) || 0,
        gpuBusy: Number(frames.AverageGpuBusyPercent) || 0,
        memoryPeak: max('MemoryPercent'),
        gpuTempPeak: max('GpuTemperatureC'),
        displayKnown,
        displayCount: Number(device.DisplayCount) || (device.ScreenWidth ? 1 : 0),
        externalDisplay: Boolean(device.HasExternalDisplay),
        displayTopology: String(device.DisplayTopology || '旧样本未记录'),
        displayConnections: String(device.DisplayConnections || 'N/A'),
        framePoints: Array.isArray(sample.FrameTimeline) ? sample.FrameTimeline.length : 0,
        telemetryPoints: timeline.length,
      });
    } catch (reason) {
      setSummary(null);
      setError(reason instanceof Error ? reason.message : '采样包读取失败');
    }
  }

  const safeCode = useMemo(() => summary?.sampleId ? summary.sampleId.slice(0, 6).toUpperCase() : '------', [summary]);

  function downloadHtml() {
    if (!summary) return;
    const html = buildOfflineReport(summary, customer, headline, diagnosis);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `GameBoost_${safeName(summary.game)}_${safeCode}_诊断报告.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="generator-site">
      <header className="generator-head"><a href="/">XT / 小同实验室</a><span>GAMEBOOST REPORT FOUNDRY</span><b>OWNER TOOL · LOCAL PARSE</b></header>
      <section className="generator-hero"><span>REPORT GENERATOR / P0</span><h1>把回传数据，变成顾客真正看得懂的报告。</h1><p>原始 `.gbsample` 只在当前浏览器读取。先由优化师审阅结论，再生成脱敏 HTML；当前工具不会自动上传原始采样。</p></section>

      <section className="generator-grid">
        <div className="generator-input">
          <label className="sample-drop"><FileUp /><b>拖入或选择 .gbsample</b><span>读取帧时间、硬件遥测与显示拓扑</span><input type="file" accept=".gbsample,application/json" onChange={loadSample} /></label>
          {error && <p className="generator-error">{error}</p>}
          <div className="privacy-strip"><ShieldCheck /><span><b>隐私规则</b>不发布原始采样、本地路径、完整设备指纹或无关进程。</span></div>

          <div className="generator-fields">
            <label>顾客称呼<input value={customer} onChange={(event) => setCustomer(event.target.value)} /></label>
            <label>一句话“卡在哪”<textarea value={headline} onChange={(event) => setHeadline(event.target.value)} /></label>
            <label>优化师解释<textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} /></label>
          </div>
        </div>

        <div className="generator-preview">
          <div className="generator-preview-head"><span><i /> REPORT PREVIEW</span><b>CASE {safeCode}</b></div>
          {!summary ? <div className="generator-empty"><Gauge /><p>等待采样包</p><span>载入后将在这里显示可发布数据</span></div> : <>
            <div className="generator-device"><Cpu /><span>{summary.device}</span><b>{summary.game}</b></div>
            <h2>{customer}，<br /><em>{headline}</em></h2>
            <p>{diagnosis}</p>
            <div className="generator-metrics"><Metric label="AVG FPS" value={summary.averageFps} /><Metric label="1% LOW" value={summary.lowFps} warn /><Metric label="MEM PEAK" value={summary.memoryPeak} suffix="%" /></div>
            <div className="generator-display"><DisplayIcon external={summary.externalDisplay} /><span><b>显示拓扑</b><small>{summary.displayKnown ? `${summary.displayTopology} · ${summary.displayCount} 屏 · ${summary.displayConnections}` : '该旧样本没有采集显示拓扑，请用新版 GameBoost 重新采样'}</small></span><strong>{summary.displayKnown ? (summary.externalDisplay ? '检测到外接屏' : '未检测到外接屏') : '旧样本未记录'}</strong></div>
            <div className="generator-evidence"><span><Check />{summary.framePoints} 个帧时间点</span><span><Check />{summary.telemetryPoints} 个遥测点</span><span><Check />GPU 峰值 {summary.gpuTempPeak.toFixed(0)}°C</span></div>
          </>}
        </div>
      </section>

      <section className="generator-actions"><button disabled={!summary} onClick={downloadHtml}><Download />生成单文件 HTML</button><div><b>官网发布路径</b><span>xiaotongcn.mom/r/{safeCode}</span><small>正式发布需要优化师确认和官网发布权限</small></div></section>
    </main>
  );
}

function Metric({ label, value, suffix = '', warn = false }: { label: string; value: number; suffix?: string; warn?: boolean }) {
  return <div className={warn ? 'warn' : ''}><small>{label}</small><b>{value > 0 ? value.toFixed(1) : 'N/A'}{suffix}</b></div>;
}

function DisplayIcon({ external }: { external: boolean }) {
  return external ? <Monitor /> : <Laptop />;
}

function safeName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) || 'Game';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}

function buildOfflineReport(summary: Summary, customer: string, headline: string, diagnosis: string) {
  const data = { ...summary, customer, headline, diagnosis };
  const d = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? escapeHtml(value) : value]));
  const displayText = d.displayKnown
    ? `${d.displayCount} 屏 · ${d.displayConnections} · ${d.externalDisplay ? '检测到外接屏' : '未检测到外接屏'}`
    : '该旧样本未采集显示拓扑，请使用新版 GameBoost 重新采样';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GameBoost · ${d.game} 专属诊断</title><style>*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 50% 10%,#29302c,#080b09 70%);color:#dfe7d8;font-family:Arial,"Microsoft YaHei UI",sans-serif}.shell{width:min(920px,calc(100% - 24px));margin:22px auto;padding:20px;border:1px solid #4d5551;border-radius:20px;background:linear-gradient(145deg,#292e2c,#141715);box-shadow:0 35px 80px #000}.head{display:flex;justify-content:space-between;padding:15px 10px 22px;border-bottom:1px solid #343c37;font:700 10px Arial;letter-spacing:1px}.head b{color:#e0aa48}.screen{position:relative;margin-top:18px;padding:34px;border:1px solid #34483a;background:radial-gradient(circle at 35% 25%,#16301f,#07100c 65%);box-shadow:inset 0 0 28px #000}.screen small{color:#dba747}.screen h1{font-size:clamp(29px,6vw,52px);line-height:1.25;margin:15px 0;color:#d3e7b7}.screen h1 em{color:#eab34d;font-style:normal}.screen p{max-width:720px;color:#8da083;line-height:1.85}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:28px}.metrics div{padding:18px;border:1px solid #26372c;background:#09120d}.metrics span{display:block;color:#627561;font:700 8px Arial}.metrics b{display:block;margin-top:10px;color:#bddb97;font-size:25px}.metrics .warn b{color:#e5ab46}.display{display:flex;gap:14px;align-items:center;margin-top:14px;padding:17px;border:1px solid #303a33;background:#171c18}.display b{display:block;color:#c7cec1}.display span{display:block;margin-top:6px;color:#747f74;font-size:12px}.foot{display:flex;justify-content:space-between;padding:24px 10px 6px;color:#656d67;font-size:10px}.foot b{color:#9fcf61}@media(max-width:600px){.screen{padding:23px}.metrics{grid-template-columns:1fr}.foot{display:block}.foot span{display:block;margin-top:8px}}</style></head><body><article class="shell"><header class="head"><span>GAMEBOOST · PERSONAL PERFORMANCE REPORT</span><b>CASE ${String(d.sampleId).slice(0,6).toUpperCase()}</b></header><section class="screen"><small>一句话结论</small><h1>${d.customer}，<br><em>${d.headline}</em></h1><p>${d.diagnosis}</p><div class="metrics"><div><span>平均 FPS</span><b>${Number(d.averageFps).toFixed(1)}</b></div><div class="warn"><span>1% LOW</span><b>${Number(d.lowFps).toFixed(1)}</b></div><div><span>内存峰值</span><b>${Number(d.memoryPeak).toFixed(1)}%</b></div></div><div class="display"><div>▣</div><div><b>显示拓扑：${d.displayKnown ? d.displayTopology : '旧样本未记录'}</b><span>${displayText}</span></div></div></section><footer class="foot"><span>${d.game} · ${d.device}</span><b>xiaotongcn.mom · 免费监测 / 专属优化 ¥50</b></footer></article></body></html>`;
}

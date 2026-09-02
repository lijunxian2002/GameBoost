'use client';

import {
  Activity,
  ArrowUpRight,
  Cpu,
  Download,
  Gauge,
  RotateCcw,
  Thermometer,
  Upload,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type MachineState = 'idle' | 'sampling' | 'captured' | 'profile' | 'applied';

const stateCopy: Record<MachineState, { badge: string; line: string }> = {
  idle: { badge: 'STANDBY', line: '等待实测采样。进入会卡顿的游戏场景后按下 CAPTURE。' },
  sampling: { badge: 'RECORDING', line: '正在记录帧时间、温度、频率、功耗与限制原因…' },
  captured: { badge: 'SAMPLE READY', line: '样本已封装。现在导出并回传这份 .gbsample。' },
  profile: { badge: 'CFG LOADED', line: '专属配置已载入：2 个可还原动作，等待确认。' },
  applied: { badge: 'OPTIMIZED', line: '专属配置已应用，还原收据已保存在本机。' },
};

export default function Home() {
  const [mode, setMode] = useState<MachineState>('idle');
  const [seconds, setSeconds] = useState(0);

  const clock = useMemo(() => {
    const value = mode === 'sampling' ? Math.max(74, seconds) : mode === 'idle' ? 0 : 524;
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  }, [mode, seconds]);

  function capture() {
    if (mode === 'sampling') {
      setMode('captured');
      return;
    }
    setSeconds(74);
    setMode('sampling');
    window.setTimeout(() => setSeconds(82), 800);
  }

  function returnSample() {
    if (mode === 'idle' || mode === 'sampling') return;
    setMode('captured');
  }

  function loadOrApply() {
    if (mode === 'idle' || mode === 'sampling') return;
    setMode(mode === 'profile' ? 'applied' : 'profile');
  }

  const activeData = mode !== 'idle';
  const hasProfile = mode === 'profile' || mode === 'applied';
  const copy = stateCopy[mode];

  return (
    <main className="workbench">
      <section className="machine" aria-label="GameBoost 单屏控制台原型">
        <i className="screw screw-nw" />
        <i className="screw screw-ne" />
        <i className="screw screw-sw" />
        <i className="screw screw-se" />

        <header className="machine-header">
          <div className="brand-block">
            <div className="brand-mark"><span>GB</span></div>
            <div>
              <h1>GAMEBOOST</h1>
              <p>FIELD PERFORMANCE UNIT</p>
            </div>
          </div>

          <div className="header-rail" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>

          <div className="unit-state">
            <span className={`state-lamp ${mode === 'sampling' ? 'recording' : mode === 'applied' ? 'ready' : ''}`} />
            <div>
              <small>UNIT STATUS</small>
              <strong>{copy.badge}</strong>
            </div>
          </div>
        </header>

        <div className="body-grid">
          <aside className="side-panel left-panel" aria-label="设备概况">
            <div className="engraved">GB // 0137</div>
            <div className="side-readout">
              <Cpu size={18} />
              <span>CPU</span>
              <b>R7 5800H</b>
            </div>
            <div className="side-readout">
              <Gauge size={18} />
              <span>GPU</span>
              <b>RTX 3050 Ti</b>
            </div>
            <div className="side-readout">
              <Activity size={18} />
              <span>DISPLAY</span>
              <b>1080P / 165</b>
            </div>
            <div className="vent" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</div>
          </aside>

          <section className="screen-bezel">
            <div className="screen-topline">
              <span>CORE CONSOLE / LOCAL ONLY</span>
              <span className="signal-bars" aria-label="设备在线"><i /><i /><i /><i /></span>
            </div>

            <div className="display">
              <div className="scanlines" aria-hidden="true" />
              <div className="display-head">
                <span className={`live-dot ${mode === 'sampling' ? 'pulse' : ''}`} />
                <b>{copy.badge}</b>
                <span>SESSION 08-31 / LOCAL</span>
              </div>

              <div className="console-grid">
                <div className="code-panel">
                  <p><em>[DEVICE]</em></p>
                  <p><span>platform</span> = <b>&quot;WIN11_LAPTOP&quot;</b></p>
                  <p><span>fingerprint</span> = <b>&quot;GB-7C21-A9F0&quot;</b></p>
                  <p><span>gpu</span> = <b>&quot;RTX_3050_TI_MOBILE&quot;</b></p>
                  <p className="code-gap"><em>[CAPTURE]</em></p>
                  <p><span>target</span> = <b>&quot;project8.exe&quot;</b></p>
                  <p><span>duration</span> = <strong>&quot;{clock}&quot;</strong></p>
                  <p><span>frametime_source</span> = <b>&quot;PRESENTMON&quot;</b></p>
                  <p className="code-gap"><em>[PROFILE]</em></p>
                  <p><span>cfg</span> = <strong>&quot;{hasProfile ? 'THERMAL_STABLE_01' : 'WAITING'}&quot;</strong></p>
                  <p><span>safety</span> = <b>&quot;REVERSIBLE_ONLY&quot;</b></p>
                </div>

                <div className="telemetry-panel">
                  <Metric icon={<Gauge size={16} />} label="AVG FPS" value={activeData ? '164.8' : '---'} unit="FPS" />
                  <Metric icon={<Activity size={16} />} label="1% LOW" value={activeData ? '96.4' : '---'} unit="FPS" warn />
                  <Metric icon={<Thermometer size={16} />} label="GPU TEMP" value={activeData ? '82' : '--'} unit="°C" />
                  <Metric icon={<Zap size={16} />} label="LIMIT" value={activeData ? 'THERMAL' : 'NONE'} unit="" warn={activeData} />
                </div>
              </div>

              <div className="terminal-line">
                <span className="prompt">GB&gt;</span>
                <span>{copy.line}</span>
                <i />
              </div>
            </div>

            <div className="screen-foot">
              <span>READ-ONLY TELEMETRY</span>
              <span>NO DRIVER / NO CLOUD</span>
              <span>BUILD P0.13</span>
            </div>
          </section>

          <aside className="side-panel right-panel" aria-label="配置状态">
            <div className="profile-chip">
              <small>CFG SLOT</small>
              <b>{hasProfile ? '01' : '--'}</b>
              <span>{hasProfile ? 'LOCKED' : 'EMPTY'}</span>
            </div>
            <dl>
              <div><dt>SAMPLE</dt><dd>{activeData ? 'READY' : 'WAIT'}</dd></div>
              <div><dt>BINDING</dt><dd>{hasProfile ? 'MATCH' : '---'}</dd></div>
              <div><dt>RECEIPT</dt><dd>{mode === 'applied' ? 'SAVED' : '---'}</dd></div>
            </dl>
            <button className="restore-key" disabled={mode !== 'applied'} onClick={() => setMode('profile')}>
              <RotateCcw size={15} /> RESTORE
            </button>
          </aside>
        </div>

        <footer className="control-deck">
          <div className="deck-caption">
            <b>MISSION CONTROL</b>
            <span>一次采样 · 一份专属配置 · 一次优化</span>
          </div>

          <div className="control-bank">
            <GameKey
              letter="A"
              title={mode === 'sampling' ? '停止采样' : '实测采样'}
              note={mode === 'sampling' ? 'STOP & PACK' : 'CAPTURE'}
              color="amber"
              onClick={capture}
              active={mode === 'sampling'}
              icon={<Activity size={21} />}
            />
            <GameKey
              letter="B"
              title="导出回传"
              note=".GBSAMPLE"
              color="steel"
              onClick={returnSample}
              disabled={mode === 'idle' || mode === 'sampling'}
              icon={<Download size={21} />}
            />
            <GameKey
              letter="X"
              title={mode === 'profile' ? '应用优化' : mode === 'applied' ? '已优化' : '载入配置'}
              note={mode === 'profile' ? 'APPLY CFG' : '.GBCFG'}
              color="green"
              onClick={loadOrApply}
              disabled={mode === 'idle' || mode === 'sampling' || mode === 'applied'}
              icon={mode === 'profile' ? <Zap size={21} /> : <Upload size={21} />}
            />
          </div>

          <div className="deck-meta">
            <span>PROFILE LINK</span>
            <ArrowUpRight size={17} />
            <b>{hasProfile ? 'BOUND' : 'OFFLINE'}</b>
          </div>
        </footer>
      </section>
      <p className="prototype-note">INTERACTIVE UI PROTOTYPE · 点击三个实体键体验状态变化</p>
      <section className="console-trust" aria-label="GameBoost 服务边界">
        <div><span>READ BEFORE ACTION</span><b>采样不改系统；CFG 先由真人审核。</b><p>免费报告解释“卡在哪里”。只有确认存在合理改善空间时，才提供收费的专属配置与指导。</p></div>
        <nav><Link href="/service">服务说明</Link><Link href="/privacy">隐私政策</Link><Link href="/terms">用户协议</Link><Link href="/data-rights">数据与投诉</Link></nav>
      </section>
    </main>
  );
}

function Metric({ icon, label, value, unit, warn = false }: { icon: React.ReactNode; label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className="metric">
      <div className="metric-label">{icon}<span>{label}</span></div>
      <div className={warn ? 'metric-value warn' : 'metric-value'}>{value}<small>{unit}</small></div>
      <i><span style={{ width: value === '---' || value === '--' ? '8%' : warn ? '84%' : '68%' }} /></i>
    </div>
  );
}

function GameKey({ letter, title, note, color, onClick, disabled = false, active = false, icon }: {
  letter: string; title: string; note: string; color: 'amber' | 'steel' | 'green'; onClick: () => void; disabled?: boolean; active?: boolean; icon: React.ReactNode;
}) {
  return (
    <button className={`game-key ${color} ${active ? 'is-active' : ''}`} onClick={onClick} disabled={disabled}>
      <span className="key-cap"><b>{letter}</b>{icon}</span>
      <span className="key-copy"><b>{title}</b><small>{note}</small></span>
    </button>
  );
}

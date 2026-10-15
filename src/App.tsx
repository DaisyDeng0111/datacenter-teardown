/* 数据中心的四级拆解：机房 → 机柜 → 服务器 → 软件。
   左栏管「在哪一级、看哪一面」，中间是舞台，右栏是这级零件的清单。
   状态只留两个：层级与行业视图；其余全部交给引擎。 */
import { useEffect, useRef, useState } from 'react';
import { MODELS, LEVELS, bootLevel, type LevelId } from './lib/env';
import type { Engine } from './lib/teardown';

export default function App() {
  const [level, setLevel] = useState<LevelId>('room');
  const [mode, setMode] = useState(0);
  const [parts, setParts] = useState<{ id: string; name: string; tag: string; layer: number }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const model = MODELS[level];

  /* 换层级 = 换引擎。引擎内部自己处理加载屏与重建。 */
  useEffect(() => {
    let dead = false;
    let engine: Engine | null = null;
    bootLevel(level, stageRef.current!, mode).then(e => {
      if (dead) { e.dispose(); return; }
      engine = e;
      engineRef.current = e;
      setParts(e.index());
      e.onSelect = id => setActive(id);
    });
    return () => { dead = true; engine?.dispose(); engineRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  /* 行业视图（裸片模式）：不重建引擎，只换版图与部件组 */
  useEffect(() => {
    engineRef.current?.setDieMode(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const focus = (id: string) => {
    setActive(id);
    engineRef.current?.focus(id);
  };

  return (
    <div id="app">
      <aside>
        <div className="hd">
          <h1>数据中心透视引擎 <small>TEARDOWN</small></h1>
          <p>{model.meta.sub}</p>
        </div>

        <div className="levels">
          {(Object.keys(MODELS) as (keyof typeof MODELS)[]).map(id => (
            <button key={id} className={id === level ? 'on' : ''} onClick={() => { setLevel(id); setMode(0); }}>
              <b>{MODELS[id].meta.levelName}</b>
              <span>{MODELS[id].meta.crumb}</span>
            </button>
          ))}
        </div>

        <div className="die">
          <div className="die-hd">{model.meta.dieTab}</div>
          {model.DIE_MODES.map((m, i) => (
            <button key={m.id} className={i === mode ? 'on' : ''} onClick={() => setMode(i)}>
              <b>{m.name}</b>
              <span>{m.tag}</span>
            </button>
          ))}
          <p className="die-desc">{model.DIE_MODES[mode].desc}</p>
        </div>

        <div className="foot">
          <span>{model.meta.stat}</span>
          <span>{parts.length} PARTS</span>
        </div>
      </aside>

      <main>
        <div id="stage" ref={stageRef} />
        <div className="hud">
          <span>拖动旋转 · 滚轮缩放 · 点击零件聚焦</span>
        </div>
      </main>

      <section className="idx">
        <div className="idx-hd">部件索引 <span>{model.meta.crumb}</span></div>
        <div className="idx-list">
          {[...parts].sort((a, b) => a.layer - b.layer).map(p => (
            <div key={p.id} className={`ix ${p.id === active ? 'on' : ''}`} onClick={() => focus(p.id)}>
              <b>{p.name}</b>
              <span>{p.tag}</span>
              <em>L{p.layer}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

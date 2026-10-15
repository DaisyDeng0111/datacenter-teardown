import { useEffect, useRef, useState } from 'react'
import { createTeardown } from './lib/teardown.js'
import * as room from './models/room.js'
import * as rack from './models/rack.js'
import * as server from './models/server.js'
import * as software from './models/software.js'

/* 数据中心的四级拆解：机房 → 机柜 → 服务器 → 软件。
   每一级是一份独立模型（零件表 + 链路 + 场景参数），切换层级即整景重建。 */
const MODELS = { room, rack, server, software }

/* 加载屏住在 index.html 里（它得比这个 chunk 先画出来），引擎通过它报进度。
   这边只管一件事：连 WebGL2 都没有的设备上，别让加载屏一直扣着页面。 */
declare global {
  interface Window {
    __boot?: { set(v: number, label?: string): void; dl(got: number, total: number): void
               done(): void; fail(msg?: string): void }
  }
}

type Row = { name: string; tag: string; layer: number; on: boolean }
type Index = { rows: Row[]; locked: number; nPart: number | string; nTri: string }

const no = (i: number) => String(i + 1).padStart(2, '0')

export default function App() {
  const stage = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const tips = useRef<HTMLDivElement>(null)
  const paneParts = useRef<HTMLDivElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const api = useRef<ReturnType<typeof createTeardown> | null>(null)

  const [level, setLevel] = useState<'room' | 'rack' | 'server' | 'software'>('room')
  const model = MODELS[level]

  const [ix, setIx] = useState<Index>({ rows: [], locked: -1, nPart: '—', nTri: '—' })
  const [crumb, setCrumb] = useState({ crumb: 'ARCHITECTURE', mode: 'EXTERIOR' })
  const [ex, setEx] = useState(0)
  const [cut, setCut] = useState(100)
  const [grid, setGrid] = useState(true)
  const [wire, setWire] = useState(false)
  const [flow, setFlow] = useState(true)
  const [spin, setSpin] = useState(false)
  const [pane, setPane] = useState('parts')
  const [dieMode, setDieMode] = useState(0)
  const [gate, setGate] = useState(false)
  const [refUrl, setRefUrl] = useState('')
  const [refA, setRefA] = useState(55)
  const [refZ, setRefZ] = useState(180)
  const [over, setOver] = useState(false)

  /* 切换层级 = 销毁旧场景、重建新场景。控件读数一起归零，
     不然新场景的滑杆还停在上一层的读数上。 */
  useEffect(() => {
    setEx(0); setCut(100); setGrid(true); setWire(false); setFlow(true)
    setPane('parts'); setDieMode(0); setRefUrl(''); setGate(false)
    const t = createTeardown({
      els: { stage: stage.current!, svg: svg.current!, tips: tips.current!, paneParts: paneParts.current! },
      emit: {
        index: setIx, crumb: setCrumb, explode: setEx, cut: setCut,
        spin: setSpin, gate: setGate, ref: setRefUrl,
      },
      model: MODELS[level],
    })
    api.current = t
    return () => { t.dispose(); api.current = null }
  }, [level])

  useEffect(() => { if (gate) window.__boot?.fail('这台设备不支持 WebGPU / WebGL2') }, [gate])

  const stop = (e: React.DragEvent, on: boolean) => { e.preventDefault(); setOver(on) }
  const modes = model.DIE_MODES as { id: number; name: string; tag: string; desc: string }[]

  return (
    <div id="app">
      <aside>
        <div className="hd">
          <h1>数据中心透视引擎 <small>TEARDOWN</small></h1>
          <p>{model.meta.sub}</p>
        </div>

        <div className="levels">
          {(Object.keys(MODELS) as (keyof typeof MODELS)[]).map(id => (
            <button key={id} className={level === id ? 'on' : ''} type="button"
              onClick={() => setLevel(id)}>{MODELS[id].meta.levelName}</button>
          ))}
        </div>

        <div className="tabs">
          {[['parts', model.meta.partsTab ?? model.meta.levelName + '部件'],
            ...(modes.length ? [['die', model.meta.dieTab ?? '软件栈']] : [])]
            .map(([id, label]) => (
            <button key={id} className={pane === id ? 'on' : ''} data-pane={id} type="button"
              onClick={() => setPane(id)}>{label}</button>
          ))}
        </div>

        {/* 行由 React 画，但点击/悬停仍走引擎挂在这个容器上的委托监听 */}
        <div className={'pane' + (pane === 'parts' ? ' on' : '')} id="pane-parts" ref={paneParts}>
          {ix.rows.map((p, i) => (
            <div key={i} className={'ix' + (p.on ? '' : ' off') + (ix.locked === i ? ' on' : '')} data-i={i}>
              <span className="no">{no(i)}</span>
              <span className="nm"><b>{p.name}</b><i>第 {p.layer} 层</i></span>
              <span className="tg">{p.tag}</span>
              <span className="eye" data-eye={i}>{p.on ? '◉' : '○'}</span>
            </div>
          ))}
        </div>

        {modes.length > 0 && (
        <div className={'pane' + (pane === 'die' ? ' on' : '')} id="pane-die">
          <div id="die-ix">
            {modes.map(m => (
              <div key={m.id} className={'ix' + (dieMode === m.id ? ' on' : '')} data-mode={m.id}
                onClick={() => { setDieMode(m.id); api.current?.setDieMode(m.id) }}>
                <span className="no">{no(m.id)}</span>
                <span className="nm"><b>{m.name}</b><i>{m.desc.slice(0, 22)}…</i></span>
                <span className="tg">{m.tag}</span>
              </div>
            ))}
            <div style={{
              padding: '11px 15px 4px', fontSize: '10.5px', lineHeight: 1.75, color: 'var(--muted)',
              borderTop: '1px solid var(--line-soft)', marginTop: '6px',
            }} id="die-desc">{modes[dieMode].desc}</div>
          </div>
        </div>
        )}

        <div className={'drop' + (over ? ' over' : '')} id="drop" onClick={() => file.current?.click()}
          onDragEnter={e => stop(e, true)} onDragOver={e => stop(e, true)}
          onDragLeave={e => stop(e, false)}
          onDrop={e => { stop(e, false); api.current?.useFile(e.dataTransfer.files[0]) }}>
          <input type="file" id="file" accept="image/*" ref={file}
            onChange={e => api.current?.useFile(e.target.files?.[0])} />
          {refUrl
            ? <><img src={refUrl} alt="参考照片" /><i style={{ marginTop: '7px' }}>已作为对位底图放进场景 · 点此更换</i></>
            : <><b>拖入一张服务器或机房照片</b>
              <i>作为对位底图立在模型后面。<br />再把 Agent Brief 里的提示词连同照片发给 agent，<br />让它照着写出这一页的 PARTS 数组。</i></>}
        </div>
        <div className={'refctl' + (refUrl ? ' on' : '')} id="refctl">
          <div className="sl" style={{ marginBottom: '7px' }}>
            <label>底图浓度</label>
            <input type="range" id="ref-a" min="0" max="100" value={refA}
              onChange={e => { setRefA(+e.target.value); api.current?.setRefAlpha(+e.target.value) }} />
            <output id="ref-ao">{refA}</output>
          </div>
          <div className="sl">
            <label>底图距离</label>
            <input type="range" id="ref-z" min="60" max="320" value={refZ}
              onChange={e => { setRefZ(+e.target.value); api.current?.setRefDist(+e.target.value) }} />
            <output id="ref-zo">{refZ}</output>
          </div>
        </div>

        <div className="foot">
          <div>部件 <b id="n-part">{ix.nPart}</b> · 三角面 <b id="n-tri">{ix.nTri}</b></div>
          <div>拖拽旋转 · 滚轮缩放 · 点部件锁定</div>
        </div>
      </aside>

      <div id="stage" ref={stage}>
        <svg id="svg" ref={svg}></svg>
        <div id="tips" ref={tips}></div>

        <div className="crumb">{model.meta.crumb} / <b id="crumb">{crumb.crumb}</b></div>
        <div className="stat">
          <div>{model.meta.stat} <span className="dot"></span></div>
          <div><em id="st-mode">{crumb.mode}</em></div>
        </div>

        <div id="dock">
          <div className="sl">
            <label>爆炸</label><input type="range" id="ex" min="0" max="100" value={ex}
              onChange={e => api.current?.setExplode(+e.target.value)} /><output id="exo">{ex}</output>
          </div>
          <div className="sl">
            <label>剖切</label><input type="range" id="cut" min="0" max="100" value={cut}
              onChange={e => api.current?.setCut(+e.target.value)} />
            <output id="cuto">{cut === 100 ? '—' : cut}</output>
          </div>
          <div className="vsep"></div>
          {[0, 45, 100].map((v, i) => (
            <button key={v} className="tb" data-preset={v} type="button"
              onClick={() => api.current?.setExplode(v)}>{['合起', '半开', '全炸'][i]}</button>
          ))}
          <div className="vsep"></div>
          <button className={'tb' + (grid ? ' on' : '')} id="t-grid" type="button"
            onClick={() => { setGrid(!grid); api.current?.setGrid(!grid) }}>网格</button>
          <button className={'tb' + (wire ? ' on' : '')} id="t-wire" type="button"
            onClick={() => { setWire(!wire); api.current?.setWire(!wire) }}>线框</button>
          <button className={'tb' + (flow ? ' on' : '')} id="t-flow" type="button"
            onClick={() => { setFlow(!flow); api.current?.setFlow(!flow) }}>数据通路</button>
          <button className={'tb' + (spin ? ' on' : '')} id="t-spin" type="button"
            onClick={() => { setSpin(!spin); api.current?.setSpin(!spin) }}>自转</button>
        </div>

        <div id="hint">→ 拖拽旋转　→ 滚轮缩放　→ 悬停查看<br />ESC 取消锁定 · 1/2/3 切爆炸预设</div>
        <div id="gate" style={gate ? { display: 'grid' } : undefined}>这台设备既没有 WebGPU 也没有 WebGL2。<br />左栏的部件索引与释义仍然可读。</div>
      </div>
    </div>
  )
}

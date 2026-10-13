/* ═══════════════════════════════════════════════════════════════════════
   裸片版图 —— 用 TSL 画在裸片顶面上的那张图。

   三种裸片各有自己的读法：

     ccd  Zen 5 计算裸片。长边横放，八个核心分上下两排，
          中间一条 32 MB L3 把它们隔开（**沿长轴，不是沿短轴** —— 这条带的方向
          画错，会让人以为核心是左右各四个）。每个核心朝内那侧是 1 MB L2，
          朝外、贴着裸片边缘的那道是 512 位向量单元 —— FPU 最热，所以被推到边上。
          GMI3 的 PHY 在朝向 cIOD 的那条长边上。
          五种 uMode 读法在末尾按权重混合，不走分支，所以切换是渐变的。

     l3d  第二代 3D V-Cache。整片铺满 TSV，中央是 64 MB SRAM 阵列 —— 这一面朝上，
          正是与 CCD 铜-铜混合键合的那一面。

     iod  cIOD。不编造功能分区：它的功能分区没有可靠的公开版图，
          所以只画金属层本来的样子（几层正交布线 + 边缘的 PHY 宏块）。

   坐标不取 uv：BoxGeometry 六个面的 uv 走向不一致，靠 uv 分区会在某个面上翻过来。
   这里直接用 positionLocal.xz 除以零件尺寸，p.x 沿长边、p.y 沿短边，永远对。
   ═══════════════════════════════════════════════════════════════════════ */

import {
  vec2, vec3, float, positionLocal, normalLocal,
  smoothstep, step, abs, fract, floor, mix, sin, clamp, max, length, dot, pow,
} from 'three/tsl';
import { band, rect } from './tsl-util.js';

const hash21 = c => fract(sin(dot(c, vec2(41.3, 289.1))).mul(43758.5453));

/* 每格描边：n 格里画出格与格之间那条缝 */
const gridLine = (x, n, w) => float(1).sub(band(fract(x.mul(n)), w, 1 - w, w * 0.6));

const KEY = {
  core:  vec3(0.36, 0.60, 0.88),
  l2:    vec3(0.98, 0.74, 0.34),
  fpu:   vec3(0.78, 0.44, 0.86),
  l3:    vec3(0.36, 0.88, 0.76),
  tsv:   vec3(1.00, 0.70, 0.28),
  fab:   vec3(0.58, 0.82, 1.00),
  hot:   vec3(1.00, 0.86, 0.48),
  dark:  vec3(0.055, 0.070, 0.085),
  dim:   vec3(0.10, 0.12, 0.145),
};

/* ── 金属层：任何裸片顶面都有的那层正交布线。三个尺度叠起来才像。 ── */
function metalLayers(p) {
  const a = gridLine(p.x, 220, 0.30).mul(0.35);
  const b = gridLine(p.y, 140, 0.30).mul(0.28);
  const c = gridLine(p.x.add(p.y.mul(0.5)), 48, 0.42).mul(0.18);
  return a.add(b).add(c);
}

/* ── 划片道内侧那圈密封环，每颗裸片都有。给了它，裸片才不像一块塑料板。 ── */
function sealRing(p) {
  const inner = rect(p, 0.016, 0.984, 0.024, 0.976, 0.004);
  const outer = rect(p, 0.006, 0.994, 0.010, 0.990, 0.004);
  return outer.sub(inner);
}

/* ═══════ Zen 5 CCD ═══════════════════════════════════════════════════ */
function ccdPlan(p, t, mode) {
  const ay = abs(p.y.sub(0.5));                       // 到长轴中线的距离

  /* 版图分区 */
  const inL3   = rect(p, 0.045, 0.955, 0.355, 0.645, 0.004);
  const inRow  = band(ay, 0.155, 0.425, 0.004).mul(band(p.x, 0.045, 0.955, 0.004));
  const inIF   = rect(p, 0.10, 0.90, 0.936, 0.994, 0.004);

  /* 核心格：横向四个，上下两排 */
  const cu = p.x.sub(0.045).div(0.2275);
  const ci = clamp(floor(cu), 0, 3);
  const fx = fract(cu);
  const row = step(0.5, p.y);
  const coreId = ci.add(row.mul(4));
  const gut = band(fx, 0.06, 0.94, 0.018);            // 核与核之间的缝
  const core = inRow.mul(gut);

  /* 核内分层：r=0 贴着 L3，r=1 贴着裸片边缘 */
  const r = clamp(ay.sub(0.155).div(0.27), 0, 1);
  const mL2  = core.mul(band(r, 0.00, 0.26, 0.012));
  const mFPU = core.mul(band(r, 0.80, 1.00, 0.012));
  const mLog = core.mul(band(r, 0.26, 0.80, 0.012));

  /* L3：32 个 1 MB 宏块 —— 16 列 × 2 排，就排在裸片中轴上 */
  const l3x = p.x.sub(0.045).div(0.91);
  const l3y = p.y.sub(0.355).div(0.29);
  const macro = inL3.mul(band(fract(l3x.mul(16)), 0.06, 0.94, 0.05))
                    .mul(band(fract(l3y.mul(2)), 0.06, 0.94, 0.05));

  /* TSV：L3 底下那片硅通孔。Zen 5 比 Zen 4 稀，所以点阵给得松。 */
  const tq = vec2(fract(p.x.mul(52.0)), fract(l3y.mul(9.0))).sub(0.5);
  const tsv = inL3.mul(smoothstep(0.34, 0.16, length(tq)));

  /* ── 五种读法，各算各的，最后按权重混。不走分支，切换自带渐变。 ── */
  const rnd = hash21(vec2(coreId, 3.0));

  // 0 核心占用
  const act = pow(sin(t.mul(rnd.mul(2.4).add(1.1)).add(rnd.mul(31.0))).mul(0.5).add(0.5), 1.7)
    .mul(rnd.mul(0.6).add(0.4));
  const c0 = mix(KEY.dim, KEY.hot, act.mul(core))
    .add(KEY.l3.mul(inL3).mul(0.055));
  const g0 = act.mul(core).mul(1.5).add(inL3.mul(0.04));

  // 1 核心与 L2
  const c1 = KEY.dim
    .add(KEY.core.mul(mLog).mul(0.85))
    .add(KEY.l2.mul(mL2).mul(0.95))
    .add(KEY.fpu.mul(mFPU).mul(0.85))
    .add(KEY.l3.mul(inL3).mul(0.10));
  const g1 = mLog.mul(0.42).add(mL2.mul(0.75)).add(mFPU.mul(0.60));

  // 2 片上 L3
  const mv = hash21(vec2(floor(l3x.mul(16)), floor(l3y.mul(2)))).mul(0.35).add(0.65);
  const c2 = KEY.dim.mul(0.7)
    .add(KEY.l3.mul(macro).mul(mv))
    .add(KEY.core.mul(core).mul(0.06));
  const g2 = macro.mul(mv).mul(1.05);

  // 3 TSV 键合区
  const pulse = sin(t.mul(2.0).sub(length(p.sub(0.5)).mul(24.0))).mul(0.5).add(0.5);
  const c3 = KEY.dark
    .add(KEY.tsv.mul(tsv).mul(pulse.mul(0.7).add(0.3)))
    .add(KEY.l3.mul(inL3).mul(0.05))
    .add(KEY.core.mul(core).mul(0.045));
  const g3 = tsv.mul(pulse.mul(0.8).add(0.35)).mul(1.4);

  // 4 Infinity Fabric —— 数据从核心区往 cIOD 那条边推
  const wave = fract(p.y.mul(1.6).sub(t.mul(0.42)));
  const stream = smoothstep(0.80, 1.0, wave).mul(band(p.y, 0.10, 0.94, 0.05));
  const c4 = KEY.dark
    .add(KEY.fab.mul(inIF).mul(0.95))
    .add(KEY.fab.mul(stream).mul(0.34))
    .add(KEY.dim.mul(core.mul(0.55).add(inL3.mul(0.35))));
  const g4 = inIF.mul(1.25).add(stream.mul(0.45));

  // 5 零售电商 —— 交易洪峰沿横向扫过整个应用面（秒杀脉冲）
  const wave5 = fract(p.x.mul(1.4).add(t.mul(0.35)));
  const stream5 = smoothstep(0.82, 1.0, wave5).mul(band(p.x, 0.06, 0.94, 0.05));
  const c5 = KEY.dark
    .add(KEY.l2.mul(stream5).mul(0.55))
    .add(KEY.dim.mul(core.mul(0.60).add(inL3.mul(0.40))))
    .add(KEY.l2.mul(macro).mul(0.22));
  const g5 = stream5.mul(0.65).add(macro.mul(0.28));

  // 6 能源与交通 —— 调度脉冲沿长轴滚动，像电网潮流图上的负荷曲线
  const wave6 = sin(t.mul(1.6).sub(p.x.mul(10.0))).mul(0.5).add(0.5);
  const c6 = KEY.dark
    .add(KEY.l3.mul(core.mul(wave6.mul(0.55).add(0.18))).mul(0.65))
    .add(KEY.dim.mul(inL3.mul(0.50)));
  const g6 = core.mul(wave6).mul(0.75).add(inL3.mul(0.10));

  /* 权重：离 uMode 一格以内才有份，正好在整数上时只有那一种 */
  const w = i => max(float(1).sub(abs(mode.sub(i))), 0);
  const w0 = w(0), w1 = w(1), w2 = w(2), w3 = w(3), w4 = w(4), w5 = w(5), w6 = w(6);

  const col = c0.mul(w0).add(c1.mul(w1)).add(c2.mul(w2)).add(c3.mul(w3)).add(c4.mul(w4))
    .add(c5.mul(w5)).add(c6.mul(w6));
  const glow = g0.mul(w0).add(g1.mul(w1)).add(g2.mul(w2)).add(g3.mul(w3)).add(g4.mul(w4))
    .add(g5.mul(w5)).add(g6.mul(w6));

  /* 版图之上再压一层金属布线与密封环 —— 这两样跟读法无关，永远在 */
  const wires = metalLayers(p).mul(0.16);
  return {
    col: col.add(wires).add(sealRing(p).mul(vec3(0.30, 0.34, 0.40))),
    glow: glow.add(sealRing(p).mul(0.20)),
  };
}

/* ═══════ 第二代 3D V-Cache 缓存裸片 ═════════════════════════════════ */
function l3dPlan(p, t) {
  const arr = rect(p, 0.085, 0.915, 0.135, 0.865, 0.006);
  const macro = arr.mul(band(fract(p.x.mul(16.0)), 0.08, 0.92, 0.05))
                   .mul(band(fract(p.y.mul(4.0)), 0.10, 0.90, 0.06));
  // 整片铺满的 TSV —— 第二代把它做成了底座，供电也要从这里穿上去
  const tq = vec2(fract(p.x.mul(60.0)), fract(p.y.mul(38.0))).sub(0.5);
  const tsv = smoothstep(0.36, 0.18, length(tq));
  const sweep = sin(t.mul(0.9).sub(p.x.mul(7.0))).mul(0.5).add(0.5);

  const col = KEY.dark
    .add(KEY.l3.mul(macro).mul(sweep.mul(0.35).add(0.5)))
    .add(KEY.tsv.mul(tsv).mul(0.22))
    .add(metalLayers(p).mul(0.10))
    .add(sealRing(p).mul(vec3(0.26, 0.30, 0.34)));
  const glow = macro.mul(0.55).add(tsv.mul(0.22)).add(sealRing(p).mul(0.18));
  return {col, glow};
}

/* ═══════ cIOD ═══════════════════════════════════════════════════════
   不给功能分区编名字 —— 只画金属层与边缘 PHY 宏块的样子。 */
function iodPlan(p, t) {
  const phyN = rect(p, 0.06, 0.94, 0.03, 0.13, 0.006).mul(band(fract(p.x.mul(11.0)), 0.10, 0.90, 0.06));
  const phyS = rect(p, 0.06, 0.94, 0.87, 0.97, 0.006).mul(band(fract(p.x.mul(11.0)), 0.10, 0.90, 0.06));
  const phyE = rect(p, 0.03, 0.11, 0.18, 0.82, 0.006).mul(band(fract(p.y.mul(9.0)), 0.10, 0.90, 0.06));
  const phyW = rect(p, 0.89, 0.97, 0.18, 0.82, 0.006).mul(band(fract(p.y.mul(9.0)), 0.10, 0.90, 0.06));
  const phy = phyN.add(phyS).add(phyE).add(phyW);

  const blocks = rect(p, 0.16, 0.84, 0.20, 0.80, 0.006)
    .mul(band(fract(p.x.mul(5.0)), 0.06, 0.94, 0.04))
    .mul(band(fract(p.y.mul(4.0)), 0.06, 0.94, 0.05));
  const shimmer = sin(t.mul(0.6).add(p.x.mul(4.0).add(p.y.mul(3.0)))).mul(0.5).add(0.5);

  const col = KEY.dark
    .add(KEY.fab.mul(phy).mul(0.42))
    .add(KEY.dim.mul(blocks).mul(2.2))
    .add(metalLayers(p).mul(0.34))
    .add(KEY.fab.mul(blocks).mul(shimmer).mul(0.14))
    .add(KEY.l3.mul(blocks).mul(0.05))
    .add(sealRing(p).mul(vec3(0.24, 0.28, 0.32)));
  const glow = phy.mul(0.30).add(blocks.mul(0.14)).add(sealRing(p).mul(0.16));
  return {col, glow};
}

/* ── 对外：给一个零件算出「顶面画什么」。
      返回 mask（只有朝上的那个面是 1）、col（版图颜色）、glow（自发光强度）。 ── */
export function dieFloorplan(kind, size, uTime, uMode) {
  const p = vec2(
    positionLocal.x.div(size[0]).add(0.5),
    positionLocal.z.div(size[2]).add(0.5),
  );
  const mask = smoothstep(0.55, 0.80, normalLocal.y);
  const r = kind === 'ccd' ? ccdPlan(p, uTime, uMode)
          : kind === 'l3d' ? l3dPlan(p, uTime)
          : iodPlan(p, uTime);
  return {mask, col: r.col, glow: r.glow};
}

/* ═══════════════════════════════════════════════════════════════════════
   零件材质 —— 每一类零件一种真实材料，全部走 TSL 节点。

   一个手写的 Lambert 加两盏方向光，能把形状说清楚，但**分不出材料**：
   镀金触点、绿油基板、镍面顶盖、抛光硅在同一个光照模型下只是三种深浅不同的灰。
   解剖图恰恰要靠材料说话。

   所以每一类零件给一份真的 BRDF 参数，再加一层程序化细节：
     gold     镀金触点     金属度 1，粗糙度按实例抖动 —— 一千七百个触点不能一模一样
     pcb      封装基板     绿油顶面 + 走线 + 过孔；侧面是多层压合的铜层剖面
     silicon  裸片 / 结构硅 抛光硅：高折射、低粗糙、带薄膜干涉（钝化层真的会出彩虹）
     metal    顶盖         镍面拉丝，粗糙度沿一个方向拉条
     solder   铟基钎料     软金属，粗糙度高
     ceramic  贴片电容     陶瓷体 + 两端金属端子

   高亮与淡出（uHi / uFade）在每种材质末尾统一施加，保持和索引联动的行为不变。
   ═══════════════════════════════════════════════════════════════════════ */

import { MeshPhysicalNodeMaterial, DoubleSide } from 'three/webgpu';
import {
  vec2, vec3, float, uniform, positionLocal, normalLocal, normalView, positionViewDirection,
  instanceIndex, smoothstep, abs, fract, mix, sin, cos, clamp, length, dot, pow, mx_noise_float, hash,
} from 'three/tsl';
import { dieFloorplan } from './die.js';
import { stripes } from './tsl-util.js';

const fresnel = k => pow(clamp(float(1).sub(abs(dot(normalView, positionViewDirection))), 0, 1), k);

/* 朝上 / 朝侧：几乎每种材质都要分这两种面 */
const upMask = () => smoothstep(0.55, 0.85, normalLocal.y);
const capMask = () => smoothstep(0.55, 0.85, abs(normalLocal.y));

/* ── 镀金触点 ─────────────────────────────────────────────────────── */
function gold(base) {
  const jitter = hash(instanceIndex).mul(0.16);
  return {
    color: base.mul(float(0.88).add(jitter.mul(0.9))),
    metalness: float(1.0),
    roughness: float(0.24).add(jitter.mul(0.6)),
    emissive: vec3(0),
  };
}

/* ── 封装基板 ─────────────────────────────────────────────────────
      顶面：绿油 + 一层看得见走向的走线 + 稀疏过孔
      侧面：多层基板压合后的剖面，一条条铜层 —— 这是基板最好认的一个特征 */
function pcb(base) {
  const p = positionLocal.xz.mul(1 / 3);      // p 的一个单位 = 3 个世界单位 ≈ 1 mm
  const up = upMask();

  const trace = stripes(p.x.add(sin(p.y.mul(0.7)).mul(0.4)), 1.0, 0.44).mul(0.5)
    .add(stripes(p.y.add(cos(p.x.mul(0.5)).mul(0.35)), 1.0, 0.45).mul(0.35));
  const via = smoothstep(0.22, 0.13,
    length(vec2(fract(positionLocal.x.mul(0.25)), fract(positionLocal.z.mul(0.25))).sub(0.5)));
  const grain = mx_noise_float(vec3(positionLocal.x.mul(0.4), positionLocal.y, positionLocal.z.mul(0.4))).mul(0.5).add(0.5);

  const top = base
    .add(vec3(0.020, 0.042, 0.030).mul(trace))
    .add(vec3(0.045, 0.032, 0.010).mul(via))
    .mul(grain.mul(0.22).add(0.88));

  // 侧面：铜层与预浸料交替
  const layers = stripes(positionLocal.y.mul(0.62), 6.0, 0.34);
  const side = mix(vec3(0.055, 0.048, 0.036), vec3(0.16, 0.10, 0.05), layers);

  return {
    color: mix(side, top, up),
    metalness: mix(float(0.02), via.mul(0.45), up),
    roughness: mix(float(0.70), float(0.56).sub(via.mul(0.26)), up),
    emissive: vec3(0),
  };
}

/* ── 硅 ────────────────────────────────────────────────────────────
      抛光硅是高折射率的暗镜面。钝化层的薄膜干涉会随视角出彩虹 ——
      这不是特效，拿真芯片对着光转就是这个样子，也是"这是一颗裸片"最强的信号。 */
function silicon(base, part, ctx) {
  const up = upMask();
  const f = fresnel(2.6);
  const iri = vec3(
    sin(f.mul(9.0).add(0.0)).mul(0.5).add(0.5),
    sin(f.mul(9.0).add(2.1)).mul(0.5).add(0.5),
    sin(f.mul(9.0).add(4.2)).mul(0.5).add(0.5),
  ).mul(f.mul(0.14));

  let color = base.mul(float(1).sub(up.mul(0.25))).add(iri);
  let rough = float(0.30).sub(up.mul(0.16));
  let metal = float(0.42).add(up.mul(0.28));
  let emissive = vec3(0);

  if (part.dieShader) {
    const d = dieFloorplan(part.dieShader, part.size, ctx.uTime, ctx.uMode);
    // 版图只压进 albedo 两成，其余走自发光 —— 版图是"读数"不是"漆面"。
    // 让它跟着环境光和主光一起被照亮，颜色就全糊成一片粉彩了。
    color = mix(color, d.col.mul(0.22).add(iri.mul(0.3)), d.mask);
    emissive = d.col.mul(d.glow.mul(0.6).add(0.30)).mul(d.mask);
    rough = mix(rough, float(0.52), d.mask);
    metal = mix(metal, float(0.30), d.mask);
  }
  return {color, metalness: metal, roughness: rough, emissive};
}

/* ── 顶盖：镍面拉丝 ─────────────────────────────────────────────── */
function metalIhs(base) {
  const brush = stripes(positionLocal.x.mul(0.5).add(mx_noise_float(positionLocal.mul(0.9)).mul(0.4)), 3.0, 0.45);
  const micro = mx_noise_float(vec3(positionLocal.x.mul(6.0), positionLocal.y, positionLocal.z.mul(0.4))).mul(0.5).add(0.5);
  return {
    color: base.mul(micro.mul(0.14).add(0.90)),
    metalness: float(1.0),
    roughness: float(0.17).add(brush.mul(0.13)).add(micro.mul(0.07)),
    emissive: vec3(0),
  };
}

/* ── 铟基钎料：软、哑、带流痕 ───────────────────────────────────── */
function solder(base) {
  const flow = mx_noise_float(positionLocal.mul(0.22)).mul(0.5).add(0.5);
  return {
    color: base.mul(flow.mul(0.22).add(0.88)),
    metalness: float(0.72),
    roughness: float(0.52).add(flow.mul(0.26)),
    emissive: vec3(0),
  };
}

/* ── 贴片电容：陶瓷体 + 两端金属端子 ─────────────────────────────── */
function ceramic(base) {
  const cap = capMask();
  const jitter = hash(instanceIndex).mul(0.2);
  return {
    color: mix(base.mul(jitter.add(0.86)), vec3(0.34, 0.35, 0.37), cap),
    metalness: mix(float(0.05), float(0.85), cap),
    roughness: mix(float(0.74), float(0.44), cap),
    emissive: vec3(0),
  };
}

/* ── 穿孔钢板：机柜前后门、服务器面板的网孔 ─────────────────────── */
function perforated(base) {
  const p = positionLocal.xz.mul(0.55);
  const hole = smoothstep(0.30, 0.20,
    length(vec2(fract(p.x), fract(p.y)).sub(0.5)));
  return {
    color: base.mul(float(1).sub(hole.mul(0.75))),
    metalness: float(0.82),
    roughness: float(0.38).add(hole.mul(0.30)),
    emissive: vec3(0),
  };
}

/* ── 拉丝铝：服务器前面板、机柜饰条 ─────────────────────────────── */
function brushedAlu(base) {
  const lines = stripes(positionLocal.y.mul(3.2), 2.0, 0.42);
  const micro = mx_noise_float(vec3(positionLocal.x.mul(0.6), positionLocal.y.mul(8.0), positionLocal.z.mul(0.6))).mul(0.5).add(0.5);
  return {
    color: base.mul(lines.mul(0.10).add(micro.mul(0.08)).add(0.88)),
    metalness: float(0.92),
    roughness: float(0.30).add(lines.mul(0.16)),
    emissive: vec3(0),
  };
}

/* ── 镀镍铜：散热器底座与热管。铜的橙 + 镍的亮灰，氧化斑点 ─────── */
function nickelCopper(base) {
  const tarnish = mx_noise_float(positionLocal.mul(0.8)).mul(0.5).add(0.5);
  const edge = smoothstep(0.4, 0.9, abs(normalLocal.y));
  return {
    color: base.mul(tarnish.mul(0.16).add(0.88)).add(vec3(0.10, 0.06, 0.02).mul(edge)),
    metalness: float(0.96),
    roughness: float(0.24).add(tarnish.mul(0.20)),
    emissive: vec3(0),
  };
}

/* ── 注塑塑料：导风罩、把手、风扇框。带轻微合模线 ───────────────── */
function plastic(base) {
  const seam = smoothstep(0.015, 0.005, abs(positionLocal.x)).mul(0.12);
  const grain = mx_noise_float(positionLocal.mul(3.0)).mul(0.5).add(0.5);
  return {
    color: base.mul(grain.mul(0.10).add(0.92)).sub(vec3(seam)),
    metalness: float(0.02),
    roughness: float(0.62),
    emissive: vec3(0),
  };
}

/* ── 钢化玻璃：机柜前门。透明、有折射率、边缘泛绿 ───────────────── */
function glass(base) {
  const f = fresnel(3.0);
  return {
    color: base.mul(0.55).add(vec3(0.02, 0.05, 0.04).mul(f)),
    metalness: float(0.05),
    roughness: float(0.06).add(f.mul(0.10)),
    emissive: vec3(0),
  };
}

/* ── 橡胶与线缆：脚轮、密封条、理线架上的线束 ───────────────────── */
function rubber(base) {
  const rib = stripes(positionLocal.y.mul(4.0), 1.0, 0.5).mul(0.10);
  return {
    color: base.mul(rib.add(0.92)),
    metalness: float(0.0),
    roughness: float(0.88),
    emissive: vec3(0),
  };
}

const KINDS = {gold, pcb, silicon, metal: metalIhs, solder, ceramic,
  perforated, brushedAlu, nickelCopper, plastic, glass, rubber};

/* ── 组装 ─────────────────────────────────────────────────────────── */
export function makeMaterial(part, ctx) {
  const uHi = uniform(0), uFade = uniform(1);
  const base = vec3(...hexToLinear(part.color));
  const k = KINDS[part.mat] || silicon;
  const s = k(base, part, ctx);

  /* 边缘光用强调色而不是白色：这是让暗场里的单色画面仍有体积感的那一笔。
     给少，多了就成雾。 */
  const rim = fresnel(4.2).mul(0.16);
  const hi = uHi;

  let color = mix(s.color.mul(0.30), s.color, uFade);
  color = mix(color, ctx.accent.mul(0.22).add(color.mul(0.85)), hi);

  const em = s.emissive.mul(mix(float(0.22), float(1), uFade)).mul(float(1).add(hi.mul(0.5)));

  const m = new MeshPhysicalNodeMaterial();
  m.colorNode = color;
  m.metalnessNode = clamp(s.metalness, 0, 1);
  m.roughnessNode = clamp(s.roughness, 0.04, 1);
  m.emissiveNode = em.mul(1.9).add(ctx.accent.mul(rim.mul(0.55).add(hi.mul(0.20))));

  if ((part.opacity ?? 1) < 1) {
    // 平面看得穿、边缘留得住 —— 比一律 30% 的均匀半透明清楚得多，
    // 因为轮廓不糊掉，仍然读得出这是一块有厚度的实体。
    m.opacityNode = mix(float(part.opacity), float(1), fresnel(3.2));
    m.transparent = true;
    m.depthWrite = false;
  }
  // 双面：剖切把零件切开之后，单面材质留下的是一个洞。双面至少能看到零件的内壁，
  // NodeMaterial 会按 faceDirection 翻转法线，所以背面也是正常着色的。
  m.side = DoubleSide;
  m.clippingPlanes = ctx.clippingPlanes;
  m.clipShadows = true;

  return {material: m, uHi, uFade};
}

/* sRGB 十六进制 → 线性。走 PBR 之后不转换的话，所有零件都会偏亮一档。 */
function hexToLinear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
}

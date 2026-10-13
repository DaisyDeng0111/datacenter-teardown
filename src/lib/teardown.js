/* ═══════════════════════════════════════════════════════════════════════
   拆解引擎 —— WebGPU / TSL。

   渲染层的目标不是"好看"，是说清**材料**：镀金触点、绿油基板、镍面顶盖、
   抛光硅在同一套光照下不能只是三种深浅不同的灰。一张解剖图有一半的信息量
   就在材料上：看见金你才知道那是触点，看见彩虹你才知道那是裸片。

   所以：
     · WebGPURenderer（设备不支持时 three 自己回落到 WebGL2，代码不分叉）
     · 每类零件一份真的 BRDF 参数 + 程序化细节（见 materials.js）
     · 程序生成的 HDR 环境光（env.js）—— 金属的样子八成来自它反射到的东西
     · 一盏会投影的主光 + 地面接影，模型这才真的"落"在网格上
     · GTAO / Bloom / SMAA / 微量色差与颗粒的后期链
     · 裸片版图由着色器画（die.js），L3 带沿长轴

   three.js 的场景图本来就在 React 之外，引线与标注卡片也是每帧算位置的，
   所以这一层自己管 DOM；React 只画左栏、底部控件条和面包屑，靠 emit.* 拿读数。
   ═══════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three/webgpu';
import {
  vec2, vec3, vec4, float, uniform, attribute, screenUV, positionLocal,
  mix, fract, abs, min, max, sin, smoothstep, clamp, length, pow, fwidth, uv,
} from 'three/tsl';
import { pass } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { smaa } from 'three/addons/tsl/display/SMAANode.js';

import { makeMaterial } from './materials.js';
import { partGeometry, gridOffsets } from './geometry.js';
import { studioEnvironment } from './env.js';

const FOV = 37.8;          // 全画幅 35 mm 镜头的垂直视角：2·atan(12/35)
const ACCENT = '#8fb8e8';   // 与 CSS 的 --accent 一致：改一处要改两处，这是另一处

export function createTeardown({els, emit, model}) {
  /* boot 是异步的（WebGPU 适配器要等）。先返回一份空壳，就绪后原地补齐 ——
     这两百毫秒里 React 已经挂好了，用户点到的按钮变成空操作而不是异常。 */
  // 形参不能省：App.tsx 是 TS，这份空壳的签名就是它看到的类型，
  // 写成 setExplode() 会被推断成 () => void，调用处每一行都报 "Expected 0 arguments"。
  const api = {
    setExplode(_v) {}, setCut(_v) {}, setGrid(_on) {}, setWire(_on) {}, setFlow(_on) {}, setSpin(_on) {},
    setDieMode(_id) {}, useFile(_f) {}, setRefAlpha(_v) {}, setRefDist(_v) {},
    dispose() { dead = true },
  };
  let dead = false;
  boot({els, emit, model}).then(real => {
    if (dead) { real.dispose(); return }
    Object.assign(api, real);
  }).catch(err => {
    console.error('[teardown]', err);
    emit.gate(true);
  });
  return api;
}

async function boot({els, emit, model}) {
  const ac = new AbortController();
  const {signal} = ac;
  const bind = (t, ev, fn, o) => t.addEventListener(ev, fn, {...o, signal});
  const {stage, paneParts, svg, tips} = els;

  /* 每个模型（机房 / 机柜 / 服务器 / 软件）自带零件表、链路定义与场景参数。
     软件层多一个 partsFor(id)：切换行业时按行业重建应用层组件。 */
  const {PARTS: PARTS0, buildLinks, cfg = {}, partsFor} = model;
  let PARTS = PARTS0;
  const SPREAD = cfg.spread ?? 12;    // 层间距。层数变多时要往下调，否则全炸会把模型顶出画面
  const CUT_LO = cfg.cutLo ?? -104, CUT_HI = cfg.cutHi ?? 104;   // 剖切面沿 Z 的扫描范围
  const CAM0 = cfg.camDist ?? 445;    // 开场机位距离
  const SHADOW = cfg.shadow ?? 165;   // 阴影相机覆盖范围

  /* 加载屏的进度回调。它挂在 window 上而不是从模块里 import —— 那段东西必须在
     这个 chunk 到达之前就画出来，所以只能待在 index.html 里，而不是打包进来。
     刻度接着加载器的 0.70 往后排，最后由第一帧真正画完来收尾。 */
  const bt = typeof window !== 'undefined' ? window.__boot : null;
  const step = (v, label) => { if (bt) bt.set(v, label) };
  /* renderer.init() 之后的活（环境光、十三份材质、后期链、首帧）是一整块同步代码，
     跑满一秒多。中间不让出去，进度条就设了标签也画不出来 —— 用户看到的是卡在 74%。
     一次 20 ms 足够浏览器插进一帧；用 setTimeout 不用 rAF，是因为标签页在后台时
     rAF 根本不触发，那会让整页卡在加载屏上直到兜底超时。 */
  const breathe = () => new Promise(r => setTimeout(r, 20));

  /* ── 渲染器 ─────────────────────────────────────────────────────── */
  const renderer = new THREE.WebGPURenderer({antialias: false, alpha: false});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.localClippingEnabled = true;
  // 解剖图要的是可读：Neutral（Khronos PBR Neutral）不像 AgX 那样压暗部、也不像
  // ACES 那样给整幅画面上色，暗场里零件之间的明度差最留得住。
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  step(0.74, '启动 WebGPU');
  await renderer.init();
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 3000);
  const root = new THREE.Group();
  scene.add(root);

  const accent = new THREE.Color(ACCENT).convertSRGBToLinear();
  const uAccent = uniform(vec3(accent.r, accent.g, accent.b));
  const uTime = uniform(0);
  const uMode = uniform(0);

  /* 背景：和 #stage 那层 CSS 径向渐变对齐。
     不用 alpha 画布透出 CSS —— 后期链（AO / Bloom）在透明底上会把边缘算脏。 */
  scene.backgroundNode = mix(
    vec3(0.0030, 0.0097, 0.0072),     // #0a1512，已转线性
    vec3(0.0030, 0.0035, 0.0043),     // --bg #0a0b0d
    smoothstep(0.0, 0.62, length(screenUV.sub(vec2(0.5, 0.88)).mul(vec2(0.85, 1.25)))),
  );
  step(0.79, '生成环境光');
  await breathe();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 1.15;

  /* ── 灯 ───────────────────────────────────────────────────────────
        环境贴图管漫反射与反射，方向光只管一件事：投影。
        没有影子，模型就是浮在网格上的一张贴纸。 */
  const key = new THREE.DirectionalLight(0xdfe9ff, 2.4);
  key.position.set(-90, 190, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 40; key.shadow.camera.far = 520;
  const S = SHADOW;                   // 阴影相机要装得下整个模型的投影面
  Object.assign(key.shadow.camera, {left: -S, right: S, top: S, bottom: -S});
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.6;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(accent.getHex(), 0.55);
  rim.position.set(160, 40, -180);
  scene.add(rim);

  /* ── 剖切面。法线 -Z、常数 c 时保留 z < c 的那一半 ── */
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), CUT_HI);
  const ctx = {accent: uAccent, uTime, uMode, clippingPlanes: [clip]};

  /* ── 建模：把 PARTS 变成 mesh ───────────────────────────────────
     做成函数而非一次性代码 —— 软件层切换行业时要按行业重建应用层组件。 */
  step(0.84, '装配零件');
  await breathe();
  let triCount = 0;
  const parts = [];
  function buildParts(list) {
    for (const p of list) {
      const geo = partGeometry(p);
      const {material, uHi, uFade} = makeMaterial(p, ctx);

      let mesh, n = 1;
      if (p.shape === 'grid') {
        const at = gridOffsets(p);
        n = at.length;
        mesh = new THREE.InstancedMesh(geo, material, n);
        const m = new THREE.Matrix4();
        at.forEach(([x, y, z], i) => { m.makeTranslation(x, y, z); mesh.setMatrixAt(i, m) });
        mesh.instanceMatrix.needsUpdate = true;
        // 包围球按几何体算，不含实例偏移；不关剔除，靠边的阵列会在某个角度整片消失
        mesh.frustumCulled = false;
      } else {
        mesh = new THREE.Mesh(geo, material);
      }
      mesh.position.set(...p.pos);
      // 半透明件不投影：顶盖一投影，它罩住的整个内部就全黑了，而这一页正是要看内部。
      // 顺带也除掉了顶盖顶面自遮挡的那圈阶梯状阴影粉刺。
      mesh.castShadow = (p.opacity ?? 1) >= 1;
      mesh.receiveShadow = true;
      mesh.userData.part = p;
      root.add(mesh);
      triCount += (geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3) * n;
      parts.push({...p, mesh, mat: material, uHi, uFade, base: mesh.position.clone(), on: true, hi: 0, fade: 1});
    }
  }
  buildParts(PARTS);
  function clearParts() {
    for (const p of parts) { root.remove(p.mesh); p.mesh.geometry.dispose(); p.mat.dispose() }
    parts.length = 0;
    triCount = 0;
  }

  /* ── 地面：接影 + 一张片元着色的网格 ───────────────────────────── */
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    Object.assign(new THREE.ShadowNodeMaterial(), {transparent: true, opacity: 0.42}),
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -34;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const uGridOn = uniform(1);
  const gLine = (p, s) => {
    const q = p.div(s);
    const g = abs(fract(q.sub(0.5)).sub(0.5)).div(fwidth(q));
    return float(1).sub(min(min(g.x, g.y), 1));
  };
  const gp = positionLocal.xy;
  const gridMat = new THREE.MeshBasicNodeMaterial({transparent: true, depthWrite: false});
  gridMat.colorNode = uAccent.mul(0.85);
  gridMat.opacityNode = gLine(gp, 10).mul(0.30).add(gLine(gp, 50).mul(0.55))
    .mul(float(1).sub(smoothstep(180, 620, length(gp))))
    .mul(uGridOn).mul(0.5);
  const gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), gridMat);
  gridMesh.rotation.x = -Math.PI / 2;
  gridMesh.position.y = -33.9;
  scene.add(gridMesh);

  /* ── 数据通路 ──────────────────────────────────────────────────────
     会动的光点不是装饰，每一条都是这个模型里真实存在的链路，
     端点直接从 PARTS 里取零件坐标，两端各带一个层号、按 uSpread 分别抬升，
     所以爆炸时每条流跟着自己那两个零件走，不会脱节飘在半空。

     每条链路的具体定义写在该模型的 buildLinks() 里（见 src/models/）：
     那里同时注明了哪些是核实过的量、哪些是示意。 */
  /* 层级查找做成函数：切换行业重建零件后，层号映射要跟着重算 */
  let PART_OF, LI, lay;
  function computeMaps() {
    PART_OF = Object.fromEntries(parts.map(p => [p.id, p]));
    const LAYERS = [...new Set(parts.map(p => p.layer))].sort((a, b) => a - b);
    LI = Object.fromEntries(LAYERS.map((l, i) => [l, i - LAYERS.indexOf(0)]));
    lay = id => LI[PART_OF[id].layer];
  }
  computeMaps();

  let LINKS = [];
  /* 一条互连 = 两个方向：只画一个，内存就成了只读、网络就成了单工 ——
     数据链路在真机上全是双向的（供电、气流除外）。nBack 可以给反向单独的密度。 */
  function rebuildLinks(industryId = 0) {
    LINKS = [];
    const duplex = (o, nBack = o.n) => {
      LINKS.push(o);
      LINKS.push({...o, n: nBack, from: o.to, to: o.from, lf: o.lt, lt: o.lf});
    };
    buildLinks({P: PART_OF, lay, LINKS, duplex}, industryId);
  }
  rebuildLinks();

  let FLOWN = LINKS.reduce((a, l) => a + l.n, 0);

  /* WebGPU 下 THREE.Points 只能画 1 像素的点：PointsNodeMaterial 的 sizeNode
     走的是 setupVertexSprite 那条路，而那条路只在对象**不是** isPoints 时才用。
     所以这里把每个光点做成一个四边形，挂在普通 Mesh 上，材质照旧用
     PointsNodeMaterial —— 它会把 positionGeometry.xy 当作屏幕空间的偏移，
     positionNode 当作中心，于是拿到的是一个会朝向镜头、按距离缩放的真 sprite。
     做成函数：切换行业时链路端点变了，缓冲要重建。 */
  const CORNER = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  const uSpread = uniform(0), uFlowOn = uniform(1);

  let fgeo = null, flow = null;
  function buildFlow() {
    FLOWN = LINKS.reduce((a, l) => a + l.n, 0);
    const vPos = new Float32Array(FLOWN * 4 * 3), vUv = new Float32Array(FLOWN * 4 * 2);
    const aFrom = new Float32Array(FLOWN * 4 * 3), aTo = new Float32Array(FLOWN * 4 * 3);
    const aLay = new Float32Array(FLOWN * 4 * 2), aMisc = new Float32Array(FLOWN * 4 * 3);
    const idx = new Uint32Array(FLOWN * 6);
    let w = 0;
    for (const L of LINKS) for (let i = 0; i < L.n; i++, w++) {
      const misc = [i / L.n, L.speed, L.arc + L.tint * 100];   // 相位 / 速度 /（弧度+色号）
      for (let c = 0; c < 4; c++) {
        const v = w * 4 + c;
        vPos.set([CORNER[c][0], CORNER[c][1], 0], v * 3);
        vUv.set([CORNER[c][0] + 0.5, CORNER[c][1] + 0.5], v * 2);
        aFrom.set(L.from, v * 3); aTo.set(L.to, v * 3);
        aLay.set([L.lf, L.lt], v * 2); aMisc.set(misc, v * 3);
      }
      idx.set([w * 4, w * 4 + 1, w * 4 + 2, w * 4, w * 4 + 2, w * 4 + 3], w * 6);
    }
    if (flow) { root.remove(flow); fgeo.dispose() }
    fgeo = new THREE.BufferGeometry();
    fgeo.setAttribute('position', new THREE.BufferAttribute(vPos, 3));
    fgeo.setAttribute('uv', new THREE.BufferAttribute(vUv, 2));
    fgeo.setAttribute('aFrom', new THREE.BufferAttribute(aFrom, 3));
    fgeo.setAttribute('aTo', new THREE.BufferAttribute(aTo, 3));
    fgeo.setAttribute('aLay', new THREE.BufferAttribute(aLay, 2));
    fgeo.setAttribute('aMisc', new THREE.BufferAttribute(aMisc, 3));
    fgeo.setIndex(new THREE.BufferAttribute(idx, 1));

    const nFrom = attribute('aFrom', 'vec3'), nTo = attribute('aTo', 'vec3');
    const nLay = attribute('aLay', 'vec2'), nMisc = attribute('aMisc', 'vec3');
    const arcN = nMisc.z.mod(100);
    const tintN = nMisc.z.div(100).floor();
    const tN = fract(nMisc.x.add(uTime.mul(nMisc.y)));
    const fromN = nFrom.add(vec3(0, nLay.x.mul(uSpread), 0));
    const toN = nTo.add(vec3(0, nLay.y.mul(uSpread), 0));
    const posN = mix(fromN, toN, tN).add(vec3(0, sin(tN.mul(Math.PI)).mul(arcN), 0));
    const aN = sin(tN.mul(Math.PI));               // 两端淡出，看不出生成和消失

    const tw = i => max(float(1).sub(abs(tintN.sub(i))), 0);
    const flowMat = new THREE.PointsNodeMaterial({
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    // 关掉 alphaToCoverage：单采样目标下它把 alpha 量化成全有全无，
    // 于是每颗本该淡出的光点被画成一个实心方块。
    flowMat.alphaToCoverage = false;
    flowMat.positionNode = posN;
    flowMat.sizeNode = mix(float(2.6), float(4.0), tw(1));
    flowMat.sizeAttenuation = true;
    // 四种通路四种色：数据用强调色，横向流转偏暖，IO 偏冷，供电最暗
    flowMat.colorNode = uAccent.mul(1.6).mul(tw(0))
      .add(vec3(1.00, 0.72, 0.36).mul(tw(1)))
      .add(vec3(0.55, 0.84, 1.00).mul(tw(2)))
      .add(vec3(0.62, 0.68, 0.78).mul(tw(3)));
    flowMat.opacityNode = pow(clamp(float(1).sub(length(uv().sub(0.5)).mul(2)), 0, 1), 2)
      .mul(aN).mul(mix(float(0.9), float(0.45), tw(3))).mul(uFlowOn);
    flow = new THREE.Mesh(fgeo, flowMat);
    flow.frustumCulled = false;
    flow.castShadow = false;
    root.add(flow);
  }
  buildFlow();

  /* ── 后期链 ───────────────────────────────────────────────────────
        AO 负责把零件之间的缝画出来 —— 爆炸图里"谁贴着谁"全靠这道缝；
        Bloom 只吃自发光，也就是裸片版图和高亮边缘；
        SMAA 放在 sRGB 转换之前；最后是极轻的暗角与颗粒。 */
  const scenePass = pass(scene, camera);
  const colorTex = scenePass.getTextureNode('output');
  const depthTex = scenePass.getTextureNode('depth');

  /* GTAO 的法线由深度重建，不走 MRT。
     MRT 法线在这里有一个很难看的症状：数据通路那些朝向镜头的四边形会把自己的法线
     写进法线附件（它们不写深度，所以深度是干净的），GTAO 读到一堆无效法线，
     于是基板上凭空出现一片黑色小方块 —— 关掉数据通路也还在，因为关的只是不透明度。
     深度重建法线精度略低，但这一页全是平面和方块，差别看不出来，
     而且透明件彻底不参与 AO，这正是想要的。 */
  const aoPass = ao(depthTex, null, camera);
  aoPass.resolutionScale = 0.75;
  aoPass.radius.value = 0.42;
  aoPass.distanceExponent.value = 1.6;
  aoPass.scale.value = 1.1;
  aoPass.thickness.value = 1.4;
  aoPass.samples.value = 12;

  const lit = colorTex.mul(vec4(vec3(aoPass.getTextureNode().r), 1));
  const bloomPass = bloom(lit, 0.34, 0.55, 0.72);
  let composed = smaa(lit.add(bloomPass));

  const vig = float(1).sub(smoothstep(0.42, 1.02, length(screenUV.sub(0.5).mul(vec2(1.06, 1.0)))).mul(0.55));
  const grain = fract(sin(screenUV.x.mul(12.9898).add(screenUV.y.mul(78.233)).add(uTime.mul(9.1))).mul(43758.5453))
    .sub(0.5).mul(0.018);
  composed = vec4(composed.rgb.mul(vig).add(grain), 1);

  const post = new THREE.RenderPipeline(renderer, composed);

  /* ── 参考照片：永远立在模型正后方、正对镜头的一块贴图板 ────────── */
  let refMesh = null, refDist = 180;
  function setRef(url) {
    new THREE.TextureLoader().load(url, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const ar = tex.image.width / tex.image.height, hh = 120;
      if (refMesh) { refMesh.geometry.dispose(); refMesh.material.dispo
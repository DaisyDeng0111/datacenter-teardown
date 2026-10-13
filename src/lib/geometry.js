/* ═══════════════════════════════════════════════════════════════════════
   零件几何 —— 由 PARTS 的 shape 字段决定。

   box / cyl / grid 之外还有 ihs：AM5 顶盖的真实轮廓 —— 四角切角、每边两个缺口，
   缺口下面正对着那八簇电容。这个八边形轮廓不是造型，是为电容让位，
   也是这一页最好认的外形特征，画成方块就丢了。
   ═══════════════════════════════════════════════════════════════════════ */

import {
  BoxGeometry, CylinderGeometry, ExtrudeGeometry, Shape, BufferAttribute,
} from 'three/webgpu';

/* AM5 顶盖轮廓：一条边（含两个缺口）画好，绕四次即可。
   转 −90° 而不是 +90°，这样每条边的末端正好接上下一条边的起点，
   两点之间那一段就是切角。 */
function ihsOutline(half, {chamfer = 15, notchAt = [-22, 22], notchW = 19, notchD = 8} = {}) {
  const edge = [[-(half - chamfer), half]];
  for (const c of notchAt) {
    edge.push([c - notchW / 2, half], [c - notchW / 2, half - notchD],
              [c + notchW / 2, half - notchD], [c + notchW / 2, half]);
  }
  edge.push([half - chamfer, half]);

  const pts = [];
  for (let k = 0; k < 4; k++) {
    const a = -k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
    for (const [u, v] of edge) pts.push([u * ca - v * sa, u * sa + v * ca]);
  }
  return pts;
}

function ihsGeometry(size) {
  const shape = new Shape();
  const pts = ihsOutline(size[0] / 2);
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();

  const d = size[1] - 1.6;                 // 留出倒角的厚度
  const geo = new ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelOffset: 0, bevelSegments: 2,
  });
  // ExtrudeGeometry 沿 +Z 长出来，转平之后 Y 从 0 到 d，再平移回中心
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, d / 2, 0);
  geo.computeVertexNormals();
  return geo;
}

/* ── 风扇叶轮：中心轮毂 + 按叶片数扭曲的扇叶 ─────────────────────
      服务器与机房的风扇不是实心圆柱：9 片后倾叶片，每片沿半径方向
      有一个倾角 —— 这是轴流风扇最好认的特征。叶片用压扁拉长的盒子
      近似，比真的扫掠曲面便宜得多，而轮廓已经到位。 */
function fanGeometry(d, thick, blades = 9) {
  const hub = new CylinderGeometry(d * 0.32, d * 0.32, thick, 20);
  const group = [hub];
  const R = d * 0.96, bl = (R - d * 0.30);
  for (let i = 0; i < blades; i++) {
    const blade = new BoxGeometry(bl, thick * 0.55, d * 0.34);
    blade.translate(d * 0.30 + bl / 2, 0, d * 0.10);
    blade.rotateZ(-0.5);                       // 叶片后倾
    blade.rotateY((i / blades) * Math.PI * 2); // 绕轴排布
    group.push(blade);
  }
  return mergeGeometries(group);
}

/* ── 散热鳍片：一组平行薄板。CPU 散热器、GPU 散热罩的内部都用它 ── */
function finsGeometry(w, h, depth, n) {
  const group = [];
  for (let i = 0; i < n; i++) {
    const fin = new BoxGeometry(w / n * 0.22, h, depth);
    fin.translate(-w / 2 + (i + 0.5) * (w / n), 0, 0);
    group.push(fin);
  }
  return mergeGeometries(group);
}

/* ── 散热孔阵列：在面板上规则打孔（用凸起的孔柱表现，远视读作网孔） ── */
function ventGeometry(w, h, t, pitch) {
  const group = [];
  const nx = Math.floor(w / pitch), nz = Math.floor(h / pitch);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const hole = new CylinderGeometry(pitch * 0.30, pitch * 0.30, t, 8);
    hole.rotateX(Math.PI / 2);
    hole.translate(-w / 2 + (i + 0.5) * pitch, -h / 2 + (j + 0.5) * pitch, 0);
    group.push(hole);
  }
  return mergeGeometries(group);
}

/* ── 卷边钢板：机柜立柱、机箱边框上的折边。截面是槽钢形 ── */
function railGeometry(w, h, len, lip = 0.35) {
  const group = [];
  const a = new BoxGeometry(w, h, len);
  const b = new BoxGeometry(w * lip, h * 0.55, len);
  b.translate(w * (0.5 - lip / 2), 0, 0);
  const c = new BoxGeometry(w * lip, h * 0.55, len);
  c.translate(-w * (0.5 - lip / 2), 0, 0);
  group.push(a, b, c);
  return mergeGeometries(group);
}

function mergeGeometries(list) {
  // 手工合并：全部转成非索引，拼 position/normal/uv
  let pc = 0;
  const geos = list.map(g => g.toNonIndexed());
  for (const g of geos) pc += g.attributes.position.count;
  const pos = new Float32Array(pc * 3), nor = new Float32Array(pc * 3), uv = new Float32Array(pc * 2);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
  }
  const out = new BoxGeometry(1, 1, 1).toNonIndexed();   // 借个壳
  out.setAttribute('position', new BufferAttribute(pos, 3));
  out.setAttribute('normal', new BufferAttribute(nor, 3));
  out.setAttribute('uv', new BufferAttribute(uv, 2));
  return out;
}

export function partGeometry(p) {
  if (p.shape === 'ihs') return ihsGeometry(p.size);
  if (p.shape === 'fan') return fanGeometry(p.size[0], p.size[1], p.blades ?? 9);
  if (p.shape === 'fins') return finsGeometry(p.size[0], p.size[1], p.size[2], p.fins ?? 24);
  if (p.shape === 'vent') return ventGeometry(p.size[0], p.size[1], p.size[2], p.pitch ?? 3);
  if (p.shape === 'rail') return railGeometry(p.size[0], p.size[1], p.size[2]);
  const isCyl = p.shapeKind === 'cyl' || p.shape === 'cyl';
  return isCyl
    ? new CylinderGeometry(p.size[0], p.size[0], p.size[1], 18)
    : new BoxGeometry(p.size[0], p.size[1], p.size[2]);
}

/* grid 的实例偏移：显式坐标表优先（触点、机柜排、堆叠设备都用它），
   否则退回 count × pitch 的规则阵列。
   坐标统一返回 [x, y, z] 三元组 —— 老的两元 [x, z] 自动补 y=0，
   这样机柜里沿竖直方向叠放的 8 台服务器、机柜的顶与底也能用实例阵列。 */
export function gridOffsets(p) {
  if (p.grid.at) return p.grid.at.map(a => a.length === 3 ? a : [a[0], 0, a[1]]);
  const [nx, nz] = p.grid.count, [px, pz] = p.grid.pitch, out = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    out.push([(i - (nx - 1) / 2) * px, 0, (j - (nz - 1) / 2) * pz]);
  }
  return out;
}

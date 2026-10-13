/* TSL 小工具 —— 版图与材质都要用的几个形状函数。

   都写成「节点或数字都收」：TSL 的节点不能参与 JS 的 + - 运算，
   `lo - s` 在 lo 是节点时会静静地算成 NaN，然后在 NodeBuilder 里炸成
   "this.bNode.getNodeType is not a function"，离出错的那一行已经很远了。 */

import { float, smoothstep, fract } from 'three/tsl';

const n = v => (v && v.isNode ? v : float(v));

/* 一维软带：lo..hi 之间为 1。
   用两个升序 smoothstep 相减 —— 降序 smoothstep（e0 > e1）在 WGSL 上是未定义行为。 */
export function band(x, lo, hi, s = 0.006) {
  const L = n(lo), H = n(hi), S = n(s);
  return smoothstep(L.sub(S), L.add(S), x).sub(smoothstep(H.sub(S), H.add(S), x));
}

/* 二维软矩形 */
export const rect = (p, x0, x1, y0, y1, s = 0.006) =>
  band(p.x, x0, x1, s).mul(band(p.y, y0, y1, s));

/* 等间距条纹：n 条，每条占宽 1-2w */
export const stripes = (x, count, w) =>
  band(fract(x.mul(count)), w, n(1).sub(n(w)), n(w).mul(0.5));

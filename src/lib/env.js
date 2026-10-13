/* 环境光照 —— 一张程序生成的等距柱状 HDR。

   走了 PBR 就必须有环境贴图：镀金触点、镍面顶盖、抛光硅这三种材料的样子
   八成来自它们反射到的东西，只给方向光的话金属会黑成一块塑料。
   不引外部 .hdr 文件，因为这一页要保持能单文件跑起来。

   布光是标准的三灯：左上偏前一盏冷白主光（顶盖的主高光来自它）、
   右后一盏强调色的轮廓光、正前一盏很暗的补光把底面从纯黑里拉出来一点。 */

import { DataTexture, EquirectangularReflectionMapping, FloatType, RGBAFormat, PMREMGenerator } from 'three/webgpu';

const LIGHTS = [
  {dir: [-0.42, 0.86, 0.30], size: 0.34, color: [4.2, 4.6, 5.4]},   // 主光
  {dir: [0.78, 0.16, -0.58], size: 0.24, color: [0.7, 1.2, 2.4]},   // 轮廓光（强调色）
  {dir: [0.20, -0.35, 0.90], size: 0.52, color: [0.10, 0.14, 0.18]},// 补光
];

export function studioEnvironment(renderer, {width = 256, height = 128} = {}) {
  const data = new Float32Array(width * height * 4);
  const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l) };
  const lights = LIGHTS.map(l => ({...l, dir: norm(l.dir)}));

  for (let y = 0; y < height; y++) {
    const phi = (y + 0.5) / height * Math.PI;
    for (let x = 0; x < width; x++) {
      const theta = (x + 0.5) / width * Math.PI * 2;
      const d = [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];

      // 天空：顶上带一点页面那个冷绿，往下压到近黑
      const up = d[1] * 0.5 + 0.5;
      let r = 0.005 + up * up * 0.020;
      let g = 0.007 + up * up * 0.032;
      let b = 0.010 + up * up * 0.038;

      for (const L of lights) {
        const c = d[0] * L.dir[0] + d[1] * L.dir[1] + d[2] * L.dir[2];
        const f = Math.exp(-Math.pow(Math.max(0, 1 - c) / L.size, 2) * 2.2);
        r += L.color[0] * f; g += L.color[1] * f; b += L.color[2] * f;
      }
      const i = (y * width + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 1;
    }
  }

  const tex = new DataTexture(data, width, height, RGBAFormat, FloatType);
  tex.mapping = EquirectangularReflectionMapping;
  tex.needsUpdate = true;

  const pmrem = new PMREMGenerator(renderer);
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();
  return rt.texture;
}

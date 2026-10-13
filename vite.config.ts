import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/* 主 chunk 有 1.1 MB（three 的 WebGPU 渲染器 + 整套节点材质，压完 350 KB）。
   浏览器自己用 <script type="module"> 拉它的时候，页面拿不到任何进度 ——
   慢网络上就是几秒钟的纯白，而纯白读起来就是"这页打不开"。
   所以打包时把那个标签换成一段内联加载器：自己 fetch，边读边报字节数，
   读完用 blob 直接 import 进来（整个 chunk 自包含，没有 import.meta、
   没有动态 import、没有 Worker，所以 blob 的模块语义和原来完全一致）。
   开发模式不动 —— 本地零延迟，没有进度可报。 */
function streamingBoot(): Plugin {
  return {
    name: 'streaming-boot',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        const tag = html.match(/<script type="module"[^>]*\bsrc="([^"]+)"[^>]*><\/script>\s*/)
        if (!tag) return html
        const entry = Object.values(ctx.bundle).find(
          (c): c is Extract<typeof c, { type: 'chunk' }> => c.type === 'chunk' && c.isEntry,
        )
        // 解压后的字节数。进度必须按它算：响应带 gzip 时 content-length 是压缩后的，
        // 而流式读到的是解压后的，拿压缩长度当分母会一路冲到 300%。
        const bytes = entry ? Buffer.byteLength(entry.code) : 0
        return html.replace(tag[0], `<script>${loader(tag[1], bytes)}</script>\n`)
      },
    },
  }
}

const loader = (src: string, total: number) => `
(function(){
var S=${JSON.stringify(src)},T=${total},B=window.__boot,fell=false,started=false;
function plain(){if(fell)return;fell=true;var s=document.createElement('script');
 s.type='module';s.crossOrigin='anonymous';s.src=S;document.head.appendChild(s)}
if(!window.fetch||!window.ReadableStream||!B)return plain();
fetch(S,{credentials:'same-origin'}).then(function(r){
 if(!r.ok||!r.body)throw new Error('http '+r.status);
 var enc=r.headers.get('content-encoding'),cl=+r.headers.get('content-length');
 var size=(!enc&&cl)?cl:T,rd=r.body.getReader(),parts=[],got=0;
 return (function pump(){return rd.read().then(function(c){
  if(c.done){B.dl(size,size);return new Blob(parts,{type:'text/javascript'})}
  parts.push(c.value);got+=c.value.length;B.dl(got,Math.max(size,got));return pump()})})()
}).then(function(b){
 B.set(0.70,'解析引擎');started=true;
 var u=URL.createObjectURL(b);
 return import(u).then(function(m){URL.revokeObjectURL(u);return m})
}).catch(function(e){
 /* 已经进到模块求值里再报错，那是应用自己的问题，再跑一遍只会把同一个错报两次 */
 if(started&&!/dynamically imported module/.test(String(e&&e.message))){
  console.error('[boot]',e);B.fail('引擎启动失败');return}
 console.warn('[boot] 流式加载不可用，回落到普通 script:',e);plain()});
})();`.replace(/\n\s*/g, '')   // 压成一行；所以上面只能用块注释，一行 // 会把后面全吃掉

export default defineConfig({
  plugins: [react(), streamingBoot()],
})

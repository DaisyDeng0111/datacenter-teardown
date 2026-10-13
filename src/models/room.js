/* ═══════════════════════════════════════════════════════════════════════
   零件表 —— 机房层：一栋数据中心的数据大厅（Data Hall）里有什么。

   从下到上：架空地板 → 精密空调 / UPS / 配电 / 消防 → 机柜排 →
   冷通道封闭 → 桥架与母线槽。选中「机柜」层级可以继续往下拆一整柜。

   ── 尺度与夸张 ─────────────────────────────────────────────────────────
   大厅按约 60×40 m 的微模块（Micro-Module）示意，1 m ≈ 4.7 世界单位，
   整体 280×190 世界单位。机柜、空调的高度照比例，但为了在屏幕上分层，
   Y 方向相对 XZ 有约 1.2 倍拉开。位置关系照真实机房：
   两排机柜面对面夹出一条冷通道，空调沿长边布置，供配电与消防靠墙。
   ═══════════════════════════════════════════════════════════════════════ */

const PARTS = [
  {id:'floor', name:'架空地板', tag:'FLOOR', layer:0, shape:'box',
   size:[280, 2, 180], pos:[0, -30, 0], mat:'brushedAlu', color:'#3a3f46',
   brands:{intl:'Kingspan / Lindner / Tate / CBI Europe / MERO-TSK',cn:'沈飞 / 汇丽 / 华集 / 向利 / 友联'}, desc:'600×600 mm 防静电架空地板，硫酸钙或全钢基材 + HPL 贴面，通常架高 40-80 cm。地板下面是两样东西：冷通道的送风静压箱（空调把冷风压进地板下，从机柜前的通风地板冒出），和弱电线缆桥架。高密度机房正转向无地板的行间空调与液冷。'},

  {id:'vent-tile', name:'通风地板 ×8', tag:'VENT-TILE', layer:0, shape:'vent',
   size:[10, 10, 0.6], pos:[0, -28.8, 0], pitch:1.4,
   grid:{at:[[-84,0,-20],[-56,0,-20],[-28,0,-20],[0,0,-20],[28,0,-20],[56,0,-20],[84,0,-20],[112,0,-20]]},
   mat:'perforated', color:'#5a616b',
   brands:{intl:'Kingspan / Tate / Lindner / Triad / ASM',cn:'沈飞 / 汇丽 / 华集 / 欧荔 / 奥斯曼'}, desc:'冷通道里的一排通风地板（开孔率 25-55% 可选），冷风从地板下静压箱经这些孔进入冷通道。开孔率按每列机柜的功率配 —— 功率高的列配高开孔率板，这是机房气流调试的基本功。'},

  {id:'crac', name:'精密空调 ×4', tag:'CRAC', layer:1, shape:'grid',
   size:[24, 16, 14], pos:[0, -21, 0], grid:{at:[[-99, 0, -78], [-33, 0, -78], [33, 0, -78], [99, 0, -78]]},
   mat:'metal', color:'#4a5058',
   brands:{intl:'Vertiv 维谛 / STULZ 世图兹 / Schneider APC / Daikin / Mitsubishi Electric',cn:'英维克 / 华为 / 佳力图 / 依米康 / 申菱'}, desc:'房间级精密空调（CRAC），N+1 冗余，冷源来自室外的冷水机组与冷却塔。它们吞下热通道的回风、吐出冷风 —— 制冷通常吃掉数据中心 30% 以上的电，PUE（总耗电 ÷ IT 耗电）的大头就在这条链上。先进机房 PUE 已做到 1.15 以下。'},

  {id:'crac-vent', name:'空调出风格栅 ×4', tag:'GRILLE', layer:1, shape:'grid',
   size:[20, 6, 0.8], pos:[0, -13, 0], grid:{at:[[-99, 0, -71], [-33, 0, -71], [33, 0, -71], [99, 0, -71]]},
   mat:'brushedAlu', color:'#6b7480',
   brands:{intl:'Titus / Krueger / Price / Trox / Nailor',cn:'妥思中国 / 盈达 / 显隆 / 威士文 / 中航大记'}, desc:'空调正面的可调百叶格栅，风向可以手动或电动调节。回风从顶部进、处理后从下部百叶吹向地板下静压箱 —— 百叶的角度决定了冷风能不能均匀铺满整条冷通道。'},

  {id:'ups', name:'UPS ×2', tag:'UPS', layer:1, shape:'grid',
   size:[20, 18, 30], pos:[0, -20, 0], grid:{at:[[-118, 0, 68], [-96, 0, 68]]},
   mat:'metal', color:'#2c333a',
   brands:{intl:'Vertiv / Schneider APC / Eaton / ABB / Socomec',cn:'华为 / 科华 / 科士达 / 易事特 / 英威腾'}, desc:'不间断电源，2N 配置（两套独立系统互为备份）。市电中断时蓄电池立刻顶上 10-15 分钟 —— 这段时间刚好够柴油发电机启动并网。近年大厂改用 HVDC 高压直流，少一级交直流转换就省 2-3% 的电。'},

  {id:'ups-batt', name:'蓄电池架 ×2', tag:'BATTERY', layer:1, shape:'grid',
   size:[22, 12, 18], pos:[0, -23, 0], grid:{at:[[-118, 0, 44], [-96, 0, 44]]},
   mat:'plastic', color:'#1a1c1e',
   brands:{intl:'EnerSys / Exide / C&D / FIAMM / Panasonic',cn:'宁德时代 / 比亚迪 / 双登 / 南都电源 / 圣阳'}, desc:'阀控式铅酸蓄电池架（或锂电柜），几十只电池串成一组。它们是机房里最「重」的设备之一，楼板承重要单独核算；也是巡检的重点 —— 一只电池鼓包漏液，整组都得换。'},

  {id:'pdu', name:'列头配电柜 ×2', tag:'PDU', layer:1, shape:'grid',
   size:[16, 14, 24], pos:[0, -22, 0], grid:{at:[[-70, 0, 68], [-50, 0, 68]]},
   mat:'metal', color:'#3a4048',
   brands:{intl:'Schneider APC / Vertiv / Eaton / Raritan / Legrand',cn:'华为 / 突破电气 / 公牛 / 克莱沃 / 大唐电信'}, desc:'UPS 的输出在这里分成几十路，经母线槽或电缆送到每列机柜的 PDU。每一条支路的电流、电压、电量都被计量并上报 DCIM —— 机房大屏上每条曲线的源头就是这里的互感器。柜门上的指示灯与数显表是巡检的第一站。'},

  {id:'fire', name:'气体灭火钢瓶 ×4', tag:'FIRE', layer:1, shape:'grid', shapeKind:'cyl',
   size:[5, 16], pos:[0, -21, 0], grid:{at:[[-132, 0, -30], [-132, 0, -10], [-132, 0, 10], [-132, 0, 30]]},
   mat:'metal', color:'#7a2e2a',
   brands:{intl:'Siemens / Honeywell / Johnson Controls / Hochiki / Bosch',cn:'海湾 GST / 青鸟消防 / 泛海三江 / 泰和安 / 利达'}, desc:'七氟丙烷 / 全氟己酮灭火钢瓶，红色瓶身是强制标识。确认火情后 10 秒内气体淹没防护区。配套的极早期烟雾探测（VESDA）通过吸气式管网监测空气，比传统烟感早几百倍发现阴燃。'},

  {id:'fire-pipe', name:'消防管网', tag:'PIPE', layer:4, shape:'rail',
   size:[4, 2, 200], pos:[-100, 26, 0], mat:'metal', color:'#7a2e2a',
   brands:{intl:'Victaulic / Tyco / Viking / Minimax / Fike',cn:'金盾 / 威特龙 / 闽山 / 川消 / 天广中茂'}, desc:'灭火气体的输送管网沿墙敷设，末端是防护区顶部的喷头。管网要做压力保持测试 —— 钢瓶里 4.2 MPa 的储存压力，漏一点，真到用时就不够浓度了。'},

  {id:'racks', name:'服务器机柜 ×16', tag:'RACK', layer:2, shape:'grid',
   size:[24, 46, 26], pos:[0, -6, 0],
   grid:{at:(() => { const xs = [-98, -70, -42, -14, 14, 42, 70, 98];
       return [...xs.map(x => [x, 0, -20]), ...xs.map(x => [x, 0, 20])]; })()},
   mat:'metal', color:'#2c333a',
   brands:{intl:'Vertiv / Schneider APC / Eaton / Rittal / Legrand',cn:'华为 / 图腾 / 一舟 / 科华 / 中兴'}, desc:'两排 42U 机柜面对面，中间夹出一条冷通道。每个柜子装服务器、存储与 ToR 交换机，功率从通用柜的 8 kW 到 AI 训练柜的 100 kW+。选中「机柜」层级，可以打开其中一个，看里面每一 U 装了什么。'},

  {id:'rack-door', name:'机柜前门 ×16', tag:'DOOR', layer:2, shape:'grid',
   size:[22, 44, 1], pos:[0, -6, 0],
   grid:{at:(() => { const xs = [-98, -70, -42, -14, 14, 42, 70, 98];
       return [...xs.map(x => [x, 0, -33.5]), ...xs.map(x => [x, 0, 33.5])]; })()},
   mat:'perforated', color:'#6b7480', opacity:0.35,
   brands:{intl:'Rittal / Vertiv / APC / Chatsworth / Legrand',cn:'图腾 / 一舟 / 华为 / 精致 / 中兴'}, desc:'机柜的蜂窝网孔门朝冷通道一侧敞开进风。从大厅这一侧看过去，一排半透明的网孔门后面透出服务器指示灯的星星点点 —— 这是数据大厅最有辨识度的一幕。'},

  {id:'sensor', name:'DCIM 传感器 ×4', tag:'SENSOR', layer:2, shape:'grid',
   size:[3, 3, 3], pos:[0, 0, 0], grid:{at:[[-84, 20, 0], [-28, 20, 0], [28, 20, 0], [84, 20, 0]]},
   mat:'plastic', color:'#8fb8e8',
   brands:{intl:'Honeywell / Siemens / Schneider / Vertiv / AKCP',cn:'华为 / 大疆行业 / 昆仑海岸 / 迈世 / 斯特纽'}, desc:'温湿度、烟感、漏水绳、门禁、视频监控……所有传感器汇入 DCIM（数据中心基础设施管理）平台：容量管理、能耗分析、3D 可视化大屏的数据全来自这张传感网。一台机柜前后通常各布 3-6 个测温点。'},

  {id:'contain', name:'冷通道封闭顶板', tag:'CONTAIN', layer:3, shape:'box',
   size:[250, 1.5, 22], pos:[0, 19, 0], mat:'glass', color:'#9aa4ad', opacity:0.22,
   brands:{intl:'Vertiv / Schneider / Eaton / Rittal / Subzero',cn:'华为 / 英维克 / 依米康 / 科华 / 佳力图'}, desc:'两排机柜顶部加玻璃/金属顶板，两端装自动门，把冷通道封成一个「冷池」：冷空气只许从机柜正面进、背面出，不许与热风掺混。回风温度因此提高，空调效率显著上升 —— 这是最便宜的 PUE 优化手段之一。'},

  {id:'tray', name:'网格桥架', tag:'TRAY', layer:4, shape:'rail',
   size:[250, 3, 8], pos:[0, 26, -34], mat:'metal', color:'#6b7480',
   brands:{intl:'Legrand / Eaton / Panduit / Chatsworth / Snake Tray',cn:'一舟 / 普天汉飞 / 韩电 / 天诚 / 爱谱华顿'}, desc:'机柜上方的上走线桥架（钢丝网格结构）：光纤、网线在这里从每个机柜的柜顶汇集到核心机房。网格结构散热好、可以随时增减线缆 —— 强电（母线槽）与弱电（桥架）分两侧走，间距有规范约束。'},

  {id:'busway', name:'母线槽', tag:'BUSWAY', layer:4, shape:'rail',
   size:[250, 4, 6], pos:[0, 28, 34], mat:'nickelCopper', color:'#8a6a3f',
   brands:{intl:'Schneider / Siemens / Eaton / ABB / Starline',cn:'华为 / 威腾 / 镇江西门子合资 / 江苏华威 / 大全'}, desc:'代替成捆电缆的末端母线槽：铜排在绝缘外壳里通长敷设，机柜用插接箱即插即用地取电。扩容新机柜不用停电拉电缆，直接在母线上热插拔一个新插接箱 —— 这是近年大型数据中心的标配做法。'},
];

const DIE_MODES = [];

/* ── 链路：电力、冷热气流、数据在数据大厅里的三条河 ─────────────────
     power  UPS → 列头柜 → 机柜     供配电链，真单向（tint 3）。
     cold   精密空调 → 冷通道        冷风经地板下静压箱进冷通道（tint 2，冷色）。
     hot    机柜热通道 → 空调回风    热风回流，单向（tint 1，暖色）。
     net    机柜顶 ↔ 网格桥架        光纤与网线的水平布线（tint 0，双向）。 */
const cfg = {spread: 9, cutLo: -95, cutHi: 95, camDist: 420, shadow: 220};

function buildLinks({P, lay, LINKS, duplex}) {
  for (const sx of [-107, -60]) {                 // UPS → 列头配电柜
    LINKS.push({n: 7, speed: 0.18, arc: 1.2, tint: 3,
      from: [sx, -11, 62], to: [-60, -15, 62], lf: lay('ups'), lt: lay('pdu')});
  }
  for (const x of [-70, -14, 42, 98]) {           // 列头柜 → 各列机柜（经母线槽）
    LINKS.push({n: 7, speed: 0.18, arc: 2.4, tint: 3,
      from: [-60, -15, 60], to: [x, 17, 22], lf: lay('pdu'), lt: lay('racks')});
  }
  for (const x of [-99, -33, 33, 99]) {           // 冷风：空调 → 冷通道（地板下）
    LINKS.push({n: 8, speed: 0.22, arc: 1.0, tint: 2,
      from: [x, -24, -70], to: [x * 0.6, -26, 0], lf: lay('crac'), lt: lay('racks')});
    LINKS.push({n: 6, speed: 0.20, arc: 2.8, tint: 1,   // 热风：机柜背面 → 空调回风
      from: [x * 0.7, 6, -34], to: [x, -13, -70], lf: lay('racks'), lt: lay('crac')});
  }
  for (const x of [-84, -28, 28, 84]) {           // 布线：机柜顶 ↔ 桥架，双向
    duplex({n: 5, speed: 0.26, arc: 0.6, tint: 0,
      from: [x, 17, -20], to: [x, 26, -34], lf: lay('racks'), lt: lay('tray')});
  }
}

const meta = {
  levelName: '机房',
  sub: '数据大厅微模块 · 供配电 / 制冷 / 消防 / 监控',
  crumb: 'DC / DATA HALL',
  stat: 'MICRO-MODULE',
};

export { PARTS, DIE_MODES, cfg, buildLinks, meta };

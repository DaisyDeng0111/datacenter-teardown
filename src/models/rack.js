/* ═══════════════════════════════════════════════════════════════════════
   零件表 —— 机柜层：42U 标准机柜，按真实产品结构建模。

   不只是「装着设备的黑柜子」：立柱上有 U 位刻度与安装孔、层板四角有
   固定耳、PDU 带插座簧片、网孔门能看到开孔率、理线架上绕出了线束。
   设备面板的进风孔、提手、状态灯都按真实形态画出。

   ── 尺度 ───────────────────────────────────────────────────────────────
   600×1200×2000 mm（宽×深×高）按 1 mm = 0.09 换算：54×108×180。
   竖直方向为了屏幕可读，用 60 世界单位装 42U（1U ≈ 1.43），是示意压缩。
   面板上 8 台 2U 服务器、2 台 4U 存储、2 台 1U 交换机、双 PDU 均为
   通用机柜真实典型配置。
   ═══════════════════════════════════════════════════════════════════════ */

/* U 位刻度线：42 格，画在左右前立柱的内侧棱上 */
function uTicks() {
  const out = [];
  for (const sx of [-23.6, 23.6]) for (let u = 0; u < 42; u++) {
    out.push([sx, -28.5 + u * 1.36, -52.2]);
  }
  return out;
}

const PARTS = [
  /* ── 骨架 ── */
  {id:'frame', name:'机柜立柱 ×4', tag:'FRAME', layer:0, shape:'grid',
   size:[4.5, 60, 4.5], pos:[0, 0, 0],
   grid:{at:[[-25, 0, -50], [25, 0, -50], [-25, 0, 50], [25, 0, 50]]},
   mat:'metal', color:'#5a616b',
   brands:{intl:'Schneider APC / Vertiv / Eaton / Rittal / Legrand',cn:'图腾 / 华为 / 中兴 / 一舟 / 金盾'}, desc:'四根卷边钢板立柱，截面是槽钢形 —— 侧向刚度全靠那两道折边。立柱内侧面按 1U 间距冲出方孔（笼式螺母孔位），设备的安装耳就拧在这里。「19 英寸」指的就是这两排孔的水平间距。'},

  {id:'utick', name:'U 位刻度 ×84', tag:'U-MARK', layer:0, shape:'grid', shapeKind:'cyl',
   size:[0.7, 0.28], pos:[0, 0, 0], grid:{at:uTicks()}, mat:'gold', color:'#c9a227',
   brands:{intl:'Schneider APC / Vertiv / Eaton / Rittal / Legrand',cn:'图腾 / 华为 / 中兴 / 一舟 / 金盾'}, desc:'立柱内侧的 U 位标识点，42 格一格不缺。上架定位全靠它：「这台装 12U-13U」说的就是从下往上数第 12 格。镀层亮点在真柜上是丝印的刻度线，这里用金属点标记出来。'},

  {id:'base', name:'柜顶与底座', tag:'TOP/BASE', layer:0, shape:'grid',
   size:[54, 1.5, 106], pos:[0, 0, 0], grid:{at:[[0, -31, 0], [0, 31, 0]]},
   mat:'metal', color:'#4a5058',
   brands:{intl:'Schneider APC / Vertiv / Eaton / Rittal / Legrand',cn:'图腾 / 华为 / 中兴 / 一舟 / 金盾'}, desc:'底座四角有调平脚（这里略去）；柜顶开两个走线孔带毛刷条，上走线的光纤网线从这里进柜。顶上预留的四个圆孔是装风扇单元的位置 —— 高热密度柜会选装柜顶风扇强制排风。'},

  {id:'caster', name:'脚轮 ×4', tag:'CASTER', layer:0, shape:'grid', shapeKind:'cyl',
   size:[3.2, 2.6], pos:[0, -33.8, 0],
   grid:{at:[[-22, 0, -46], [22, 0, -46], [-22, 0, 46], [22, 0, 46]]},
   mat:'rubber', color:'#1a1c1e',
   brands:{intl:'Schneider APC / Vertiv / Eaton / Rittal / Legrand',cn:'图腾 / 华为 / 中兴 / 一舟 / 金盾'}, desc:'承重脚轮，单轮额定 300 kg 起 —— 一个装满设备的 42U 柜能到一吨。就位后轮子要刹车、调平脚要落地，轮子只负责「推到位」这一段路。'},

  /* ── 电力 ── */
  {id:'pdu', name:'机柜 PDU ×2', tag:'PDU', layer:1, shape:'grid',
   size:[4, 52, 5], pos:[0, 0, 0], grid:{at:[[-23, 0, 44], [23, 0, 44]]},
   mat:'plastic', color:'#2c333a',
   brands:{intl:'Schneider APC / Vertiv / Eaton / Raritan / Server Technology',cn:'突破电气 / 华为 / 图腾 / 同为 / 昌遂科技'}, desc:'A/B 双路竖装 PDU，分别接两路独立市电。壳体上的每一个凹槽是一个 C13/C19 插座位（图中按间隔简化），设备的两个电源各插一路 —— 任何一路掉电业务无感，这就是 2N 供电在柜内的样子。智能 PDU 还逐口计量电量上报 DCIM。'},

  {id:'pdu-in', name:'PDU 进线插头 ×2', tag:'PLUG', layer:1, shape:'grid', shapeKind:'cyl',
   size:[1.6, 3.2], pos:[0, 28.5, 0], grid:{at:[[-23, 0, 44], [23, 0, 44]]},
   mat:'plastic', color:'#3a3f46',
   brands:{intl:'Mennekes / Legrand / Hubbell / Schneider / Eaton',cn:'突破电气 / 同为 / 昌遂科技 / 公牛 / 正泰'}, desc:'32A 工业连接器（俗称「航空插头」），从柜顶引入 A/B 两路市电。蓝色是 220V 单相的标识色；三相五线的大柜子用红色 380V 插头。热插拔是绝对禁止的 —— 带电拔它等于制造电弧。'},

  /* ── 存储 ── */
  {id:'storage', name:'存储阵列 ×2 · 4U', tag:'STORAGE', layer:2, shape:'grid',
   size:[46, 5.7, 80], pos:[0, 0, 0], grid:{at:[[0, -24, -4], [0, -17.5, -4]]},
   mat:'metal', color:'#3d4a5c',
   brands:{intl:'Dell EMC / NetApp / HPE / IBM / Pure Storage',cn:'华为 OceanStor / 浪潮 / 新华三 / 中科曙光 / 宏杉科技'}, desc:'4U 存储阵列，占柜子最底两层 —— 盘多、最重，放低处是惯例。前面是 24/36 盘位的抽拉硬盘托架（见下一个零件），可以是双控 SAN，也可以是分布式存储节点（Ceph）。三副本、纠删码、快照、容灾都发生在这一层。'},

  {id:'tray', name:'硬盘托架 ×24', tag:'TRAY', layer:2, shape:'grid',
   size:[3.6, 1.1, 5.5], pos:[0, -24, -46.5],
   grid:{count:[12, 2], pitch:[3.85, 2.2]}, mat:'plastic', color:'#8b939c',
   brands:{intl:'Dell / HPE / Supermicro / Seagate / WD',cn:'华为 / 浪潮 / 新华三 / 中科曙光 / 联想'}, desc:'热插拔硬盘托架，一托一盘，带弹簧卡扣与状态灯位（绿灯 = 在线、琥珀灯 = 故障预警）。托架上的丝印编号对应背板槽位 —— 换盘时对槽位，插错槽就是一次数据事故。'},

  /* ── 计算 ── */
  {id:'srv', name:'服务器节点 ×8 · 2U', tag:'SERVER', layer:3, shape:'grid',
   size:[46, 2.85, 80], pos:[0, 0, -4],
   grid:{at:[[0,-14,0],[0,-10.6,0],[0,-7.2,0],[0,-3.8,0],[0,-0.4,0],[0,3,0],[0,6.4,0],[0,9.8,0]]},
   mat:'metal', color:'#454c54',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'八台 2U 计算节点，是虚拟化或 Kubernetes 集群的成员。每台双路 CPU、TB 级内存、冗余电源 —— 选中「服务器」层级，可以看到其中一台被完整拆开：CPU、内存、GPU、网卡、风扇墙全在里面。'},

  {id:'srv-vent', name:'服务器前面板散热孔 ×8', tag:'VENT', layer:3, shape:'vent',
   size:[40, 2.2, 0.8], pos:[0, 0, -44.6], pitch:2.2,
   grid:{at:[[0,-14,0],[0,-10.6,0],[0,-7.2,0],[0,-3.8,0],[0,-0.4,0],[0,3,0],[0,6.4,0],[0,9.8,0]]},
   mat:'perforated', color:'#2c333a',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'前面板大面积蜂窝散热孔，开孔率约 60%。服务器的冷空气从前门进、后门出，这一片孔就是进风口 —— 所以机柜前门必须是网孔门，玻璃门会把它憋死。'},

  {id:'srv-ear', name:'上架提耳 ×16', tag:'EAR', layer:3, shape:'grid',
   size:[3, 2.6, 6], pos:[0, 0, -42.5],
   grid:{at:(() => { const ys = [-14,-10.6,-7.2,-3.8,-0.4,3,6.4,9.8];
     const out = []; for (const y of ys) for (const sx of [-21.5, 21.5]) out.push([sx, y, 0]);
     return out; })()},
   mat:'brushedAlu', color:'#9aa4ad',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'每台服务器两侧的上架提耳：抽拉、搬运、固定在立柱上全靠它。耳上的两颗手拧螺丝（免工具设计）拧紧后，整机才算真正「上架」。'},

  /* ── 网络 ── */
  {id:'tor', name:'ToR 交换机 ×2 · 1U', tag:'SWITCH', layer:4, shape:'grid',
   size:[44, 1.43, 46], pos:[0, 0, -20], grid:{at:[[0, 13.5, 0], [0, 17, 0]]},
   mat:'metal', color:'#16181d',
   brands:{intl:'Cisco / Arista / Juniper / NVIDIA Mellanox / Dell',cn:'华为 / 新华三 H3C / 锐捷网络 / 中兴 / 迈普'}, desc:'柜顶交换机（Top of Rack）：下联柜内每台服务器的 25G 网口，上联 Spine 的 100G 端口。两台做堆叠/MLAG 双活，断一台业务无感。1U 高度里要塞下 48 个端口与两颗交换芯片 —— 前面板密布的 cage 就是光模块插槽（见下一零件）。'},

  {id:'sfp', name:'光模块插槽 ×48', tag:'SFP28', layer:4, shape:'grid',
   size:[2.6, 1.1, 2.2], pos:[0, 15.25, -43.8],
   grid:{count:[24, 2], pitch:[1.85, 1.9]}, mat:'metal', color:'#8a919b',
   brands:{intl:'Finisar / Coherent / Broadcom / Cisco / Intel',cn:'中际旭创 / 新易盛 / 光迅科技 / 华工科技 / 天孚通信'}, desc:'48 个 SFP28/SFP+ 光模块 cage，上下两排。每个 cage 插一只光模块，拉环颜色区分波长（蓝 = 1310nm 单模、黑 = 850nm 多模）。跳线插上后,module 的拉手要朝外 —— 这是布线规范的第一课。'},

  {id:'cable', name:'理线架与线束 ×2', tag:'CABLE', layer:5, shape:'grid',
   size:[44, 1.43, 40], pos:[0, 0, -14], grid:{at:[[0, 20.5, 0], [0, 22, 0]]},
   mat:'plastic', color:'#6b7480',
   brands:{intl:'Panduit / CommScope / Leviton / Belden / Siemon',cn:'一舟 / 普天汉飞 / 大唐电信 / 清华同方 / 爱谱华顿'}, desc:'1U 理线架，带盖板与上下理线环。网线光纤在环里横平竖直不只是为了好看 —— 乱塞的线会堵住前后风道，散热效率直接打折；光纤还有最小弯曲半径（≥30 mm）的硬约束，折死一根就是一次断网。'},

  /* ── 门与附件 ── */
  {id:'door', name:'前后网孔门', tag:'DOOR', layer:6, shape:'grid',
   size:[52, 62, 1.2], pos:[0, 0, 0], grid:{at:[[0, 0, -53.5], [0, 0, 53.5]]},
   mat:'perforated', color:'#9aa4ad', opacity:0.30,
   brands:{intl:'Schneider APC / Vertiv / Eaton / Rittal / Legrand',cn:'图腾 / 华为 / 中兴 / 一舟 / 金盾'}, desc:'前门进冷风、后门出热风，六角蜂窝网孔开孔率要超过 70% 才不挡气流 —— 这正是机柜不装风扇的原因：冷气由机房冷通道供给，门只负责「别挡住」。门锁带三点式连杆，一把钥匙锁上下两个锁点。'},

  {id:'sidepanel', name:'侧板 ×2', tag:'SIDE', layer:6, shape:'grid',
   size:[1.2, 58, 100], pos:[0, 0, 0], grid:{at:[[-27, 0, 0], [27, 0, 0]]},
   mat:'metal', color:'#8b939c', opacity:0.35,
   brands:{intl:'Schneider APC / Vertiv / Eaton / Rittal / Legrand',cn:'图腾 / 华为 / 中兴 / 一舟 / 金盾'}, desc:'左右两块快拆侧板，卡扣固定、免工具拆装。整排机柜并柜后，相邻两柜之间的侧板通常会拆掉一半，留出柜间理线与管理通道。侧板内侧的加强筋是防共振设计 —— 风扇墙的振动会把它变成喇叭。'},
];

const DIE_MODES = [];

/* ── 链路：电力流、数据流在机柜里的走向 ────────────────────────────── */
const cfg = {spread: 8, cutLo: -60, cutHi: 60, camDist: 300, shadow: 90};

function buildLinks({P, lay, LINKS, duplex}) {
  for (const sx of [-23, 23]) {                   // 供电：PDU → 各层设备，单向
    for (const [y, to] of [[-20, 'storage'], [-2, 'srv'], [16, 'tor']]) {
      LINKS.push({n: 6, speed: 0.20, arc: 0.6, tint: 3,
        from: [sx, y - 6, 44], to: [sx * 0.72, y, 32],
        lf: lay('pdu'), lt: lay(to)});
    }
  }
  const srvY = [-14, -10.6, -7.2, -3.8, -0.4, 3, 6.4, 9.8];
  srvY.forEach((y, i) => {                        // 网络：服务器 ↔ ToR，双归属
    const sx = i % 2 ? 14 : -14;
    duplex({n: 5, speed: 0.26, arc: 1.6, tint: 2,
      from: [sx, y - 2.1, 34], to: [(i % 2 ? 12 : -12), 16.8, 4],
      lf: lay('srv'), lt: lay('tor')});
  });
  for (let l = 0; l < 4; l++) {                   // 存储流量：服务器 ↔ 存储阵列
    const x = (l - 1.5) * 10;
    duplex({n: 5, speed: 0.22, arc: 0.8, tint: 1,
      from: [x, -9.5, 28], to: [x * 0.8, -19.5, 28],
      lf: lay('srv'), lt: lay('storage')});
  }
  for (const sx of [-12, 12]) {                   // 上联：ToR → Spine（柜顶出线）
    duplex({n: 6, speed: 0.24, arc: 0.4, tint: 0,
      from: [sx, 17.5, -16], to: [sx * 1.2, 34, 10],
      lf: lay('tor'), lt: lay('tor')});
  }
}

const meta = {
  levelName: '机柜',
  sub: '42U 标准机柜 · 一柜之内的完整世界',
  crumb: 'DC / RACK 42U',
  stat: '42U CABINET',
};

export { PARTS, DIE_MODES, cfg, buildLinks, meta };

/* ═══════════════════════════════════════════════════════════════════════
   零件表 —— 服务器层：2U 双路机架服务器，按真实产品结构建模。

   前面板的散热孔阵列、两侧提耳、VGA/USB 口、硬盘托架与卡扣、
   风扇墙的叶轮、散热器的鳍片与热管、CPU 顶盖、GPU 外壳与金手指、
   内存的散热马甲、PSU 的把手与风扇 —— 每一处都按真实形态画出。

   ── 尺度与夸张 ─────────────────────────────────────────────────────────
   XZ 平面照实：446×720 mm 按 1 mm = 0.27 换算为 124×196 世界单位。
   Y 方向约 2.5 倍夸张（2U 内空只有约 80 mm，照实画零件会挤成一张纸）。
   硬盘 24 盘位、风扇 6 只、内存 16 条按真实常见配置生成；GPU 两张
   双宽卡为示意（真实 AI 训练机是 8 卡整机）。
   ═══════════════════════════════════════════════════════════════════════ */

const PARTS = [
  {id:'rail', name:'机柜滑轨 ×2', tag:'RAIL', layer:0, shape:'grid',
   size:[7, 8, 200], pos:[0, -13, 0], grid:{at:[[-66, 0], [66, 0]]}, mat:'brushedAlu', color:'#6b7480',
   brands:{intl:'Accuride / King Slide / General Devices / Jonathan / Fulterer',cn:'海福乐 / 东泰 DTC / 星徽精密 / 固特 / 汇泰龙'}, desc:'三节式滚珠滑轨，推进 19 英寸机柜后完全展开可以把整机拉出维护。内轨固定在机箱侧壁（两颗定位销 + 一个卡扣），中轨与外轨留在柜上 —— 抽拉时的手感分级就是这三节轨的功劳。'},

  {id:'chassis', name:'机箱主体', tag:'CHASSIS', layer:1, shape:'box',
   size:[124, 10, 196], pos:[0, -4, 0], mat:'metal', color:'#454c54',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'SGCC 镀锌钢板冲压折边成型，侧壁有冲压加强筋。2U = 88.9 mm 高、19 英寸宽、深约 720 mm。图上 XZ 按真实尺寸换算，Y 方向为看清内部放大约 2.5 倍。'},

  {id:'bezel', name:'前面板与散热孔', tag:'BEZEL', layer:1, shape:'vent',
   size:[118, 8, 1.2], pos:[0, -3, -99], pitch:3.2, mat:'perforated', color:'#2c333a',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'前面板大面积蜂窝散热孔，开孔率约 60% —— 服务器全部进风都从这里进。面板内侧嵌一块防尘海绵网（图中略去），边缘是 EMC 弹片：面板合上后与机箱形成导电密封，把电磁泄漏关在箱内。'},

  {id:'ear', name:'上架提耳 ×2', tag:'EAR', layer:1, shape:'grid',
   size:[6, 9, 10], pos:[0, -3.5, 0], grid:{at:[[-63, 0, -93], [63, 0, -93]]},
   mat:'brushedAlu', color:'#9aa4ad',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'前面板两侧的上架提耳：抽拉、搬运、固定在机柜立柱上全靠它。耳上的免工具手拧螺丝拧紧后，整机才算真正上架。提耳内还藏着理线臂（CMA）的固定点 —— 整机拉出时线缆跟着走而不被扯断。'},

  {id:'frontio', name:'前置接口区', tag:'I/O', layer:1, shape:'box',
   size:[16, 3, 1.5], pos:[46, -2.5, -98.5], mat:'plastic', color:'#1a1c1e',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'VGA 调试口、两个 USB 3.0 与 UID 按钮/指示灯。机房巡场时按一下 UID，这台机器的蓝色定位灯与 iBMC 里的「定位」状态同步点亮 —— 在几千台机器里找到「它」，靠的就是这盏灯。'},

  {id:'psu', name:'冗余电源 ×2', tag:'PSU', layer:2, shape:'grid',
   size:[22, 11, 34], pos:[0, 8, 0], grid:{at:[[-47, 78], [47, 78]]}, mat:'metal', color:'#2c333a',
   brands:{intl:'Delta 台达 / Lite-On 光宝 / Chicony 群光 / AcBel 康舒 / Artesyn',cn:'华为 / 长城电源 / 欧陆通 / 麦格米特 / 泰嘉股份'}, desc:'1+1 热插拔冗余 CRPS 电源：任意一个掉电，另一个立刻接管全部负载。80+ 钛金认证效率约 96% —— 十万台规模下，1% 的效率差就是每年百万度电。上游是 UPS、HVDC 母排与柴油发电机组成的供配电系统。'},

  {id:'psu-hd', name:'电源把手与风扇 ×2', tag:'HANDLE', layer:2, shape:'grid',
   size:[14, 3, 3], pos:[0, 14, 0], grid:{at:[[-47, 0, 90], [47, 0, 90]]},
   mat:'plastic', color:'#d8a760',
   brands:{intl:'Delta 台达 / Lite-On 光宝 / Chicony 群光 / AcBel 康舒 / Artesyn',cn:'华为 / 长城电源 / 欧陆通 / 麦格米特 / 泰嘉股份'}, desc:'PSU 尾部的橙色快拆把手与散热风扇窗。橙色 = 热插拔部件的行业色标：看到橙色就可以带电拔。把手旁的小窗里是一颗 40 mm 暴力风扇 —— 它只在 PSU 内部循环，不参与整机风道。'},

  {id:'drives', name:'NVMe 固态盘 ×24', tag:'SSD', layer:2, shape:'grid',
   size:[4, 17, 26], pos:[0, 10.5, -70], grid:{count:[24, 1], pitch:[4.9, 0]}, mat:'brushedAlu', color:'#3d4a5c',
   brands:{intl:'Samsung / Solidigm / Micron / Kioxia / WD',cn:'长江存储 / 忆联 / 大普微 / 江波龙 / 佰维存储'}, desc:'前置 24 盘位 2.5 寸 U.2 NVMe，全部热插拔。单盘容量已到 30/60 TB 级。存储在数据中心是独立的一层：本机盘之外还有分布式块存储（Ceph）、集中式 SAN，冷数据沉到对象存储与磁带库。'},

  {id:'latch', name:'硬盘卡扣 ×24', tag:'LATCH', layer:2, shape:'grid',
   size:[2, 4, 1.5], pos:[0, 18, -83.5], grid:{count:[24, 1], pitch:[4.9, 0]}, mat:'plastic', color:'#d8a760',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'托架前端的橙色弹簧卡扣。按下解锁、弹出把手、沿导轨抽出 —— 热插拔的全套动作单手完成。卡扣旁的两颗 LED 是盘的「心跳」：绿灯常亮 = 在线，琥珀灯闪烁 = 阵列正在重构。'},

  {id:'board', name:'主板', tag:'MAINBOARD', layer:3, shape:'box',
   size:[112, 2.2, 150], pos:[0, 3, 4], mat:'pcb', color:'#0f3340',
   brands:{intl:'Supermicro / Dell / HPE / ASUS 华硕 / Gigabyte 技嘉',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 宝德'}, desc:'承载双路 CPU、16 条 DDR5、PCIe 5.0 插槽与 OCP 网卡槽位。板载 BMC 管理芯片 —— 每台服务器里的「电脑中的电脑」，运维平台通过 IPMI/Redfish 批量管理上万个节点：远程开关机、挂载镜像、读温度功耗，全走这条独立带外通道。'},

  {id:'cpu', name:'计算 CPU ×2', tag:'CPU', layer:4, shape:'grid',
   size:[21, 3, 17], pos:[0, 5.6, 0], grid:{at:[[-26, -16], [26, -16]]}, mat:'silicon', color:'#1b232a', dieShader:'ccd',
   brands:{intl:'Intel 至强 / AMD EPYC / NVIDIA Grace / Ampere / IBM POWER',cn:'华为鲲鹏 / 海光 / 飞腾 / 龙芯中科 / 兆芯'}, desc:'双路 x86（Xeon / EPYC），单节点 128 核上下。算力是数据中心的商品本体：虚拟化、容器、数据库最终都换算成这里的核时。顶面叠加的是负载透视读法 —— 切到左栏「软件栈」，看每一层软件落到芯片上的样子。'},

  {id:'ihs', name:'CPU 顶盖与扣具 ×2', tag:'IHS', layer:4, shape:'grid',
   size:[23, 1.6, 19], pos:[0, 8.2, 0], grid:{at:[[-26, -16], [26, -16]]}, mat:'nickelCopper', color:'#b0895a',
   brands:{intl:'Intel / AMD / NVIDIA / Ampere / IBM',cn:'华为鲲鹏 / 海光 / 飞腾 / 龙芯中科 / 兆芯'}, desc:'镀镍铜顶盖（IHS）把硅片的热量摊开给散热器底座，边缘的扣具螺丝按对角顺序分三次拧紧 —— 顺序错了压力不均，散热接触面就有空隙。顶盖上的激光刻字是型号与批次码。'},

  {id:'dimm', name:'DDR5 内存 ×16', tag:'DIMM', layer:4, shape:'grid',
   size:[3.4, 9, 26], pos:[0, 8.5, 6], grid:{count:[16, 1], pitch:[6.2, 0]}, mat:'pcb', color:'#14402e',
   brands:{intl:'Samsung / SK hynix / Micron / Kingston / Corsair',cn:'长鑫存储 CXMT / 嘉合劲威 / 金泰克 / 联想记忆科技 / 江波龙'}, desc:'双路各 8 通道 DDR5 RDIMM，单节点容量以 TB 计。内存数据库、向量检索、AI 推理的 KV Cache 都在吃容量与带宽 —— 近年服务器配置里涨得最快的一项，大内存节点已配到 4 TB。'},

  {id:'dimm-hs', name:'内存散热马甲 ×16', tag:'HEATSINK', layer:4, shape:'grid',
   size:[3.8, 9.5, 1.2], pos:[0, 8.5, 19.6], grid:{count:[16, 1], pitch:[6.2, 0]}, mat:'brushedAlu', color:'#6b7480',
   brands:{intl:'Samsung / SK hynix / Micron / Kingston / Corsair',cn:'长鑫存储 CXMT / 嘉合劲威 / 金泰克 / 联想记忆科技 / 江波龙'}, desc:'RDIMM 的铝制散热马甲。DDR5 把工作电压管理搬到了内存条上（PMIC），发热比 DDR4 高 —— 高频条不装马甲，在 40℃ 进风下就会触发降频保护。'},

  {id:'heatsink', name:'散热器鳍片 ×2', tag:'HSINK', layer:5, shape:'fins',
   size:[26, 7, 26], pos:[0, 11.5, 0], fins:22,
   grid:{at:[[-26, -16], [26, -16]]}, mat:'nickelCopper', color:'#b07a45',
   brands:{intl:'Cooler Master / Noctua / AVC 奇鋐 / Auras 双鸿 / Delta 台达',cn:'超频三 / 九州风神 / 酷冷至尊(台资) / 思民 / 利民(台资)'}, desc:'铜底铝鳍塔式散热片，鳍片间距约 1.5 mm —— 再密风阻压不住，再疏面积不够。压在两颗 CPU 上，是制冷链的第一环：芯片 → 散热器 → 风扇墙 → 热通道 → 精密空调 → 冷却塔。PUE 的大半由这条链的效率决定。'},

  {id:'heatpipe', name:'热管 ×8', tag:'PIPE', layer:5, shape:'grid', shapeKind:'cyl',
   size:[1.1, 24], pos:[0, 12.5, 0],
   grid:{at:(() => { const out = [];
     for (const cx of [-26, 26]) for (const off of [-6, -2, 2, 6]) out.push([cx + off, 0, -16]);
     return out; })()},
   mat:'nickelCopper', color:'#c98a4b',
   brands:{intl:'AVC 奇鋐 / Auras 双鸿 / Cooler Master / Fujikura / Furukawa',cn:'超频三 / 九州风神 / 双鸿(台资) / 思民 / 中石科技'}, desc:'烧结式热管横贯鳍片组：管内工作液体在蒸发端汽化、冷凝端液化，靠毛细回流完成循环 —— 等效导热系数是实心铜的几十倍。弯折处的扁化是工艺痕迹，不是损伤。'},

  {id:'gpu', name:'GPU 加速卡 ×2', tag:'GPU', layer:5, shape:'grid',
   size:[26, 6, 62], pos:[0, 9.5, 0], grid:{at:[[-23, 46], [23, 46]]}, mat:'pcb', color:'#16181d',
   brands:{intl:'NVIDIA / AMD / Intel / Google TPU / Graphcore',cn:'华为昇腾 / 寒武纪 / 海光 DCU / 摩尔线程 / 燧原科技'}, desc:'AI 时代的增量算力。这里画两张双宽卡作示意，真实训练机型是整机 8 卡 + NVLink 全互联；万卡集群之间靠 RDMA 网络（InfiniBand / RoCE v2）连接，网络带宽直接决定大模型训练效率。'},

  {id:'gpu-sh', name:'GPU 外壳 ×2', tag:'SHROUD', layer:5, shape:'grid',
   size:[27, 1.5, 63], pos:[0, 13.2, 0], grid:{at:[[-23, 46], [23, 46]]}, mat:'brushedAlu', color:'#2c333a',
   brands:{intl:'NVIDIA / AMD / Intel / Dell OEM / HPE OEM',cn:'华为昇腾 / 寒武纪 / 海光 DCU / 摩尔线程 / 燧原科技'}, desc:'数据中心 GPU 没有风扇 —— 全封闭铝合金外壳 + 被动散热鳍片，风道完全交给服务器的系统风扇。外壳上的导流槽把气流压过鳍片；这与消费卡的开放式三风扇是两种物种。'},

  {id:'gpu-gf', name:'PCIe 金手指 ×2', tag:'EDGE', layer:5, shape:'grid',
   size:[20, 1.2, 2.5], pos:[0, 6, 0], grid:{at:[[-23, 0, 16], [23, 0, 16]]}, mat:'gold', color:'#c9a227',
   brands:{intl:'NVIDIA / AMD / Intel / Broadcom / Marvell',cn:'华为昇腾 / 寒武纪 / 海光 DCU / 摩尔线程 / 燧原科技'}, desc:'PCIe 5.0 x16 的金手指，32 GT/s 的信号从这对镀金触点上走过。触点镀金厚度有标准（≥0.76 µm 为工业级）—— 插拔寿命与接触可靠性全靠这层金。'},

  {id:'nic', name:'OCP 网卡', tag:'NIC', layer:5, shape:'box',
   size:[22, 5, 28], pos:[0, 8.5, 68], mat:'pcb', color:'#12384a',
   brands:{intl:'NVIDIA Mellanox / Broadcom / Intel / Marvell / Cisco',cn:'华为 / 中兴 / 云豹智能 / 中科驭数 / 星云智联'}, desc:'OCP 3.0 形态的 25/100 GbE 网卡，从主板尾部的专用插槽水平插入 —— 不占标准 PCIe 插槽，是机架服务器的标配做法。上联柜顶 ToR 交换机，再往上是 Leaf-Spine 的 CLOS 组网。RDMA 网卡还承担 GPU 集群的参数同步流量。'},

  {id:'nic-port', name:'光口笼 ×2', tag:'CAGE', layer:5, shape:'grid',
   size:[8, 4, 6], pos:[0, 9, 0], grid:{at:[[-6, 0, 80], [6, 0, 80]]}, mat:'metal', color:'#8a919b',
   brands:{intl:'NVIDIA Mellanox / Broadcom / Intel / Finisar / Coherent',cn:'华为 / 中兴 / 光迅科技 / 新易盛 / 中际旭创'}, desc:'SFP28/QSFP28 光模块笼，光模块插进去后拉手朝外。笼体上的弹片既接地又夹持 —— 万兆以上速率的信号完整性，从这只笼子就开始了。'},

  {id:'fan', name:'风扇墙 ×6', tag:'FAN', layer:6, shape:'fan',
   size:[8, 9], pos:[0, 10, -36], blades:9,
   grid:{count:[6, 1], pitch:[17.5, 0]}, mat:'plastic', color:'#22262c',
   brands:{intl:'Delta 台达 / Nidec / Sunon 建准 / AVC 奇鋐 / Sanyo Denki',cn:'艾美特 / 亿利达 / 金亿翔 / 深圳建准 / 苏州电讯'}, desc:'6 只 8038 规格轴流风扇组成风扇墙，N+1 冗余，按进风温度无级调速。9 片后倾叶片 —— 满转时一台服务器就是一个小型飓风，风扇功耗能占整机 10%。高密度 AI 机柜上，风冷已到极限，冷板式液冷正在把这一面墙换成进出水歧管。'},

  {id:'fan-frame', name:'风扇框 ×6', tag:'FRAME', layer:6, shape:'grid',
   size:[9.5, 9.5, 2], pos:[0, 10, -36], grid:{count:[6, 1], pitch:[17.5, 0]}, mat:'plastic', color:'#1a1c1e',
   brands:{intl:'Delta 台达 / Nidec / Sunon 建准 / AVC 奇鋐 / Sanyo Denki',cn:'艾美特 / 亿利达 / 金亿翔 / 深圳建准 / 苏州电讯'}, desc:'风扇的方形固定框，四角减震橡胶钉隔离振动 —— 风扇的振动如果直接传导到硬盘托架，HDD 的寻道错误率会明显上升（NVMe 时代这条顾虑正在消失）。'},

  {id:'shroud', name:'导风罩', tag:'DUCT', layer:7, shape:'box',
   size:[110, 8, 118], pos:[0, 17, 8], mat:'plastic', color:'#8b939c', opacity:0.32,
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'一块不起眼的注塑塑料板，决定冷空气是老老实实流过 CPU 与内存，还是从空隙里「短路」跑掉。气流组织是 PUE 的微观战场：机房级的冷热通道隔离，机柜级的盲板，服务器级就靠它。（高度放大同机箱。）'},

  {id:'cover', name:'机箱上盖', tag:'COVER', layer:8, shape:'box',
   size:[124, 3.5, 196], pos:[0, 22.5, 0], mat:'brushedAlu', color:'#9aa4ad', opacity:0.28,
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'免工具拆装的上盖，后端一颗弹簧锁销固定。合上它，这台服务器就是 42U 机柜里的一格；一排机柜组成一个微模块，成百上千个微模块加上供配电、制冷、消防、安防与 DCIM 监控，组成一栋数据中心。'},
];

/* 软件栈读法：不是物理零件，是「一台服务器上跑着什么」的五层。 */
const DIE_MODES = [
  {id:0, name:'固件与带外管理', tag:'FW',  desc:'BIOS / UEFI 与 BMC（IPMI、Redfish）。服务器没开机它就在工作：远程开关机、挂载安装镜像、采集温度功耗、故障告警，全走这条独立于业务系统的管理平面。它是数据中心自动化运维的抓手。'},
  {id:1, name:'虚拟化层', tag:'HV',  desc:'Hypervisor（VMware ESXi / KVM / Hyper-V）把一台物理机切成多台虚拟机，CPU、内存、IO 全部池化 —— 这是 IaaS 云主机的底座。裸金属与 AI 训练场景则会刻意跳过这层，减少损耗。'},
  {id:2, name:'操作系统层', tag:'OS',  desc:'Linux（RHEL / Ubuntu / 麒麟）与 Windows Server：进程调度、内存管理、文件系统、TCP/IP 协议栈都在这层。内核参数调优（大页内存、NUMA 绑核、网络中断亲和）直接决定业务性能上限。'},
  {id:3, name:'容器与编排', tag:'K8S', desc:'containerd / Docker 运行时 + Kubernetes 编排：以 Pod 为最小单位把应用调度到成千上万个节点上，负责弹性伸缩、服务发现、滚动发布与故障自愈。这是云原生的操作系统。'},
  {id:4, name:'应用与数据服务', tag:'APP', desc:'数据库（MySQL / PostgreSQL / Redis）、消息队列与中间件（Kafka / Nginx）、大数据平台（Hadoop / Spark）与 AI 训练推理框架 —— 数据中心存在的一切理由，最终落在这一层跑的业务上。'},
];

/* ── 场景参数与链路定义 ────────────────────────────────────────────── */
const cfg = {spread: 12, cutLo: -104, cutHi: 104, camDist: 445, shadow: 165};

function buildLinks({P, lay, LINKS, duplex}) {
  for (const sx of [-47, 47]) {                   // 供电：PSU → 主板，单向
    for (let l = 0; l < 3; l++) {
      const off = (l - 1) * 6;
      LINKS.push({n: 6, speed: 0.20, arc: 0.5, tint: 3,
        from: [sx + off, 6.5, 64], to: [sx * 0.75 + off, 4.4, 56],
        lf: lay('psu'), lt: lay('board')});
    }
  }
  for (const sx of [-26, 26]) {                   // 内存通道：CPU ↔ DDR5，双向
    for (let l = 0; l < 4; l++) {
      const off = (l - 1.5) * 5;
      duplex({n: 5, speed: 0.28, arc: 1.2, tint: 0,
        from: [sx + off, 5.6, -7.5], to: [sx * 1.5 + off, 8.5, -5],
        lf: lay('cpu'), lt: lay('dimm')});
    }
  }
  for (const sx of [-26, 26]) {                   // PCIe 5.0：CPU ↔ GPU，双向
    for (let l = 0; l < 3; l++) {
      const off = (l - 1) * 6;
      duplex({n: 6, speed: 0.24, arc: 2.2, tint: 2,
        from: [sx + off, 5.6, -6], to: [sx * 0.85 + off, 9.5, 15],
        lf: lay('cpu'), lt: lay('gpu')});
    }
  }
  for (let l = 0; l < 6; l++) {                   // 存储背板：NVMe ↔ 主板，双向
    const x = (l - 2.5) * 20;
    duplex({n: 5, speed: 0.22, arc: 0.6, tint: 1,
      from: [x, 10.5, -57], to: [x * 0.85, 4.4, -64],
      lf: lay('drives'), lt: lay('board')});
  }
  for (let l = 0; l < 3; l++) {                   // 网络上联：网卡 → ToR，双向
    const off = (l - 1) * 6;
    duplex({n: 6, speed: 0.26, arc: 0.8, tint: 2,
      from: [off, 8.5, 82], to: [off, 8.5, 102],
      lf: lay('nic'), lt: lay('nic')});
  }
}

const meta = {
  levelName: '服务器',
  sub: '2U 机架服务器 · 软硬件基础设施全览',
  crumb: 'DC / 2U SERVER',
  stat: '2U RACK SERVER',
};

export { PARTS, DIE_MODES, cfg, buildLinks, meta };

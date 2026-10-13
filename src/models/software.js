/* ═══════════════════════════════════════════════════════════════════════
   零件表 —— 软件层：数据中心里跑着的全部软件，自下而上四层。

   硬件资源底座 → 基础架构软件 → 中间件 → 应用软件。

   ── 行业视图 ───────────────────────────────────────────────────────────
   这一层的关键设计：应用层不是一张固定的图。选中左栏「行业视图」里的
   一个行业，应用层的**组件会整套换掉** —— 制造业长出 MES/PLM/APS/QMS/
   WMS/SCADA，金融业换成核心系统/支付清算/风控/监管报送。六个行业六套
   不同的应用系统，这才是「不同行业应用种类差异很大」的真实样子。

   底座三层（硬件 / 基础软件 / 中间件）跨行业基本通用，保持不动；
   通用应用（ERP/OA/CRM/HRM/财务/BI）始终在场 —— 任何行业都绕不开它们，
   行业系统从通用系统旁边长出来。横向流转链路按行业重组。
   ═══════════════════════════════════════════════════════════════════════ */

/* 底座三层与通用应用是常量；行业应用按行业成组切换。 */
const BASE = [
  {id:'hw', name:'硬件资源底座', tag:'HARDWARE', layer:0, shape:'box',
   size:[250, 4, 110], pos:[0, -16, 0], mat:'metal', color:'#454c54',
   brands:{intl:'Dell / HPE / Supermicro / Lenovo / Cisco UCS',cn:'浪潮信息 / 华为 / 新华三 / 中科曙光 / 联想'}, desc:'所有软件最终都落在已经拆过的那三级上：机房的供电制冷、机柜的交换机与存储、服务器里的 CPU 与内存。云化的本质就是把这层池化，让上面的软件不再关心自己跑在哪台物理机上。'},

  {id:'infra-slab', name:'基础架构软件平台', tag:'PLATFORM', layer:1, shape:'box',
   size:[250, 2.5, 110], pos:[0, -8, 0], mat:'metal', color:'#8fb8e8', opacity:0.18,
   brands:{intl:'VMware / Microsoft / Citrix / Red Hat / Nutanix',cn:'华为 / 新华三 / 深信服 / 云宏 / 易捷行云'}, desc:'把硬件变成可分配资源的总底座：操作系统管单机，虚拟化与容器管池化，数据库管数据，安全与运维软件管住整个面。这一层出问题，上面所有层一起停摆。'},

  {id:'os', name:'操作系统', tag:'OS', layer:2, shape:'box',
   size:[28, 10, 34], pos:[-99, -1, 0], mat:'silicon', color:'#1b232a',
   brands:{intl:'Microsoft Windows Server / Red Hat RHEL / SUSE / Ubuntu Canonical / Oracle Linux',cn:'麒麟软件 / 统信 UOS / openEuler / 中科方德 / 普华基础软件'}, desc:'每台服务器的第一层软件：Linux（RHEL / Ubuntu / 麒麟 / 统信）与 Windows Server。进程调度、内存管理、文件系统、TCP/IP 协议栈全在这里，内核调优（大页内存、NUMA 绑核）直接决定上层性能上限。'},
  {id:'db', name:'数据库软件', tag:'DATABASE', layer:2, shape:'box',
   size:[28, 10, 34], pos:[-66, -1, 0], mat:'silicon', color:'#12384a',
   brands:{intl:'Oracle / Microsoft SQL Server / MySQL / PostgreSQL / MongoDB',cn:'达梦 / 人大金仓 / OceanBase / 华为 GaussDB / PingCAP TiDB'}, desc:'Oracle / MySQL / PostgreSQL，国产的达梦、人大金仓、OceanBase，再加上 Redis、MongoDB、时序与图数据库。数据是数据中心真正的资产，数据库选型与主从/集群方案决定了可用性与扩展性的天花板。'},
  {id:'virt', name:'虚拟化与云平台', tag:'VIRT/CLOUD', layer:2, shape:'box',
   size:[28, 10, 34], pos:[-33, -1, 0], mat:'silicon', color:'#1b232a',
   brands:{intl:'VMware vSphere / Microsoft Hyper-V / Citrix / Nutanix AHV / Proxmox',cn:'华为 FusionSphere / H3C CAS / 深信服 / 云宏 / ZStack'}, desc:'VMware vSphere、KVM、Hyper-V 把物理机切成虚拟机；OpenStack / 超融合 / 私有云再把成百上千台机器拧成一个资源池 —— IaaS 云主机就从这层长出来。'},
  {id:'ctn', name:'容器与编排', tag:'K8S', layer:2, shape:'box',
   size:[28, 10, 34], pos:[0, -1, 0], mat:'silicon', color:'#14402e',
   brands:{intl:'Kubernetes / Docker / Red Hat OpenShift / Rancher SUSE / VMware Tanzu',cn:'华为云 CCE / 阿里云 ACK / 腾讯云 TKE / 灵雀云 / 时速云'}, desc:'containerd / Docker 运行时 + Kubernetes 编排，以 Pod 为单位把应用调度到成千上万个节点：弹性伸缩、服务发现、滚动发布、故障自愈。云原生的操作系统，现在也是 AI 训练任务的调度底座。'},
  {id:'bak', name:'备份与容灾', tag:'BACKUP', layer:2, shape:'box',
   size:[28, 10, 34], pos:[33, -1, 0], mat:'silicon', color:'#2b3a2c',
   brands:{intl:'Veeam / Veritas / Dell EMC / Commvault / IBM',cn:'华为 / 爱数 / 鼎甲 / 云祺 / 火星高科'}, desc:'Veeam / CommVault / 爱数做定时备份，CDP 做连续数据保护；「两地三中心」与同城双活、异地灾备解决的是机房级灾难 —— 勒索病毒时代，离线备份是最后一道防线。'},
  {id:'sec', name:'安全软件', tag:'SECURITY', layer:2, shape:'box',
   size:[28, 10, 34], pos:[66, -1, 0], mat:'silicon', color:'#3a2a2a',
   brands:{intl:'Palo Alto / Fortinet / Check Point / Cisco / CrowdStrike',cn:'奇安信 / 深信服 / 启明星辰 / 绿盟科技 / 天融信'}, desc:'防火墙、WAF、IDS/IPS 守边界，EDR 守终端，堡垒机管运维入口，漏洞扫描与态势感知看全局。等保 2.0 合规要求让这一层从「可选」变成「必配」。'},
  {id:'ops', name:'监控与运维平台', tag:'OPS/ITSM', layer:2, shape:'box',
   size:[28, 10, 34], pos:[99, -1, 0], mat:'silicon', color:'#20272e',
   brands:{intl:'ServiceNow / BMC / Datadog / Splunk / Dynatrace',cn:'华为 / 蓝鲸智云 / 云智慧 / 博睿数据 / 嘉为科技'}, desc:'Zabbix / Prometheus 采指标，CMDB 管资产台账，ITSM 管工单流程，AIOps 做异常检测与根因分析。万台节点的数据中心靠它运转 —— 无人值守的前提是无所不见。'},

  {id:'mid-slab', name:'中间件平台', tag:'MIDDLEWARE', layer:3, shape:'box',
   size:[250, 2.5, 110], pos:[0, 8, 0], mat:'metal', color:'#8fb8e8', opacity:0.18,
   brands:{intl:'IBM / Oracle / Red Hat / VMware / Software AG',cn:'东方通 / 宝兰德 / 普元 / 中创 / 金蝶天燕'}, desc:'操作系统与应用之间的「通用能力层」：应用不必自己处理高并发、消息堆积、分布式事务与系统集成，这些难题被抽象成中间件，一次建设、处处复用。'},

  {id:'web', name:'应用服务器', tag:'APP SERVER', layer:4, shape:'box',
   size:[24, 10, 34], pos:[-108, 15, 0], mat:'silicon', color:'#1b232a',
   brands:{intl:'Apache / Nginx F5 / Microsoft IIS / Oracle WebLogic / IBM WebSphere',cn:'东方通 TongWeb / 宝兰德 / 普元 / 金蝶天燕 / 中创'}, desc:'Nginx / Apache 扛 HTTP 接入与反向代理，Tomcat / WebLogic / 东方通跑应用逻辑。它决定了单机并发上限，也是负载均衡与灰度发布的第一站。'},
  {id:'mq', name:'消息中间件', tag:'MQ', layer:4, shape:'box',
   size:[24, 10, 34], pos:[-77, 15, 0], mat:'silicon', color:'#12384a',
   brands:{intl:'IBM MQ / RabbitMQ / Apache Kafka / Confluent / Amazon SQS',cn:'东方通 / 普元 / 阿里云 RocketMQ / 宝兰德 / 金蝶天燕'}, desc:'Kafka / RabbitMQ / RocketMQ / Pulsar：削峰填谷、异步解耦、最终一致性的骨架。秒杀洪峰、日志采集、跨系统数据同步，全走消息队列。'},
  {id:'cache', name:'分布式缓存', tag:'CACHE', layer:4, shape:'box',
   size:[24, 10, 34], pos:[-46, 15, 0], mat:'silicon', color:'#3a2a2a',
   brands:{intl:'Redis / Memcached / Hazelcast / Couchbase / Aerospike',cn:'阿里云 Tair / 腾讯云 / 华为云 / 宝兰德 / 东方通'}, desc:'Redis / Memcached 把热点数据放进内存，微秒级响应。会话、排行榜、库存扣减、分布式锁都离不开它 —— 缓存击穿与雪崩是这层最著名的两道面试题，也是两次真实的线上事故类型。'},
  {id:'gw', name:'API 网关与注册中心', tag:'GATEWAY', layer:4, shape:'box',
   size:[24, 10, 34], pos:[-15, 15, 0], mat:'silicon', color:'#1b232a',
   brands:{intl:'Kong / Apigee Google / MuleSoft / AWS / Akana',cn:'阿里云 / 华为云 / 普元 / 东方通 / 星环科技'}, desc:'Kong / APISIX / Spring Cloud Gateway 统一入口：鉴权、限流、熔断、路由。Nacos / Consul 负责服务注册发现 —— 微服务架构的「电话总机」。'},
  {id:'esb', name:'服务集成与治理', tag:'ESB/MESH', layer:4, shape:'box',
   size:[24, 10, 34], pos:[15, 15, 0], mat:'silicon', color:'#2b3a2c',
   brands:{intl:'MuleSoft / IBM / Oracle / TIBCO / Software AG',cn:'普元 / 东方通 / 宝兰德 / 金蝶天燕 / 中创'}, desc:'传统企业的 ESB 企业服务总线、新一代的 Istio 服务网格，解决的是同一件事：几十上百个系统之间怎么互相调用而不乱成一锅粥 —— 协议转换、路由编排、可观测性都在这层。'},
  {id:'etl', name:'数据集成与交换', tag:'ETL/CDC', layer:4, shape:'box',
   size:[24, 10, 34], pos:[46, 15, 0], mat:'silicon', color:'#14402e',
   brands:{intl:'Informatica / Talend / IBM DataStage / Oracle ODI / Microsoft SSIS',cn:'普元 / 东方通 / 星环科技 / 华为云 / 阿里云'}, desc:'ETL 工具（DataX / Kettle）、实时同步（Flink CDC / Canal）把数据从各个业务库搬进数据仓库与数据中台 —— 报表与 BI 的数据从这条路来，主数据管理（MDM）也在这层。'},
  {id:'bpm', name:'流程与规则引擎', tag:'BPM', layer:4, shape:'box',
   size:[24, 10, 34], pos:[77, 15, 0], mat:'silicon', color:'#20272e',
   brands:{intl:'Appian / Pegasystems / IBM / Oracle / Camunda',cn:'泛微 / 致远互联 / 普元 / 炎黄盈动 / 金蝶'}, desc:'Activiti / Flowable / Camunda 把审批流、业务流程从代码里抽出来变成可配置的流程图；规则引擎（Drools）让风控规则、定价策略随业务改而不必发版。OA 与 ERP 的审批流都站在它肩上。'},
  {id:'sched', name:'任务调度', tag:'SCHEDULER', layer:4, shape:'box',
   size:[24, 10, 34], pos:[108, 15, 0], mat:'silicon', color:'#1b232a',
   brands:{intl:'Control-M BMC / IBM / Autosys Broadcom / Airflow / ActiveBatch',cn:'普元 / 东方通 / 宝兰德 / 腾讯云 / 阿里云'}, desc:'XXL-Job / DolphinScheduler / Airflow：每天凌晨的批量跑批、账单生成、对账、报表计算由它按时触发。银行与电信的「日终批量」是这层最严苛的真实战场。'},

  {id:'app-slab', name:'应用软件平台', tag:'APPLICATION', layer:5, shape:'box',
   size:[250, 2.5, 110], pos:[0, 23, 0], mat:'metal', color:'#8fb8e8', opacity:0.20, dieShader:'ccd',
   brands:{intl:'SAP / Oracle / Microsoft / Salesforce / Adobe',cn:'用友 / 金蝶 / 浪潮 / 东软 / 泛微'}, desc:'数据中心存在的理由。前半排是所有企业都要用的通用系统，后半排随行业整套变换 —— 切到左栏「行业视图」，换制造、金融、医疗、政务、零售、能源，这一层的组件会整体换掉。顶面亮起的负载视图也随行业切换。'},
];

/* 通用应用六件套：任何行业的集团企业都绕不开 */
const COMMON = [
  {id:'erp', name:'ERP 企业资源计划', tag:'ERP', layer:6, shape:'box',
   size:[28, 10, 22], pos:[-99, 30, -26], mat:'silicon', color:'#1b232a',
   brands:{intl:'SAP / Oracle / Microsoft Dynamics / Infor / Workday',cn:'用友 / 金蝶 / 浪潮 / 鼎捷 / 管家婆'}, desc:'SAP / Oracle EBS / 用友 / 金蝶：财务、采购、库存、生产、销售一体化管理，企业的「中央账本」。一个 ERP 项目往往牵动全公司的流程再造。'},
  {id:'oa', name:'OA 协同办公', tag:'OA', layer:6, shape:'box',
   size:[28, 10, 22], pos:[-66, 30, -26], mat:'silicon', color:'#12384a',
   brands:{intl:'Microsoft 365 / Google Workspace / Atlassian / Asana / monday.com',cn:'泛微 / 致远互联 / 钉钉 / 企业微信 / 飞书'}, desc:'泛微 / 致远 / 钉钉 / 企业微信：审批流、公文、会议、知识库、门户。使用人数最多的一套系统 —— 它挂在中间件的流程引擎上，是 BPM 最典型的客户。'},
  {id:'crm', name:'CRM 客户关系', tag:'CRM', layer:6, shape:'box',
   size:[28, 10, 22], pos:[-33, 30, -26], mat:'silicon', color:'#14402e',
   brands:{intl:'Salesforce / Microsoft Dynamics / HubSpot / Oracle / SAP',cn:'销售易 / 纷享销客 / 用友 / 金蝶 / 玄武云'}, desc:'Salesforce / 销售易 / 纷享销客：线索、商机、合同、回款的全周期管理。它和 ERP 的订单、OA 的审批之间由集成中间件缝合 —— 这就是 ESB/API 网关存在的理由。'},
  {id:'hrm', name:'HRM 人力资源', tag:'HR', layer:6, shape:'box',
   size:[28, 10, 22], pos:[0, 30, -26], mat:'silicon', color:'#20272e',
   brands:{intl:'Workday / SAP SuccessFactors / Oracle HCM / ADP / UKG',cn:'北森 / 用友 / 金蝶 / 肯耐珂萨 / Moka'}, desc:'组织人事、薪酬考勤、招聘绩效。北森 / SAP SuccessFactors / 用友人力云。数据敏感度最高的系统之一，权限与审计要求也最严。'},
  {id:'fin', name:'财务共享与预算', tag:'FIN', layer:6, shape:'box',
   size:[28, 10, 22], pos:[33, 30, -26], mat:'silicon', color:'#2b3a2c',
   brands:{intl:'SAP / Oracle / Workday / Sage / BlackLine',cn:'用友 / 金蝶 / 浪潮 / 远光软件 / 久其软件'}, desc:'财务共享中心、全面预算、费控报销、资金管理与税务系统。集团型企业把各分子公司的核算集中到这里，月底结账的跑批压力全部落在任务调度层。'},
  {id:'bi', name:'BI 与数据可视化', tag:'BI', layer:6, shape:'box',
   size:[28, 10, 22], pos:[66, 30, -26], mat:'silicon', color:'#3a2a2a',
   brands:{intl:'Tableau / Microsoft Power BI / Qlik / SAP / ThoughtSpot',cn:'帆软 / 永洪科技 / 观远数据 / Smartbi / 亿信华辰'}, desc:'帆软 / Tableau / PowerBI：经营驾驶舱、报表平台、自助分析。它的数据全部来自 ETL 与数据中台那条链路 —— 数据不通，BI 就是墙上的一张图。'},
];

/* 行业应用：每个行业六块，换掉应用层的整个后半排 */
const INDUSTRIES = [
  {id:0, name:'通用企业集团', tag:'GENERAL', apps: [
    {id:'portal', name:'企业门户', tag:'PORTAL', color:'#1b232a',
     desc:'统一门户与单点登录（SSO）：员工每天从这一个入口进入几十个系统。背后是 IAM 身份管理 —— 入转调离一次开通、一次回收全部权限。'},
    {id:'dm', name:'文档与知识管理', tag:'DMS', color:'#12384a',
     desc:'企业网盘、档案管理与知识库。非结构化数据（合同扫描件、图纸、视频）的增长速度远超数据库，对象存储与全文检索是它背后的两件套。'},
    {id:'mail', name:'邮件与协作', tag:'MAIL', color:'#14402e',
     desc:'邮件系统、视频会议与即时通讯。Exchange / 腾讯企业邮 / 263。邮件至今仍是跨企业商务往来的法定证据载体，归档与审计要求一点不比业务系统低。'},
    {id:'proj', name:'项目与合同管理', tag:'PM', color:'#20272e',
     desc:'项目立项、进度、成本与合同台账。工程、咨询、研发类企业的主线系统 —— 项目的收款节点直接对接财务共享的应收。'},
    {id:'crm2', name:'营销自动化', tag:'MKT', color:'#2b3a2c',
     desc:'活动、线索孵化、内容营销与 SCRM 私域运营。线索成熟后流入 CRM —— 营销自动化和销售管理之间的这条缝，是 CRM 项目最常见的烂尾点。'},
    {id:'ai', name:'AI 助手平台', tag:'AI', color:'#3a2a2a',
     desc:'企业级大模型平台：知识库问答、代码助手、合同审查、客服机器人。私有化部署走 GPU 推理集群，数据不出域 —— 这是近两年数据中心 GPU 需求的第一来源。'}],
   desc:'ERP、OA、CRM、HRM、财务共享、BI 六件套打底，再加门户、文档、邮件协作与项目管理。这是任何规模企业的标准配置，行业系统从这里往上长。'},

  {id:1, name:'制造业', tag:'MFG', apps: [
    {id:'mes', name:'MES 制造执行', tag:'MES', color:'#1b232a',
     brands:{intl:'Siemens Opcenter / Rockwell / SAP ME / Dassault / GE Digital',cn:'用友精智 / 金蝶 / 鼎捷 / 宝信软件 / 摩尔元数'}, desc:'车间大脑：工单派发、报工、在制品追踪、设备稼动率（OEE）。上接 ERP 的生产订单，下连 SCADA 与 PLC 的实时数据 —— 「订单到交付」主线的中枢。'},
    {id:'plm', name:'PLM 产品生命周期', tag:'PLM', color:'#12384a',
     brands:{intl:'Siemens Teamcenter / PTC Windchill / Dassault / Aras / Oracle Agile',cn:'用友 / 金蝶 / 索为系统 / 华天软件 / 思普软件'}, desc:'图纸、BOM、工艺路线与变更管理（ECN）。PLM 的制造 BOM 进 ERP，ERP 的生产订单下 MES —— 这条链断在哪一环，车间就乱在哪一环。'},
    {id:'aps', name:'APS 高级排产', tag:'APS', color:'#14402e',
     brands:{intl:'Siemens / Dassault DELMIA / AspenTech / o9 / Kinaxis',cn:'永凯 / 安达发 / 金蝶 / 用友 / 数夫'}, desc:'考虑设备、模具、人员、物料约束的有限产能排产。ERP 的无限产能 MRP 排出的计划落不了地，APS 补上的就是这一课 —— 插单、换线、瓶颈工序都是它的战场。'},
    {id:'wms', name:'WMS 仓储管理', tag:'WMS', color:'#20272e',
     brands:{intl:'Manhattan / Blue Yonder / SAP EWM / Oracle / Infor',cn:'富勒 / 科箭 / 唯智 / 通天晓 / 巨沃'}, desc:'入库、上架、拣选、盘点、批次与效期追溯，联动 AGV 与立体库。制造业的 WMS 还要管线边仓 —— 物料要准时送到工位，而不是躺在仓库里。'},
    {id:'qms', name:'QMS 质量管理', tag:'QMS', color:'#2b3a2c',
     brands:{intl:'Siemens / ETQ / Sparta TrackWise / MasterControl / IQVIA',cn:'用友 / 金蝶 / 鼎捷 / 海克斯康中国 / 云质'}, desc:'来料检、过程检、成品检与 SPC 统计过程控制。追溯链从供应商批次一路追到成品序列号 —— 汽车与医药行业，这条链是法规要求，不是管理选择。'},
    {id:'scada', name:'SCADA 数采与工业互联网', tag:'SCADA', color:'#3a2a2a',
     brands:{intl:'Siemens WinCC / Rockwell / AVEVA / GE / Emerson',cn:'亚控科技 / 力控 / 紫金桥 / 九思易 / 易控微网'}, desc:'从 PLC、CNC、机器人采集秒级实时数据，经边缘网关汇聚进工业互联网平台做预测性维护与能耗分析。OT 与 IT 在这层汇合，也是工控安全的主战场。'}],
   desc:'ERP + MES + PLM + APS + WMS + QMS + SCADA 数采。主线「订单到交付」：PLM 的 BOM 进 ERP，ERP 的生产订单下 MES，MES 报工回写成本，SCADA 提供现场实时数据。'},

  {id:2, name:'金融业', tag:'FIN', apps: [
    {id:'core', name:'核心银行系统', tag:'CORE', color:'#1b232a',
     brands:{intl:'Temenos / FIS / Fiserv / Oracle FLEXCUBE / Finastra',cn:'长亮科技 / 宇信科技 / 神州数码 / 润和软件 / 赞同科技'}, desc:'账务心脏：存款、贷款、核算。新一代分布式核心正从大型机迁往 x86/ARM 集群 —— 日终批量、结息日、年终决算是它一年里最紧张的三个夜晚。'},
    {id:'pay', name:'支付清算', tag:'PAY', color:'#12384a',
     brands:{intl:'ACI Worldwide / FIS / Fiserv / Mastercard / Visa',cn:'银联商务 / 通联支付 / 拉卡拉 / 联动优势 / 易宝支付'}, desc:'大小额支付、超级网银、银联与网联通道、跨境 CIPS。7×24 不间断，单笔延迟按毫秒计 —— 支付系统的 SLA 是整个行业里最硬的一档。'},
    {id:'channel', name:'渠道与手机银行', tag:'CHANNEL', color:'#14402e',
     brands:{intl:'Backbase / Temenos / Finastra / Q2 / nCino',cn:'宇信科技 / 长亮科技 / 神州数码 / 文思海辉 / 润和软件'}, desc:'手机银行、网上银行、微信银行与开放银行 API。承载全部零售客户的日常访问，双十一与春节红包是它自己的「大促」。'},
    {id:'risk', name:'风险与反欺诈', tag:'RISK', color:'#20272e',
     brands:{intl:'SAS / Moody\'s / FICO / NICE Actimize / Oracle',cn:'同盾科技 / 百融云创 / 第四范式 / 顶象技术 / 冰鉴科技'}, desc:'信用评分、实时反欺诈、反洗钱（AML）与操作风险。规则引擎 + 实时流计算：一笔交易要在 100 ms 内跑完上百条风控规则才能放行。'},
    {id:'wealth', name:'理财与资管', tag:'WM', color:'#2b3a2c',
     brands:{intl:'SS&C / Temenos / FIS / Broadridge / Avaloq',cn:'恒生电子 / 金证股份 / 顶点软件 / 宇信科技 / 赢时胜'}, desc:'理财登记、估值核算、投资交易与份额登记（TA）。净值化转型后，估值时效与准确性直接决定产品能不能按时披露净值。'},
    {id:'reg', name:'监管报送', tag:'REGTECH', color:'#3a2a2a',
     brands:{intl:'AxiomSL / Wolters Kluwer / NICE / SAS / Moody\'s Analytics',cn:'恒生电子 / 宇信科技 / 长亮科技 / 金证股份 / 中科金财'}, desc:'1104、EAST、客户风险统计等监管报表。数据从几十个上游系统抽取、校验、汇总 —— 报送质量出问题，等着的是监管罚单。'}],
   desc:'核心系统、支付清算、渠道、风控、资管、监管报送，外加证券集中交易与保险保单核心。共同点：极端可用性、两地三中心容灾、日终批量 —— 金融把基础设施的每个名词都推到极限。'},

  {id:3, name:'医疗健康', tag:'MED', apps: [
    {id:'his', name:'HIS 医院信息', tag:'HIS', color:'#1b232a',
     brands:{intl:'Oracle Cerner / Epic / MEDITECH / InterSystems / Altera',cn:'东软 / 卫宁健康 / 创业慧康 / 东华医为 / 智业软件'}, desc:'挂号、收费、住院、药房的主干系统。HIS 停一分钟全院停摆 —— 医疗行业对可用性的要求仅次于金融核心，门诊高峰的并发一点不小。'},
    {id:'emr', name:'EMR 电子病历', tag:'EMR', color:'#12384a',
     brands:{intl:'Epic / Oracle Cerner / MEDITECH / Altera / athenahealth',cn:'嘉和美康 / 东软 / 卫宁健康 / 创业慧康 / 曼荼罗'}, desc:'结构化病历、医嘱闭环、病历质控。电子病历分级评价（0-8 级）是医院信息化建设的指挥棒，过级评审牵动着全院几十个系统的改造。'},
    {id:'lis', name:'LIS 检验信息', tag:'LIS', color:'#14402e',
     brands:{intl:'Orchard / Clinisys / Sunquest / Roche / Siemens',cn:'东软 / 卫宁健康 / 创业慧康 / 瑞美 / 智方'}, desc:'检验申请、样本流转、仪器双向通讯与报告审核。全院上百台检验仪器通过串口/网络接入 LIS —— 它是全院接口数量最多的系统之一。'},
    {id:'pacs', name:'PACS 影像归档', tag:'PACS', color:'#20272e',
     brands:{intl:'GE Healthcare / Philips / Siemens / Fujifilm / Agfa',cn:'东软 / 卫宁健康 / 锐珂中国 / 蓝网科技 / 岱嘉医学'}, desc:'CT、MR、超声影像的存储、调阅与三维后处理。影像数据量大到离谱 —— 一家三甲一年几百 TB，冷热分层存储（在线 SSD + 离线蓝光/磁带）在这层是刚需。'},
    {id:'mi', name:'医保结算接口', tag:'医保', color:'#2b3a2c',
     brands:{intl:'Philips / GE / Siemens / Sectra / Intelerad',cn:'东软医疗 / 联影 / 卫宁健康 / 锐珂中国 / 蓝韵'}, desc:'医保贯标、DRG/DIP 付费分组、实时结算接口。医保目录一年一调，接口一月一改 —— 这是医院 IT 维护量最大、最不能出错的一条外部通道。'},
    {id:'rhp', name:'区域健康平台', tag:'RHIP', color:'#3a2a2a',
     brands:{intl:'Microsoft / Google Cloud / AWS / IBM / Oracle',cn:'阿里云 / 腾讯健康 / 华为云 / 卫宁健康 / 东软'}, desc:'区域全民健康信息平台：跨医院的病历共享、检验结果互认、双向转诊。患者换一家医院，数据跟着人走 —— 这是互联互通测评要解决的最后一公里。'}],
   desc:'HIS + EMR + LIS + PACS 四大主干，加医保接口与区域健康平台。电子病历分级评价与互联互通测评驱动建设路线；PACS 的影像数据是医院里增长最快的存储大户。'},

  {id:4, name:'政务', tag:'GOV', apps: [
    {id:'yztb', name:'一网通办门户', tag:'PORTAL', color:'#1b232a',
     brands:{intl:'ServiceNow / Salesforce / Microsoft / Oracle / SAP',cn:'太极股份 / 东软 / 浪潮软件 / 南威软件 / 数字政通'}, desc:'政务服务网与政务 APP：事项的申报、受理、审批、出证全程线上化。「最多跑一次」的工程实现，背后是几十个委办局系统的对接。'},
    {id:'share', name:'数据共享交换', tag:'SHARING', color:'#12384a',
     brands:{intl:'Snowflake / Databricks / AWS / Microsoft / Google',cn:'太极股份 / 东软 / 星环科技 / 华为云 / 阿里云'}, desc:'政务数据共享交换平台：人口、法人、空间地理、电子证照四大基础库在这层汇聚互通。「让数据多跑路，让群众少跑腿」说的就是这条链路。'},
    {id:'brain', name:'城市大脑', tag:'CITY', color:'#14402e',
     brands:{intl:'IBM / Siemens / Cisco / Microsoft / Huawei rival Ericsson',cn:'华为 / 阿里云 / 腾讯 / 百度 / 科大讯飞'}, desc:'城市运行「一网统管」：交通、城管、应急、环保的实时态势一张图。IoT 感知数据（摄像头、传感器、工单）经数据中台汇入，AI 算法做事件自动发现。'},
    {id:'grid', name:'网格化治理', tag:'GRID', color:'#20272e',
     brands:{intl:'Esri / Hexagon / Bentley / Trimble / Autodesk',cn:'超图软件 / 数字政通 / 武大吉奥 / 苍穹数码 / 中地数码'}, desc:'社区网格的事件上报、派遣、处置、核查闭环。网格员手机端上报的问题，自动分派到对应委办局的处置系统 —— 跨部门协同是它的核心难点。'},
    {id:'license', name:'电子证照与印章', tag:'LICENSE', color:'#2b3a2c',
     brands:{intl:'ServiceNow / Salesforce / Appian / Pega / OpenText',cn:'南威软件 / 太极股份 / 东软 / 浪潮软件 / 万达信息'}, desc:'电子证照库、电子印章与电子档案。证照电子化之后，办事免提交纸质材料 —— 它的权威数据源核验全靠共享交换平台。'},
    {id:'xc', name:'信创适配平台', tag:'信创', color:'#3a2a2a',
     brands:{intl:'Microsoft / IBM / Oracle / VMware / Red Hat',cn:'华为 / 中国电子 / 中国电科 / 麒麟软件 / 统信'}, desc:'政务是信创替代推进最快的行业：国产 CPU（鲲鹏/海光/飞腾）、OS（麒麟/统信）、数据库（达梦/金仓）、中间件（东方通/金蝶天燕）全面上位，适配迁移本身就是一套工程平台。'}],
   desc:'一网通办、数据共享交换、城市大脑、网格化治理、电子证照。政务行业信创替代推进最快 —— 国产 OS、数据库、中间件在这层全面上位，适配迁移是头等大事。'},

  {id:5, name:'零售与电商', tag:'RETAIL', apps: [
    {id:'ecom', name:'电商中台', tag:'EC', color:'#1b232a',
     brands:{intl:'Shopify / Adobe Magento / Salesforce / BigCommerce / SAP',cn:'有赞 / 微盟 / 宝尊 / 商派 / 千米网'}, desc:'商品、订单、库存、营销、会员五大中心组成的业务中台，支撑 App、小程序、门店多端共用一套后端 —— 大中台战略最经典的应用场景。'},
    {id:'oms', name:'OMS 订单管理', tag:'OMS', color:'#12384a',
     brands:{intl:'Manhattan / Blue Yonder / Oracle / SAP / Salesforce',cn:'聚水潭 / 旺店通 / 管易云 / 万里牛 / 网店管家'}, desc:'全渠道订单路由：线上订单就近门店发货、门店缺货转仓发货。订单履约的每一跳（拆单、寻源、派单）都在毫秒内决策。'},
    {id:'wms-r', name:'WMS 与 TMS', tag:'WMS/TMS', color:'#14402e',
     brands:{intl:'Manhattan / Blue Yonder / SAP / Oracle / Infor',cn:'富勒 / 科箭 / 通天晓 / 巨沃 / 唯智'}, desc:'仓储管理 + 运输调度：大促期间日均百万单的仓配体系，拣货路径优化、波次策略、快递路由都是算出来的。'},
    {id:'pos', name:'POS 门店收银', tag:'POS', color:'#20272e',
     brands:{intl:'Square / Lightspeed / Toast / Shopify POS / NCR',cn:'客如云 / 美团收银 / 二维火 / 哗啦啦 / 思迅软件'}, desc:'门店收银、会员识别、促销引擎。线下门店网络可能随时中断 —— POS 的离线收银与断网续传是零售系统特有的硬需求。'},
    {id:'member', name:'会员与营销', tag:'CRM/MKT', color:'#2b3a2c',
     brands:{intl:'Salesforce / SAP Emarsys / Braze / Klaviyo / HubSpot',cn:'有赞 / 微盟 / 群脉 / 创略科技 / 珍岛'}, desc:'会员等级、积分、优惠券、千人千面的推荐与精准营销。大促的优惠券预算、库存预扣、防薅羊毛风控都在这层联动。'},
    {id:'scm', name:'供应链计划', tag:'SCM', color:'#3a2a2a',
     brands:{intl:'Blue Yonder / Kinaxis / o9 / SAP / Oracle',cn:'用友 / 金蝶 / 京东物流科技 / 菜鸟 / 顺丰科技'}, desc:'需求预测、自动补货、采购协同。库存是零售企业最大的资金占用 —— 预测准一个百分点，省下的就是真金白银。'}],
   desc:'电商中台、OMS、WMS/TMS、POS、会员营销、供应链计划。大促是这套体系的期末考试：洪峰流量由网关限流、MQ 削峰、缓存扛读三层共同消化，订单路由与库存一致性是最难的两道题。'},

  {id:6, name:'能源与交通', tag:'ENERGY', apps: [
    {id:'ems', name:'EMS 电网调度', tag:'EMS', color:'#1b232a',
     brands:{intl:'GE / Siemens / ABB / Schneider / Hitachi Energy',cn:'南瑞集团 / 许继电气 / 国电南自 / 四方股份 / 东方电子'}, desc:'能量管理系统：电网实时监控、负荷预测、自动发电控制（AGC）。调度指令按秒下发，一次误操作影响的是一座城市的灯。'},
    {id:'dms', name:'DMS 配网管理', tag:'DMS', color:'#12384a',
     brands:{intl:'GE / Siemens / Schneider / Oracle / Hitachi Energy',cn:'南瑞集团 / 许继电气 / 国电南自 / 积成电子 / 恒华科技'}, desc:'配电自动化：馈线故障定位、隔离与自愈恢复。配网停电从「人工巡线几小时」变成「分钟级自动复电」，靠的就是这套系统。'},
    {id:'scada-e', name:'SCADA 集控', tag:'SCADA', color:'#14402e',
     brands:{intl:'Siemens / ABB / GE / Emerson / Honeywell',cn:'南瑞集团 / 许继电气 / 四方股份 / 亚控科技 / 力控'}, desc:'电厂、变电站、油气管道、水务厂站的集中监控。工控协议（IEC104、OPC UA、Modbus）从现场层一路接到数据中心，实时性按秒甚至毫秒计。'},
    {id:'meter', name:'计量与用采', tag:'AMI', color:'#20272e',
     brands:{intl:'Itron / Landis+Gyr / Sensus / Honeywell / Kamstrup',cn:'威胜集团 / 林洋能源 / 海兴电力 / 三星医疗 / 华立科技'}, desc:'智能电表的用电信息采集：亿级表计的日冻结数据、线损分析、窃电稽查。数据量是全行业最大的之一 —— 全国日新增数据以百亿条计。'},
    {id:'ticket', name:'票务与清分', tag:'AFC', color:'#2b3a2c',
     brands:{intl:'ServiceNow / IBM Maximo / SAP / Oracle / IFS',cn:'南瑞集团 / 朗坤智慧 / 用友 / 金现代 / 远光软件'}, desc:'轨道交通 AFC 自动售检票与多线路清分结算；公路 ETC 门架计费。早晚高峰的进出站并发，是城市级的实时交易系统。'},
    {id:'tms-t', name:'TMS 运输调度', tag:'TMS', color:'#3a2a2a',
     brands:{intl:'Oracle / SAP / Blue Yonder / Manhattan / Descartes',cn:'oTMS / 唯智 / 科箭 / 富勒 / 易流科技'}, desc:'物流运输的订单、配载、在途跟踪与结算；港口机场的 TOS 作业调度。车辆轨迹的 GPS 流数据实时入湖，晚点预测与路径优化都跑在上面。'}],
   desc:'EMS/DMS 电网调度、SCADA 集控、智能计量、票务清分与运输调度。工控协议从现场层直连数据中心，实时性按秒计 —— 公用事业的系统连着物理世界，可靠性要求仅次于金融核心。'},
];

/* 行业应用块的统一槽位：应用层后半排六个位置 */
const SLOTS = [[-99, 30, 26], [-66, 30, 26], [-33, 30, 26], [0, 30, 26], [33, 30, 26], [66, 30, 26]];

function partsFor(industryId) {
  const ind = INDUSTRIES[industryId] || INDUSTRIES[0];
  const apps = ind.apps.map((a, i) => ({
    ...a, layer: 6, shape: 'box', size: [28, 10, 22],
    pos: SLOTS[i].slice(), mat: 'silicon',
  }));
  return [...BASE, ...COMMON, ...apps];
}

const PARTS = partsFor(0);
const DIE_MODES = INDUSTRIES.map(({id, name, tag, desc}) => ({id, name, tag, desc}));

/* 应用层横向流转：通用系统与行业系统之间的业务数据流，按行业重组 */
const FLOWS = [
  [['erp', 'proj'], ['oa', 'portal'], ['crm', 'crm2'], ['fin', 'mail'], ['dm', 'ai'], ['bi', 'proj']],
  [['plm', 'erp'], ['erp', 'mes'], ['mes', 'qms'], ['wms', 'mes'], ['scada', 'mes'], ['aps', 'erp']],
  [['channel', 'core'], ['pay', 'core'], ['risk', 'channel'], ['wealth', 'core'], ['reg', 'core'], ['crm', 'channel']],
  [['his', 'emr'], ['his', 'lis'], ['emr', 'pacs'], ['his', 'mi'], ['rhp', 'emr'], ['bi', 'his']],
  [['yztb', 'share'], ['license', 'share'], ['share', 'brain'], ['grid', 'brain'], ['xc', 'yztb'], ['oa', 'yztb']],
  [['ecom', 'oms'], ['pos', 'ecom'], ['oms', 'wms-r'], ['member', 'ecom'], ['scm', 'wms-r'], ['crm', 'member']],
  [['ems', 'dms'], ['scada-e', 'ems'], ['meter', 'dms'], ['ticket', 'tms-t'], ['erp', 'meter'], ['bi', 'ems']],
];

/* ── 链路：调用与数据在软件四层之间的走向 ──────────────────────────── */
const cfg = {spread: 14, cutLo: -60, cutHi: 60, camDist: 410, shadow: 130};

function buildLinks({P, lay, LINKS, duplex}, industryId = 0) {
  for (const x of [-99, -66, -33, 0, 33, 66, 99]) {   // 硬件 → 基础软件，单向
    LINKS.push({n: 5, speed: 0.20, arc: 0.4, tint: 3,
      from: [x, -14, 0], to: [x, -6, 0], lf: lay('hw'), lt: lay('os')});
  }
  for (const x of [-108, -77, -46, -15, 15, 46, 77, 108]) {   // 基础 ↔ 中间件
    duplex({n: 5, speed: 0.26, arc: 0.4, tint: 0,
      from: [x * 0.92, 4, 0], to: [x, 10, 0], lf: lay('os'), lt: lay('web')});
  }
  for (const x of [-99, -66, -33, 0, 33, 66, 99]) {   // 中间件 ↔ 应用
    duplex({n: 6, speed: 0.28, arc: 0.6, tint: 2,
      from: [x * 1.09, 20, 0], to: [x, 25, 0], lf: lay('web'), lt: lay('app-slab')});
  }
  for (const [a, b] of FLOWS[industryId] || FLOWS[0]) {   // 应用层横向流转（按行业）
    const pa = P[a], pb = P[b];
    if (!pa || !pb) continue;
    duplex({n: 4, speed: 0.22, arc: 3.0, tint: 1,
      from: [pa.pos[0], 35.5, pa.pos[2]], to: [pb.pos[0], 35.5, pb.pos[2]],
      lf: lay(a), lt: lay(b)});
  }
}

const meta = {
  levelName: '软件',
  sub: '基础软件 · 中间件 · 行业应用',
  crumb: 'DC / SOFTWARE',
  stat: 'SOFTWARE STACK',
  dieTab: '行业视图',
};

export { PARTS, DIE_MODES, cfg, buildLinks, meta, partsFor };

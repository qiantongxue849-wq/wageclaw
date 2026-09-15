import type { WorkEvent } from "@/types";

export const dailyRageMilestones = [
  { id: "ripple-50", threshold: 50, title: "怨气涟漪 50", action: "ripple" },
  { id: "ricochet-100", threshold: 100, title: "怨气临界 100", action: "ricochet" },
  { id: "storm-150", threshold: 150, title: "怨气风暴 150", action: "storm" },
  { id: "blackout-200", threshold: 200, title: "黑屏结界 200", action: "blackout" },
  { id: "crack-260", threshold: 260, title: "怨念裂痕 260", action: "crack" },
  { id: "overdrive-320", threshold: 320, title: "怨气超载 320", action: "overdrive" },
  { id: "awaken-400", threshold: 400, title: "邪灵觉醒 400", action: "awaken" },
  { id: "nuke-500", threshold: 500, title: "怨气核爆 500", action: "nuke" }
];

export const workEvents: WorkEvent[] = [
  {
    id: "overtime-meeting",
    title: "老板通知今晚加班",
    prompt: "老板突然发来消息：“今晚都留下来把方案再过一遍。”软团看着下班倒计时，问你此刻最想怎么回。",
    tone: "边界感考试",
    choices: [
      { id: "accept", label: "A. 忍气吞声接受", detail: "人留在工位，怨气留在心里。", effect: { growth: 170, paw: -8, rage: 16, bloodPressure: 8, satiety: -4 } },
      { id: "polite-refuse", label: "B. 委婉拒绝", detail: "说明早有安排，明早第一时间跟进。", effect: { growth: 50, paw: 12, rage: 4, bloodPressure: -4 } },
      { id: "ignore", label: "C. 假装没看到", detail: "手机静音，先让消息在未读区冷静。", effect: { growth: 110, paw: 7, rage: 9, affection: 1 } },
      { id: "flip-table", label: "D. 强势拒绝并掀桌", detail: "边界直接拉满，软团当场进入暴走形态。", effect: { growth: 260, paw: -12, rage: 24, bloodPressure: 14, mana: -8 } }
    ]
  },
  {
    id: "coworker-blame",
    title: "同事甩锅",
    prompt: "同事说“这个锅你先背一下，之后请你喝奶茶”。软团已经把聊天框截图命名为证据一。",
    tone: "锅具鉴定",
    choices: [
      { id: "carry", label: "A. 默默接锅", detail: "嘴上说没事，心里已经开庭。", effect: { growth: 170, paw: -6, rage: 15, bloodPressure: 10 } },
      { id: "receipt", label: "B. 保存证据", detail: "先留记录，再礼貌同步责任边界。", effect: { growth: 50, paw: 10, rage: 3, bloodPressure: -2 } },
      { id: "clarify", label: "C. 群里确认分工", detail: "让锅回到它真正的主人手里。", effect: { growth: 110, paw: 9, rage: 7, affection: 2 } },
      { id: "return-pot", label: "D. 原锅奉还", detail: "把截图、时间线和责任人一次性甩回去。", effect: { growth: 260, paw: 13, rage: 22, bloodPressure: 6 } }
    ]
  },
  {
    id: "boss-pie",
    title: "老板画饼",
    prompt: "老板说“今年先苦一苦，明年你就是核心骨干”。软团问：骨干能不能写进合同。",
    tone: "大饼烘焙",
    choices: [
      { id: "believe", label: "A. 当场感动", detail: "先把饼咽下去，回工位继续燃烧。", effect: { growth: 170, paw: -5, rage: 13, bloodPressure: 7 } },
      { id: "contract", label: "B. 询问写进合同", detail: "把抽象激励翻译成具体条款。", effect: { growth: 50, paw: 14, rage: 2, bloodPressure: -5 } },
      { id: "screenshot", label: "C. 截图收藏", detail: "今日菜单：云端大饼，保留证据。", effect: { growth: 110, paw: 7, rage: 6 } },
      { id: "invoice", label: "D. 当场要求折现", detail: "不吃饼，只问加薪、奖金和到账日期。", effect: { growth: 260, paw: 15, rage: 21, bloodPressure: 5 } }
    ]
  },
  {
    id: "tea-room-break",
    title: "茶水间摸鱼",
    prompt: "茶水间没人，咖啡机还热着。软团的小工牌显示：合理补能不算逃跑。",
    tone: "补能窗口",
    choices: [
      { id: "roll", label: "A. 立刻回去继续卷", detail: "咖啡机热，血压也热。", effect: { growth: 170, paw: -4, rage: 11, bloodPressure: 5 } },
      { id: "micro-break", label: "B. 正常休息五分钟", detail: "短暂回血，继续做人。", effect: { growth: 50, paw: 8, mana: 8, bloodPressure: -2 } },
      { id: "patrol", label: "C. 假装路过三次", detail: "路线规划非常专业，情绪逐渐稳定。", effect: { growth: 110, paw: 10, affection: 2 } },
      { id: "long-break", label: "D. 带薪消失半小时", detail: "手机静音，软团替你在工位放了个残影。", effect: { growth: 260, paw: 6, rage: 18, mana: 12 } }
    ]
  },
  {
    id: "void-meeting",
    title: "无效会议",
    prompt: "会议已经开了四十分钟，没人知道要解决什么。软团把纪要标题写成《我们为什么在这里》。",
    tone: "会议逃生",
    choices: [
      { id: "notes", label: "A. 认真做完整纪要", detail: "很敬业，也很耗电。", effect: { growth: 170, paw: -3, rage: 12, mana: -8 } },
      { id: "ask-result", label: "B. 追问会议结论", detail: "把漂浮的话拽回地面。", effect: { growth: 50, paw: 11, rage: 3, bloodPressure: -3 } },
      { id: "cart", label: "C. 悄悄整理购物车", detail: "会议没结果，购物车至少有。", effect: { growth: 110, paw: 7, light: 3 } },
      { id: "leave-call", label: "D. 直接退出会议", detail: "留下一句“有结论再叫我”，然后消失。", effect: { growth: 260, paw: 9, rage: 20, bloodPressure: 4 } }
    ]
  },
  {
    id: "kpi-shift",
    title: "KPI 玄学调整",
    prompt: "KPI 又变了，这次叫“动态目标共创”。软团试图打开字典，字典选择了下班。",
    tone: "指标算命",
    choices: [
      { id: "self-blame", label: "A. 立刻自我反思", detail: "不是你的错，但你先把压力全收下了。", effect: { growth: 170, paw: -7, rage: 14, bloodPressure: 8 } },
      { id: "scope", label: "B. 问清考核口径", detail: "先定义清楚，别让玄学扣工资。", effect: { growth: 50, paw: 13, rage: 4, bloodPressure: -3 } },
      { id: "sheet", label: "C. 建表留痕", detail: "用表格封印每一次随机变化。", effect: { growth: 110, paw: 8, light: 4 } },
      { id: "reject-kpi", label: "D. 拒绝签收新指标", detail: "没有资源和书面确认，这口 KPI 不接。", effect: { growth: 260, paw: 14, rage: 23, bloodPressure: 6 } }
    ]
  },
  {
    id: "client-last-minute",
    title: "客户临时改口",
    prompt: "客户下班前说“其实我们想要的是另一版”。软团把需求文档抱紧，像抱着一块漂流木。",
    tone: "需求漂移",
    choices: [
      { id: "redo", label: "A. 今晚全部重做", detail: "软团的血压条开始闪。", effect: { growth: 170, paw: -10, rage: 17, bloodPressure: 12, satiety: -6 } },
      { id: "change-list", label: "B. 列变更清单", detail: "把临时想法变成可估算工作量。", effect: { growth: 50, paw: 12, rage: 5, bloodPressure: -2 } },
      { id: "minimum", label: "C. 只交最小版本", detail: "先让船靠岸，再谈豪华装修。", effect: { growth: 110, paw: 9, rage: 8, mana: -4 } },
      { id: "deadline-reset", label: "D. 要求重排工期", detail: "改需求可以，原截止时间当场作废。", effect: { growth: 260, paw: 14, rage: 24, bloodPressure: 5 } }
    ]
  },
  {
    id: "manager-praise",
    title: "口头表扬",
    prompt: "领导说你最近辛苦了，然后转身又塞来两个需求。软团怀疑这是一种免费燃料。",
    tone: "表扬折现",
    choices: [
      { id: "free-work", label: "A. 感谢后继续白干", detail: "表扬很轻，新增工作很重。", effect: { growth: 170, paw: -6, rage: 14, bloodPressure: 7 } },
      { id: "thanks-boundary", label: "B. 感谢并重新排期", detail: "礼貌收下，不立刻加塞。", effect: { growth: 50, paw: 9, affection: 2 } },
      { id: "resource", label: "C. 顺势要求资源", detail: "既然认可辛苦，那就补人补时间。", effect: { growth: 110, paw: 13, rage: 5, bloodPressure: -4 } },
      { id: "salary-talk", label: "D. 直接谈加薪", detail: "口头认可收到，现在谈谈怎么体现在工资上。", effect: { growth: 260, paw: 16, rage: 22, bloodPressure: 4 } }
    ]
  }
];


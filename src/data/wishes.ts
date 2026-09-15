import type { Part } from "@/types";

export const parts: Part[] = [
  { id: "shell", wishItemId: "macbook_pro_14", name: "一体成型外壳", ratio: 0.18, narrative: "先把体面攒出来。外壳稳住，里面的野心就有地方安放。" },
  { id: "screen", wishItemId: "macbook_pro_14", name: "Liquid Retina 屏幕", ratio: 0.26, narrative: "屏幕负责发光，也提醒你：你的生活不该只亮给工作看。" },
  { id: "battery", wishItemId: "macbook_pro_14", name: "电池模组", ratio: 0.12, narrative: "续航不是逞强，是允许自己撑得更久，也休得更早。" },
  { id: "memory", wishItemId: "macbook_pro_14", name: "内存与芯片", ratio: 0.22, narrative: "把被会议挤爆的脑容量，换成真正属于自己的算力。" },
  { id: "keyboard", wishItemId: "macbook_pro_14", name: "妙控键盘", ratio: 0.1, narrative: "以后敲下去的每个字，都先服务你自己的计划。" },
  { id: "trackpad", wishItemId: "macbook_pro_14", name: "触控板", ratio: 0.12, narrative: "从这一小块开始，手指落下去，目标就不再只是想想。" },

  { id: "iphone_frame", wishItemId: "iphone16_pro_max_1tb", name: "钛金属机身", ratio: 0.18, narrative: "先把上一代顶配的质感攒住。边框稳住，消息再多也不能把你压扁。" },
  { id: "iphone_screen", wishItemId: "iphone16_pro_max_1tb", name: "超视网膜屏幕", ratio: 0.2, narrative: "屏幕亮起来，提醒你：生活的清晰度，应该先属于自己。" },
  { id: "iphone_battery", wishItemId: "iphone16_pro_max_1tb", name: "长续航电池", ratio: 0.14, narrative: "续航不是硬撑，是给自己留够不用慌的余量。" },
  { id: "iphone_camera", wishItemId: "iphone16_pro_max_1tb", name: "方形三摄影像模组", ratio: 0.18, narrative: "把值得记住的瞬间留给自己，不只给工位截图和会议纪要。" },
  { id: "iphone_chip", wishItemId: "iphone16_pro_max_1tb", name: "芯片与主板", ratio: 0.16, narrative: "把脑内后台清一清，真正的性能应该服务你的计划。" },
  { id: "iphone_storage", wishItemId: "iphone16_pro_max_1tb", name: "1TB 存储", ratio: 0.14, narrative: "给照片、文件和未来都留空间。你的人生不该总提示容量不足。" },

  { id: "iphone17_frame", wishItemId: "iphone17_pro_max_1tb", name: "一体式铝金属机身", ratio: 0.18, narrative: "先把新的外壳点亮。你的底气可以换一副更轻、更亮、更像未来的样子。" },
  { id: "iphone17_screen", wishItemId: "iphone17_pro_max_1tb", name: "Pro 显示屏", ratio: 0.2, narrative: "屏幕亮起来，今天不只显示工作消息，也显示你正在认真靠近自己。" },
  { id: "iphone17_battery", wishItemId: "iphone17_pro_max_1tb", name: "长续航电池", ratio: 0.14, narrative: "电量一点点补上，像是在提醒你：真正的强大，也包括不被耗干。" },
  { id: "iphone17_camera_plateau", wishItemId: "iphone17_pro_max_1tb", name: "横向相机平台", ratio: 0.18, narrative: "新相机平台归位，把人生里值得放大的画面，交还给你自己。" },
  { id: "iphone17_chip", wishItemId: "iphone17_pro_max_1tb", name: "A 系芯片与主板", ratio: 0.16, narrative: "性能点亮，后台清空。你也可以把算力留给自己的计划和野心。" },
  { id: "iphone17_storage", wishItemId: "iphone17_pro_max_1tb", name: "1TB 存储", ratio: 0.14, narrative: "容量点亮，照片、灵感和未来都不用再被迫删掉。" },

  { id: "phuket_flight", wishItemId: "phuket_7_day_trip", name: "往返机票", ratio: 0.22, narrative: "第一步是离开工位。登机牌点亮，世界就从待办列表里走出来。" },
  { id: "phuket_resort", wishItemId: "phuket_7_day_trip", name: "海边酒店", ratio: 0.28, narrative: "床、海风和没有闹钟的早晨，都值得被认真预订。" },
  { id: "phuket_boat", wishItemId: "phuket_7_day_trip", name: "离岛快艇", ratio: 0.14, narrative: "让船把你带离消息提示音，去看真的蓝色。" },
  { id: "phuket_snorkel", wishItemId: "phuket_7_day_trip", name: "浮潜体验", ratio: 0.1, narrative: "把头埋进海里，暂时听不见需求，心就会自己浮上来。" },
  { id: "phuket_food", wishItemId: "phuket_7_day_trip", name: "海岛餐食", ratio: 0.1, narrative: "好好吃饭不是奖励，是恢复体力的正当流程。" },
  { id: "phuket_fund", wishItemId: "phuket_7_day_trip", name: "旅行备用金", ratio: 0.16, narrative: "有余量的旅行才叫休息。给自己一点不用精打细算的自由。" },

  { id: "chair_headrest", wishItemId: "ergonomic_chair", name: "可调头枕", ratio: 0.1, narrative: "先把脖子从低头赶工里赎回来。休息也需要支点。" },
  { id: "chair_backrest", wishItemId: "ergonomic_chair", name: "透气椅背", ratio: 0.24, narrative: "背不用一直替压力站岗。它也可以被稳稳托住。" },
  { id: "chair_lumbar", wishItemId: "ergonomic_chair", name: "动态腰托", ratio: 0.15, narrative: "腰托点亮，说明你开始把身体当成长期资产，而不是耗材。" },
  { id: "chair_cushion", wishItemId: "ergonomic_chair", name: "承托坐垫", ratio: 0.18, narrative: "坐下不是继续消耗，而是让每一小时少伤自己一点。" },
  { id: "chair_base", wishItemId: "ergonomic_chair", name: "金属底盘", ratio: 0.2, narrative: "底盘稳，节奏就稳。工作可以忙，但人不能散架。" },
  { id: "chair_caster", wishItemId: "ergonomic_chair", name: "静音脚轮", ratio: 0.13, narrative: "脚轮转动，代表你还有移动的余地，不必被一个工位钉住。" },

  { id: "robovac_robot", wishItemId: "robot_vacuum_mop", name: "扫拖主机", ratio: 0.28, narrative: "把下班后的第一场家务交出去。你回家应该先坐下。" },
  { id: "robovac_dock", wishItemId: "robot_vacuum_mop", name: "自清洁基站", ratio: 0.24, narrative: "会自己收尾的系统，才配叫解放双手。" },
  { id: "robovac_tank", wishItemId: "robot_vacuum_mop", name: "清水箱", ratio: 0.12, narrative: "水箱点亮，家里开始有自动变干净的可能。" },
  { id: "robovac_mop", wishItemId: "robot_vacuum_mop", name: "拖布模组", ratio: 0.12, narrative: "拖布不是你的第二份工作。让机器把地面慢慢擦亮。" },
  { id: "robovac_brush", wishItemId: "robot_vacuum_mop", name: "边刷组件", ratio: 0.08, narrative: "连角落都有人管了，你可以少管一点。" },
  { id: "robovac_bag", wishItemId: "robot_vacuum_mop", name: "尘袋滤芯", ratio: 0.16, narrative: "把灰尘和疲惫都收起来，别再让它们铺满晚上。" },

  { id: "ai_glasses_frame", wishItemId: "ai_glasses_commute_kit", name: "轻量镜框", ratio: 0.18, narrative: "先把未来感架在鼻梁上。通勤路上，也可以有一点属于自己的从容。" },
  { id: "ai_glasses_lenses", wishItemId: "ai_glasses_commute_kit", name: "通透镜片", ratio: 0.16, narrative: "镜片点亮，世界还是那个世界，但你终于不用只盯着工位消息。" },
  { id: "ai_glasses_camera_mic", wishItemId: "ai_glasses_commute_kit", name: "感知模组", ratio: 0.18, narrative: "摄像头和麦克风就位，把灵感随手收住，不再让好点子掉进地铁缝里。" },
  { id: "ai_glasses_speaker", wishItemId: "ai_glasses_commute_kit", name: "骨传导扬声器", ratio: 0.14, narrative: "声音贴着你走，不吵别人，也不让世界把你完全吞掉。" },
  { id: "ai_glasses_battery", wishItemId: "ai_glasses_commute_kit", name: "细长电池", ratio: 0.16, narrative: "电量不是硬撑，是给每天多留一段不慌不忙的余地。" },
  { id: "ai_glasses_case", wishItemId: "ai_glasses_commute_kit", name: "充电收纳盒", ratio: 0.18, narrative: "收进盒里，明天还能继续发光。连装备都知道下班要回血。" },

  { id: "handheld_console_screen", wishItemId: "handheld_console_kit", name: "掌机屏幕", ratio: 0.24, narrative: "屏幕亮起，不是继续看报表，而是把今天的精神领回自己手里。" },
  { id: "handheld_console_controllers", wishItemId: "handheld_console_kit", name: "左右手柄", ratio: 0.18, narrative: "手柄归位，手指终于不用只会敲键盘，也能掌控一点快乐。" },
  { id: "handheld_console_chip", wishItemId: "handheld_console_kit", name: "游戏芯片", ratio: 0.18, narrative: "性能点亮，把高帧率留给冒险，把卡顿留给没写完的周报。" },
  { id: "handheld_console_battery", wishItemId: "handheld_console_kit", name: "续航电池", ratio: 0.14, narrative: "电池补上，快乐不用刚开局就找插座。" },
  { id: "handheld_console_dock", wishItemId: "handheld_console_kit", name: "桌面底座", ratio: 0.12, narrative: "底座站稳，游戏从手心延伸到房间，今晚不被工位收编。" },
  { id: "handheld_console_pouch", wishItemId: "handheld_console_kit", name: "防护收纳包", ratio: 0.14, narrative: "把小宇宙装进包里，通勤、出差、周末都能偷偷回血。" },

  { id: "concert_weekend_ticket", wishItemId: "concert_weekend_pass", name: "演唱会门票", ratio: 0.32, narrative: "票根点亮，说明生活里终于有一晚不是为需求排期。" },
  { id: "concert_weekend_transit", wishItemId: "concert_weekend_pass", name: "往返交通", ratio: 0.16, narrative: "车票备好，身体先离开工位，心情才追得上音乐。" },
  { id: "concert_weekend_hotel", wishItemId: "concert_weekend_pass", name: "周末住宿", ratio: 0.18, narrative: "住处落定，散场后不用赶末班车，快乐可以慢慢降落。" },
  { id: "concert_weekend_lightstick", wishItemId: "concert_weekend_pass", name: "应援灯棒", ratio: 0.12, narrative: "灯亮起来，你也在人海里亮了一小下。" },
  { id: "concert_weekend_merch", wishItemId: "concert_weekend_pass", name: "周边托特包", ratio: 0.12, narrative: "把那晚的心跳装回日常，周一也能摸到一点现场余温。" },
  { id: "concert_weekend_voucher", wishItemId: "concert_weekend_pass", name: "餐饮备用金", ratio: 0.1, narrative: "快乐不能饿着肚子结算。先吃好，再大声唱。" },

  { id: "sleep_recovery_pillow", wishItemId: "sleep_recovery_kit", name: "智能承托枕", ratio: 0.22, narrative: "先把脖子接住。真正的自律，也包括认真睡觉。" },
  { id: "sleep_recovery_blanket", wishItemId: "sleep_recovery_kit", name: "冷感重力毯", ratio: 0.22, narrative: "毯子盖上去，像给过载的大脑按下静音键。" },
  { id: "sleep_recovery_mask", wishItemId: "sleep_recovery_kit", name: "遮光眼罩", ratio: 0.12, narrative: "把光线关掉一半，把世界也暂时调低音量。" },
  { id: "sleep_recovery_lamp", wishItemId: "sleep_recovery_kit", name: "白噪音小灯", ratio: 0.14, narrative: "柔光和白噪音就位，今晚不和焦虑硬碰硬。" },
  { id: "sleep_recovery_diffuser", wishItemId: "sleep_recovery_kit", name: "香氛扩香器", ratio: 0.14, narrative: "味道慢慢散开，房间开始像一个允许你松掉的地方。" },
  { id: "sleep_recovery_tracker", wishItemId: "sleep_recovery_kit", name: "睡眠记录器", ratio: 0.16, narrative: "把休息也认真记录下来，因为你的恢复同样值得被看见。" },

  { id: "toycraft_plush", wishItemId: "toycraft_mood_box", name: "毛绒挂件", ratio: 0.18, narrative: "小挂件先到岗，替你把今天的委屈软化一点。" },
  { id: "toycraft_board", wishItemId: "toycraft_mood_box", name: "拼豆手作板", ratio: 0.2, narrative: "一颗一颗拼上去，手忙起来，脑子就能暂时别加班。" },
  { id: "toycraft_display", wishItemId: "toycraft_mood_box", name: "透明展示盒", ratio: 0.16, narrative: "展示盒点亮，说明你的小快乐也配有正式位置。" },
  { id: "toycraft_stickers", wishItemId: "toycraft_mood_box", name: "贴纸包", ratio: 0.12, narrative: "贴纸不是幼稚，是给生活边角补一点可爱。" },
  { id: "toycraft_standee", wishItemId: "toycraft_mood_box", name: "亚克力立牌", ratio: 0.18, narrative: "立牌站起来，像一个小小的情绪护卫，替你看住桌面。" },
  { id: "toycraft_card", wishItemId: "toycraft_mood_box", name: "限定收藏卡", ratio: 0.16, narrative: "卡面收进来，今天终于不只收需求，也收一点喜欢。" }
];


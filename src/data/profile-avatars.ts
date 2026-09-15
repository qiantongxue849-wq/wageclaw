/** 主题档案头像与文案：设置页与首页工资卡共用。 */
import profileArcadeArt from "@/assets/profile-avatars/profile-arcade.png";
import profileCitrusArt from "@/assets/profile-avatars/profile-citrus.png";
import profileForestArt from "@/assets/profile-avatars/profile-forest.png";
import profileInkArt from "@/assets/profile-avatars/profile-ink.png";
import profileSakuraArt from "@/assets/profile-avatars/profile-sakura.png";
import type { Theme } from "@/types";

export const profileAvatarCopy: Record<Theme, { title: string; status: string; detail: string; image: string }> = {
  forest: {
    title: "林间工位牛马",
    status: "靠窗摸鱼中",
    detail: "一边装作认真盯屏，一边把下班倒计时藏进树影里。",
    image: profileForestArt
  },
  arcade: {
    title: "夜班低电量工位人",
    status: "电量告急中",
    detail: "霓虹还亮着，脑袋电池已经红了，代码和咖啡一起续命。",
    image: profileArcadeArt
  },
  sakura: {
    title: "便当困猫打工人",
    status: "午休失守中",
    detail: "便当摆好了，眼皮也快关机了，下午的待办还在排队。",
    image: profileSakuraArt
  },
  ink: {
    title: "公文墨团打工人",
    status: "纸海漂流中",
    detail: "公文堆到桌边，怨气凝成墨团，只剩一点体面撑着工牌。",
    image: profileInkArt
  },
  citrus: {
    title: "汽水卡皮打工人",
    status: "气泡续航中",
    detail: "靠一口柑橘汽水把魂拽回工位，表情平静但班味很重。",
    image: profileCitrusArt
  }
};

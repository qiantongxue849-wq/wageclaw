/**
 * 桌宠桌面演出：弹跳 / 风暴 / 核爆三段位移动画（定时器统一持有，退出前清理）。
 */
module.exports = function createPetMotion(ctx) {
  const { screen } = ctx;

  function clearPetMotionTimers() {
    clearInterval(ctx.timers.petRicochetTimer);
    clearInterval(ctx.timers.petStormTimer);
    clearInterval(ctx.timers.petNukeTimer);
    ctx.timers.petRicochetTimer = null;
    ctx.timers.petStormTimer = null;
    ctx.timers.petNukeTimer = null;
  }

  function triggerPetRicochet() {
    ctx.togglePetWindow(true);
    if (!ctx.petWindow || ctx.petWindow.isDestroyed()) return false;
    const { workArea } = screen.getPrimaryDisplay();
    const [width, height] = ctx.petWindow.getSize();
    const maxX = workArea.x + workArea.width - width - 12;
    const maxY = workArea.y + workArea.height - height - 12;
    const minX = workArea.x + 12;
    const minY = workArea.y + 12;
    const points = [
      [minX, minY + Math.round(workArea.height * 0.16)],
      [maxX, minY],
      [minX + Math.round(workArea.width * 0.22), maxY],
      [maxX, minY + Math.round(workArea.height * 0.48)],
      [minX, maxY - Math.round(workArea.height * 0.12)],
      [workArea.x + workArea.width - width - 24, workArea.y + workArea.height - height - 24]
    ];
    let index = 0;
    clearInterval(ctx.timers.petRicochetTimer);
    ctx.sendWhenReady(ctx.petWindow, "wageclaw:pet-command", { action: "ricochet", source: "desktop-ricochet" });
    ctx.timers.petRicochetTimer = setInterval(() => {
      const point = points[index];
      ctx.petWindow.setPosition(point[0], point[1], true);
      index += 1;
      if (index >= points.length) {
        clearInterval(ctx.timers.petRicochetTimer);
        ctx.timers.petRicochetTimer = null;
      }
    }, 180);
    return true;
  }

  function triggerPetStorm() {
    ctx.togglePetWindow(true);
    if (!ctx.petWindow || ctx.petWindow.isDestroyed()) return false;
    const { workArea } = screen.getPrimaryDisplay();
    const [width, height] = ctx.petWindow.getSize();
    const centerX = workArea.x + Math.round(workArea.width / 2 - width / 2);
    const centerY = workArea.y + Math.round(workArea.height / 2 - height / 2);
    let step = 0;
    const totalSteps = 36;
    clearInterval(ctx.timers.petStormTimer);
    ctx.sendWhenReady(ctx.petWindow, "wageclaw:pet-command", { action: "storm", source: "desktop-storm" });
    ctx.timers.petStormTimer = setInterval(() => {
      const angle = (step / totalSteps) * Math.PI * 6;
      const radius = 60 + Math.sin(step * 0.4) * 40;
      const x = centerX + Math.round(Math.cos(angle) * radius);
      const y = centerY + Math.round(Math.sin(angle) * radius);
      ctx.petWindow.setPosition(x, y, true);
      step += 1;
      if (step >= totalSteps) {
        clearInterval(ctx.timers.petStormTimer);
        ctx.timers.petStormTimer = null;
      }
    }, 100);
    return true;
  }

  function triggerPetNuke() {
    ctx.togglePetWindow(true);
    if (!ctx.petWindow || ctx.petWindow.isDestroyed()) return false;
    const { workArea } = screen.getPrimaryDisplay();
    const [width, height] = ctx.petWindow.getSize();
    const centerX = workArea.x + Math.round(workArea.width / 2 - width / 2);
    const centerY = workArea.y + Math.round(workArea.height / 2 - height / 2);
    let step = 0;
    const totalSteps = 48;
    clearInterval(ctx.timers.petNukeTimer);
    ctx.sendWhenReady(ctx.petWindow, "wageclaw:pet-command", { action: "nuke", source: "desktop-nuke" });
    ctx.timers.petNukeTimer = setInterval(() => {
      const progress = step / totalSteps;
      let x, y;
      if (progress < 0.15) {
        x = centerX + Math.round((Math.random() - 0.5) * 300);
        y = centerY + Math.round((Math.random() - 0.5) * 300);
      } else if (progress < 0.4) {
        const angle = progress * Math.PI * 12;
        const radius = 200 - progress * 300;
        x = centerX + Math.round(Math.cos(angle) * radius);
        y = centerY + Math.round(Math.sin(angle) * radius);
      } else {
        const angle = progress * Math.PI * 8;
        const radius = 40 + (1 - progress) * 80;
        x = centerX + Math.round(Math.cos(angle) * radius);
        y = centerY + Math.round(Math.sin(angle) * radius);
      }
      ctx.petWindow.setPosition(x, y, true);
      step += 1;
      if (step >= totalSteps) {
        clearInterval(ctx.timers.petNukeTimer);
        ctx.timers.petNukeTimer = null;
      }
    }, 80);
    return true;
  }

  return {
    clearPetMotionTimers,
    triggerPetRicochet,
    triggerPetStorm,
    triggerPetNuke
  };
};

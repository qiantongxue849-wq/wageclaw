// WageClaw small-window adapter. Upstream game mechanics are preserved.
const pocketGames={jumpman:['跳跃冒险','← → 移动 · 空格跳跃 · X 加速'],blastman:['炸弹迷宫','方向键移动 · 空格放炸弹'],powerwing:['雷霆战机','方向键移动 · Z 射击 · X 炸弹'],pucMan:['吃豆迷宫','方向键移动 · 吃光豆子，躲开幽灵'],speedway:['极速赛车','↑ 加速 · ↓ 刹车 · ← → 转向'],froggit:['青蛙过河','方向键移动 · 躲车，跳上浮木']};
const pocketKey=location.pathname.split('/').pop().split('.')[0];
const pocketGame=pocketGames[pocketKey];
const pocketTitle=createTitleMenu;
createTitleMenu=config=>pocketTitle({...config,title:pocketGame[0],titleFx:null,subtitle:pocketGame[1],playLabel:'开始游戏',itemsBefore:[],items:[],showBest:false,revealOnClick:false});
const pocketPause=createPauseMenu;
createPauseMenu=opts=>pocketPause({...opts,title:'暂停',resumeLabel:'继续',restartLabel:'重新开始',quitLabel:'回到开场',confirmQuit:false,extraItems:[]});
const pocketToolbar=installDefaultToolbar;
installDefaultToolbar=opts=>pocketToolbar({...opts,fullscreen:false});
const pocketInit=engineInit;
engineInit=(init,...rest)=>pocketInit(()=>{init();setMenuMuted(true);},...rest);

function pocketScale(){return mainCanvasSize.y/(mainCanvas.getBoundingClientRect().height||innerHeight);}
function pocketWidth(){return mainCanvasSize.x/pocketScale();}
function pocketHeight(){return mainCanvasSize.y/pocketScale();}
function pocketText(text,x,y,size=10,align='left',color=WHITE){const scale=pocketScale();drawTextScreen(text,vec2(x,y).scale(scale),size*scale,color,1*scale,BLACK,align,'Microsoft YaHei');}
function pocketBanner(title,subtitle=''){const s=pocketScale(),w=pocketWidth(),h=pocketHeight();drawRect(mainCanvasSize.scale(.5),vec2(Math.min(w-8,250)*s,65*s),rgb(0,0,0,.8),0,false,true);pocketText(title,w/2,h/2-8,18,'center');if(subtitle)pocketText(subtitle,w/2,h/2+15,10,'center');}

// Keep end-of-round dialogs readable without a large decorative icon.
showGameOverDialog=opts=>{opts=opts||{};if(typeof opts.score==='number'&&opts.submitBest!==false)submitBestScore(opts.score,{lowerIsBetter:!!opts.lowerIsBetter});showAlertDialog({title:opts.won?'过关了！':'游戏结束',titleFx:null,icon:null,message:typeof opts.score==='number'?'本局得分 '+opts.score:'再来一局吧。',okLabel:'回到开场',onOk:opts.onContinue||(()=>quitToTitle())});};

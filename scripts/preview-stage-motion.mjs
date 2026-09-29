// A review artifact made from the same packed drawings and registration as the app.
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const meta = JSON.parse(await readFile('src/assets/pet-motion/stages/frames.json'));
const types = ['capybara','cat','dog','cow','blob'], levels = [2,10], side = 180;
const output = 'design/pet-motion/stages';
await mkdir(output,{recursive:true});
const drawings = {};
for (const type of types) for (const level of levels) {
  const name = `${type}-${level}`, pack = meta[name]; drawings[name] = [];
  for (const f of pack.frames) {
    const w = Math.round(f.sw*pack.scale), h = Math.round(f.sh*pack.scale);
    let left = Math.round(pack.originX-f.anchor*pack.scale), top = Math.round(pack.originY-f.ground*pack.scale);
    const image = await sharp(`src/assets/pet-motion/stages/${name}.webp`).extract({left:f.sx,top:f.sy,width:f.sw,height:f.sh}).resize(w,h).png().toBuffer();
    const cutLeft=Math.max(0,-left),cutTop=Math.max(0,-top),cutWidth=Math.min(w-cutLeft,288-Math.max(0,left)),cutHeight=Math.min(h-cutTop,288-Math.max(0,top));
    const visible = await sharp(image).extract({left:cutLeft,top:cutTop,width:cutWidth,height:cutHeight}).png().toBuffer();
    const canvas = await sharp({create:{width:288,height:288,channels:4,background:'#f6f3e9'}}).composite([{input:visible,left:Math.max(0,left),top:Math.max(0,top)}]).png().toBuffer();
    drawings[name].push(await sharp(canvas).resize(side,side).png().toBuffer());
  }
}
const poses=[], delays=[];
for (const base of [0,8,16]) {
  poses.push(0);delays.push(650);
  for(let i=1;i<=7;i++){poses.push(base+i);delays.push(i===7?400:110);}
  for(let i=6;i>=1;i--){poses.push(base+i);delays.push(125);}
  poses.push(0);delays.push(300);
}
const width=side*5,height=side*2+32,frames=[];
for(const pose of poses){
 const inputs=[];
 levels.forEach((level,row)=>types.forEach((type,col)=>inputs.push({input:drawings[`${type}-${level}`][pose],left:col*side,top:row*side+32})));
 const label=Buffer.from(`<svg width="${width}" height="32"><rect width="100%" height="100%" fill="#f6f3e9"/><text x="20" y="23" font-family="sans-serif" font-size="15" fill="#345">Redrawn poses · Level 2 / Level 10 · Capybara / Cat / Dog / Cow / Blob</text></svg>`);
 inputs.push({input:label,left:0,top:0});
 frames.push(await sharp({create:{width,height,channels:4,background:'#f6f3e9'}}).composite(inputs).raw().toBuffer());
}
await sharp(Buffer.concat(frames),{raw:{width,height:height*frames.length,channels:4,pageHeight:height}}).gif({loop:0,delay:delays,colours:256,dither:0}).toFile(`${output}/authored-motion.gif`);
await sharp(frames[7],{raw:{width,height,channels:4}}).png().toFile(`${output}/authored-motion.png`);
await writeFile(`${output}/preview.json`,JSON.stringify({levels,poses,delays}));
console.log('Saved authored-motion.gif and representative still.');

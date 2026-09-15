/**
 * 图片体积优化管线（一次性工具，也可重复执行）
 *
 * 原地压缩 src/assets 下的位图资源。
 * - maxWidth 模式不改变文件名与格式，代码零改动
 * - toWebp 模式把 png 转成同名 .webp 并删除原 png，需要同步更新代码里的 import 后缀
 *
 * 还原方式：git checkout -- src/assets
 *
 * 用法：
 *   node scripts/optimize-images.mjs            # 实际执行
 *   node scripts/optimize-images.mjs --dry-run  # 只打印计划，不写文件
 */
import sharp from "sharp";
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_SMALLER_THAN = 100 * 1024; // 默认跳过小于 100KB 的文件，规则可用 skipSmallerThan 覆盖

// 每个目录的处理规则
// - petActions: 桌宠动作精灵图（webp 网格帧，play 12 列 / sleep 18 列 × 10 行），按帧高压缩等比缩放
// - sheets: 桌宠 idle 精灵图（png，10 帧横排），帧宽压到 288px
// - maxWidth: 通用限制最大宽度 + png 调色板量化（展示尺寸都很小）
// - toWebp: png 转 webp（实拍/插画类图 q85 肉眼无差、体积减半以上）
const RULES = [
  // 帧高 192（悬浮窗 136px / hero 196px 显示，1.4x 余量），q50 经并排对比肉眼无差；
  // 实测 q42 仅再省 ~6%，画质风险不值，已到压缩地板
  { dir: "src/assets/pet-actions", mode: "petActions", frameHeight: 192, webpQuality: 50, cols: { play: 12, sleep: 18 } },
  { dir: "src/assets/pet-sheets", mode: "sheets", frameWidth: 288, cols: 10 },
  { dir: "src/assets/ui-art", mode: "maxWidth", width: 1280, palette: true, quality: 88 },
  { dir: "src/assets/wishlist", mode: "toWebp", width: 640, webpQuality: 85, skipSmallerThan: 8 * 1024 },
  { dir: "src/assets/pet-stages", mode: "toWebp", webpQuality: 85 },
  { dir: "src/assets/supplies", mode: "maxWidth", width: 512, palette: true, quality: 90, recompress: true },
  { dir: "src/assets/profile-avatars", mode: "maxWidth", width: 512, palette: true, quality: 90 },
  { dir: "src/assets/pet-previews", mode: "maxWidth", width: 640, palette: true, quality: 90 },
  { dir: "src/assets/pet-ui", mode: "maxWidth", width: 512, palette: true, quality: 90 },
  { dir: "src/assets/settings-icons", mode: "maxWidth", width: 160, palette: true, quality: 90, recompress: true, skipSmallerThan: 0 }
];

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

async function processImage(filePath, rule) {
  const input = readFileSync(filePath);
  const meta = await sharp(input).metadata();
  let pipeline = sharp(input);
  let target;

  if (rule.mode === "petActions") {
    const key = Object.keys(rule.cols).find((k) => filePath.includes(k));
    if (!key) return null;
    const rows = 10;
    // 目标 sheet 高 = 帧高 × 行数；宽度随等比缩放，并取列数的整数倍，保证网格帧不错位
    const scale = (rule.frameHeight * rows) / meta.height;
    if (scale >= 1) return null; // 已处理过（不会放大）
    const width = Math.max(rule.cols[key], Math.round((meta.width * scale) / rule.cols[key]) * rule.cols[key]);
    target = { width, height: rule.frameHeight * rows };
    pipeline = pipeline.resize({ width: target.width, height: target.height, fit: "fill" }).webp({ quality: rule.webpQuality });
  } else if (rule.mode === "sheets") {
    const width = rule.frameWidth * rule.cols;
    if (meta.width <= width) return null; // 已处理过（不会放大）
    target = { width, height: rule.frameWidth };
    pipeline = pipeline.resize({ width, height: target.height, fit: "fill" }).png({ compressionLevel: 9, palette: true, quality: 92 });
  } else if (rule.mode === "toWebp") {
    if (!/\.png$/i.test(filePath)) return null; // 已是 webp，跳过
    const needsResize = rule.width ? meta.width > rule.width : false;
    pipeline = pipeline.resize(needsResize ? { width: rule.width } : {}).webp({ quality: rule.webpQuality, effort: 6 });
    const output = await pipeline.toBuffer();
    if (output.length >= input.length) return null; // 没变小就不转
    return { input: input.length, output: output.length, data: output, target: {}, convert: filePath.replace(/\.png$/i, ".webp") };
  } else {
    const needsResize = meta.width > rule.width;
    if (!needsResize && !rule.recompress) return null;
    target = needsResize ? { width: rule.width } : {};
    pipeline = pipeline.resize(target).png({ compressionLevel: 9, palette: rule.palette, quality: rule.quality });
  }

  const output = await pipeline.toBuffer();
  if (output.length >= input.length) return null; // 没变小就不写
  return { input: input.length, output: output.length, data: output, target };
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;
  let changed = 0;
  let skipped = 0;

  for (const rule of RULES) {
    const dir = join(ROOT, rule.dir);
    let files;
    try {
      files = readdirSync(dir);
    } catch {
      console.log(`跳过（目录不存在）: ${rule.dir}`);
      continue;
    }

    let dirBefore = 0;
    let dirAfter = 0;
    for (const file of files) {
      if (!/\.(png|webp|jpg|jpeg)$/i.test(file)) continue;
      const filePath = join(dir, file);
      if (statSync(filePath).size < (rule.skipSmallerThan ?? SKIP_SMALLER_THAN)) {
        skipped += 1;
        continue;
      }
      const result = await processImage(filePath, rule);
      const before = statSync(filePath).size;
      dirBefore += before;
      if (result) {
        if (!DRY_RUN) {
          writeFileSync(result.convert ?? filePath, result.data);
          if (result.convert) unlinkSync(filePath); // 格式转换：删掉原 png
        }
        dirAfter += result.output;
        changed += 1;
        console.log(
          `${DRY_RUN ? "[计划] " : "[完成] "}${rule.dir}/${result.convert ? `${file} -> ${result.convert.split(/[\\/]/).pop()}` : file}: ${formatKB(result.input)} -> ${formatKB(result.output)}`
        );
      } else {
        dirAfter += before;
        skipped += 1;
      }
    }
    totalBefore += dirBefore;
    totalAfter += dirAfter;
    console.log(
      `── ${rule.dir}: ${formatKB(dirBefore)} -> ${formatKB(dirAfter)}（省 ${formatKB(Math.max(0, dirBefore - dirAfter))}）\n`
    );
  }

  console.log(
    `合计: ${formatKB(totalBefore)} -> ${formatKB(totalAfter)}，节省 ${formatKB(Math.max(0, totalBefore - totalAfter))}` +
      `（处理 ${changed} 个，跳过 ${skipped} 个${DRY_RUN ? "，DRY RUN 未写入" : ""}）`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

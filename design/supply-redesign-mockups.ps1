Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$scriptPath = $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($scriptPath)) {
  $root = (Get-Location).Path
} else {
  $root = Split-Path -Parent (Split-Path -Parent $scriptPath)
}
$outDir = Join-Path $root "design"
$assetRoot = Join-Path $root "src\assets"

function C([string]$hex, [int]$alpha = 255) {
  $h = $hex.TrimStart("#")
  if ($h.Length -eq 3) {
    $h = -join ($h.ToCharArray() | ForEach-Object { "$_$_" })
  }
  return [System.Drawing.Color]::FromArgb($alpha, [Convert]::ToInt32($h.Substring(0, 2), 16), [Convert]::ToInt32($h.Substring(2, 2), 16), [Convert]::ToInt32($h.Substring(4, 2), 16))
}

function New-Font([float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
  return New-Object System.Drawing.Font("Microsoft YaHei UI", $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Path-RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function Fill-RoundRect($g, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r, [System.Drawing.Color]$fill, [System.Drawing.Color]$stroke = [System.Drawing.Color]::Transparent, [float]$sw = 1) {
  if ($r -le 0) {
    $brush = New-Object System.Drawing.SolidBrush($fill)
    $g.FillRectangle($brush, $x, $y, $w, $h)
    $brush.Dispose()
    if ($stroke.A -gt 0) {
      $pen = New-Object System.Drawing.Pen($stroke, $sw)
      $g.DrawRectangle($pen, $x, $y, $w, $h)
      $pen.Dispose()
    }
    return
  }
  $path = Path-RoundRect $x $y $w $h $r
  $brush = New-Object System.Drawing.SolidBrush($fill)
  $g.FillPath($brush, $path)
  $brush.Dispose()
  if ($stroke.A -gt 0) {
    $pen = New-Object System.Drawing.Pen($stroke, $sw)
    $g.DrawPath($pen, $path)
    $pen.Dispose()
  }
  $path.Dispose()
}

function Draw-Text($g, [string]$text, [float]$x, [float]$y, [float]$w, [float]$h, [float]$size, [string]$color = "#251f1a", [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular, [string]$align = "Near", [string]$valign = "Near") {
  $font = New-Font $size $style
  $brush = New-Object System.Drawing.SolidBrush((C $color))
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::$align
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::$valign
  $fmt.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  $fmt.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit
  $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  $g.DrawString($text, $font, $brush, $rect, $fmt)
  $fmt.Dispose()
  $brush.Dispose()
  $font.Dispose()
}

function Draw-Line($g, [float]$x1, [float]$y1, [float]$x2, [float]$y2, [string]$color, [float]$width = 1) {
  $pen = New-Object System.Drawing.Pen((C $color), $width)
  $g.DrawLine($pen, $x1, $y1, $x2, $y2)
  $pen.Dispose()
}

function Draw-ImageFit($g, [string]$path, [float]$x, [float]$y, [float]$w, [float]$h) {
  if (-not (Test-Path $path)) { return }
  $img = [System.Drawing.Image]::FromFile($path)
  $scale = [Math]::Min($w / $img.Width, $h / $img.Height)
  $dw = $img.Width * $scale
  $dh = $img.Height * $scale
  $dx = $x + ($w - $dw) / 2
  $dy = $y + ($h - $dh) / 2
  $g.DrawImage($img, $dx, $dy, $dw, $dh)
  $img.Dispose()
}

function Draw-GridBackground($g, [int]$w, [int]$h) {
  $g.Clear((C "#f3ead8"))
  $pen = New-Object System.Drawing.Pen((C "#d8ccb4" 95), 1)
  for ($x = 260; $x -lt $w; $x += 38) { $g.DrawLine($pen, $x, 0, $x, $h) }
  for ($y = 28; $y -lt $h; $y += 38) { $g.DrawLine($pen, 260, $y, $w, $y) }
  $pen.Dispose()
}

function Draw-AppShell($g, [string]$title, [string]$subtitle) {
  Fill-RoundRect $g 0 0 1440 900 0 (C "#efe7d2")
  Draw-GridBackground $g 1440 900
  Fill-RoundRect $g 0 0 292 900 0 (C "#102d25")
  $sideGlow = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, 292, 900)),
    (C "#285f45" 80),
    (C "#082019" 255),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  $g.FillRectangle($sideGlow, 0, 0, 292, 900)
  $sideGlow.Dispose()

  Fill-RoundRect $g 26 36 58 58 16 (C "#7ba36e")
  Draw-Text $g "爪" 39 47 34 34 28 "#fff9e8" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
  Draw-Text $g "忍了吧" 102 39 150 36 26 "#f7eed8" ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "WageClaw · 怨气管理器" 102 77 166 24 14 "#c9c1aa"

  $nav = @(
    @("忍了吧", "余额、心愿、账本", $false),
    @("补给仓", "商城、背包、使用记录", $true),
    @("怨气桌宠", "桌宠、投喂、对练", $false),
    @("设置", "资料、主题、数据", $false)
  )
  $ny = 222
  foreach ($n in $nav) {
    if ($n[2]) {
      Fill-RoundRect $g 22 $ny 248 72 12 (C "#ecdfc4" 36) (C "#d7c5a5" 50)
      Fill-RoundRect $g 22 $ny 4 72 2 (C "#e4b75f")
    }
    Fill-RoundRect $g 40 ($ny + 16) 38 38 10 (C "#f7f1df" 20) (C "#eee2c4" 110)
    Draw-Text $g ($n[0].Substring(0,1)) 48 ($ny + 22) 22 22 20 "#f5ead1" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
    Draw-Text $g $n[0] 96 ($ny + 12) 140 30 24 "#f7eed8" ([System.Drawing.FontStyle]::Bold)
    Draw-Text $g $n[1] 96 ($ny + 44) 150 22 14 "#cfc4a9"
    $ny += 92
  }

  Fill-RoundRect $g 26 690 238 156 12 (C "#f6edda" 22) (C "#eee1c8" 42)
  Draw-Text $g "今日可领" 44 712 100 30 20 "#cfc4aa" ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "¥0.00" 44 755 130 44 34 "#fff7e3" ([System.Drawing.FontStyle]::Bold)
  Fill-RoundRect $g 44 810 194 40 9 (C "#2d7b66")
  Draw-Text $g "领取 ¥0.00" 44 816 194 28 18 "#fffdf0" ([System.Drawing.FontStyle]::Bold) "Center" "Center"

  Fill-RoundRect $g 292 0 1148 900 0 (C "#f1e7d0")
  Draw-Text $g $title 328 38 360 44 28 "#271f18" ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g $subtitle 328 80 620 26 15 "#736a5c"
}

function Draw-TopSwitch($g, [array]$tabs, [int]$active, [float]$x = 328, [float]$y = 122, [float]$w = 1032) {
  Fill-RoundRect $g $x $y $w 62 13 (C "#fff8e9" 210) (C "#d7c8aa")
  $tabW = ($w - 24) / $tabs.Count
  for ($i = 0; $i -lt $tabs.Count; $i++) {
    $tx = $x + 12 + $i * $tabW
    if ($i -eq $active) {
      Fill-RoundRect $g $tx ($y + 10) ($tabW - 8) 42 10 (C "#255c4d")
      Draw-Text $g $tabs[$i] $tx ($y + 17) ($tabW - 8) 24 17 "#fff8e8" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
    } else {
      Draw-Text $g $tabs[$i] $tx ($y + 17) ($tabW - 8) 24 17 "#756958" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
    }
  }
}

function Draw-StatPill($g, [string]$label, [string]$value, [float]$x, [float]$y, [float]$w) {
  Fill-RoundRect $g $x $y $w 50 10 (C "#fff7e7" 210) (C "#d9c8a9")
  Draw-Text $g $label ($x + 14) ($y + 7) ($w - 28) 18 12 "#817564" ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g $value ($x + 14) ($y + 24) ($w - 28) 23 15 "#2d251e" ([System.Drawing.FontStyle]::Bold)
}

function Draw-ProductCard($g, [string]$name, [string]$tag, [string]$price, [string]$desc, [string]$image, [float]$x, [float]$y, [float]$w, [float]$h, [string]$accent = "#255c4d") {
  Fill-RoundRect $g $x $y $w $h 12 (C "#fff8e9" 226) (C "#d8c8aa")
  Fill-RoundRect $g ($x + 12) ($y + 12) ($w - 24) 128 10 (C "#efe4ca") (C "#d9c8aa")
  Draw-ImageFit $g $image ($x + 28) ($y + 20) ($w - 56) 112
  Fill-RoundRect $g ($x + 22) ($y + 22) 76 26 8 (C "#fff8e9" 230)
  Draw-Text $g $tag ($x + 22) ($y + 27) 76 16 11 "#6d604f" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
  Draw-Text $g $name ($x + 16) ($y + 154) ($w - 32) 26 17 "#2a221b" ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g $desc ($x + 16) ($y + 184) ($w - 32) 44 12 "#786f60"
  Draw-Text $g $price ($x + 16) ($y + $h - 48) 112 28 18 $accent ([System.Drawing.FontStyle]::Bold)
  Fill-RoundRect $g ($x + $w - 96) ($y + $h - 48) 78 32 8 (C $accent)
  Draw-Text $g "许愿" ($x + $w - 96) ($y + $h - 42) 78 20 14 "#fff8e9" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
}

function Draw-SupplyCard($g, [string]$name, [string]$tag, [string]$price, [string]$icon, [string]$effect, [float]$x, [float]$y, [float]$w, [float]$h) {
  Fill-RoundRect $g $x $y $w $h 11 (C "#fff9ec" 230) (C "#d9c9ab")
  Fill-RoundRect $g ($x + 14) ($y + 14) 58 58 12 (C "#dfeadf") (C "#b9c9b2")
  Draw-Text $g $icon ($x + 14) ($y + 14) 58 58 24 "#2a221b" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
  Draw-Text $g $name ($x + 84) ($y + 15) ($w - 98) 24 16 "#2a221b" ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g $tag ($x + 84) ($y + 43) 70 20 12 "#7c705f"
  Draw-Text $g $effect ($x + 14) ($y + 83) ($w - 28) 34 12 "#766b5b"
  Draw-Text $g $price ($x + 14) ($y + $h - 36) 96 22 15 "#bc7040" ([System.Drawing.FontStyle]::Bold)
  Fill-RoundRect $g ($x + $w - 82) ($y + $h - 42) 66 30 8 (C "#c47545")
  Draw-Text $g "兑换" ($x + $w - 82) ($y + $h - 36) 66 18 13 "#fff8e9" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
}

function Draw-Slot($g, [string]$icon, [string]$name, [string]$count, [float]$x, [float]$y, [float]$size, [bool]$active = $false) {
  $fill = if ($active) { "#f4dfb7" } else { "#fff8e9" }
  $stroke = if ($active) { "#c88c44" } else { "#d7c6a8" }
  Fill-RoundRect $g $x $y $size $size 10 (C $fill 232) (C $stroke)
  Draw-Text $g $icon ($x + 8) ($y + 20) ($size - 16) 48 26 "#30271f" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
  Draw-Text $g $name ($x + 9) ($y + $size - 37) ($size - 18) 18 11 "#4b4034" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
  Draw-Text $g $count ($x + $size - 36) ($y + 8) 26 18 12 "#7e705e" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
}

function New-Canvas {
  $bmp = New-Object System.Drawing.Bitmap(1440, 900)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return @{ Bitmap = $bmp; Graphics = $g }
}

function Save-Canvas($canvas, [string]$name) {
  $path = Join-Path $outDir $name
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

$macbook = Join-Path $assetRoot "wishlist\macbook-full-card.png"
$iphone = Join-Path $assetRoot "wishlist\iphone17-full.png"
$chair = Join-Path $assetRoot "wishlist\ergochair-full.png"
$robot = Join-Path $assetRoot "wishlist\robovac-full.png"
$supply = Join-Path $assetRoot "ui-art\supply-cache.png"

$canvas = New-Canvas
$g = $canvas.Graphics
Draw-AppShell $g "补给仓 · 四分区货架" "去掉大头图后，界面直接进入功能模块：心愿商城、供销社、背包、心愿实现。"
Draw-TopSwitch $g @("心愿商城", "供销社", "背包", "心愿实现") 0
Draw-StatPill $g "工资余额" "¥495.20" 1040 42 130
Draw-StatPill $g "怨气余额" "359 怨气" 1185 42 130
Draw-Text $g "方案 A：四模块横向切换，适合你要的「心愿系统」和「日常桌宠商品」强区分。" 328 196 820 26 16 "#5f5548"
Draw-ProductCard $g "MacBook Pro 14" "实体心愿" "¥15000" "设为唯一心愿后，工资余额只推进它的拆分进度。" $macbook 328 238 314 300 "#255c4d"
Draw-ProductCard $g "苹果 17 Pro Max 1TB" "实体心愿" "¥13999" "手机心愿拆成机身、屏幕、电池、影像和存储逐步点亮。" $iphone 664 238 314 300 "#255c4d"
Draw-ProductCard $g "人体工学椅" "健康心愿" "¥6499" "给长期久坐的身体一个交代，完成后进入心愿实现。" $chair 1000 238 314 300 "#255c4d"
Fill-RoundRect $g 328 570 650 244 12 (C "#fff8e9" 226) (C "#d8c8aa")
Draw-Text $g "当前心愿拆分预览" 352 592 260 28 20 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "工资余额只影响这里；供销社商品完全走怨气余额，不混账。" 352 626 400 24 13 "#766b5b"
Draw-Line $g 352 666 934 666 "#d8c8aa" 1
$parts = @("外壳","屏幕","电池","芯片","键盘","触控板")
for ($i = 0; $i -lt 6; $i++) {
  $px = 352 + ($i % 3) * 190
  $py = 690 + [Math]::Floor($i / 3) * 54
  Fill-RoundRect $g $px $py 166 38 8 (C "#f1ead8") (C "#d7c8aa")
  Draw-Text $g $parts[$i] ($px + 12) ($py + 9) 90 18 13 "#4a4035" ([System.Drawing.FontStyle]::Bold)
  Draw-Text $g "$(18 + $i * 7)%" ($px + 114) ($py + 9) 40 18 12 "#2d6b55" ([System.Drawing.FontStyle]::Bold) "Far"
}
Fill-RoundRect $g 1000 570 314 244 12 (C "#f4ead5" 228) (C "#d8c8aa")
Draw-Text $g "轻状态条" 1024 592 120 24 18 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "原来头部里的资源信息收进右上角和小状态卡，不再压住商品。" 1024 626 246 50 13 "#766b5b"
Draw-ImageFit $g $supply 1030 680 246 104
Save-Canvas $canvas "supply-redesign-option-a.png"

$canvas = New-Canvas
$g = $canvas.Graphics
Draw-AppShell $g "补给仓 · 商城 / 背包双仓" "顶层只保留商城和背包，商城内部再拆心愿商城与供销社；背包内部再拆物品与心愿实现。"
Draw-TopSwitch $g @("商城", "背包") 0 328 122 540
Draw-TopSwitch $g @("心愿商城", "供销社") 1 900 122 460
Draw-Text $g "方案 B：最贴近你说的「商城和背包来回切换」，但仍能在商城里清楚分出心愿和供销社。" 328 196 870 26 16 "#5f5548"
Fill-RoundRect $g 328 236 318 578 14 (C "#fff8e9" 226) (C "#d8c8aa")
Draw-Text $g "心愿商城" 352 262 160 28 22 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "工资兑换的实体目标" 352 298 180 20 13 "#7b705f"
Draw-ProductCard $g "MacBook Pro 14" "实体心愿" "¥15000" "设为唯一心愿，进入拆分台。" $macbook 352 336 246 250 "#255c4d"
Fill-RoundRect $g 352 608 246 156 12 (C "#fff8e9" 226) (C "#d8c8aa")
Draw-ImageFit $g $robot 366 620 88 74
Draw-Text $g "扫拖机器人旗舰套装" 470 626 110 42 16 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "家务解放 · ¥5999" 470 676 108 22 13 "#255c4d" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "下班后的地面交给机器。" 372 718 132 22 12 "#766b5b"
Fill-RoundRect $g 512 714 66 30 8 (C "#255c4d")
Draw-Text $g "许愿" 512 720 66 18 13 "#fff8e9" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
Fill-RoundRect $g 674 236 410 578 14 (C "#fff8e9" 226) (C "#d8c8aa")
Draw-Text $g "供销社" 698 262 160 28 22 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "桌宠吃喝、恢复、训练，全走怨气余额。" 698 298 290 22 13 "#7b705f"
Draw-SupplyCard $g "板面" "主食" "18 怨气" "面" "饱食 +28，饥饿 -35" 698 336 170 144
Draw-SupplyCard $g "奶油蛋糕" "甜点" "25 怨气" "糕" "饱食 +22，亲密 +8" 888 336 170 144
Draw-SupplyCard $g "热包子" "主食" "12 怨气" "包" "饱食 +20，饥饿 -20" 698 502 170 144
Draw-SupplyCard $g "能量罐头" "恢复" "32 怨气" "罐" "体力 +30，心情 +5" 888 502 170 144
Fill-RoundRect $g 698 668 360 120 12 (C "#f4ead5" 228) (C "#d8c8aa")
Draw-Text $g "供销社分类" 720 690 130 24 18 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "主食、甜点、恢复、玩具、道具可以做成小筛选；卡片不用再和心愿商品混排。" 720 722 284 44 13 "#766b5b"
Fill-RoundRect $g 1000 726 42 34 8 (C "#c47545")
Draw-Text $g "筛选" 1000 733 42 18 11 "#fff8e9" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
Fill-RoundRect $g 1112 236 248 578 14 (C "#f4ead5" 228) (C "#d8c8aa")
Draw-Text $g "背包预览" 1136 262 130 28 22 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "右侧只显示快速库存，不抢商城主体。" 1136 298 180 40 13 "#7b705f"
Draw-Slot $g "面" "板面" "x2" 1136 356 84 $true
Draw-Slot $g "糕" "蛋糕" "x1" 1242 356 84 $false
Draw-Slot $g "包" "包子" "x4" 1136 464 84 $false
Draw-Slot $g "绳" "玩具" "x1" 1242 464 84 $false
Draw-Text $g "下一步入口" 1136 604 130 22 16 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Fill-RoundRect $g 1136 636 190 42 9 (C "#255c4d")
Draw-Text $g "打开背包" 1136 644 190 24 15 "#fff8e9" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
Fill-RoundRect $g 1136 692 190 42 9 (C "#fbf3df") (C "#d7c6a8")
Draw-Text $g "查看心愿实现" 1136 700 190 24 15 "#5f5446" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
Save-Canvas $canvas "supply-redesign-option-b.png"

$canvas = New-Canvas
$g = $canvas.Graphics
Draw-AppShell $g "补给仓 · 游戏背包格子" "背包优先：买到的东西像游戏物品槽一样管理，已完成心愿变成收藏陈列。"
Draw-TopSwitch $g @("心愿商城", "供销社", "背包", "心愿实现") 2
Draw-Text $g "方案 C：更像游戏背包，适合后续加稀有度、数量、冷却、最近使用等交互。" 328 196 800 26 16 "#5f5548"
Fill-RoundRect $g 328 236 720 578 14 (C "#fff8e9" 226) (C "#d8c8aa")
Draw-Text $g "背包物品" 352 262 140 28 22 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "桌宠供销社买来的东西都在这里，用槽位展示数量和类型。" 352 298 420 22 13 "#7b705f"
$slotData = @(
  @("面","板面","x2",$true), @("糕","蛋糕","x1",$false), @("包","热包子","x4",$false), @("茶","回血茶","x1",$false),
  @("绳","逗猫绳","x1",$false), @("罐","罐头","x3",$false), @("贴","冷静贴","x2",$false), @("券","训练券","x1",$false),
  @("洗","洗护包","x1",$false), @("骰","对练骰","x2",$false), @("汁","果汁","x5",$false), @("窝","小窝","x1",$false)
)
for ($i = 0; $i -lt $slotData.Count; $i++) {
  $sx = 352 + ($i % 4) * 164
  $sy = 344 + [Math]::Floor($i / 4) * 136
  Draw-Slot $g $slotData[$i][0] $slotData[$i][1] $slotData[$i][2] $sx $sy 116 $slotData[$i][3]
}
Fill-RoundRect $g 1076 236 284 340 14 (C "#f4ead5" 230) (C "#d8c8aa")
Draw-Text $g "物品详情" 1100 262 120 28 22 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "板面" 1100 306 160 30 26 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "主食 · 库存 x2" 1100 345 140 22 14 "#7b705f"
Draw-Text $g "热腾腾的宽面配辣椒，给软团补一口实在的。投喂后饱食 +28，饥饿 -35。" 1100 386 210 76 14 "#5f5548"
Fill-RoundRect $g 1100 490 220 44 9 (C "#255c4d")
Draw-Text $g "使用" 1100 500 220 24 16 "#fff8e9" ([System.Drawing.FontStyle]::Bold) "Center" "Center"
Fill-RoundRect $g 1076 600 284 214 14 (C "#fff8e9" 226) (C "#d8c8aa")
Draw-Text $g "心愿实现" 1100 626 130 28 22 "#2a221b" ([System.Drawing.FontStyle]::Bold)
Draw-Text $g "通过忍受完成的实体礼物，不再混在普通背包里。" 1100 662 210 42 13 "#7b705f"
Draw-ImageFit $g $macbook 1104 708 96 72
Draw-ImageFit $g $chair 1220 704 92 80
Draw-Text $g "已实现 2 件" 1100 782 140 20 14 "#255c4d" ([System.Drawing.FontStyle]::Bold)
Save-Canvas $canvas "supply-redesign-option-c.png"

Remove-Item -LiteralPath (Join-Path $outDir "test-systemdrawing.png") -ErrorAction SilentlyContinue

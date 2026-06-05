// ─────────────────────────────────────────────
// Canvas 2D procedural renderer
// Pure functions — no React dependency
// Draws a "newspaper document" being scanned
// ─────────────────────────────────────────────

/** Deterministic pseudo-random from seed */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/** Easing: ease-in-out cubic */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Clamp value between min and max */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ── Color palette ──
const COLORS = {
  void: '#050505',
  paper: '#1a1a18',
  paperLight: '#252520',
  textLine: '#3a3a35',
  textLineDim: '#2a2a26',
  headline: '#e8e6e1',
  headlineDim: 'rgba(232, 230, 225, 0.6)',
  scanYellow: '#f0e130',
  scanGlow: 'rgba(240, 225, 48, 0.12)',
  detectionRed: 'rgba(192, 57, 43, 0.85)',
  detectionRedGlow: 'rgba(192, 57, 43, 0.2)',
  processedBlue: 'rgba(52, 152, 219, 0.08)',
  labelWhite: '#e8e6e1',
} as const;

// ── Procedural document layout ──
interface TextBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'headline' | 'subhead' | 'body' | 'column-rule' | 'image-placeholder';
}

function generateDocumentLayout(w: number, h: number): TextBlock[] {
  const blocks: TextBlock[] = [];
  const margin = w * 0.08;
  const innerW = w - margin * 2;
  const lineH = h * 0.012;
  const gap = lineH * 0.8;

  // ── Masthead rule ──
  blocks.push({ x: margin, y: margin, w: innerW, h: 2, type: 'column-rule' });

  // ── Main headline ──
  blocks.push({ x: margin, y: margin + 16, w: innerW * 0.85, h: lineH * 3.5, type: 'headline' });

  // ── Sub-headline ──
  blocks.push({ x: margin, y: margin + 16 + lineH * 4.5, w: innerW * 0.6, h: lineH * 1.8, type: 'subhead' });

  // ── Divider ──
  blocks.push({ x: margin, y: margin + 16 + lineH * 7.5, w: innerW, h: 1, type: 'column-rule' });

  // ── Two-column body text ──
  const colStartY = margin + 16 + lineH * 9;
  const colGap = innerW * 0.04;
  const colW = (innerW - colGap) / 2;

  // Left column — body lines
  let cy = colStartY;
  for (let i = 0; i < 18; i++) {
    const lineW = colW * (0.7 + seededRandom(i * 7) * 0.3);
    blocks.push({ x: margin, y: cy, w: lineW, h: lineH, type: 'body' });
    cy += lineH + gap;
  }

  // Column rule
  blocks.push({
    x: margin + colW + colGap * 0.45,
    y: colStartY,
    w: 1,
    h: (lineH + gap) * 18,
    type: 'column-rule',
  });

  // Right column — image placeholder + body
  const imgH = h * 0.15;
  blocks.push({
    x: margin + colW + colGap,
    y: colStartY,
    w: colW,
    h: imgH,
    type: 'image-placeholder',
  });

  let ry = colStartY + imgH + gap * 2;
  for (let i = 0; i < 12; i++) {
    const lineW = colW * (0.65 + seededRandom(i * 13 + 3) * 0.35);
    blocks.push({
      x: margin + colW + colGap,
      y: ry,
      w: lineW,
      h: lineH,
      type: 'body',
    });
    ry += lineH + gap;
  }

  // ── Bottom rule ──
  blocks.push({
    x: margin,
    y: h - margin,
    w: innerW,
    h: 1,
    type: 'column-rule',
  });

  return blocks;
}

// ── Detection zones (pre-computed) ──
interface DetectionZone {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  appearAt: number; // progress 0-1 when it should appear
}

function generateDetectionZones(w: number, h: number): DetectionZone[] {
  const margin = w * 0.08;
  const innerW = w - margin * 2;
  const lineH = h * 0.012;
  const colStartY = margin + 16 + lineH * 9;

  return [
    {
      x: margin - 4,
      y: margin + 12,
      w: innerW * 0.85 + 8,
      h: lineH * 3.5 + 8,
      label: 'UNVERIFIED CLAIM',
      appearAt: 0.62,
    },
    {
      x: margin - 4,
      y: colStartY + (lineH + lineH * 0.8) * 4 - 4,
      w: (innerW - innerW * 0.04) / 2 * 0.9 + 8,
      h: (lineH + lineH * 0.8) * 3 + 8,
      label: 'SOURCE MISSING',
      appearAt: 0.70,
    },
    {
      x: margin + (innerW - innerW * 0.04) / 2 + innerW * 0.04 - 4,
      y: colStartY + h * 0.15 + lineH * 0.8 * 2 + (lineH + lineH * 0.8) * 2 - 4,
      w: (innerW - innerW * 0.04) / 2 * 0.75 + 8,
      h: (lineH + lineH * 0.8) * 4 + 8,
      label: 'MISLEADING CONTEXT',
      appearAt: 0.78,
    },
  ];
}

// ─────────────────────────────────────────────
// Main render function — called every frame
// ─────────────────────────────────────────────
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number,
  dpr: number,
): void {
  const w = width;
  const h = height;

  // Clear
  ctx.clearRect(0, 0, w * dpr, h * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  // ── Phase 1: Document materializes (0 – 0.25) ──
  const docAlpha = clamp(progress / 0.25, 0, 1);
  drawDocument(ctx, w, h, easeInOut(docAlpha));

  // ── Phase 2: Scanner sweeps (0.25 – 0.60) ──
  if (progress > 0.2) {
    const scanProgress = clamp((progress - 0.2) / 0.4, 0, 1);
    drawScanLine(ctx, w, h, scanProgress);
    drawProcessedOverlay(ctx, w, h, scanProgress);
  }

  // ── Phase 3: Detection boxes (0.60 – 0.85) ──
  if (progress > 0.58) {
    drawDetections(ctx, w, h, progress);
  }

  // ── Phase 4: Compress & fade (0.85 – 1.0) ──
  if (progress > 0.85) {
    const fadeOut = clamp((progress - 0.85) / 0.15, 0, 1);
    ctx.restore();
    ctx.save();
    ctx.scale(dpr, dpr);

    // Scale down and fade
    const scale = 1 - fadeOut * 0.3;
    const alpha = 1 - easeInOut(fadeOut);
    ctx.globalAlpha = alpha;
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
  }

  ctx.restore();
}

// ── Draw the procedural newspaper ──
function drawDocument(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
): void {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;

  // Paper background
  ctx.fillStyle = COLORS.paper;
  const paperMargin = w * 0.05;
  ctx.fillRect(paperMargin, paperMargin, w - paperMargin * 2, h - paperMargin * 2);

  // Subtle paper border
  ctx.strokeStyle = COLORS.textLineDim;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(paperMargin, paperMargin, w - paperMargin * 2, h - paperMargin * 2);

  const blocks = generateDocumentLayout(w, h);

  for (const block of blocks) {
    switch (block.type) {
      case 'headline':
        ctx.fillStyle = COLORS.headline;
        ctx.fillRect(block.x, block.y, block.w, block.h);
        break;
      case 'subhead':
        ctx.fillStyle = COLORS.headlineDim;
        ctx.fillRect(block.x, block.y, block.w, block.h);
        break;
      case 'body':
        ctx.fillStyle = COLORS.textLine;
        ctx.fillRect(block.x, block.y, block.w, block.h);
        break;
      case 'column-rule':
        ctx.fillStyle = COLORS.textLineDim;
        ctx.fillRect(block.x, block.y, block.w, block.h);
        break;
      case 'image-placeholder':
        ctx.fillStyle = COLORS.paperLight;
        ctx.fillRect(block.x, block.y, block.w, block.h);
        // Cross lines
        ctx.strokeStyle = COLORS.textLineDim;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(block.x, block.y);
        ctx.lineTo(block.x + block.w, block.y + block.h);
        ctx.moveTo(block.x + block.w, block.y);
        ctx.lineTo(block.x, block.y + block.h);
        ctx.stroke();
        break;
    }
  }

  ctx.globalAlpha = 1;
}

// ── Draw the glowing scan line ──
function drawScanLine(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
): void {
  const scanY = h * 0.05 + (h * 0.9) * easeInOut(progress);

  // Wide ambient glow
  const glowGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
  glowGrad.addColorStop(0, 'transparent');
  glowGrad.addColorStop(0.4, COLORS.scanGlow);
  glowGrad.addColorStop(0.5, 'rgba(240, 225, 48, 0.25)');
  glowGrad.addColorStop(0.6, COLORS.scanGlow);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, scanY - 60, w, 120);

  // Core scan line
  ctx.fillStyle = COLORS.scanYellow;
  ctx.shadowColor = COLORS.scanYellow;
  ctx.shadowBlur = 20;
  ctx.fillRect(w * 0.05, scanY - 1, w * 0.9, 2);
  ctx.shadowBlur = 0;
}

// ── Tint processed region ──
function drawProcessedOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scanProgress: number,
): void {
  const scanY = h * 0.05 + (h * 0.9) * easeInOut(scanProgress);
  ctx.fillStyle = COLORS.processedBlue;
  ctx.fillRect(w * 0.05, h * 0.05, w * 0.9, scanY - h * 0.05);
}

// ── Draw detection boxes + labels ──
function drawDetections(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
): void {
  const zones = generateDetectionZones(w, h);

  for (const zone of zones) {
    const zoneProgress = clamp((progress - zone.appearAt) / 0.06, 0, 1);
    if (zoneProgress <= 0) continue;

    const easedAlpha = easeInOut(zoneProgress);

    // Glow background
    ctx.globalAlpha = easedAlpha * 0.3;
    ctx.fillStyle = COLORS.detectionRedGlow;
    ctx.fillRect(zone.x - 6, zone.y - 6, zone.w + 12, zone.h + 12);

    // Border
    ctx.globalAlpha = easedAlpha * 0.9;
    ctx.strokeStyle = COLORS.detectionRed;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.setLineDash([]);

    // Corner marks
    const cornerLen = 8;
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y + cornerLen);
    ctx.lineTo(zone.x, zone.y);
    ctx.lineTo(zone.x + cornerLen, zone.y);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(zone.x + zone.w - cornerLen, zone.y);
    ctx.lineTo(zone.x + zone.w, zone.y);
    ctx.lineTo(zone.x + zone.w, zone.y + cornerLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y + zone.h - cornerLen);
    ctx.lineTo(zone.x, zone.y + zone.h);
    ctx.lineTo(zone.x + cornerLen, zone.y + zone.h);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(zone.x + zone.w - cornerLen, zone.y + zone.h);
    ctx.lineTo(zone.x + zone.w, zone.y + zone.h);
    ctx.lineTo(zone.x + zone.w, zone.y + zone.h - cornerLen);
    ctx.stroke();

    // Label
    ctx.globalAlpha = easedAlpha;
    const fontSize = Math.max(9, w * 0.018);
    ctx.font = `600 ${fontSize}px "Space Grotesk", "JetBrains Mono", monospace`;
    ctx.fillStyle = COLORS.detectionRed;

    // Label background
    const textMetrics = ctx.measureText(zone.label);
    const labelPadX = 6;
    const labelPadY = 3;
    const labelX = zone.x;
    const labelY = zone.y - fontSize - labelPadY * 2 - 2;
    ctx.fillStyle = 'rgba(192, 57, 43, 0.15)';
    ctx.fillRect(labelX, labelY, textMetrics.width + labelPadX * 2, fontSize + labelPadY * 2);

    ctx.fillStyle = COLORS.detectionRed;
    ctx.fillText(zone.label, labelX + labelPadX, labelY + fontSize + labelPadY - 2);
  }

  ctx.globalAlpha = 1;
}

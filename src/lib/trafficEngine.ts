export type VisualMode = 'lines' | 'rich' | 'original';
export type HeadlineMode = 'static' | 'rise-loop' | 'rise-hold' | 'hidden';

export interface TrafficConfig {
  mode: VisualMode;
  headlineMode: HeadlineMode;
  speed: number;
  density: number;
  trailIntensity: number;
  lineThinness: number;
  showMetro: boolean;
  showFrontage: boolean;
  showAiLines: boolean;
  paused: boolean;
}

export interface HeadlineAssets {
  skyPatch: HTMLImageElement | null;
  headlineBandClean?: HTMLImageElement | null;
  dinhHinhSprite?: HTMLImageElement | null;
}

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1300;

// Wide clean sky patch (covers the entire baked-in red sweep bar x=198..1429, y=166..426 + DINH HINH + Landmark 81 spire)
const SKY_PATCH_X = 188;
const SKY_PATCH_Y = 162;
const SKY_PATCH_W = 1260;
const SKY_PATCH_H = 270;

// Bright lime-green bar under "LẤY CON NGƯỜI" — glides from "SIÊU ĐÔ THỊ TOÀN CẦU,"
// behind Landmark 81 and lands flush with "TRUNG TÂM" at x=1008..1547.5
const BAND_X = 196;
const BAND_Y = 399;
const BAND_W = 1356;
const BAND_H = 88;
const LIME_BAR_START_LEFT = 198;
const LIME_BAR_START_RIGHT = 924;
const LIME_BAR_END_LEFT = 1007.5;
const LIME_BAR_END_RIGHT = 1547.5;
const LIME_BAR_EXT_START_X = 1525;
const LIME_BAR_Y = 401.5;
const LIME_BAR_H = 83;
const LIME_BAR_COLOR = '#B8FE66';
const LIME_R = 184;
const LIME_G = 254;
const LIME_B = 102;
// Exact dark royal blue RGB of "SIÊU ĐÔ THỊ TOÀN CẦU," and "LẤY CON NGƯỜI"
const TEXT_R = 1;
const TEXT_G = 64;
const TEXT_B = 161;

// Build exact mathematical vector Path2D for "ĐỊNH HÌNH" calibrated pixel-for-pixel to the 1920x1300 master layout.
// Uses clockwise outer contours + counter-clockwise counter on "Đ" so nonzero fill gives razor-sharp vector edges
// with zero pixelation, zero H.264 chroma blur, and one uniform subtle drop shadow.
function buildDinhHinhVectorPath(): Path2D {
  const p = new Path2D();
  const yTop = 212;
  const yBot = 367.5;
  const capH = yBot - yTop;
  const r = 2;

  const addRoundRect = (x: number, y: number, w: number, h: number, rad: number) => {
    const cr = Math.min(rad, w / 2, h / 2);
    p.moveTo(x + cr, y);
    p.lineTo(x + w - cr, y);
    p.arcTo(x + w, y, x + w, y + cr, cr);
    p.lineTo(x + w, y + h - cr);
    p.arcTo(x + w, y + h, x + w - cr, y + h, cr);
    p.lineTo(x + cr, y + h);
    p.arcTo(x, y + h, x, y + h - cr, cr);
    p.lineTo(x, y + cr);
    p.arcTo(x, y, x + cr, y, cr);
    p.closePath();
  };

  // 1. "Đ" — outer D (clockwise)
  p.moveTo(500 + r, yTop);
  p.lineTo(576.5, yTop);
  p.arcTo(601.5, yTop, 601.5, yTop + 25, 25);
  p.lineTo(601.5, yBot - 25);
  p.arcTo(601.5, yBot, 576.5, yBot, 25);
  p.lineTo(500 + r, yBot);
  p.arcTo(500, yBot, 500, yBot - r, r);
  p.lineTo(500, yTop + r);
  p.arcTo(500, yTop, 500 + r, yTop, r);
  p.closePath();

  // "Đ" — inner counter (counter-clockwise so nonzero fill punches clean hole)
  p.moveTo(533, 240);
  p.lineTo(533, 338);
  p.lineTo(564, 338);
  p.arcTo(570, 338, 570, 332, 6);
  p.lineTo(570, 246);
  p.arcTo(570, 240, 564, 240, 6);
  p.closePath();

  // "Đ" — horizontal crossbar (clockwise)
  addRoundRect(490, 279, 59, 24.5, 1.5);

  // 2. "Ị" — vertical stem + circular dot
  addRoundRect(622, yTop, 33, capH, r);
  p.moveTo(637.5 + 15.6, 393.5);
  p.arc(637.5, 393.5, 15.6, 0, Math.PI * 2, false);
  p.closePath();

  // Helper for "N" (identical geometric construction for both N1 and N2)
  const addN = (x0: number) => {
    addRoundRect(x0, yTop, 33, capH, r);
    addRoundRect(x0 + 82, yTop, 33, capH, r);
    p.moveTo(x0 + 30, yTop);
    p.lineTo(x0 + 60, yTop);
    p.lineTo(x0 + 78, 338.5);
    p.lineTo(x0 + 85, 338.5);
    p.lineTo(x0 + 85, yBot);
    p.lineTo(x0 + 56, yBot);
    p.lineTo(x0 + 38, 238.5);
    p.lineTo(x0 + 30, 238.5);
    p.closePath();
  };

  // Helper for "H" (vertical stems + crossbar)
  const addH = (x0: number, totalW: number, stemW: number) => {
    addRoundRect(x0, yTop, stemW, capH, r);
    addRoundRect(x0 + totalW - stemW, yTop, stemW, capH, r);
    addRoundRect(x0 + 2, 275.5, totalW - 4, 28, 1);
  };

  // 3. "N" (first)
  addN(676);

  // 4. "H" (first)
  addH(814, 101.5, 32.5);

  // 5. "H" (second — clipped cleanly behind Landmark 81 via BUILDING_MASKS)
  addH(996, 103, 33);

  // 6. "Ì" — vertical stem + crisp slanted grave accent
  addRoundRect(1121.5, yTop, 32.5, capH, r);
  p.moveTo(1111, 173.5);
  p.lineTo(1135, 173.5);
  p.lineTo(1150.5, 202.5);
  p.lineTo(1134.5, 202.5);
  p.closePath();

  // 7. "N" (second)
  addN(1176);

  // 8. "H" (third)
  addH(1312, 103.5, 33);

  return p;
}

interface PathPoint {
  x: number;
  y: number;
  halfWidth: number;
  scale: number;
}

// Calibrated pixel-for-pixel against the 1920x1300 Landmark 81 & Saigon Bridge video:
// Continuous artery from bottom-left Dien Bien Phu -> open gap beside Tan Cang -> Saigon Bridge -> Thu Duc.
// Occluded accurately behind every foreground Vinhomes tower & Landmark 81 so lines NEVER cross buildings.
const SAIGON_BRIDGE_PATH: PathPoint[] = [
  { x: -20, y: 1254, halfWidth: 20, scale: 1.12 },
  { x: 140, y: 1216, halfWidth: 20, scale: 1.08 },
  { x: 260, y: 1184, halfWidth: 20, scale: 1.04 },
  { x: 470, y: 1126, halfWidth: 20, scale: 0.98 },
  { x: 684, y: 1068, halfWidth: 22, scale: 0.94 },
  { x: 862, y: 1002, halfWidth: 21, scale: 0.9 },
  { x: 1030, y: 932, halfWidth: 21, scale: 0.86 },
  { x: 1200, y: 865, halfWidth: 19, scale: 0.8 },
  { x: 1400, y: 794, halfWidth: 16, scale: 0.72 },
  { x: 1550, y: 730, halfWidth: 14, scale: 0.64 },
  { x: 1700, y: 664, halfWidth: 11, scale: 0.54 },
  { x: 1850, y: 598, halfWidth: 8, scale: 0.44 },
  { x: 1935, y: 562, halfWidth: 7, scale: 0.38 },
];

// Parallel Metro Line 1 elevated viaduct (runs cleanly right above Saigon Bridge)
const METRO_BRIDGE_PATH: PathPoint[] = [
  { x: -20, y: 1236, halfWidth: 6, scale: 1.08 },
  { x: 260, y: 1164, halfWidth: 6, scale: 1.0 },
  { x: 684, y: 1040, halfWidth: 7, scale: 0.92 },
  { x: 862, y: 974, halfWidth: 7, scale: 0.88 },
  { x: 1030, y: 902, halfWidth: 7, scale: 0.84 },
  { x: 1200, y: 838, halfWidth: 6, scale: 0.76 },
  { x: 1400, y: 768, halfWidth: 5, scale: 0.68 },
  { x: 1550, y: 706, halfWidth: 5, scale: 0.6 },
  { x: 1700, y: 646, halfWidth: 4, scale: 0.5 },
  { x: 1850, y: 586, halfWidth: 3, scale: 0.42 },
  { x: 1935, y: 552, halfWidth: 3, scale: 0.36 },
];

// Exact foreground building occlusion polygons (excluded via evenodd clip so ZERO lines cross buildings):
// 1. Landmark 81 tower (center — pixel-accurate spire, setbacks & straight x=1007.5 right facade)
const LANDMARK81_MASK: Array<[number, number]> = [
  [952, 48],
  [984, 48],
  [984, 322],
  [987, 326],
  [987, 344],
  [1002, 349],
  [1007.5, 358],
  [1007.5, 520],
  [1018, 616],
  [1036, 650],
  [1036, 1300],
  [856, 1300],
  [858, 940],
  [880, 882],
  [886, 636],
  [906, 558],
  [915, 510],
  [915, 316],
  [923, 314],
  [923, 294],
  [944, 290],
  [952, 284],
];

// 2. Lower-left Vinhomes Central Park foreground apartment towers (4 interconnected silhouettes)
const VINHOMES_LEFT_TOWERS_MASK: Array<[number, number]> = [
  [0, 1262],
  [145, 1236],
  [254, 1188],
  [254, 1084],
  [332, 1042],
  [410, 1062],
  [410, 1016],
  [534, 978],
  [686, 1014],
  [686, 1122],
  [798, 1148],
  [798, 1300],
  [0, 1300],
];

// 3. Tan Cang Metro Station curved white canopy roof (keeps lines off the white station roof)
const TAN_CANG_STATION_MASK: Array<[number, number]> = [
  [668, 1004],
  [750, 956],
  [858, 922],
  [862, 972],
  [736, 1024],
  [672, 1034],
];

// 4. Lower-right foreground riverside towers & Landmark base buildings
const LOWER_RIGHT_TOWERS_MASK: Array<[number, number]> = [
  [1034, 962],
  [1168, 954],
  [1296, 1068],
  [1418, 1110],
  [1418, 1300],
  [1034, 1300],
];

const BUILDING_MASKS: Array<Array<[number, number]>> = [
  LANDMARK81_MASK,
  VINHOMES_LEFT_TOWERS_MASK,
  TAN_CANG_STATION_MASK,
  LOWER_RIGHT_TOWERS_MASK,
];

type CorridorId = 'bridge' | 'metro';
type LineTone = 'warmGold' | 'ivoryWhite' | 'amberCoral' | 'metroCyan';

interface LightFilament {
  corridor: CorridorId;
  direction: 1 | -1;
  t: number;
  laneOffset: number;
  baseSpeed: number;
  lengthT: number;
  thickness: number;
  pulsePhase: number;
  pulseSpeed: number;
  brightness: number;
  tone: LineTone;
  rank: number;
}

interface AiAscendingLine {
  x: number;
  yStart: number;
  yEnd: number;
  progress: number;
  speed: number;
  lengthPx: number;
  thickness: number;
  brightness: number;
  tone: 'skyWhite' | 'softGold' | 'skyCyan';
  hasMicroTicks: boolean;
  driftX: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// C3-continuous quintic silk ease-out: zero velocity, acceleration, and jerk at landing
function easeOutSilk(t: number): number {
  const u = 1 - clamp(t, 0, 1);
  return 1 - u * u * u * u * u;
}

function easeInOutCubic(t: number): number {
  const u = clamp(t, 0, 1);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePath(
  points: PathPoint[],
  t: number,
  laneOffset: number
): { x: number; y: number; scale: number } {
  const tc = clamp(t, 0, 1);
  const scaled = tc * (points.length - 1);
  const idx = Math.min(points.length - 2, Math.floor(scaled));
  const localT = scaled - idx;

  const a = points[idx];
  const b = points[idx + 1];

  const cx = lerp(a.x, b.x, localT);
  const cy = lerp(a.y, b.y, localT);
  const hw = lerp(a.halfWidth, b.halfWidth, localT);
  const scale = lerp(a.scale, b.scale, localT);

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  return {
    x: cx + nx * hw * laneOffset,
    y: cy + ny * hw * laneOffset,
    scale,
  };
}

function getToneColors(tone: LineTone): {
  core: [number, number, number];
  glow: [number, number, number];
  tail: [number, number, number];
} {
  switch (tone) {
    case 'ivoryWhite':
      return {
        core: [255, 254, 245],
        glow: [255, 232, 168],
        tail: [255, 196, 98],
      };
    case 'warmGold':
      return {
        core: [255, 245, 200],
        glow: [255, 208, 102],
        tail: [242, 162, 54],
      };
    case 'amberCoral':
      return {
        core: [255, 212, 184],
        glow: [255, 114, 78],
        tail: [224, 58, 48],
      };
    case 'metroCyan':
      return {
        core: [244, 253, 255],
        glow: [148, 228, 255],
        tail: [56, 178, 242],
      };
  }
}

export class TrafficEngine {
  private filaments: LightFilament[] = [];
  private aiLines: AiAscendingLine[] = [];
  private time = 0;
  private headlineElapsed = 0;
  private lastVideoTime = -1;
  private bandCanvas: HTMLCanvasElement | null = null;
  private bandCtx: CanvasRenderingContext2D | null = null;
  private cleanBandPixels: Uint8ClampedArray | null = null;
  private cleanBandSource: HTMLImageElement | null = null;
  private dinhHinhPath: Path2D | null = null;

  constructor() {
    this.initFilaments();
    this.initAiLines();
  }

  public resetHeadline(): void {
    this.headlineElapsed = 0;
    this.lastVideoTime = 0;
  }

  private initFilaments(): void {
    const rand = mulberry32(19201300);

    // 1. Saigon Bridge & Hanoi Highway — Northeast bound (upper deck lanes)
    const neLanes = [-0.72, -0.44, -0.18];
    for (let i = 0; i < 28; i++) {
      const lane = neLanes[i % neLanes.length];
      this.filaments.push({
        corridor: 'bridge',
        direction: 1,
        t: rand() * 1.15 - 0.08,
        laneOffset: clamp(lane + (rand() - 0.5) * 0.1, -0.9, -0.06),
        baseSpeed: 0.072 + rand() * 0.04,
        lengthT: 0.085 + rand() * 0.085,
        thickness: 1.0 + rand() * 0.75,
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.9 + rand() * 0.8,
        brightness: 0.64 + rand() * 0.32,
        tone: rand() > 0.45 ? 'ivoryWhite' : 'warmGold',
        rank: i / 28,
      });
    }

    // 2. Saigon Bridge & Hanoi Highway — Southwest bound (lower deck lanes)
    const swLanes = [0.18, 0.46, 0.72];
    for (let i = 0; i < 28; i++) {
      const lane = swLanes[i % swLanes.length];
      this.filaments.push({
        corridor: 'bridge',
        direction: -1,
        t: rand() * 1.15 - 0.08,
        laneOffset: clamp(lane + (rand() - 0.5) * 0.1, 0.06, 0.9),
        baseSpeed: 0.07 + rand() * 0.038,
        lengthT: 0.085 + rand() * 0.085,
        thickness: 1.0 + rand() * 0.75,
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.9 + rand() * 0.8,
        brightness: 0.64 + rand() * 0.32,
        tone: rand() > 0.42 ? 'amberCoral' : 'warmGold',
        rank: i / 28,
      });
    }

    // 3. Metro Line 1 elevated bridge (parallel cyan & ivory-white threads)
    for (let i = 0; i < 8; i++) {
      const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      this.filaments.push({
        corridor: 'metro',
        direction: dir,
        t: (i / 8) * 1.15 - 0.05,
        laneOffset: dir === 1 ? -0.32 : 0.32,
        baseSpeed: 0.095 + (i % 3) * 0.015,
        lengthT: 0.12 + rand() * 0.06,
        thickness: 1.1 + rand() * 0.35,
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.8,
        brightness: 0.68 + rand() * 0.24,
        tone: dir === 1 ? 'metroCyan' : 'ivoryWhite',
        rank: i / 8,
      });
    }
  }

  private initAiLines(): void {
    // Sleek ascending AI light filaments confined strictly to the open sky above the distant city horizon
    this.aiLines = [
      { x: 468, yStart: 505, yEnd: 150, progress: 0.12, speed: 0.25, lengthPx: 135, thickness: 1.05, brightness: 0.64, tone: 'skyWhite', hasMicroTicks: false, driftX: -7 },
      { x: 642, yStart: 495, yEnd: 142, progress: 0.56, speed: 0.28, lengthPx: 150, thickness: 1.15, brightness: 0.74, tone: 'softGold', hasMicroTicks: true, driftX: -4 },
      { x: 794, yStart: 490, yEnd: 138, progress: 0.28, speed: 0.26, lengthPx: 145, thickness: 1.05, brightness: 0.72, tone: 'skyCyan', hasMicroTicks: false, driftX: -2 },
      { x: 1098, yStart: 490, yEnd: 138, progress: 0.74, speed: 0.27, lengthPx: 150, thickness: 1.1, brightness: 0.74, tone: 'softGold', hasMicroTicks: true, driftX: 2 },
      { x: 1265, yStart: 495, yEnd: 144, progress: 0.4, speed: 0.25, lengthPx: 140, thickness: 1.05, brightness: 0.68, tone: 'skyWhite', hasMicroTicks: false, driftX: 5 },
      { x: 1445, yStart: 505, yEnd: 154, progress: 0.86, speed: 0.24, lengthPx: 132, thickness: 1.0, brightness: 0.62, tone: 'skyCyan', hasMicroTicks: false, driftX: 7 },
    ];
  }

  public update(dtSeconds: number, config: TrafficConfig, videoCurrentTime?: number): void {
    if (config.paused) return;
    const rawDt = Math.min(Math.max(dtSeconds, 0), 1 / 30);
    const dt = rawDt * config.speed;
    this.time += dt;

    // Advance 60fps headline timer smoothly and re-trigger cleanly whenever the 5s video loops
    if (typeof videoCurrentTime === 'number' && Number.isFinite(videoCurrentTime)) {
      if (this.lastVideoTime < 0) {
        this.headlineElapsed = videoCurrentTime;
      } else if (videoCurrentTime < this.lastVideoTime - 1.0) {
        // Video wrapped from ~5.0s back to 0.0s: replay smooth bottom-up rise
        this.headlineElapsed = videoCurrentTime;
      } else {
        this.headlineElapsed += rawDt;
      }
      this.lastVideoTime = videoCurrentTime;
    } else {
      this.headlineElapsed += rawDt;
    }

    for (const f of this.filaments) {
      f.t += f.direction * f.baseSpeed * dt;
      if (f.direction === 1 && f.t - f.lengthT > 1.04) {
        f.t = -0.04;
      } else if (f.direction === -1 && f.t + f.lengthT < -0.04) {
        f.t = 1.05;
      }
    }

    for (const ai of this.aiLines) {
      ai.progress += ai.speed * rawDt * clamp(config.speed, 0.6, 1.8);
      if (ai.progress > 1.32) {
        ai.progress = -0.18;
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    _baseImage: HTMLImageElement | null,
    videoEl: HTMLVideoElement | null,
    config: TrafficConfig,
    headlineAssets?: HeadlineAssets
  ): void {
    if (videoEl && videoEl.readyState >= 2) {
      ctx.drawImage(videoEl, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#0D5CB6';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      return;
    }

    if (config.mode === 'original') {
      return;
    }

    // 1. Restore clean sky + Landmark 81 upper tower BEFORE building clipping!
    // Because skyPatch is cropped directly from the clean t=0.0s frame (including Landmark 81's exact spire & setbacks),
    // drawing it unclipped eliminates 100% of red wipe flashes along every single pixel of the tower edges & DINH HINH.
    if (config.headlineMode !== 'hidden' && headlineAssets?.skyPatch) {
      this.drawCleanSkyOverSweepAndHeadline(ctx, videoEl, headlineAssets.skyPatch);
    }

    // Exclude ALL foreground buildings (Landmark 81, Vinhomes left towers, Tan Cang roof, right towers)
    // via evenodd clipping so the gliding lime bar, crisp vector "ĐỊNH HÌNH", and light lines stay cleanly behind buildings.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (const poly of BUILDING_MASKS) {
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i][0], poly[i][1]);
      }
      ctx.closePath();
    }
    ctx.clip('evenodd');

    // 2. Glide bright lime-green bar from "SIÊU ĐÔ THỊ TOÀN CẦU," behind Landmark 81, stopping flush under "LẤY CON NGƯỜI"
    this.drawGlidingLimeBar(ctx, videoEl, headlineAssets?.headlineBandClean ?? null);

    if (config.showAiLines) {
      this.drawAscendingAiLines(ctx, config);
    }

    if (config.headlineMode !== 'hidden') {
      this.drawCrispDinhHinh(ctx, config.headlineMode);
    }

    if (config.trailIntensity > 0.01) {
      this.drawLuminousLines(ctx, config);
    }

    ctx.restore();
  }

  private drawCleanSkyOverSweepAndHeadline(
    ctx: CanvasRenderingContext2D,
    videoEl: HTMLVideoElement | null,
    skyPatch: HTMLImageElement
  ): void {
    const vt = videoEl ? videoEl.currentTime : 1;

    // A. During the first 0.55s of the 5s loop (red sweep runs t=0.06..0.44s; "SIÊU ĐÔ THỊ TOÀN CẦU," starts at 0.57s;
    // "LẤY CON NGƯỜI" starts at 0.67s), paint the ENTIRE clean skyPatch (x=188..1448, y=162..432) including Landmark 81.
    // This guarantees ZERO red wipe flashes anywhere around Landmark 81 or "ĐỊNH HÌNH".
    if (vt < 0.55) {
      ctx.drawImage(
        skyPatch,
        0,
        0,
        SKY_PATCH_W,
        SKY_PATCH_H,
        SKY_PATCH_X,
        SKY_PATCH_Y,
        SKY_PATCH_W,
        SKY_PATCH_H
      );
      return;
    }

    // B. Permanent sky restoration for y=162..398 across the entire sweep width (x=188..1448)
    // Completely removes the video's compressed "ĐỊNH HÌNH" without touching lower text (y>=400)
    const upperH = 398 - SKY_PATCH_Y;
    ctx.drawImage(
      skyPatch,
      0,
      0,
      SKY_PATCH_W,
      upperH,
      SKY_PATCH_X,
      SKY_PATCH_Y,
      SKY_PATCH_W,
      upperH
    );

    // C. Permanent sky restoration strictly for the "dấu nặng" dot under "Ị" (x=618..658, y=398..415)
    // Kept strictly left of x=658 so the "dấu huyền" on "À" in "TOÀN" (x=666..678, y=406..414) is 100% untouched
    ctx.drawImage(
      skyPatch,
      618 - SKY_PATCH_X,
      398 - SKY_PATCH_Y,
      40,
      17,
      618,
      398,
      40,
      17
    );
  }

  private ensureCleanBandCache(bandImg: HTMLImageElement): void {
    if (this.cleanBandSource === bandImg && this.cleanBandPixels) return;
    if (typeof document === 'undefined') return;

    if (!this.bandCanvas) {
      this.bandCanvas = document.createElement('canvas');
      this.bandCanvas.width = BAND_W;
      this.bandCanvas.height = BAND_H;
      this.bandCtx = this.bandCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (!this.bandCtx) return;

    this.bandCtx.clearRect(0, 0, BAND_W, BAND_H);
    this.bandCtx.drawImage(bandImg, 0, 0, BAND_W, BAND_H);
    this.cleanBandPixels = new Uint8ClampedArray(
      this.bandCtx.getImageData(0, 0, BAND_W, BAND_H).data
    );
    this.cleanBandSource = bandImg;
  }

  private drawGlidingLimeBar(
    ctx: CanvasRenderingContext2D,
    videoEl: HTMLVideoElement | null,
    headlineBandClean: HTMLImageElement | null
  ): void {
    const vt = videoEl ? videoEl.currentTime : 3.0;

    // Resting phase (t >= 2.02s): lime bar sits parked under "LẤY CON NGƯỜI", flush with "TRUNG TÂM" (x=1547.5).
    // Fast path: only draw the seamless right-edge extension (zero per-pixel overhead).
    if (vt >= 2.02) {
      ctx.save();
      ctx.fillStyle = LIME_BAR_COLOR;
      ctx.fillRect(
        LIME_BAR_EXT_START_X,
        LIME_BAR_Y,
        LIME_BAR_END_RIGHT - LIME_BAR_EXT_START_X,
        LIME_BAR_H
      );
      ctx.restore();
      return;
    }

    // Before video's built-in lime bar starts (t < 0.21s), nothing to erase or draw yet
    if (vt < 0.21) return;

    if (!videoEl || videoEl.readyState < 2 || !headlineBandClean) return;
    this.ensureCleanBandCache(headlineBandClean);
    const bctx = this.bandCtx;
    const cleanPx = this.cleanBandPixels;
    if (!bctx || !cleanPx || !this.bandCanvas) return;

    // Choreograph the lime-green bar journey:
    //  - 0.21s..0.56s: erase video's premature right-side lime bar while waiting for "SIÊU ĐÔ THỊ TOÀN CẦU,"
    //  - 0.56s..0.94s: expand smoothly underneath "SIÊU ĐÔ THỊ TOÀN CẦU," (x = 198 -> 924)
    //  - 0.94s..2.02s: glide smoothly across behind Landmark 81 and brake into "LẤY CON NGƯỜI" (1008 .. 1547.5)
    let barLeft = -1;
    let barRight = -1;
    if (vt >= 0.56 && vt < 0.94) {
      const p = easeOutSilk((vt - 0.56) / 0.38);
      barLeft = LIME_BAR_START_LEFT;
      barRight = lerp(LIME_BAR_START_LEFT, LIME_BAR_START_RIGHT, p);
    } else if (vt >= 0.94) {
      const u = clamp((vt - 0.94) / 1.08, 0, 1);
      const uR = easeInOutCubic(clamp(u * 1.12, 0, 1));
      const uL = easeInOutCubic(clamp((u - 0.06) / 0.94, 0, 1));
      barLeft = lerp(LIME_BAR_START_LEFT, LIME_BAR_END_LEFT, uL);
      barRight = lerp(LIME_BAR_START_RIGHT, LIME_BAR_END_RIGHT, uR);
    }

    bctx.drawImage(videoEl, BAND_X, BAND_Y, BAND_W, BAND_H, 0, 0, BAND_W, BAND_H);
    const imgData = bctx.getImageData(0, 0, BAND_W, BAND_H);
    const data = imgData.data;

    // Local X ranges inside BAND_X=196..1552:
    //  - Left headline region: xGlobal = 198..926  -> lx = 2..730
    //  - Right headline region: xGlobal = 1006..1549 -> lx = 810..1353
    // Local Y range for the lime bar (yGlobal = 401.5..484.5 -> ly = 2.5..85.5, safe above TRUNG TÂM at y=488):
    const lyStart = 1; // yGlobal = 400
    const lyEnd = 86;  // yGlobal = 485

    const lrMinusTr = LIME_R - TEXT_R;
    const lgMinusTg = LIME_G - TEXT_G;
    const rightDenom = lrMinusTr * lrMinusTr + lgMinusTg * lgMinusTg;

    for (let ly = lyStart; ly <= lyEnd; ly++) {
      const yGlobal = BAND_Y + ly;
      // Smooth 1px vertical anti-aliased edge matching y = 401.5 .. 484.5
      let vCov = 0;
      if (yGlobal >= 402 && yGlobal <= 483) vCov = 1;
      else if (yGlobal === 401 || yGlobal === 484) vCov = 0.5;

      const rowOff = ly * BAND_W;

      // 1. Left side ("SIÊU ĐÔ THỊ TOÀN CẦU,"): composite gliding lime bar BEHIND dark-blue text
      if (vCov > 0 && barRight > BAND_X && barLeft < 928) {
        const lxFrom = Math.max(0, Math.floor(barLeft) - BAND_X);
        const lxTo = Math.min(732, Math.ceil(barRight) - BAND_X);
        for (let lx = lxFrom; lx <= lxTo; lx++) {
          const xGlobal = BAND_X + lx;
          const hCov = clamp(Math.min(xGlobal + 1 - barLeft, barRight - xGlobal), 0, 1);
          const cov = hCov * vCov;
          if (cov <= 0.005) continue;

          const idx = (rowOff + lx) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const sr = cleanPx[idx];
          const sg = cleanPx[idx + 1];
          const sb = cleanPx[idx + 2];

          // Extract anti-aliased dark-blue text alpha against clean sky background
          let textAlpha = 0;
          if (r < sr - 6 && g < sg - 6) {
            const dr = sr - TEXT_R;
            const dg = sg - TEXT_G;
            const db = sb - TEXT_B;
            const denom = dr * dr + dg * dg + db * db;
            if (denom > 400) {
              const rawA = ((sr - r) * dr + (sg - g) * dg + (sb - b) * db) / denom;
              if (rawA > 0.05) {
                textAlpha = clamp((rawA - 0.05) / 0.95, 0, 1);
              }
            }
          }

          // Background transitions smoothly from sky -> lime bar according to sub-pixel edge coverage
          const bgR = sr + (LIME_R - sr) * cov;
          const bgG = sg + (LIME_G - sg) * cov;
          const bgB = sb + (LIME_B - sb) * cov;

          // Keep dark-blue text razor-sharp and anti-aliased on top of the gliding lime bar
          data[idx] = Math.round(bgR + (TEXT_R - bgR) * textAlpha);
          data[idx + 1] = Math.round(bgG + (TEXT_G - bgG) * textAlpha);
          data[idx + 2] = Math.round(bgB + (TEXT_B - bgB) * textAlpha);
          data[idx + 3] = 255;
        }
      }

      // 2. Right side ("LẤY CON NGƯỜI"):
      //    - Un-matte video's premature lime bar back to clean sky wherever our gliding bar hasn't arrived yet
      //    - Keep "LẤY CON NGƯỜI" dark-blue letters 100% crisp on top
      //    - Draw the extended lime bar cleanly out to x = 1547.5 as barRight reaches it
      const rFrom = 810; // xGlobal = 1006
      const rTo = 1353;  // xGlobal = 1549
      for (let lx = rFrom; lx <= rTo; lx++) {
        const xGlobal = BAND_X + lx;
        const hCov =
          barRight > barLeft
            ? clamp(Math.min(xGlobal + 1 - barLeft, barRight - xGlobal), 0, 1)
            : 0;
        const cov = hCov * vCov;

        const idx = (rowOff + lx) * 4;
        const sr = cleanPx[idx];
        const sg = cleanPx[idx + 1];
        const sb = cleanPx[idx + 2];

        // Right extension strip (x = 1527..1548): no text here, pure clean sky -> lime bar
        if (xGlobal >= 1527) {
          if (cov > 0.005) {
            data[idx] = Math.round(sr + (LIME_R - sr) * cov);
            data[idx + 1] = Math.round(sg + (LIME_G - sg) * cov);
            data[idx + 2] = Math.round(sb + (LIME_B - sb) * cov);
            data[idx + 3] = 255;
          }
          continue;
        }

        // Inside video's built-in lime bar area (x = 1006..1526):
        // If our gliding bar fully covers this pixel (and vt >= 0.72 so video's bar is already full here), keep crisp video as-is
        if (cov >= 0.995 && vt >= 0.72) {
          continue;
        }

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // If pixel already matches clean sky closely (no text and no lime bar yet), leave or blend directly with lime
        const skyDiff = Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb);
        if (skyDiff < 32) {
          if (cov > 0.005) {
            data[idx] = Math.round(sr + (LIME_R - sr) * cov);
            data[idx + 1] = Math.round(sg + (LIME_G - sg) * cov);
            data[idx + 2] = Math.round(sb + (LIME_B - sb) * cov);
            data[idx + 3] = 255;
          }
          continue;
        }

        // Un-matte dark-blue "LẤY CON NGƯỜI" text from the video's lime bar using (R, G) channels
        let textAlpha = 0;
        if (vt >= 0.65 && r < LIME_R - 10 && g < LIME_G - 10 && b > 95) {
          const rawA = ((LIME_R - r) * lrMinusTr + (LIME_G - g) * lgMinusTg) / rightDenom;
          if (rawA > 0.07) {
            textAlpha = clamp((rawA - 0.07) / 0.93, 0, 1);
          }
        }

        const bgR = sr + (LIME_R - sr) * cov;
        const bgG = sg + (LIME_G - sg) * cov;
        const bgB = sb + (LIME_B - sb) * cov;

        data[idx] = Math.round(bgR + (TEXT_R - bgR) * textAlpha);
        data[idx + 1] = Math.round(bgG + (TEXT_G - bgG) * textAlpha);
        data[idx + 2] = Math.round(bgB + (TEXT_B - bgB) * textAlpha);
        data[idx + 3] = 255;
      }
    }

    bctx.putImageData(imgData, 0, 0);
    const sliceH = lyEnd - lyStart + 1;

    // Blit left slice ("SIÊU ĐÔ THỊ TOÀN CẦU,") only while the gliding lime bar is active on the left (vt >= 0.56, after red sweep ended)
    if (vt >= 0.56 && barLeft < 928) {
      ctx.drawImage(
        this.bandCanvas,
        0,
        lyStart,
        732,
        sliceH,
        BAND_X,
        BAND_Y + lyStart,
        732,
        sliceH
      );
    }

    // Blit right slice ("LẤY CON NGƯỜI" + flush extension to x=1547.5) cleanly above TRUNG TÂM (y=400..485)
    ctx.drawImage(
      this.bandCanvas,
      810,
      lyStart,
      544,
      sliceH,
      BAND_X + 810,
      BAND_Y + lyStart,
      544,
      sliceH
    );
  }

  private drawCrispDinhHinh(
    ctx: CanvasRenderingContext2D,
    headlineMode: HeadlineMode
  ): void {
    if (typeof Path2D === 'undefined') return;
    if (!this.dinhHinhPath) {
      this.dinhHinhPath = buildDinhHinhVectorPath();
    }

    ctx.save();

    if (headlineMode === 'rise-loop' || headlineMode === 'rise-hold') {
      const startDelay = 0.08;
      const riseDuration = 1.42;
      const rawProgress = clamp((this.headlineElapsed - startDelay) / riseDuration, 0, 1);
      if (rawProgress <= 0) {
        ctx.restore();
        return;
      }
      const eased = easeOutSilk(rawProgress);
      const offsetY = (1 - eased) * 232;
      const dotReveal = clamp((34 - offsetY) / 24, 0, 1);
      const dotBottomY = lerp(396, 416, dotReveal);

      ctx.beginPath();
      ctx.moveTo(460, 158);
      ctx.lineTo(1460, 158);
      ctx.lineTo(1460, 396);
      ctx.lineTo(660, 396);
      ctx.lineTo(660, dotBottomY);
      ctx.lineTo(614, dotBottomY);
      ctx.lineTo(614, 396);
      ctx.lineTo(460, 396);
      ctx.closePath();
      ctx.clip();

      ctx.globalAlpha = clamp(rawProgress / 0.26, 0, 1);
      ctx.translate(0, offsetY);
    }

    // Crisp, vector-rendered "#FED84D" headline with subtle editorial depth shadow
    ctx.shadowColor = 'rgba(10, 48, 96, 0.24)';
    ctx.shadowBlur = 9;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FED84D';
    ctx.fill(this.dinhHinhPath, 'nonzero');

    ctx.restore();
  }

  private getPathForCorridor(corridor: CorridorId): PathPoint[] {
    return corridor === 'bridge' ? SAIGON_BRIDGE_PATH : METRO_BRIDGE_PATH;
  }

  private drawLuminousLines(ctx: CanvasRenderingContext2D, config: TrafficConfig): void {
    const isRich = config.mode === 'rich';
    const densityThreshold = clamp((config.density / 1.5) * (isRich ? 1.15 : 0.92), 0.25, 1.0);
    const intensity = config.trailIntensity * (isRich ? 1.18 : 0.92);
    const widthScale = config.lineThinness * (isRich ? 1.15 : 0.98);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const segments = 12;

    for (const f of this.filaments) {
      if (f.rank > densityThreshold) continue;
      if (f.corridor === 'metro' && !config.showMetro) continue;

      const path = this.getPathForCorridor(f.corridor);
      const tHead = f.t;
      const tTail = f.t - f.direction * f.lengthT;

      const tMin = Math.min(tHead, tTail);
      const tMax = Math.max(tHead, tTail);
      if (tMax <= 0.01 || tMin >= 0.99) continue;

      const pts: Array<{ x: number; y: number; scale: number }> = [];
      for (let s = 0; s <= segments; s++) {
        const frac = s / segments;
        const tVal = lerp(tTail, tHead, frac);
        if (tVal < 0.0 || tVal > 1.0) continue;
        pts.push(samplePath(path, tVal, f.laneOffset));
      }

      if (pts.length < 2) continue;

      const firstPt = pts[0];
      const lastPt = pts[pts.length - 1];
      const midT = clamp((tHead + tTail) * 0.5, 0, 1);
      const edgeFade = clamp(Math.min(midT, 1 - midT) / 0.08, 0, 1);
      const pulse = 0.88 + 0.12 * Math.sin(this.time * f.pulseSpeed + f.pulsePhase);

      const alpha = clamp(f.brightness * intensity * edgeFade * pulse, 0, 0.95);
      if (alpha < 0.015) continue;

      const { core, glow, tail } = getToneColors(f.tone);
      const coreWidth = Math.max(0.75, f.thickness * lastPt.scale * widthScale);

      const grad = ctx.createLinearGradient(firstPt.x, firstPt.y, lastPt.x, lastPt.y);
      grad.addColorStop(0.0, `rgba(${tail[0]}, ${tail[1]}, ${tail[2]}, 0)`);
      grad.addColorStop(0.3, `rgba(${tail[0]}, ${tail[1]}, ${tail[2]}, ${alpha * 0.32})`);
      grad.addColorStop(0.72, `rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, ${alpha * 0.78})`);
      grad.addColorStop(0.93, `rgba(${core[0]}, ${core[1]}, ${core[2]}, ${alpha})`);
      grad.addColorStop(1.0, `rgba(${core[0]}, ${core[1]}, ${core[2]}, ${alpha * 0.18})`);

      const tracePath = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) {
          ctx.lineTo(pts[k].x, pts[k].y);
        }
      };

      tracePath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = coreWidth * 4.0;
      ctx.globalAlpha = 0.24;
      ctx.stroke();

      tracePath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = coreWidth * 2.0;
      ctx.globalAlpha = 0.5;
      ctx.stroke();

      tracePath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = coreWidth;
      ctx.globalAlpha = 1.0;
      ctx.stroke();

      if (tHead > 0.03 && tHead < 0.97) {
        const glintR = Math.max(2.0, 4.8 * lastPt.scale * widthScale);
        const glint = ctx.createRadialGradient(lastPt.x, lastPt.y, 0, lastPt.x, lastPt.y, glintR);
        glint.addColorStop(0, `rgba(${core[0]}, ${core[1]}, ${core[2]}, ${alpha * 0.9})`);
        glint.addColorStop(0.45, `rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, ${alpha * 0.35})`);
        glint.addColorStop(1, `rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, 0)`);
        ctx.fillStyle = glint;
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, glintR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawAscendingAiLines(ctx: CanvasRenderingContext2D, config: TrafficConfig): void {
    const intensity = clamp(config.trailIntensity, 0.25, 1.0);
    const widthMul = clamp(config.lineThinness, 0.7, 1.4);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    for (const ai of this.aiLines) {
      const p = ai.progress;
      const yTip = lerp(ai.yStart, ai.yEnd, p);
      const yTail = yTip + ai.lengthPx;
      if (yTip > ai.yStart + 40 || yTail < ai.yEnd - 20) continue;

      const xTip = ai.x + ai.driftX * p;
      const tailFrac = clamp(p - ai.lengthPx / (ai.yStart - ai.yEnd), 0, 1);
      const xTail = ai.x + ai.driftX * tailFrac;

      const enterFade = clamp((p + 0.06) / 0.22, 0, 1);
      const exitFade = clamp((1.12 - p) / 0.28, 0, 1);
      const alpha = ai.brightness * intensity * enterFade * exitFade * 0.78;
      if (alpha < 0.012) continue;

      const palette =
        ai.tone === 'softGold'
          ? { core: [255, 252, 224], glow: [255, 226, 128], tail: [255, 198, 84] }
          : ai.tone === 'skyCyan'
          ? { core: [242, 254, 255], glow: [148, 232, 255], tail: [88, 198, 255] }
          : { core: [255, 255, 255], glow: [232, 246, 255], tail: [188, 224, 255] };

      const grad = ctx.createLinearGradient(xTail, yTail, xTip, yTip);
      grad.addColorStop(0.0, `rgba(${palette.tail[0]}, ${palette.tail[1]}, ${palette.tail[2]}, 0)`);
      grad.addColorStop(0.35, `rgba(${palette.tail[0]}, ${palette.tail[1]}, ${palette.tail[2]}, ${alpha * 0.28})`);
      grad.addColorStop(0.76, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, ${alpha * 0.72})`);
      grad.addColorStop(0.95, `rgba(${palette.core[0]}, ${palette.core[1]}, ${palette.core[2]}, ${alpha})`);
      grad.addColorStop(1.0, `rgba(${palette.core[0]}, ${palette.core[1]}, ${palette.core[2]}, ${alpha * 0.22})`);

      ctx.beginPath();
      ctx.moveTo(xTail, yTail);
      ctx.lineTo(xTip, yTip);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ai.thickness * 4.0 * widthMul;
      ctx.globalAlpha = 0.22;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xTail, yTail);
      ctx.lineTo(xTip, yTip);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ai.thickness * widthMul;
      ctx.globalAlpha = 1.0;
      ctx.stroke();

      if (ai.hasMicroTicks) {
        for (let k = 1; k <= 3; k++) {
          const frac = 0.14 * k;
          const tx = lerp(xTip, xTail, frac);
          const ty = lerp(yTip, yTail, frac);
          ctx.fillStyle = `rgba(${palette.core[0]}, ${palette.core[1]}, ${palette.core[2]}, ${alpha * (0.65 - k * 0.16)})`;
          ctx.beginPath();
          ctx.arc(tx, ty, Math.max(1.0, 1.45 * widthMul), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const nodeR = Math.max(2.2, 4.4 * widthMul);
      const nodeGrad = ctx.createRadialGradient(xTip, yTip, 0, xTip, yTip, nodeR);
      nodeGrad.addColorStop(0, `rgba(${palette.core[0]}, ${palette.core[1]}, ${palette.core[2]}, ${alpha * 0.92})`);
      nodeGrad.addColorStop(0.45, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, ${alpha * 0.35})`);
      nodeGrad.addColorStop(1, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, 0)`);
      ctx.fillStyle = nodeGrad;
      ctx.beginPath();
      ctx.arc(xTip, yTip, nodeR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

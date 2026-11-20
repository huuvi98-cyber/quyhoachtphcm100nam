export type VisualMode = 'lines' | 'rich' | 'original';
export type HeadlineMode = 'rise-loop' | 'rise-hold' | 'hidden';

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
  dinhHinhSprite: HTMLImageElement | null;
}

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1300;

// Wide clean sky patch (covers the entire baked-in red sweep bar x=198..1429, y=166..426 + DINH HINH)
const SKY_PATCH_X = 188;
const SKY_PATCH_Y = 162;
const SKY_PATCH_W = 1260;
const SKY_PATCH_H = 270;

// Right-side overlap strip (y=398..432) where the red sweep bottom briefly meets the lime box (t < 0.54s)
const RED_STRIP_X = 988;
const RED_STRIP_Y = 398;
const RED_STRIP_W = 456;
const RED_STRIP_H = 34;

// Exact coordinate box of the extracted dinhhinh_sprite.png asset
const DINH_HINH_X = 470;
const DINH_HINH_Y = 165;
const DINH_HINH_W = 980;
const DINH_HINH_H = 260;

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
// 1. Landmark 81 tower (center — pixel-accurate spire & setback contour)
const LANDMARK81_MASK: Array<[number, number]> = [
  [952, 48],
  [985, 48],
  [986, 292],
  [996, 326],
  [1010, 354],
  [1014, 430],
  [1022, 616],
  [1036, 650],
  [1036, 1300],
  [856, 1300],
  [858, 940],
  [880, 882],
  [886, 636],
  [906, 558],
  [914, 312],
  [922, 312],
  [922, 294],
  [952, 294],
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
  private redStripCanvas: HTMLCanvasElement | null = null;
  private redStripCtx: CanvasRenderingContext2D | null = null;
  private cleanSkyStripPixels: Uint8ClampedArray | null = null;
  private cleanSkyStripSource: HTMLImageElement | null = null;

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

    // Exclude ALL foreground buildings (Landmark 81, Vinhomes left towers, Tan Cang roof, right towers)
    // via evenodd clipping so BOTH the rising "ĐỊNH HÌNH" headline and light lines stay cleanly behind buildings.
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

    // 1. Restore clean sky first (erases both the baked-in horizontal red wipe bar and static "ĐỊNH HÌNH")
    // so ascending sky AI filaments glide cleanly behind the rising headline
    if (config.headlineMode !== 'hidden' && headlineAssets?.skyPatch) {
      this.drawCleanSkyOverSweepAndHeadline(ctx, videoEl, headlineAssets.skyPatch);
    }

    if (config.showAiLines) {
      this.drawAscendingAiLines(ctx, config);
    }

    if (config.headlineMode !== 'hidden' && headlineAssets) {
      this.drawRisingDinhHinh(ctx, headlineAssets);
    }

    if (config.trailIntensity > 0.01) {
      this.drawLuminousLines(ctx, config);
    }

    ctx.restore();
  }

  private ensureCleanSkyStripCache(skyPatch: HTMLImageElement): void {
    if (this.cleanSkyStripSource === skyPatch && this.cleanSkyStripPixels) return;
    if (typeof document === 'undefined') return;

    if (!this.redStripCanvas) {
      this.redStripCanvas = document.createElement('canvas');
      this.redStripCanvas.width = RED_STRIP_W;
      this.redStripCanvas.height = RED_STRIP_H;
      this.redStripCtx = this.redStripCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (!this.redStripCtx) return;

    this.redStripCtx.clearRect(0, 0, RED_STRIP_W, RED_STRIP_H);
    this.redStripCtx.drawImage(
      skyPatch,
      RED_STRIP_X - SKY_PATCH_X,
      RED_STRIP_Y - SKY_PATCH_Y,
      RED_STRIP_W,
      RED_STRIP_H,
      0,
      0,
      RED_STRIP_W,
      RED_STRIP_H
    );
    this.cleanSkyStripPixels = new Uint8ClampedArray(
      this.redStripCtx.getImageData(0, 0, RED_STRIP_W, RED_STRIP_H).data
    );
    this.cleanSkyStripSource = skyPatch;
  }

  private drawCleanSkyOverSweepAndHeadline(
    ctx: CanvasRenderingContext2D,
    videoEl: HTMLVideoElement | null,
    skyPatch: HTMLImageElement
  ): void {
    // A. Permanent sky restoration for y=162..398 across the entire sweep width (x=188..1448)
    // Completely removes the red wipe bar & baked-in "ĐỊNH HÌNH" without touching lower text (y>=400)
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

    // B. Permanent sky restoration strictly for the "dấu nặng" dot under "Ị" (x=622..653, y=377..412)
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

    // C. During the first 0.49s of the 5s loop (red sweep finishes at 0.44s; "SIÊU ĐÔ THỊ TOÀN CẦU," starts at 0.57s),
    // erase the 34px bottom edge (y=398..432) of the red sweep bar while keeping "LẤY CON NGƯỜI" untouched
    const vt = videoEl ? videoEl.currentTime : 1;
    if (vt < 0.49) {
      // Left half (x=188..950): "SIÊU ĐÔ THỊ TOÀN CẦU," hasn't appeared yet (starts at 0.57s)
      const leftW = 950 - SKY_PATCH_X;
      ctx.drawImage(
        skyPatch,
        0,
        398 - SKY_PATCH_Y,
        leftW,
        RED_STRIP_H,
        SKY_PATCH_X,
        398,
        leftW,
        RED_STRIP_H
      );

      // Right half (x=988..1444): selectively replace ONLY reddish sweep pixels on a tiny offscreen strip
      // so the lime-green box stays pixel-exact regardless of video frame timing
      if (videoEl && videoEl.readyState >= 2) {
        this.ensureCleanSkyStripCache(skyPatch);
        const sctx = this.redStripCtx;
        const skyPx = this.cleanSkyStripPixels;
        if (sctx && skyPx && this.redStripCanvas) {
          sctx.drawImage(
            videoEl,
            RED_STRIP_X,
            RED_STRIP_Y,
            RED_STRIP_W,
            RED_STRIP_H,
            0,
            0,
            RED_STRIP_W,
            RED_STRIP_H
          );
          const imgData = sctx.getImageData(0, 0, RED_STRIP_W, RED_STRIP_H);
          const data = imgData.data;
          let replacedAny = false;

          // Mark red/pinkish sweep pixels (strictly excludes lime green where g > r and blue sky where b > r)
          const isRed = new Uint8Array(RED_STRIP_W * RED_STRIP_H);
          for (let p = 0; p < isRed.length; p++) {
            const idx = p * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            if (r > 120 && r - g > 26 && r - b > 26) {
              isRed[p] = 1;
              replacedAny = true;
            }
          }

          if (replacedAny) {
            // Replace detected red pixels + 1px horizontal fringe (only if non-lime) with clean sky pixels
            for (let y = 0; y < RED_STRIP_H; y++) {
              const row = y * RED_STRIP_W;
              for (let x = 0; x < RED_STRIP_W; x++) {
                const p = row + x;
                const hit =
                  isRed[p] ||
                  (x > 0 && isRed[p - 1]) ||
                  (x + 1 < RED_STRIP_W && isRed[p + 1]);
                if (!hit) continue;
                const idx = p * 4;
                // Never overwrite lime-green pixels (g clearly dominates r and b)
                if (!isRed[p] && data[idx + 1] > 185 && data[idx + 1] > data[idx] + 8) {
                  continue;
                }
                data[idx] = skyPx[idx];
                data[idx + 1] = skyPx[idx + 1];
                data[idx + 2] = skyPx[idx + 2];
                data[idx + 3] = 255;
              }
            }
            sctx.putImageData(imgData, 0, 0);
            ctx.drawImage(this.redStripCanvas, RED_STRIP_X, RED_STRIP_Y);
          }
        }
      }
    }
  }

  private drawRisingDinhHinh(
    ctx: CanvasRenderingContext2D,
    assets: HeadlineAssets
  ): void {
    const { skyPatch, dinhHinhSprite } = assets;
    if (!skyPatch || !dinhHinhSprite) return;

    // Smooth 60fps bottom-up rise synchronized with the 5s video loop
    const startDelay = 0.08;
    const riseDuration = 1.42;
    const rawProgress = clamp((this.headlineElapsed - startDelay) / riseDuration, 0, 1);
    if (rawProgress <= 0) return;

    const eased = easeOutSilk(rawProgress);
    const travelY = 232;
    const offsetY = (1 - eased) * travelY;
    const alpha = clamp(rawProgress / 0.26, 0, 1);

    // Razor-straight architectural emergence line at y=396 (cleanly above "SIÊU ĐÔ THỊ TOÀN CẦU," & "LẤY CON NGƯỜI").
    // Once letters rise above y=396 (offsetY < 34), smoothly open the narrow column under "Ị" (x=614..660) to y=416
    // so the round "dấu nặng" dot (x=622..653) lands 100% full while staying clear of "À" in "TOÀN" (x=666..678).
    const dotReveal = clamp((34 - offsetY) / 24, 0, 1);
    const dotBottomY = lerp(396, 416, dotReveal);

    ctx.save();
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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(10, 48, 96, 0.22)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.drawImage(
      dinhHinhSprite,
      DINH_HINH_X,
      DINH_HINH_Y + offsetY,
      DINH_HINH_W,
      DINH_HINH_H
    );

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

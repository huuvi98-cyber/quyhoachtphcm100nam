export type VisualMode = 'lines' | 'rich' | 'original';
export type HeadlineMode = 'rise-loop' | 'rise-hold' | 'hidden';

export interface TrafficConfig {
  mode: VisualMode;
  headlineMode: HeadlineMode;
  speed: number; // 0.3 to 2.2
  density: number; // 0.3 to 1.5
  trailIntensity: number; // 0 to 1 (luminance / glow brightness)
  lineThinness: number; // 0.6 to 1.6 (stroke width multiplier; lower = ultra-fine)
  showMetro: boolean;
  showFrontage: boolean;
  showAiLines: boolean;
  paused: boolean;
}

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

interface RoadSample {
  y: number;
  xLeft: number;
  xRight: number;
}

// Calibrated pixel-for-pixel from the 1920x1080 HCMC Hanoi Highway / Metro Line 1 frame
const LEFT_CARRIAGEWAY: RoadSample[] = [
  { y: 562, xLeft: 944, xRight: 958 },
  { y: 600, xLeft: 930, xRight: 954 },
  { y: 650, xLeft: 898, xRight: 946 },
  { y: 700, xLeft: 836, xRight: 916 },
  { y: 750, xLeft: 824, xRight: 914 },
  { y: 800, xLeft: 838, xRight: 926 },
  { y: 850, xLeft: 842, xRight: 936 },
  { y: 900, xLeft: 838, xRight: 944 },
  { y: 950, xLeft: 828, xRight: 948 },
  { y: 1000, xLeft: 814, xRight: 951 },
  { y: 1080, xLeft: 794, xRight: 954 },
];

const RIGHT_CARRIAGEWAY: RoadSample[] = [
  { y: 562, xLeft: 964, xRight: 978 },
  { y: 600, xLeft: 960, xRight: 985 },
  { y: 650, xLeft: 952, xRight: 994 },
  { y: 700, xLeft: 940, xRight: 1008 },
  { y: 750, xLeft: 952, xRight: 1026 },
  { y: 800, xLeft: 962, xRight: 1044 },
  { y: 850, xLeft: 972, xRight: 1066 },
  { y: 900, xLeft: 978, xRight: 1088 },
  { y: 950, xLeft: 984, xRight: 1108 },
  { y: 1000, xLeft: 988, xRight: 1128 },
  { y: 1080, xLeft: 992, xRight: 1154 },
];

const RIGHT_FRONTAGE: RoadSample[] = [
  { y: 695, xLeft: 1054, xRight: 1084 },
  { y: 780, xLeft: 1095, xRight: 1138 },
  { y: 870, xLeft: 1152, xRight: 1205 },
  { y: 970, xLeft: 1208, xRight: 1274 },
  { y: 1080, xLeft: 1256, xRight: 1344 },
];

const LEFT_FRONTAGE: RoadSample[] = [
  { y: 675, xLeft: 766, xRight: 790 },
  { y: 775, xLeft: 682, xRight: 724 },
  { y: 885, xLeft: 568, xRight: 632 },
  { y: 990, xLeft: 446, xRight: 534 },
  { y: 1080, xLeft: 344, xRight: 454 },
];

const METRO_VIADUCT: RoadSample[] = [
  { y: 594, xLeft: 997, xRight: 1008 },
  { y: 650, xLeft: 1042, xRight: 1058 },
  { y: 720, xLeft: 1104, xRight: 1126 },
  { y: 800, xLeft: 1172, xRight: 1202 },
  { y: 890, xLeft: 1248, xRight: 1286 },
  { y: 985, xLeft: 1326, xRight: 1372 },
  { y: 1080, xLeft: 1400, xRight: 1456 },
];

const HEADLINE_LINES = [
  { text: 'ĐỊNH HÌNH SIÊU ĐÔ THỊ TOÀN CẦU,', baseY: 214, startDelay: 0.05 },
  { text: 'LẤY CON NGƯỜI LÀM', baseY: 316, startDelay: 0.21 },
  { text: 'TRUNG TÂM', baseY: 418, startDelay: 0.37 },
];

const HEADLINE_CYCLE_SEC = 5.5;

// Sky polygon above the HCMC skyline & foreground towers (measured pixel-for-pixel at 1920x1080)
const SKYLINE_CLIP_POINTS: Array<[number, number]> = [
  [0, 0],
  [1920, 0],
  [1920, 220],
  [1362, 258],
  [1318, 264],
  [1318, 336],
  [1298, 342],
  [1204, 354],
  [1204, 434],
  [1198, 420],
  [1162, 420],
  [1160, 434],
  [1128, 434],
  [1128, 504],
  [1100, 504],
  [1096, 466],
  [1048, 468],
  [1036, 504],
  [886, 504],
  [882, 444], // Landmark 81 spire right edge
  [875, 444], // Landmark 81 spire left edge
  [872, 504],
  [728, 504],
  [728, 378],
  [724, 364],
  [655, 362],
  [655, 320],
  [635, 304],
  [567, 298],
  [567, 286],
  [520, 255],
  [480, 226],
  [310, 226],
  [150, 236],
  [0, 236],
];

type CorridorId = 'leftMain' | 'rightMain' | 'leftFrontage' | 'rightFrontage' | 'metro';
type LineTone = 'warmWhite' | 'champagne' | 'amberRed' | 'rubyCoral' | 'metroCyan';

interface LightFilament {
  corridor: CorridorId;
  /** Direction along depth: +1 toward camera, -1 away toward Landmark 81 */
  direction: 1 | -1;
  /** Leading tip depth in [-0.2 .. 1.3] */
  z: number;
  /** Lane coordinate across road width [0.06 .. 0.94] */
  laneU: number;
  /** Calm, gentle speed in depth-units per second */
  baseSpeed: number;
  /** Filament arc length in depth-space */
  lengthZ: number;
  /** Base hairline thickness in foreground pixels (0.9 .. 2.2) */
  thickness: number;
  /** Subtle breathing phase */
  pulsePhase: number;
  pulseSpeed: number;
  /** Peak opacity [0.45 .. 0.95] */
  brightness: number;
  tone: LineTone;
  /** Priority rank 0..1 used to filter gracefully with density slider */
  rank: number;
}

interface AiAscendingLine {
  x: number;
  yStart: number;
  yEnd: number;
  /** Progress 0 (bottom skyline) -> 1 (upper sky) */
  progress: number;
  speed: number;
  lengthPx: number;
  thickness: number;
  brightness: number;
  tone: 'pearlGold' | 'softCyan' | 'warmIvory';
  hasMicroTicks: boolean;
  /** Slight outward fan tilt in pixels across full vertical travel */
  driftX: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function easeOutSilk(t: number): number {
  const u = clamp(t, 0, 1);
  // C3-continuous quintic ease-out: value=1, velocity=0, acceleration=0 smoothly at u=1 (zero snap)
  const inv = 1 - u;
  return 1 - inv * inv * inv * inv * inv;
}

function easeOutQuart(t: number): number {
  const u = clamp(t, 0, 1);
  const inv = 1 - u;
  return 1 - inv * inv * inv * inv;
}

function easeOutCubic(t: number): number {
  const u = clamp(t, 0, 1);
  const inv = 1 - u;
  return 1 - inv * inv * inv;
}

function easeInOutQuart(t: number): number {
  const u = clamp(t, 0, 1);
  return u < 0.5 ? 8 * u * u * u * u : 1 - Math.pow(-2 * u + 2, 4) / 2;
}

function sampleCorridorAtY(samples: RoadSample[], y: number): { xLeft: number; xRight: number } {
  if (y <= samples[0].y) {
    return { xLeft: samples[0].xLeft, xRight: samples[0].xRight };
  }
  const last = samples[samples.length - 1];
  if (y >= last.y) {
    return { xLeft: last.xLeft, xRight: last.xRight };
  }
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = (y - a.y) / (b.y - a.y);
      return {
        xLeft: lerp(a.xLeft, b.xLeft, t),
        xRight: lerp(a.xRight, b.xRight, t),
      };
    }
  }
  return { xLeft: last.xLeft, xRight: last.xRight };
}

function depthToPoint(
  samples: RoadSample[],
  z: number,
  laneU: number,
  perspectivePower = 2.15
): { x: number; y: number; scale: number } {
  const zClamped = clamp(z, 0, 1.06);
  const yStart = samples[0].y;
  const yEnd = samples[samples.length - 1].y;
  const persp = Math.pow(zClamped, perspectivePower);
  const y = yStart + (yEnd - yStart) * persp;
  const span = sampleCorridorAtY(samples, y);
  const x = span.xLeft + (span.xRight - span.xLeft) * laneU;
  const scale = lerp(0.16, 1.0, persp);
  return { x, y, scale };
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

function getToneColors(tone: LineTone): {
  core: [number, number, number];
  glow: [number, number, number];
  tail: [number, number, number];
} {
  switch (tone) {
    case 'warmWhite':
      return {
        core: [255, 252, 238],
        glow: [255, 224, 158],
        tail: [255, 188, 102],
      };
    case 'champagne':
      return {
        core: [255, 240, 202],
        glow: [255, 198, 118],
        tail: [244, 156, 72],
      };
    case 'amberRed':
      return {
        core: [255, 192, 148],
        glow: [255, 104, 72],
        tail: [224, 48, 42],
      };
    case 'rubyCoral':
      return {
        core: [255, 156, 134],
        glow: [248, 68, 62],
        tail: [198, 28, 38],
      };
    case 'metroCyan':
      return {
        core: [245, 252, 255],
        glow: [152, 224, 255],
        tail: [72, 174, 240],
      };
  }
}

interface HeadlineSprite {
  canvas: HTMLCanvasElement;
  logicalW: number;
  logicalH: number;
  baselineOffsetY: number;
}

export class TrafficEngine {
  private filaments: LightFilament[] = [];
  private aiLines: AiAscendingLine[] = [];
  private headlineSprites: HeadlineSprite[] = [];
  private time = 0;
  private headlineTime = 0;

  constructor() {
    this.initFilaments();
    this.initAiLines();
    this.buildHeadlineSprites();

    // Rebuild 2x supersampled sprites automatically once Barlow Condensed finishes loading
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts
        .load('700 94px "Barlow Condensed"')
        .then(() => this.buildHeadlineSprites())
        .catch(() => {});
      document.fonts.ready.then(() => this.buildHeadlineSprites()).catch(() => {});
    }
  }

  public resetHeadline(): void {
    this.headlineTime = 0;
  }

  /**
   * Pre-renders each headline line to a 2x supersampled offscreen canvas so drawImage()
   * uses true GPU sub-pixel bilinear filtering instead of fillText() integer pixel hinting,
   * eliminating all micro-jitter during slow deceleration near the stopping point.
   */
  private buildHeadlineSprites(): void {
    if (typeof document === 'undefined') return;
    const dpr = 2;
    const logicalW = 1600;
    const logicalH = 164;
    const baselineOffsetY = 120;

    this.headlineSprites = HEADLINE_LINES.map((line) => {
      const off = document.createElement('canvas');
      off.width = logicalW * dpr;
      off.height = logicalH * dpr;
      const octx = off.getContext('2d');
      if (octx) {
        octx.scale(dpr, dpr);
        octx.textAlign = 'center';
        octx.textBaseline = 'alphabetic';
        octx.font = '700 94px "Barlow Condensed", "Be Vietnam Pro", sans-serif';

        const octxWithSpacing = octx as CanvasRenderingContext2D & { letterSpacing?: string };
        if (typeof octxWithSpacing.letterSpacing === 'string') {
          octxWithSpacing.letterSpacing = '1.8px';
        }

        octx.shadowColor = 'rgba(118, 62, 12, 0.32)';
        octx.shadowBlur = 18;
        octx.shadowOffsetX = 0;
        octx.shadowOffsetY = 4;

        const textGrad = octx.createLinearGradient(0, baselineOffsetY - 90, 0, baselineOffsetY + 10);
        textGrad.addColorStop(0, '#FFFFFF');
        textGrad.addColorStop(0.75, '#FFFDF9');
        textGrad.addColorStop(1, '#FFF4E0');

        octx.fillStyle = textGrad;
        octx.fillText(line.text, logicalW / 2, baselineOffsetY);
      }
      return { canvas: off, logicalW, logicalH, baselineOffsetY };
    });
  }

  private initAiLines(): void {
    // Curated slender ascending AI light rails rising gracefully from behind Landmark 81 & skyline
    // Flanking and weaving softly behind "ĐỊNH HÌNH TẦM VÓC / SIÊU ĐÔ THỊ / TOÀN CẦU"
    const specs: Array<{
      x: number;
      yStart: number;
      yEnd: number;
      progress: number;
      speed: number;
      lengthPx: number;
      thickness: number;
      brightness: number;
      tone: 'pearlGold' | 'softCyan' | 'warmIvory';
      hasMicroTicks: boolean;
      driftX: number;
    }> = [
      { x: 584, yStart: 420, yEnd: 112, progress: 0.14, speed: 0.25, lengthPx: 122, thickness: 1.0, brightness: 0.62, tone: 'pearlGold', hasMicroTicks: false, driftX: -6 },
      { x: 696, yStart: 470, yEnd: 106, progress: 0.58, speed: 0.29, lengthPx: 145, thickness: 1.15, brightness: 0.72, tone: 'softCyan', hasMicroTicks: true, driftX: -4 },
      { x: 786, yStart: 505, yEnd: 102, progress: 0.32, speed: 0.27, lengthPx: 135, thickness: 0.95, brightness: 0.64, tone: 'warmIvory', hasMicroTicks: false, driftX: -2 },
      { x: 878, yStart: 495, yEnd: 98, progress: 0.04, speed: 0.31, lengthPx: 165, thickness: 1.25, brightness: 0.78, tone: 'pearlGold', hasMicroTicks: true, driftX: 0 },
      { x: 964, yStart: 510, yEnd: 100, progress: 0.72, speed: 0.28, lengthPx: 148, thickness: 1.1, brightness: 0.7, tone: 'softCyan', hasMicroTicks: false, driftX: 1 },
      { x: 1054, yStart: 486, yEnd: 104, progress: 0.44, speed: 0.26, lengthPx: 132, thickness: 1.0, brightness: 0.66, tone: 'warmIvory', hasMicroTicks: true, driftX: 3 },
      { x: 1150, yStart: 448, yEnd: 108, progress: 0.85, speed: 0.3, lengthPx: 138, thickness: 1.1, brightness: 0.68, tone: 'pearlGold', hasMicroTicks: false, driftX: 5 },
      { x: 1262, yStart: 392, yEnd: 114, progress: 0.22, speed: 0.24, lengthPx: 118, thickness: 0.95, brightness: 0.58, tone: 'softCyan', hasMicroTicks: false, driftX: 7 },
    ];
    this.aiLines = specs;
  }

  private initFilaments(): void {
    const rand = mulberry32(20252100);

    // 1. Left Main Carriageway (flowing gently TOWARD camera — warm champagne & ivory-gold slender lines)
    const leftLanes = [0.14, 0.25, 0.37, 0.52, 0.66, 0.78, 0.89];
    for (let i = 0; i < 42; i++) {
      const laneCenter = leftLanes[i % leftLanes.length];
      this.filaments.push({
        corridor: 'leftMain',
        direction: 1,
        z: rand() * 1.25 - 0.12,
        laneU: clamp(laneCenter + (rand() - 0.5) * 0.045, 0.07, 0.93),
        baseSpeed: 0.068 + rand() * 0.048, // Calm, serene architectural motion
        lengthZ: 0.14 + rand() * 0.16,
        thickness: 0.85 + rand() * 0.95,
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.8 + rand() * 0.9,
        brightness: 0.52 + rand() * 0.42,
        tone: rand() > 0.42 ? 'warmWhite' : 'champagne',
        rank: i / 42,
      });
    }

    // 2. Right Main Carriageway (flowing gently AWAY toward Landmark 81 — warm coral-amber & ruby silk lines)
    const rightLanes = [0.12, 0.24, 0.37, 0.51, 0.65, 0.78, 0.89];
    for (let i = 0; i < 42; i++) {
      const laneCenter = rightLanes[i % rightLanes.length];
      this.filaments.push({
        corridor: 'rightMain',
        direction: -1,
        z: rand() * 1.25 - 0.12,
        laneU: clamp(laneCenter + (rand() - 0.5) * 0.045, 0.07, 0.93),
        baseSpeed: 0.065 + rand() * 0.045,
        lengthZ: 0.14 + rand() * 0.17,
        thickness: 0.85 + rand() * 0.95,
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.8 + rand() * 0.9,
        brightness: 0.54 + rand() * 0.4,
        tone: rand() > 0.45 ? 'amberRed' : 'rubyCoral',
        rank: i / 42,
      });
    }

    // 3. Left & Right Song Hanh Frontage Roads (whisper-thin delicate threads)
    for (let i = 0; i < 12; i++) {
      this.filaments.push({
        corridor: 'leftFrontage',
        direction: 1,
        z: rand() * 1.2 - 0.1,
        laneU: 0.24 + (i % 3) * 0.25 + (rand() - 0.5) * 0.08,
        baseSpeed: 0.055 + rand() * 0.035,
        lengthZ: 0.14 + rand() * 0.14,
        thickness: 0.7 + rand() * 0.65,
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.9 + rand() * 0.7,
        brightness: 0.42 + rand() * 0.34,
        tone: 'champagne',
        rank: i / 12,
      });
    }

    for (let i = 0; i < 12; i++) {
      this.filaments.push({
        corridor: 'rightFrontage',
        direction: -1,
        z: rand() * 1.2 - 0.1,
        laneU: 0.24 + (i % 3) * 0.25 + (rand() - 0.5) * 0.08,
        baseSpeed: 0.055 + rand() * 0.035,
        lengthZ: 0.14 + rand() * 0.14,
        thickness: 0.7 + rand() * 0.65,
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.9 + rand() * 0.7,
        brightness: 0.42 + rand() * 0.34,
        tone: 'amberRed',
        rank: i / 12,
      });
    }

    // 4. Elevated Metro Line 1 Viaduct (sleek fine light streams gliding calmly on twin tracks)
    for (let i = 0; i < 6; i++) {
      const dir: 1 | -1 = i % 2 === 0 ? -1 : 1;
      this.filaments.push({
        corridor: 'metro',
        direction: dir,
        z: (i / 6) * 1.35 - 0.15,
        laneU: dir === 1 ? 0.28 : 0.72,
        baseSpeed: 0.095 + (i % 3) * 0.015,
        lengthZ: 0.24 + rand() * 0.1,
        thickness: 1.15 + rand() * 0.45,
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.7,
        brightness: 0.62 + rand() * 0.28,
        tone: dir === 1 ? 'warmWhite' : 'metroCyan',
        rank: i / 6,
      });
    }
  }

  public update(dtSeconds: number, config: TrafficConfig): void {
    if (config.paused) return;
    // Cap dt cleanly at 1/30s so brief browser pauses never create sudden motion jumps
    const rawDt = Math.min(Math.max(dtSeconds, 0), 1 / 30);
    const dt = rawDt * config.speed;
    this.time += dt;
    this.headlineTime += rawDt;

    for (const f of this.filaments) {
      f.z += f.direction * f.baseSpeed * dt;
      if (f.direction === 1 && f.z - f.lengthZ > 1.08) {
        f.z = -0.04;
      } else if (f.direction === -1 && f.z + f.lengthZ < -0.04) {
        f.z = 1.12;
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
    baseImage: HTMLImageElement | null,
    videoEl: HTMLVideoElement | null,
    config: TrafficConfig
  ): void {
    // 1. Original video comparison vs pristine 1920x1080 base plate
    if (config.mode === 'original') {
      if (videoEl && videoEl.readyState >= 2) {
        ctx.drawImage(videoEl, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else if (baseImage && baseImage.complete && baseImage.naturalWidth > 0) {
        ctx.drawImage(baseImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = '#181412';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      return;
    }

    if (baseImage && baseImage.complete && baseImage.naturalWidth > 0) {
      ctx.drawImage(baseImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (videoEl && videoEl.readyState >= 2) {
      ctx.drawImage(videoEl, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#181412';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Subtle warm golden-hour horizon shimmer behind Landmark 81
    this.drawHorizonAtmosphere(ctx);

    // 3. Sleek ascending AI light lines rising upward from skyline along with the headline
    if (config.showAiLines) {
      this.drawAscendingAiLines(ctx, config);
    }

    // 4. Smooth 60fps bottom-up display headline rising out from behind the city skyline
    if (config.headlineMode !== 'hidden') {
      this.drawHeadline(ctx, config);
    }

    // 5. Crisp top institutional header banner ("QUY HOẠCH TỔNG THỂ TPHCM GIAI ĐOẠN 2025-2050, TẦM NHÌN 100 NĂM")
    this.drawTopBanner(ctx);

    // 6. Delicate luminous light lines gliding gently along all perspective corridors
    if (config.trailIntensity > 0.01) {
      this.drawLuminousLines(ctx, config);
    }
  }

  private getSamplesForCorridor(corridor: CorridorId): RoadSample[] {
    switch (corridor) {
      case 'leftMain':
        return LEFT_CARRIAGEWAY;
      case 'rightMain':
        return RIGHT_CARRIAGEWAY;
      case 'leftFrontage':
        return LEFT_FRONTAGE;
      case 'rightFrontage':
        return RIGHT_FRONTAGE;
      case 'metro':
        return METRO_VIADUCT;
    }
  }

  private drawLuminousLines(ctx: CanvasRenderingContext2D, config: TrafficConfig): void {
    const isRich = config.mode === 'rich';
    const densityThreshold = clamp((config.density / 1.5) * (isRich ? 1.15 : 0.92), 0.2, 1.0);
    const intensity = config.trailIntensity * (isRich ? 1.22 : 0.92);
    const widthScale = config.lineThinness * (isRich ? 1.15 : 0.95);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Subtle permanent hairline guide shimmer on the elevated Metro rails & highway perspective
    if (config.showMetro) {
      this.drawSubtleRailShimmer(ctx, intensity * 0.24);
    }

    const segments = 12;

    for (const f of this.filaments) {
      if (f.rank > densityThreshold) continue;
      if (f.corridor === 'metro' && !config.showMetro) continue;
      if (!config.showFrontage && (f.corridor === 'leftFrontage' || f.corridor === 'rightFrontage')) {
        continue;
      }

      const samples = this.getSamplesForCorridor(f.corridor);
      const perspPower = f.corridor === 'metro' ? 1.85 : 2.15;

      const zHead = f.z;
      const zTail = f.z - f.direction * f.lengthZ;

      const zMin = Math.min(zHead, zTail);
      const zMax = Math.max(zHead, zTail);
      if (zMax <= 0.02 || zMin >= 1.05) continue;

      // Sample exact curved spine points from tail -> head
      const pts: Array<{ x: number; y: number; scale: number; z: number }> = [];
      for (let s = 0; s <= segments; s++) {
        const frac = s / segments; // 0 = tail, 1 = leading tip
        const z = lerp(zTail, zHead, frac);
        if (z < 0.015 || z > 1.055) continue;
        const p = depthToPoint(samples, z, f.laneU, perspPower);
        pts.push({ x: p.x, y: p.y, scale: p.scale, z });
      }

      if (pts.length < 2) continue;

      const firstPt = pts[0];
      const lastPt = pts[pts.length - 1];

      // Gentle entrance/exit envelope near horizon & bottom frame so lines never pop abruptly
      const midZ = clamp((zHead + zTail) * 0.5, 0, 1);
      const horizonFade = clamp((midZ - 0.02) / 0.14, 0, 1);
      const bottomFade = clamp((1.06 - midZ) / 0.1, 0, 1);
      const pulse = 0.88 + 0.12 * Math.sin(this.time * f.pulseSpeed + f.pulsePhase);

      const alpha = clamp(
        f.brightness * intensity * horizonFade * bottomFade * pulse,
        0,
        0.95
      );
      if (alpha < 0.015) continue;

      const { core, glow, tail } = getToneColors(f.tone);
      const headScale = lastPt.scale;
      const coreWidth = Math.max(0.6, f.thickness * lerp(0.35, 1.35, headScale) * widthScale);

      // Build multi-stop gradient along the exact path from tail -> tip
      const grad = ctx.createLinearGradient(firstPt.x, firstPt.y, lastPt.x, lastPt.y);
      grad.addColorStop(0.0, `rgba(${tail[0]}, ${tail[1]}, ${tail[2]}, 0)`);
      grad.addColorStop(0.28, `rgba(${tail[0]}, ${tail[1]}, ${tail[2]}, ${alpha * 0.28})`);
      grad.addColorStop(0.68, `rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, ${alpha * 0.72})`);
      grad.addColorStop(0.92, `rgba(${core[0]}, ${core[1]}, ${core[2]}, ${alpha})`);
      grad.addColorStop(1.0, `rgba(${core[0]}, ${core[1]}, ${core[2]}, ${alpha * 0.15})`);

      const tracePath = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) {
          ctx.lineTo(pts[k].x, pts[k].y);
        }
      };

      // Pass 1: Whisper-soft outer light aura
      tracePath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = coreWidth * 4.2;
      ctx.globalAlpha = 0.22;
      ctx.stroke();

      // Pass 2: Mid-bloom warm halo
      tracePath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = coreWidth * 2.0;
      ctx.globalAlpha = 0.45;
      ctx.stroke();

      // Pass 3: Razor-fine luminous filament core
      tracePath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = coreWidth;
      ctx.globalAlpha = 1.0;
      ctx.stroke();

      // Delicate pinpoint starlight glint near the leading tip (only when tip is inside frame)
      if (zHead > 0.06 && zHead < 1.02) {
        const glintR = Math.max(1.8, 4.6 * headScale * widthScale);
        const glint = ctx.createRadialGradient(
          lastPt.x,
          lastPt.y,
          0,
          lastPt.x,
          lastPt.y,
          glintR
        );
        glint.addColorStop(0, `rgba(${core[0]}, ${core[1]}, ${core[2]}, ${alpha * 0.85})`);
        glint.addColorStop(0.4, `rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, ${alpha * 0.3})`);
        glint.addColorStop(1, `rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, 0)`);
        ctx.fillStyle = glint;
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, glintR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawSubtleRailShimmer(ctx: CanvasRenderingContext2D, alpha: number): void {
    const tracks = [0.28, 0.72];
    for (const u of tracks) {
      const pStart = depthToPoint(METRO_VIADUCT, 0.02, u, 1.85);
      const pEnd = depthToPoint(METRO_VIADUCT, 1.0, u, 1.85);
      const grad = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y);
      grad.addColorStop(0, 'rgba(255, 224, 170, 0)');
      grad.addColorStop(0.5, `rgba(255, 232, 195, ${alpha})`);
      grad.addColorStop(1, 'rgba(255, 224, 170, 0)');

      ctx.beginPath();
      for (let s = 0; s <= 18; s++) {
        const pt = depthToPoint(METRO_VIADUCT, 0.02 + (s / 18) * 0.98, u, 1.85);
        if (s === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  }

  private clipSkyline(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(SKYLINE_CLIP_POINTS[0][0], SKYLINE_CLIP_POINTS[0][1]);
    for (let i = 1; i < SKYLINE_CLIP_POINTS.length; i++) {
      ctx.lineTo(SKYLINE_CLIP_POINTS[i][0], SKYLINE_CLIP_POINTS[i][1]);
    }
    ctx.closePath();
    ctx.clip();
  }

  private drawAscendingAiLines(ctx: CanvasRenderingContext2D, config: TrafficConfig): void {
    const intensity = clamp(config.trailIntensity, 0.25, 1.0);
    const widthMul = clamp(config.lineThinness, 0.65, 1.45);

    ctx.save();
    this.clipSkyline(ctx);
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    const drawSingleVerticalStreak = (
      xTip: number,
      yTip: number,
      xTail: number,
      yTail: number,
      thickness: number,
      alpha: number,
      tone: 'pearlGold' | 'softCyan' | 'warmIvory',
      hasMicroTicks: boolean
    ) => {
      if (alpha < 0.012) return;

      const palette =
        tone === 'softCyan'
          ? { core: [238, 252, 255], glow: [134, 224, 255], tail: [72, 180, 244] }
          : tone === 'pearlGold'
          ? { core: [255, 253, 242], glow: [255, 224, 152], tail: [248, 178, 86] }
          : { core: [255, 255, 250], glow: [255, 236, 198], tail: [255, 198, 124] };

      const grad = ctx.createLinearGradient(xTail, yTail, xTip, yTip);
      grad.addColorStop(0.0, `rgba(${palette.tail[0]}, ${palette.tail[1]}, ${palette.tail[2]}, 0)`);
      grad.addColorStop(0.32, `rgba(${palette.tail[0]}, ${palette.tail[1]}, ${palette.tail[2]}, ${alpha * 0.26})`);
      grad.addColorStop(0.76, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, ${alpha * 0.72})`);
      grad.addColorStop(0.95, `rgba(${palette.core[0]}, ${palette.core[1]}, ${palette.core[2]}, ${alpha})`);
      grad.addColorStop(1.0, `rgba(${palette.core[0]}, ${palette.core[1]}, ${palette.core[2]}, ${alpha * 0.25})`);

      // Soft atmospheric aura
      ctx.beginPath();
      ctx.moveTo(xTail, yTail);
      ctx.lineTo(xTip, yTip);
      ctx.strokeStyle = grad;
      ctx.lineWidth = thickness * 4.2 * widthMul;
      ctx.globalAlpha = 0.2;
      ctx.stroke();

      // Razor-fine luminous AI filament
      ctx.beginPath();
      ctx.moveTo(xTail, yTail);
      ctx.lineTo(xTip, yTip);
      ctx.strokeStyle = grad;
      ctx.lineWidth = thickness * widthMul;
      ctx.globalAlpha = 1.0;
      ctx.stroke();

      // Subtle micro-node segments trailing below the leading point for an architectural AI aesthetic
      if (hasMicroTicks) {
        const tickCount = 3;
        for (let k = 1; k <= tickCount; k++) {
          const frac = 0.14 * k;
          const tx = lerp(xTip, xTail, frac);
          const ty = lerp(yTip, yTail, frac);
          ctx.fillStyle = `rgba(${palette.core[0]}, ${palette.core[1]}, ${palette.core[2]}, ${alpha * (0.65 - k * 0.16)})`;
          ctx.beginPath();
          ctx.arc(tx, ty, Math.max(1.0, 1.45 * widthMul), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Delicate luminous leading node dot
      const nodeR = Math.max(2.2, 4.4 * widthMul);
      const nodeGrad = ctx.createRadialGradient(xTip, yTip, 0, xTip, yTip, nodeR);
      nodeGrad.addColorStop(0, `rgba(${palette.core[0]}, ${palette.core[1]}, ${palette.core[2]}, ${alpha * 0.92})`);
      nodeGrad.addColorStop(0.45, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, ${alpha * 0.35})`);
      nodeGrad.addColorStop(1, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, 0)`);
      ctx.fillStyle = nodeGrad;
      ctx.beginPath();
      ctx.arc(xTip, yTip, nodeR, 0, Math.PI * 2);
      ctx.fill();
    };

    // 1. Continuous ambient ascending AI vertical rails across the skyline
    for (const ai of this.aiLines) {
      const p = ai.progress;
      const yTip = lerp(ai.yStart, ai.yEnd, p);
      const yTail = yTip + ai.lengthPx;
      if (yTip > ai.yStart + 40 || yTail < ai.yEnd - 20) continue;

      const xTip = ai.x + ai.driftX * p;
      const tailFrac = clamp(p - ai.lengthPx / (ai.yStart - ai.yEnd), 0, 1);
      const xTail = ai.x + ai.driftX * tailFrac;

      // Soft envelope: emerges gently from skyline and dissolves cleanly below the top bar
      const enterFade = clamp((p + 0.06) / 0.22, 0, 1);
      const exitFade = clamp((1.12 - p) / 0.28, 0, 1);
      const alpha = ai.brightness * intensity * enterFade * exitFade * 0.72;

      drawSingleVerticalStreak(
        xTip,
        yTip,
        xTail,
        yTail,
        ai.thickness,
        alpha,
        ai.tone,
        ai.hasMicroTicks
      );
    }

    // 2. Synchronized upward AI light pulses launched right as the 3 headline lines rise
    if (config.headlineMode !== 'hidden') {
      const t =
        config.headlineMode === 'rise-loop'
          ? this.headlineTime % HEADLINE_CYCLE_SEC
          : this.headlineTime;

      const surgeSpecs: Array<{
        x: number;
        delay: number;
        tone: 'pearlGold' | 'softCyan' | 'warmIvory';
        driftX: number;
      }> = [
        { x: 642, delay: 0.02, tone: 'pearlGold', driftX: -5 },
        { x: 818, delay: 0.14, tone: 'softCyan', driftX: -2 },
        { x: 948, delay: 0.08, tone: 'warmIvory', driftX: 0 },
        { x: 1094, delay: 0.22, tone: 'softCyan', driftX: 2 },
        { x: 1226, delay: 0.3, tone: 'pearlGold', driftX: 5 },
      ];

      for (const s of surgeSpecs) {
        const localT = t - s.delay;
        const surgeDur = 1.28;
        if (localT <= 0 || localT >= surgeDur) continue;

        const prog = clamp(localT / surgeDur, 0, 1);
        const eased = easeOutQuart(prog);
        const yTip = lerp(498, 114, eased);
        const len = lerp(68, 175, Math.sin(prog * Math.PI));
        const yTail = yTip + len;
        const xTip = s.x + s.driftX * eased;
        const xTail = s.x + s.driftX * Math.max(0, eased - 0.25);

        const envelope = Math.sin(prog * Math.PI);
        const alpha = envelope * intensity * 0.88;

        drawSingleVerticalStreak(xTip, yTip, xTail, yTail, 1.25, alpha, s.tone, true);
      }
    }

    ctx.restore();
  }

  private drawHeadline(ctx: CanvasRenderingContext2D, config: TrafficConfig): void {
    const t =
      config.headlineMode === 'rise-loop'
        ? this.headlineTime % HEADLINE_CYCLE_SEC
        : this.headlineTime;

    const enterDuration = 1.12;
    const exitStart = 4.25;
    const exitDuration = 0.88;

    ctx.save();
    this.clipSkyline(ctx);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const centerX = 948;

    for (let i = 0; i < HEADLINE_LINES.length; i++) {
      const line = HEADLINE_LINES[i];
      const sprite = this.headlineSprites[i];
      const localT = t - line.startDelay;
      if (localT <= 0 || !sprite) continue;

      // Smooth C3-continuous quintic deceleration to an effortless, rock-steady stop
      const enterProgress = clamp(localT / enterDuration, 0, 1);
      const enterEase = easeOutSilk(enterProgress);
      const enterAlpha = easeOutCubic(clamp(localT / (enterDuration * 0.52), 0, 1));

      let offsetY = (1 - enterEase) * 96;
      let alpha = enterAlpha;

      // In looping mode, smoothly glide upward & dissolve out with C3 ease-in-out
      if (config.headlineMode === 'rise-loop') {
        const lineExitStart = exitStart + i * 0.065;
        if (t > lineExitStart) {
          const exitProgress = clamp((t - lineExitStart) / exitDuration, 0, 1);
          const exitEase = easeInOutQuart(exitProgress);
          offsetY -= exitEase * 36;
          alpha *= 1 - exitEase;
        }
      }

      if (alpha <= 0.004) continue;

      // Per-line horizontal reveal band wide enough for "ĐỊNH HÌNH SIÊU ĐÔ THỊ TOÀN CẦU,"
      ctx.save();
      const bandTop = line.baseY - 122;
      const bandBottom = line.baseY + 28;
      ctx.beginPath();
      ctx.rect(140, bandTop, 1640, bandBottom - bandTop);
      ctx.clip();

      ctx.globalAlpha = clamp(alpha, 0, 1);
      const drawX = centerX - sprite.logicalW / 2;
      const drawY = line.baseY + offsetY - sprite.baselineOffsetY;

      ctx.drawImage(sprite.canvas, drawX, drawY, sprite.logicalW, sprite.logicalH);

      ctx.restore();
    }

    ctx.restore();
  }

  private drawTopBanner(ctx: CanvasRenderingContext2D): void {
    const leftText = 'QUY HOẠCH TỔNG THỂ TPHCM GIAI ĐOẠN 2025-2050,';
    const badgeText = 'TẦM NHÌN 100 NĂM';

    ctx.save();
    ctx.font = '700 28px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const ctxWithSpacing = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    if (typeof ctxWithSpacing.letterSpacing === 'string') {
      ctxWithSpacing.letterSpacing = '1.4px';
    }

    const leftWidth = ctx.measureText(leftText).width;
    const badgeTextWidth = ctx.measureText(badgeText).width;
    const gap = 12;
    const badgePadX = 14;
    const badgeWidth = badgeTextWidth + badgePadX * 2;
    const badgeHeight = 46;
    const totalWidth = leftWidth + gap + badgeWidth;

    const centerX = 948;
    const centerY = 77;
    const startX = centerX - totalWidth / 2;

    // Left white title text over golden sky
    ctx.shadowColor = 'rgba(92, 54, 18, 0.28)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(leftText, startX, centerY + 1);

    // Right crimson highlight box ("TẦM NHÌN 100 NĂM") matching original #d55253 badge
    const badgeX = startX + leftWidth + gap;
    const badgeY = centerY - badgeHeight / 2;

    ctx.shadowColor = 'rgba(92, 34, 24, 0.22)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#D55253';
    ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(badgeText, badgeX + badgePadX, centerY + 1);

    ctx.restore();
  }

  private drawHorizonAtmosphere(ctx: CanvasRenderingContext2D): void {
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 0.8);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createRadialGradient(955, 555, 8, 955, 555, 220);
    grad.addColorStop(0, `rgba(255, 206, 132, ${0.13 + pulse * 0.045})`);
    grad.addColorStop(0.5, `rgba(240, 152, 76, ${0.055 + pulse * 0.02})`);
    grad.addColorStop(1, 'rgba(240, 140, 60, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(720, 340, 480, 420);
    ctx.restore();
  }
}

export const COVER_WIDTH = 1920;
export const COVER_HEIGHT = 1300;

export type NetworkColorKey = 'cyan' | 'electric' | 'gold';

interface PaletteSpec {
  rgb: [number, number, number];
}

const PALETTE: Record<NetworkColorKey, PaletteSpec> = {
  cyan: { rgb: [0, 240, 255] },
  electric: { rgb: [46, 134, 255] },
  gold: { rgb: [255, 212, 59] },
};

type Point2D = [number, number];

interface SampledPath {
  pts: Point2D[];
  cumLen: number[];
  totalLen: number;
}

interface LaneStream {
  lane: 'outbound' | 'inbound';
  t: number; // 0..1 progress in travel direction
  speed: number; // calm, steady speed
  lengthPx: number;
  color: NetworkColorKey;
  width: number;
  alpha: number;
}

interface BuildingRiseDef {
  id: string;
  x: number;
  yStart: number; // exact building rooftop Y
  yEnd: number; // gentle fade-out top Y
  color: NetworkColorKey;
  width: number;
  baseAlpha: number;
  speed: number;
  streakLenPx: number;
  phase: number;
}

// Exact Landmark 81 silhouette on the 1920x1300 cover video so lines pass cleanly BEHIND the tower
const LANDMARK81_MASK: Point2D[] = [
  [756, 140],
  [768, 178],
  [774, 425],
  [788, 476],
  [802, 502],
  [805, 845],
  [820, 864],
  [825, 1038],
  [829, 1300],
  [622, 1300],
  [625, 1232],
  [642, 1212],
  [653, 1138],
  [662, 814],
  [676, 744],
  [685, 648],
  [688, 450],
  [702, 428],
  [731, 424],
  [735, 178],
];

// Outbound carriageway (North/Inner highway deck: City Center -> Saigon Bridge -> sweeping bend toward Thu Duc)
const BRIDGE_OUTBOUND_POINTS: Point2D[] = [
  [630, 1272],
  [760, 1216],
  [900, 1162],
  [1050, 1104],
  [1200, 1046],
  [1300, 1008],
  [1400, 970],
  [1500, 932],
  [1600, 896],
  [1700, 860],
  [1762, 836],
  [1800, 818],
  [1812, 805],
  [1802, 795],
  [1774, 787],
];

// Inbound carriageway (South/Outer highway deck: sweeping around the bend from Thu Duc -> Saigon Bridge -> City Center)
const BRIDGE_INBOUND_POINTS: Point2D[] = [
  [1786, 786],
  [1814, 794],
  [1828, 806],
  [1822, 822],
  [1786, 844],
  [1715, 874],
  [1615, 912],
  [1515, 950],
  [1415, 988],
  [1315, 1024],
  [1215, 1062],
  [1070, 1118],
  [924, 1178],
  [786, 1236],
  [658, 1296],
];

// Ultra-fine, gentle upward light lines anchored precisely onto actual high-rise rooftops in the video
// Carefully kept below the top-left label and right headline ("TRUNG TÂM" ends around y=640)
const BUILDING_RISES: BuildingRiseDef[] = [
  // Far-left foreground residential towers
  {
    id: 'bldg-left-fg-1',
    x: 94,
    yStart: 1085,
    yEnd: 730,
    color: 'cyan',
    width: 0.8,
    baseAlpha: 0.2,
    speed: 0.11,
    streakLenPx: 72,
    phase: 0.05,
  },
  {
    id: 'bldg-left-fg-2',
    x: 186,
    yStart: 1105,
    yEnd: 780,
    color: 'electric',
    width: 0.75,
    baseAlpha: 0.18,
    speed: 0.1,
    streakLenPx: 66,
    phase: 0.42,
  },

  // Mid-left riverside skyline towers (left of Landmark 81)
  {
    id: 'bldg-left-mid-1',
    x: 334,
    yStart: 786,
    yEnd: 545,
    color: 'electric',
    width: 0.75,
    baseAlpha: 0.17,
    speed: 0.12,
    streakLenPx: 58,
    phase: 0.68,
  },
  {
    id: 'bldg-left-mid-2',
    x: 418,
    yStart: 758,
    yEnd: 495,
    color: 'cyan',
    width: 0.8,
    baseAlpha: 0.19,
    speed: 0.11,
    streakLenPx: 62,
    phase: 0.22,
  },
  {
    id: 'bldg-saigon-pearl-1',
    x: 538,
    yStart: 882,
    yEnd: 515,
    color: 'gold',
    width: 0.85,
    baseAlpha: 0.22,
    speed: 0.13,
    streakLenPx: 78,
    phase: 0.14,
  },
  {
    id: 'bldg-saigon-pearl-2',
    x: 604,
    yStart: 888,
    yEnd: 545,
    color: 'cyan',
    width: 0.8,
    baseAlpha: 0.2,
    speed: 0.11,
    streakLenPx: 72,
    phase: 0.56,
  },

  // Central-right bright white twin towers near Saigon Bridge (fading strictly below headline at y=675)
  {
    id: 'bldg-twin-left',
    x: 1248,
    yStart: 840,
    yEnd: 676,
    color: 'cyan',
    width: 0.85,
    baseAlpha: 0.21,
    speed: 0.14,
    streakLenPx: 52,
    phase: 0.31,
  },
  {
    id: 'bldg-twin-right',
    x: 1318,
    yStart: 840,
    yEnd: 678,
    color: 'gold',
    width: 0.85,
    baseAlpha: 0.21,
    speed: 0.13,
    streakLenPx: 52,
    phase: 0.77,
  },

  // Far-right high-rise cluster (exact rooftops verified at 20px zoom)
  {
    id: 'bldg-east-1',
    x: 1538,
    yStart: 786,
    yEnd: 535,
    color: 'electric',
    width: 0.8,
    baseAlpha: 0.18,
    speed: 0.12,
    streakLenPx: 60,
    phase: 0.19,
  },
  {
    id: 'bldg-east-2',
    x: 1628,
    yStart: 770,
    yEnd: 465,
    color: 'gold',
    width: 0.85,
    baseAlpha: 0.21,
    speed: 0.11,
    streakLenPx: 74,
    phase: 0.62,
  },
  {
    id: 'bldg-east-3',
    x: 1708,
    yStart: 754,
    yEnd: 445,
    color: 'cyan',
    width: 0.8,
    baseAlpha: 0.2,
    speed: 0.12,
    streakLenPx: 72,
    phase: 0.38,
  },
  {
    id: 'bldg-east-4',
    x: 1760,
    yStart: 742,
    yEnd: 410,
    color: 'gold',
    width: 0.85,
    baseAlpha: 0.22,
    speed: 0.1,
    streakLenPx: 76,
    phase: 0.84,
  },
  {
    id: 'bldg-east-5',
    x: 1882,
    yStart: 766,
    yEnd: 455,
    color: 'cyan',
    width: 0.8,
    baseAlpha: 0.19,
    speed: 0.11,
    streakLenPx: 68,
    phase: 0.49,
  },
];

function sampleSpline(controlPts: Point2D[], samplesPerSeg = 20): SampledPath {
  if (controlPts.length < 2) {
    return { pts: controlPts.slice(), cumLen: [0], totalLen: 1 };
  }
  const pts: Point2D[] = [];
  const n = controlPts.length;

  for (let i = 0; i < n - 1; i++) {
    const p0 = controlPts[Math.max(0, i - 1)];
    const p1 = controlPts[i];
    const p2 = controlPts[i + 1];
    const p3 = controlPts[Math.min(n - 1, i + 2)];

    for (let s = 0; s < samplesPerSeg; s++) {
      const t = s / samplesPerSeg;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      pts.push([x, y]);
    }
  }
  pts.push(controlPts[n - 1]);

  const cumLen: number[] = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    cumLen.push(total);
  }
  return { pts, cumLen, totalLen: Math.max(total, 1) };
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function getPointAtFraction(path: SampledPath, frac: number): Point2D {
  const f = clamp(frac, 0, 1);
  const target = f * path.totalLen;
  const { pts, cumLen } = path;

  let lo = 0;
  let hi = cumLen.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cumLen[mid] <= target) lo = mid;
    else hi = mid;
  }

  const segLen = cumLen[hi] - cumLen[lo];
  const u = segLen > 0.0001 ? (target - cumLen[lo]) / segLen : 0;
  return [
    pts[lo][0] + (pts[hi][0] - pts[lo][0]) * u,
    pts[lo][1] + (pts[hi][1] - pts[lo][1]) * u,
  ];
}

function traceSubPath(
  ctx: CanvasRenderingContext2D,
  path: SampledPath,
  f0: number,
  f1: number
): void {
  const startFrac = clamp(f0, 0, 1);
  const endFrac = clamp(f1, 0, 1);
  if (endFrac <= startFrac + 0.0005) return;

  const startDist = startFrac * path.totalLen;
  const endDist = endFrac * path.totalLen;
  const { pts, cumLen } = path;

  const pStart = getPointAtFraction(path, startFrac);
  ctx.beginPath();
  ctx.moveTo(pStart[0], pStart[1]);

  for (let i = 1; i < pts.length; i++) {
    const d = cumLen[i];
    if (d <= startDist) continue;
    if (d >= endDist) break;
    ctx.lineTo(pts[i][0], pts[i][1]);
  }

  const pEnd = getPointAtFraction(path, endFrac);
  ctx.lineTo(pEnd[0], pEnd[1]);
}

export class DigitalNetworkOverlay {
  private readonly outboundPath: SampledPath;
  private readonly inboundPath: SampledPath;
  private readonly laneStreams: LaneStream[];
  private readonly buildingPhases: number[];
  private elapsed = 0;

  constructor() {
    this.outboundPath = sampleSpline(BRIDGE_OUTBOUND_POINTS, 22);
    this.inboundPath = sampleSpline(BRIDGE_INBOUND_POINTS, 22);

    // Calm, refined dual-lane opposing traffic light trails across Saigon Bridge
    this.laneStreams = [
      // Outbound lane (City Center -> Thu Duc): cool cyan & electric blue
      { lane: 'outbound', t: 0.05, speed: 0.21, lengthPx: 185, color: 'cyan', width: 1.65, alpha: 0.62 },
      { lane: 'outbound', t: 0.42, speed: 0.19, lengthPx: 155, color: 'electric', width: 1.5, alpha: 0.56 },
      { lane: 'outbound', t: 0.78, speed: 0.22, lengthPx: 170, color: 'cyan', width: 1.55, alpha: 0.58 },

      // Inbound lane (Thu Duc -> City Center, opposite direction): warm gold & cyan accents
      { lane: 'inbound', t: 0.14, speed: 0.2, lengthPx: 180, color: 'gold', width: 1.65, alpha: 0.62 },
      { lane: 'inbound', t: 0.52, speed: 0.18, lengthPx: 150, color: 'gold', width: 1.5, alpha: 0.55 },
      { lane: 'inbound', t: 0.86, speed: 0.21, lengthPx: 165, color: 'cyan', width: 1.45, alpha: 0.52 },
    ];

    this.buildingPhases = BUILDING_RISES.map((b) => b.phase);
  }

  reset(): void {
    this.elapsed = 0;
  }

  update(dt: number, paused = false): void {
    if (paused) return;
    const safeDt = clamp(dt, 0, 0.05);
    this.elapsed += safeDt;

    for (const s of this.laneStreams) {
      s.t += s.speed * safeDt;
      if (s.t > 1.24) s.t -= 1.24;
    }

    for (let i = 0; i < BUILDING_RISES.length; i++) {
      this.buildingPhases[i] += BUILDING_RISES[i].speed * safeDt;
      if (this.buildingPhases[i] > 1.35) {
        this.buildingPhases[i] -= 1.35;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const fadeInGlobal = clamp(this.elapsed / 1.2, 0, 1);

    ctx.save();

    // Clip OUT Landmark 81 silhouette so bridge lanes and nearby building lines sit naturally behind the tower
    ctx.beginPath();
    ctx.rect(0, 0, COVER_WIDTH, COVER_HEIGHT);
    ctx.moveTo(LANDMARK81_MASK[0][0], LANDMARK81_MASK[0][1]);
    for (let i = 1; i < LANDMARK81_MASK.length; i++) {
      ctx.lineTo(LANDMARK81_MASK[i][0], LANDMARK81_MASK[i][1]);
    }
    ctx.closePath();
    ctx.clip('evenodd');

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Hairline light threads rising softly upward from high-rise building rooftops
    this.drawBuildingRisingLines(ctx, fadeInGlobal);

    // 2. Soft, slower two-way opposing traffic light lanes crossing Saigon Bridge
    this.drawTwoWayBridgeLanes(ctx, fadeInGlobal);

    ctx.restore();
  }

  private drawTwoWayBridgeLanes(ctx: CanvasRenderingContext2D, fadeIn: number): void {
    const breathe = 0.85 + 0.15 * Math.sin(this.elapsed * 1.4);

    // Delicate baseline guide for Outbound lane (cyan -> electric blue)
    this.drawSoftLaneBed(ctx, this.outboundPath, PALETTE.cyan, PALETTE.electric, fadeIn * breathe);

    // Delicate baseline guide for Inbound lane (gold -> cyan)
    this.drawSoftLaneBed(ctx, this.inboundPath, PALETTE.gold, PALETTE.cyan, fadeIn * breathe);

    // Gentle opposing-direction vehicle light streaks
    for (const s of this.laneStreams) {
      const path = s.lane === 'outbound' ? this.outboundPath : this.inboundPath;
      const span = clamp(s.lengthPx / path.totalLen, 0.08, 0.22);
      const head = s.t;
      const tail = head - span;
      if (head <= 0 || tail >= 1) continue;

      const pal = PALETTE[s.color];
      const enterAlpha = clamp(head / 0.14, 0, 1);
      const exitAlpha = clamp((1.16 - head) / 0.2, 0, 1);
      const alpha = enterAlpha * exitAlpha * s.alpha * fadeIn;
      if (alpha <= 0.015) continue;

      this.drawStreak(ctx, path, Math.max(0, tail), Math.min(1, head), pal, s.width, alpha);

      if (head > 0.015 && head < 0.985) {
        const pt = getPointAtFraction(path, head);
        this.drawSpark(ctx, pt[0], pt[1], pal, s.width * 2.5, alpha * 0.85);
      }
    }
  }

  private drawSoftLaneBed(
    ctx: CanvasRenderingContext2D,
    path: SampledPath,
    palA: PaletteSpec,
    palB: PaletteSpec,
    factor: number
  ): void {
    const p0 = getPointAtFraction(path, 0);
    const p1 = getPointAtFraction(path, 1);

    // Very soft atmospheric bloom
    const haloGrad = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    haloGrad.addColorStop(0, `rgba(${palA.rgb[0]}, ${palA.rgb[1]}, ${palA.rgb[2]}, ${(0.12 * factor).toFixed(3)})`);
    haloGrad.addColorStop(1, `rgba(${palB.rgb[0]}, ${palB.rgb[1]}, ${palB.rgb[2]}, ${(0.1 * factor).toFixed(3)})`);
    traceSubPath(ctx, path, 0, 1);
    ctx.strokeStyle = haloGrad;
    ctx.lineWidth = 4.6;
    ctx.stroke();

    // Fine luminous lane thread
    const coreGrad = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    coreGrad.addColorStop(0, `rgba(${palA.rgb[0]}, ${palA.rgb[1]}, ${palA.rgb[2]}, ${(0.34 * factor).toFixed(3)})`);
    coreGrad.addColorStop(1, `rgba(${palB.rgb[0]}, ${palB.rgb[1]}, ${palB.rgb[2]}, ${(0.28 * factor).toFixed(3)})`);
    traceSubPath(ctx, path, 0, 1);
    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 1.15;
    ctx.stroke();
  }

  private drawBuildingRisingLines(ctx: CanvasRenderingContext2D, fadeIn: number): void {
    for (let i = 0; i < BUILDING_RISES.length; i++) {
      const b = BUILDING_RISES[i];
      const pal = PALETTE[b.color];
      const totalH = Math.max(1, b.yStart - b.yEnd);
      const breathe = 0.72 + 0.28 * Math.sin(this.elapsed * 1.1 + i * 1.15);
      const a = b.baseAlpha * breathe * fadeIn;

      // Soft whisper-thin outer aura rising straight up from rooftop
      const auraGrad = ctx.createLinearGradient(b.x, b.yStart, b.x, b.yEnd);
      auraGrad.addColorStop(0, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, ${(a * 0.52).toFixed(3)})`);
      auraGrad.addColorStop(0.55, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, ${(a * 0.28).toFixed(3)})`);
      auraGrad.addColorStop(1, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, 0)`);

      ctx.beginPath();
      ctx.moveTo(b.x, b.yStart);
      ctx.lineTo(b.x, b.yEnd);
      ctx.strokeStyle = auraGrad;
      ctx.lineWidth = b.width * 2.6;
      ctx.stroke();

      // Razor-fine hairline filament
      const stemGrad = ctx.createLinearGradient(b.x, b.yStart, b.x, b.yEnd);
      stemGrad.addColorStop(0, `rgba(255, 255, 255, ${(a * 0.65).toFixed(3)})`);
      stemGrad.addColorStop(0.35, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, ${(a * 0.62).toFixed(3)})`);
      stemGrad.addColorStop(1, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, 0)`);

      ctx.beginPath();
      ctx.moveTo(b.x, b.yStart);
      ctx.lineTo(b.x, b.yEnd);
      ctx.strokeStyle = stemGrad;
      ctx.lineWidth = b.width;
      ctx.stroke();

      // Tiny subtle pinpoint light resting on the building rooftop
      this.drawSpark(ctx, b.x, b.yStart, pal, 2.8, a * 1.25);

      // Slow, gentle ascending light particle gliding upward along the hairline
      const head = this.buildingPhases[i];
      const span = clamp(b.streakLenPx / totalH, 0.16, 0.36);
      const tail = head - span;

      if (head > 0 && tail < 1) {
        const segStart = clamp(tail, 0, 1);
        const segEnd = clamp(head, 0, 1);
        if (segEnd > segStart + 0.005) {
          const y0 = b.yStart - segStart * totalH;
          const y1 = b.yStart - segEnd * totalH;

          const enterA = clamp(head / 0.22, 0, 1);
          const exitA = clamp((1.05 - head) / 0.38, 0, 1);
          const pAlpha = enterA * exitA * (b.baseAlpha * 1.85) * fadeIn;

          if (pAlpha > 0.015) {
            const pGrad = ctx.createLinearGradient(b.x, y0, b.x, y1);
            pGrad.addColorStop(0, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, 0)`);
            pGrad.addColorStop(0.6, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, ${(pAlpha * 0.85).toFixed(3)})`);
            pGrad.addColorStop(1, `rgba(255, 255, 255, ${pAlpha.toFixed(3)})`);

            ctx.beginPath();
            ctx.moveTo(b.x, y0);
            ctx.lineTo(b.x, y1);
            ctx.strokeStyle = pGrad;
            ctx.lineWidth = b.width * 1.15;
            ctx.stroke();

            if (head > 0.02 && head < 0.96) {
              this.drawSpark(ctx, b.x, y1, pal, 2.6, pAlpha * 0.9);
            }
          }
        }
      }
    }
  }

  private drawStreak(
    ctx: CanvasRenderingContext2D,
    path: SampledPath,
    f0: number,
    f1: number,
    pal: PaletteSpec,
    width: number,
    alpha: number
  ): void {
    if (f1 <= f0 + 0.002) return;
    const pStart = getPointAtFraction(path, f0);
    const pEnd = getPointAtFraction(path, f1);

    const gradGlow = ctx.createLinearGradient(pStart[0], pStart[1], pEnd[0], pEnd[1]);
    gradGlow.addColorStop(0, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, 0)`);
    gradGlow.addColorStop(0.55, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, ${(alpha * 0.24).toFixed(3)})`);
    gradGlow.addColorStop(1, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, ${(alpha * 0.45).toFixed(3)})`);

    traceSubPath(ctx, path, f0, f1);
    ctx.strokeStyle = gradGlow;
    ctx.lineWidth = width * 3.4;
    ctx.stroke();

    const gradCore = ctx.createLinearGradient(pStart[0], pStart[1], pEnd[0], pEnd[1]);
    gradCore.addColorStop(0, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, 0)`);
    gradCore.addColorStop(0.55, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, ${(alpha * 0.85).toFixed(3)})`);
    gradCore.addColorStop(0.92, `rgba(255, 255, 255, ${(alpha * 0.88).toFixed(3)})`);
    gradCore.addColorStop(1, `rgba(255, 255, 255, ${(alpha * 0.92).toFixed(3)})`);

    traceSubPath(ctx, path, f0, f1);
    ctx.strokeStyle = gradCore;
    ctx.lineWidth = Math.max(1.0, width * 0.95);
    ctx.stroke();
  }

  private drawSpark(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pal: PaletteSpec,
    radius: number,
    alpha: number
  ): void {
    const r = Math.max(2, radius);
    const a = clamp(alpha, 0, 1);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255, 255, 255, ${a.toFixed(3)})`);
    g.addColorStop(0.35, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, ${(a * 0.72).toFixed(3)})`);
    g.addColorStop(1, `rgba(${pal.rgb[0]}, ${pal.rgb[1]}, ${pal.rgb[2]}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

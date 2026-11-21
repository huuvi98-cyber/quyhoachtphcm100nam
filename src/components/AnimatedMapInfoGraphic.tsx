import { useEffect, useState } from 'react';

export type MapInfoKey = 'population' | 'economy';

export interface MapInfoCardConfig {
  key: MapInfoKey;
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const MAP_INFO_CARDS: Record<MapInfoKey, MapInfoCardConfig> = {
  population: {
    key: 'population',
    title: 'Quy mô dân số',
    src: '/assets/aistudio/info_dan_so_75fd43b1.png',
    alt: 'Quy mô dân số TPHCM dự kiến: 18 triệu người năm 2030, 25 triệu năm 2045 và 27 triệu năm 2050',
    width: 994,
    height: 449,
  },
  economy: {
    key: 'economy',
    title: 'Kinh tế & Kinh tế số',
    src: '/assets/aistudio/info_kinh_te_4d8bb2d5.png',
    alt: 'Kinh tế TPHCM năm 2030: GRDP tăng từ 10% mỗi năm, quy mô GRDP 200-225 tỷ USD; tỷ trọng kinh tế số đạt 40% GRDP năm 2030 và 60% GRDP năm 2035',
    width: 994,
    height: 492,
  },
};

function easeOutCubic(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - clamped, 3);
}

function stepCount(elapsedMs: number, startMs: number, durationMs: number, target: number): number {
  if (elapsedMs <= startMs) return 0;
  const progress = easeOutCubic((elapsedMs - startMs) / durationMs);
  return Math.round(progress * target);
}

interface AnimatedMapInfoGraphicProps {
  kind: MapInfoKey;
  /** Delay in ms before the number count-up begins (synced with card pop-up entrance). */
  startDelayMs?: number;
  className?: string;
}

interface CounterValues {
  pop2030: number;
  pop2045: number;
  pop2050: number;
  grdpGrowth: number;
  grdpLow: number;
  grdpHigh: number;
  digital2030: number;
  digital2035: number;
}

const FINAL_VALUES: CounterValues = {
  pop2030: 18,
  pop2045: 25,
  pop2050: 27,
  grdpGrowth: 10,
  grdpLow: 200,
  grdpHigh: 225,
  digital2030: 40,
  digital2035: 60,
};

const ZERO_VALUES: CounterValues = {
  pop2030: 0,
  pop2045: 0,
  pop2050: 0,
  grdpGrowth: 0,
  grdpLow: 0,
  grdpHigh: 0,
  digital2030: 0,
  digital2035: 0,
};

export function AnimatedMapInfoGraphic({
  kind,
  startDelayMs = 0,
  className = 'block w-full h-auto',
}: AnimatedMapInfoGraphicProps) {
  const card = MAP_INFO_CARDS[kind];

  const [values, setValues] = useState<CounterValues>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return FINAL_VALUES;
    }
    return ZERO_VALUES;
  });

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValues(FINAL_VALUES);
      return;
    }

    setValues(ZERO_VALUES);
    let rafId = 0;
    const totalEndMs = startDelayMs + 2050;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;

      if (kind === 'population') {
        setValues({
          ...ZERO_VALUES,
          pop2030: stepCount(elapsed, startDelayMs, 1200, 18),
          pop2045: stepCount(elapsed, startDelayMs + 220, 1300, 25),
          pop2050: stepCount(elapsed, startDelayMs + 440, 1400, 27),
        });
      } else {
        setValues({
          ...ZERO_VALUES,
          grdpGrowth: stepCount(elapsed, startDelayMs, 1150, 10),
          grdpLow: stepCount(elapsed, startDelayMs + 160, 1500, 200),
          grdpHigh: stepCount(elapsed, startDelayMs + 160, 1500, 225),
          digital2030: stepCount(elapsed, startDelayMs + 260, 1300, 40),
          digital2035: stepCount(elapsed, startDelayMs + 420, 1400, 60),
        });
      }

      if (elapsed < totalEndMs) {
        rafId = requestAnimationFrame(tick);
      } else {
        setValues(FINAL_VALUES);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [kind, startDelayMs]);

  const numeralColor = '#0060B5';
  const numeralStyle = {
    fontFamily: '"Be Vietnam Pro", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums' as const,
    letterSpacing: '-0.03em',
  };

  if (kind === 'population') {
    return (
      <svg
        viewBox={`0 0 ${card.width} ${card.height}`}
        width={card.width}
        height={card.height}
        role="img"
        aria-label={card.alt}
        className={className}
      >
        <image
          href={card.src}
          x={0}
          y={0}
          width={card.width}
          height={card.height}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* 18 triệu (Năm 2030) */}
        <rect x={62} y={275} width={86} height={58} fill="#FFFFFF" />
        <text
          x={142}
          y={327}
          textAnchor="end"
          fill={numeralColor}
          fontSize={60}
          style={numeralStyle}
        >
          {values.pop2030}
        </text>

        {/* 25 triệu (2045) */}
        <rect x={400} y={206} width={88} height={58} fill="#FFFFFF" />
        <text
          x={482}
          y={258}
          textAnchor="end"
          fill={numeralColor}
          fontSize={60}
          style={numeralStyle}
        >
          {values.pop2045}
        </text>

        {/* 27 triệu (2050) */}
        <rect x={695} y={135} width={89} height={59} fill="#FFFFFF" />
        <text
          x={778}
          y={187}
          textAnchor="end"
          fill={numeralColor}
          fontSize={60}
          style={numeralStyle}
        >
          {values.pop2050}
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${card.width} ${card.height}`}
      width={card.width}
      height={card.height}
      role="img"
      aria-label={card.alt}
      className={className}
    >
      <image
        href={card.src}
        x={0}
        y={0}
        width={card.width}
        height={card.height}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* GRDP >= 10% */}
      <rect x={219} y={140} width={144} height={59} fill="#FFFFFF" />
      <text
        x={224}
        y={192}
        textAnchor="start"
        fill={numeralColor}
        fontSize={58}
        style={numeralStyle}
      >
        {values.grdpGrowth}%
      </text>

      {/* Quy mô GRDP 200-225 tỷ USD */}
      <rect x={52} y={375} width={264} height={59} fill="#FFFFFF" />
      <text
        x={56}
        y={427}
        textAnchor="start"
        fill={numeralColor}
        fontSize={53}
        style={numeralStyle}
      >
        {values.grdpLow}-{values.grdpHigh}
      </text>

      {/* 40% GRDP năm 2030 */}
      <rect x={550} y={151} width={142} height={59} fill="#FFFFFF" />
      <text
        x={556}
        y={203}
        textAnchor="start"
        fill={numeralColor}
        fontSize={56}
        style={numeralStyle}
      >
        {values.digital2030}%
      </text>

      {/* 60% GRDP năm 2035 */}
      <rect x={550} y={300} width={142} height={59} fill="#FFFFFF" />
      <text
        x={556}
        y={352}
        textAnchor="start"
        fill={numeralColor}
        fontSize={56}
        style={numeralStyle}
      >
        {values.digital2035}%
      </text>
    </svg>
  );
}

interface SkylinePillarsIconProps {
  className?: string;
}

// 14 isometric skyline pillars matching the exact rhythmic silhouette of the reference graphic
const PILLAR_HEIGHTS = [74, 53, 27, 53, 74, 96, 27, 74, 53, 27, 53, 74, 96, 27];

interface AiBeamSpec {
  x: number;
  startY: number;
  travelY: number;
  length: number;
  duration: string;
  begin: string;
  tone: 'cyan' | 'gold' | 'white';
  hasMicroTicks?: boolean;
}

export function SkylinePillarsIcon({ className = '' }: SkylinePillarsIconProps) {
  const baselineY = 140;
  const colW = 14;
  const capH = 7;
  const stepX = 29;
  const startX = 64;

  // Staggered slender vertical AI light lines rising along pillar ridges and soaring above peaks
  const aiBeams: AiBeamSpec[] = [
    { x: startX + 0 * stepX, startY: baselineY + 12, travelY: 132, length: 34, duration: '3.4s', begin: '-0.4s', tone: 'cyan' },
    { x: startX + 3 * stepX, startY: baselineY + 10, travelY: 112, length: 28, duration: '3.9s', begin: '-2.1s', tone: 'white' },
    { x: startX + 5 * stepX, startY: baselineY + 14, travelY: 148, length: 42, duration: '3.1s', begin: '-1.2s', tone: 'gold', hasMicroTicks: true },
    { x: startX + 7 * stepX, startY: baselineY + 12, travelY: 134, length: 34, duration: '3.6s', begin: '-2.8s', tone: 'cyan' },
    { x: startX + 10 * stepX, startY: baselineY + 10, travelY: 116, length: 28, duration: '4.1s', begin: '-0.9s', tone: 'white' },
    { x: startX + 12 * stepX, startY: baselineY + 14, travelY: 148, length: 42, duration: '3.2s', begin: '-1.9s', tone: 'gold', hasMicroTicks: true },
    { x: startX + 13 * stepX + 14, startY: baselineY + 10, travelY: 102, length: 26, duration: '3.8s', begin: '-2.5s', tone: 'cyan' },
  ];

  return (
    <svg
      viewBox="0 0 510 148"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Ultra-delicate glass fills so the wireframe pillars stay airy and architectural */}
        <linearGradient id="wireLeftFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ED6FF" stopOpacity="0.22" />
          <stop offset="65%" stopColor="#5BB4F8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#8ED6FF" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="wireRightFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EBF7FF" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#CBEAFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="wireCapFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D6F0FF" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#6EC2FF" stopOpacity="0.14" />
        </linearGradient>

        {/* Fine vertical stroke fade (userSpaceOnUse so zero-width vertical lines always render) */}
        <linearGradient
          id="wireEdgeStroke"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="44"
          x2="0"
          y2={baselineY}
        >
          <stop offset="0%" stopColor="#E6F7FF" stopOpacity="0.95" />
          <stop offset="62%" stopColor="#8ED4FF" stopOpacity="0.54" />
          <stop offset="100%" stopColor="#8ED4FF" stopOpacity="0.16" />
        </linearGradient>

        <linearGradient
          id="wireCenterRidge"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="56"
          x2="0"
          y2={baselineY}
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#A6DEFF" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#8ED4FF" stopOpacity="0.1" />
        </linearGradient>

        {/* Tapered hairline architectural baseline (userSpaceOnUse so horizontal line renders everywhere) */}
        <linearGradient
          id="wireBaseline"
          gradientUnits="userSpaceOnUse"
          x1="12"
          y1="0"
          x2="498"
          y2="0"
        >
          <stop offset="0%" stopColor="#9ED8FF" stopOpacity="0" />
          <stop offset="10%" stopColor="#BEE6FF" stopOpacity="0.65" />
          <stop offset="90%" stopColor="#BEE6FF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#9ED8FF" stopOpacity="0" />
        </linearGradient>

        {/* Ascending vertical AI filament gradients (bright leading tip at top, transparent tail below) */}
        <linearGradient id="aiBeamCyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
          <stop offset="22%" stopColor="#9EEBFF" stopOpacity="0.9" />
          <stop offset="68%" stopColor="#58C8FF" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#58C8FF" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="aiBeamGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFDF0" stopOpacity="0.98" />
          <stop offset="24%" stopColor="#FFE074" stopOpacity="0.92" />
          <stop offset="70%" stopColor="#F8BE4B" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#F8BE4B" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="aiBeamWhite" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
          <stop offset="30%" stopColor="#DFF4FF" stopOpacity="0.74" />
          <stop offset="100%" stopColor="#BCE6FF" stopOpacity="0" />
        </linearGradient>

        {/* Clip ascending AI beams cleanly above the baseline */}
        <clipPath id="skylineAboveBaseline">
          <rect x="0" y="0" width="510" height={baselineY} />
        </clipPath>
      </defs>

      {/* 14 fine-line isometric wireframe columns */}
      {PILLAR_HEIGHTS.map((h, i) => {
        const cx = startX + i * stepX;
        const leftX = cx - colW;
        const rightX = cx + colW;
        const topY = baselineY - h;
        const shoulderY = topY + capH;
        const ridgeY = topY + capH * 2;
        const isPeak = h >= 90;

        return (
          <g key={i}>
            {/* Whisper-light translucent faces */}
            <polygon
              points={`${leftX},${shoulderY} ${cx},${ridgeY} ${cx},${baselineY} ${leftX},${baselineY}`}
              fill="url(#wireLeftFill)"
            />
            <polygon
              points={`${cx},${ridgeY} ${rightX},${shoulderY} ${rightX},${baselineY} ${cx},${baselineY}`}
              fill="url(#wireRightFill)"
            />
            <polygon
              points={`${cx},${topY} ${rightX},${shoulderY} ${cx},${ridgeY} ${leftX},${shoulderY}`}
              fill="url(#wireCapFill)"
            />

            {/* Crisp slender wireframe edges */}
            <polyline
              points={`${leftX},${baselineY} ${leftX},${shoulderY} ${cx},${topY} ${rightX},${shoulderY} ${rightX},${baselineY}`}
              stroke="url(#wireEdgeStroke)"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <polyline
              points={`${leftX},${shoulderY} ${cx},${ridgeY} ${rightX},${shoulderY}`}
              stroke="#DDF3FF"
              strokeOpacity="0.82"
              strokeWidth="0.85"
              strokeLinejoin="round"
            />
            <line
              x1={cx}
              y1={ridgeY}
              x2={cx}
              y2={baselineY}
              stroke="url(#wireCenterRidge)"
              strokeWidth="0.9"
            />

            {/* Subtle luminous apex node on the tallest towers */}
            {isPeak && (
              <circle cx={cx} cy={topY} r="1.5" fill="#FFF2B2" fillOpacity="0.95" />
            )}
          </g>
        );
      })}

      {/* Ascending vertical AI light lines */}
      <g clipPath="url(#skylineAboveBaseline)">
        {aiBeams.map((beam, idx) => {
          const gradId =
            beam.tone === 'gold'
              ? 'url(#aiBeamGold)'
              : beam.tone === 'white'
              ? 'url(#aiBeamWhite)'
              : 'url(#aiBeamCyan)';
          const dotColor =
            beam.tone === 'gold'
              ? '#FFF5C4'
              : beam.tone === 'white'
              ? '#FFFFFF'
              : '#D8FAFF';
          const haloColor =
            beam.tone === 'gold'
              ? '#FFD760'
              : beam.tone === 'white'
              ? '#CBEFFF'
              : '#7CE4FF';

          return (
            <g key={idx}>
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to={`0 ${-beam.travelY}`}
                dur={beam.duration}
                begin={beam.begin}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.96;0.96;0"
                keyTimes="0;0.14;0.76;1"
                dur={beam.duration}
                begin={beam.begin}
                repeatCount="indefinite"
              />

              {/* Soft outer luminous aura (rounded rect avoids zero-width SVG gradient bug) */}
              <rect
                x={beam.x - 1.8}
                y={beam.startY}
                width="3.6"
                height={beam.length}
                rx="1.8"
                fill={gradId}
                fillOpacity="0.3"
              />

              {/* Razor-slender AI core filament */}
              <rect
                x={beam.x - 0.65}
                y={beam.startY}
                width="1.3"
                height={beam.length}
                rx="0.65"
                fill={gradId}
              />

              {/* Optional subtle AI data micro-ticks trailing the tip */}
              {beam.hasMicroTicks && (
                <>
                  <circle cx={beam.x} cy={beam.startY + 7} r="0.95" fill={dotColor} fillOpacity="0.78" />
                  <circle cx={beam.x} cy={beam.startY + 14} r="0.8" fill={dotColor} fillOpacity="0.48" />
                </>
              )}

              {/* Luminous leading tip node */}
              <circle cx={beam.x} cy={beam.startY + 0.6} r="3.6" fill={haloColor} fillOpacity="0.3" />
              <circle cx={beam.x} cy={beam.startY + 0.6} r="1.45" fill={dotColor} />
            </g>
          );
        })}
      </g>

      {/* Fine horizontal architectural baseline */}
      <line
        x1="12"
        y1={baselineY + 0.5}
        x2="498"
        y2={baselineY + 0.5}
        stroke="url(#wireBaseline)"
        strokeWidth="0.95"
      />
    </svg>
  );
}

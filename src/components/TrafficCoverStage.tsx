import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { DigitalNetworkOverlay } from '../lib/digitalNetworkOverlay';
import { resolveAssetUrl } from '../lib/embeddedAssets';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  TrafficConfig,
  TrafficEngine,
} from '../lib/trafficEngine';

const VIDEO_SRC = '/assets/cover_hcmc_2025.mp4';
const COVER3_POSTER_SRC = '/assets/cover3_poster.jpg';
const SKY_PATCH_SRC = '/assets/sky_clean_dinhhinh.png?v=2';
const HEADLINE_BAND_CLEAN_SRC = '/assets/headline_band_clean.png';
const COVER3_SUB_SKY_SRC = '/assets/cover3_sub_sky.png';
const COVER3_SUB_FINAL_SRC = '/assets/cover3_sub_final.png';

// Exact 1920x1300 sub-headline patch bounds (covers both dark-blue horizontal wipe bars under "ĐỊNH HÌNH" & "SIÊU ĐÔ THỊ TOÀN CẦU,")
const SUB_PATCH_X = 788;
const SUB_PATCH_Y = 395;
const SUB_PATCH_W = 788;
const SUB_PATCH_H = 264;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeOutCubic(t: number): number {
  const u = 1 - clamp01(t);
  return 1 - u * u * u;
}

/**
 * Replaces the video's two dark-blue horizontal wipe bars (t = 0.26s..1.07s under "ĐỊNH HÌNH"
 * and "SIÊU ĐÔ THỊ TOÀN CẦU,") with a clean sky mask and smooth left-to-right editorial reveal
 * of the sub-headline lines while preserving the yellow "ĐỊNH HÌNH" reveal & "Ị" dot untouched.
 */
function drawCleanCoverSubHeadline(
  ctx: CanvasRenderingContext2D,
  vt: number,
  skyImg: HTMLImageElement | null,
  finalImg: HTMLImageElement | null
): void {
  if (!skyImg || !finalImg) return;
  // Before t=0.23s only clean sky + yellow "ĐỊNH HÌNH" wipe exist; after t=1.25s video is 100% static & clean
  if (vt < 0.23 || vt >= 1.25) return;

  // 1. Erase both dark-blue wipe bars with clean sky from Frame 0
  // Lower zone (y = 413..659): always safely below the yellow wipe block (max y=411)
  ctx.drawImage(
    skyImg,
    0,
    18,
    SUB_PATCH_W,
    SUB_PATCH_H - 18,
    SUB_PATCH_X,
    SUB_PATCH_Y + 18,
    SUB_PATCH_W,
    SUB_PATCH_H - 18
  );

  // Upper strip (y = 401..413): stay strictly left of the retreating yellow wipe while vt < 0.45s
  const topStripRightX =
    vt < 0.45
      ? Math.min(1495, Math.round(990 + ((vt - 0.23) / 0.22) * 505))
      : SUB_PATCH_X + SUB_PATCH_W;
  const topStripW = Math.max(0, topStripRightX - SUB_PATCH_X);
  if (topStripW > 0) {
    ctx.drawImage(skyImg, 0, 6, topStripW, 12, SUB_PATCH_X, SUB_PATCH_Y + 6, topStripW, 12);
  }

  // Tiny "À" accent box in "CẦU," (x = 1465..1495, y = 395..401), never touching yellow "Ị" dot (x = 934..958)
  if (vt >= 0.45) {
    ctx.drawImage(skyImg, 1465 - SUB_PATCH_X, 0, 30, 6, 1465, SUB_PATCH_Y, 30, 6);
  }

  // 2. Smooth reveal of Row 2: "SIÊU ĐÔ THỊ TOÀN CẦU," (t = 0.28s..0.66s)
  const p2 = easeOutCubic((vt - 0.28) / 0.38);
  if (p2 > 0) {
    const xRight = Math.round(852 + p2 * (1574 - 852));
    const w = Math.max(0, xRight - 850);
    if (w > 0) {
      ctx.save();
      ctx.globalAlpha = clamp01(0.35 + p2 * 0.65);
      ctx.drawImage(finalImg, 850 - SUB_PATCH_X, 6, w, 82, 850, SUB_PATCH_Y + 6, w, 82);
      if (xRight > 1465) {
        const aw = Math.min(30, xRight - 1465);
        ctx.drawImage(finalImg, 1465 - SUB_PATCH_X, 0, aw, 6, 1465, SUB_PATCH_Y, aw, 6);
      }
      ctx.restore();
    }
  }

  // 3. Smooth reveal of Row 3: lime-green highlight + "LẤY CON NGƯỜI LÀM" (t = 0.48s..0.88s)
  const p3 = easeOutCubic((vt - 0.48) / 0.4);
  if (p3 > 0) {
    const xRight = Math.round(790 + p3 * (1515 - 790));
    const w = Math.max(0, xRight - SUB_PATCH_X);
    if (w > 0) {
      ctx.save();
      ctx.globalAlpha = clamp01(0.35 + p3 * 0.65);
      ctx.drawImage(finalImg, 0, 88, w, 81, SUB_PATCH_X, SUB_PATCH_Y + 88, w, 81);
      ctx.restore();
    }
  }

  // 4. Smooth reveal of Row 4: "TRUNG TÂM" (t = 0.68s..1.04s)
  const p4 = easeOutCubic((vt - 0.68) / 0.36);
  if (p4 > 0) {
    const xRight = Math.round(852 + p4 * (1260 - 852));
    const w = Math.max(0, xRight - 850);
    if (w > 0) {
      ctx.save();
      ctx.globalAlpha = clamp01(0.35 + p4 * 0.65);
      ctx.drawImage(
        finalImg,
        850 - SUB_PATCH_X,
        169,
        w,
        SUB_PATCH_H - 169,
        850,
        SUB_PATCH_Y + 169,
        w,
        SUB_PATCH_H - 169
      );
      ctx.restore();
    }
  }
}

export interface TrafficCoverStageHandle {
  capturePng: () => void;
  recordVideo: (durationSec: number, onProgress: (pct: number) => void) => Promise<void>;
  enterFullscreen: () => void;
  restartVideo: () => void;
}

interface TrafficCoverStageProps {
  config: TrafficConfig;
  isFullscreenView?: boolean;
}

export const TrafficCoverStage = forwardRef<TrafficCoverStageHandle, TrafficCoverStageProps>(
  function TrafficCoverStage({ config, isFullscreenView = false }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const posterImgRef = useRef<HTMLImageElement | null>(null);
    const skyPatchRef = useRef<HTMLImageElement | null>(null);
    const headlineBandCleanRef = useRef<HTMLImageElement | null>(null);
    const coverSubSkyRef = useRef<HTMLImageElement | null>(null);
    const coverSubFinalRef = useRef<HTMLImageElement | null>(null);
    const engineRef = useRef<TrafficEngine | null>(null);
    const networkOverlayRef = useRef<DigitalNetworkOverlay | null>(null);
    const configRef = useRef<TrafficConfig>(config);
    const paintedOnceRef = useRef(false);

    const [canvasReady, setCanvasReady] = useState(false);

    configRef.current = config;

    const resolvedVideoSrc = useMemo(() => resolveAssetUrl(VIDEO_SRC), []);
    const resolvedPosterSrc = useMemo(() => resolveAssetUrl(COVER3_POSTER_SRC), []);

    // Preload instant cover poster + clean sub-headline patches (never blocks cover visibility)
    useEffect(() => {
      const poster = new Image();
      poster.decoding = 'async';
      poster.src = resolvedPosterSrc;
      poster.onload = () => {
        posterImgRef.current = poster;
      };

      if (config.mode === 'original') {
        const subSkyImg = new Image();
        subSkyImg.decoding = 'async';
        subSkyImg.src = resolveAssetUrl(COVER3_SUB_SKY_SRC);
        subSkyImg.onload = () => {
          coverSubSkyRef.current = subSkyImg;
        };

        const subFinalImg = new Image();
        subFinalImg.decoding = 'async';
        subFinalImg.src = resolveAssetUrl(COVER3_SUB_FINAL_SRC);
        subFinalImg.onload = () => {
          coverSubFinalRef.current = subFinalImg;
        };
        return;
      }

      const skyImg = new Image();
      skyImg.decoding = 'async';
      skyImg.src = resolveAssetUrl(SKY_PATCH_SRC);
      skyImg.onload = () => {
        skyPatchRef.current = skyImg;
      };

      const bandImg = new Image();
      bandImg.decoding = 'async';
      bandImg.src = resolveAssetUrl(HEADLINE_BAND_CLEAN_SRC);
      bandImg.onload = () => {
        headlineBandCleanRef.current = bandImg;
      };
    }, [config.mode, resolvedPosterSrc]);

    // Harden mobile iOS Safari / Zalo WebView autoplay + gesture resume
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', 'true');

      const tryPlay = () => {
        if (configRef.current.paused) return;
        video.play().catch(() => {
          // Poster + live DigitalNetworkOverlay remain active until autoplay/gesture succeeds
        });
      };

      if (config.paused) {
        video.pause();
      } else {
        tryPlay();
      }

      const onVisibility = () => {
        if (!document.hidden) tryPlay();
      };
      const onFirstGesture = () => {
        tryPlay();
      };

      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('touchstart', onFirstGesture, { passive: true, once: true });
      window.addEventListener('pointerdown', onFirstGesture, { passive: true, once: true });

      return () => {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('touchstart', onFirstGesture);
        window.removeEventListener('pointerdown', onFirstGesture);
      };
    }, [config.paused]);

    // Main 60fps 1920x1300 animation loop (instant poster + live light-line fallback when video is loading or paused by Low Power Mode)
    useEffect(() => {
      if (!engineRef.current) {
        engineRef.current = new TrafficEngine();
      }
      if (!networkOverlayRef.current) {
        networkOverlayRef.current = new DigitalNetworkOverlay();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      let rafId = 0;
      let lastTs = performance.now();

      const tick = (now: number) => {
        const dt = (now - lastTs) / 1000;
        lastTs = now;

        const engine = engineRef.current!;
        const networkOverlay = networkOverlayRef.current!;
        const video = videoRef.current;
        const posterImg = posterImgRef.current;

        // Only switch from crisp poster to live video once video has decoded frames AND is actually playing
        // (avoids showing blank Frame 0 sky without text when iOS Low Power Mode blocks autoplay)
        const useLiveVideo = Boolean(
          video &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            (!video.paused || video.currentTime > 1.1)
        );

        let drewFrame = false;

        if (useLiveVideo && video) {
          engine.update(dt, configRef.current, video.currentTime);
          engine.render(ctx, null, video, configRef.current, {
            skyPatch: skyPatchRef.current,
            headlineBandClean: headlineBandCleanRef.current,
          });

          if (configRef.current.mode === 'original') {
            drawCleanCoverSubHeadline(
              ctx,
              video.currentTime,
              coverSubSkyRef.current,
              coverSubFinalRef.current
            );
          }
          drewFrame = true;
        } else if (posterImg && posterImg.complete && posterImg.naturalWidth > 0) {
          ctx.drawImage(posterImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          drewFrame = true;
        }

        if (drewFrame) {
          networkOverlay.update(dt, configRef.current.paused);
          networkOverlay.render(ctx);

          if (!paintedOnceRef.current) {
            paintedOnceRef.current = true;
            setCanvasReady(true);
          }
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    }, []);

    useImperativeHandle(ref, () => ({
      capturePng: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'bia-quy-hoach-tphcm-1920x1300.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      },
      recordVideo: async (durationSec: number, onProgress: (pct: number) => void) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas) throw new Error('Canvas unavailable');

        if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
          throw new Error('Trình duyệt không hỗ trợ ghi hình trực tiếp từ canvas.');
        }

        if (video) {
          video.currentTime = 0;
          engineRef.current?.resetHeadline();
          await video.play().catch(() => {});
        }

        const stream = canvas.captureStream(60);
        const preferredMimeTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
        ];
        const mimeType =
          preferredMimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

        const recorder = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: 16_000_000,
        });

        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunks.push(ev.data);
        };

        return new Promise<void>((resolve, reject) => {
          const startedAt = performance.now();
          const durationMs = durationSec * 1000;

          const progressTimer = window.setInterval(() => {
            const elapsed = performance.now() - startedAt;
            onProgress(Math.min(99, Math.round((elapsed / durationMs) * 100)));
          }, 80);

          recorder.onerror = () => {
            window.clearInterval(progressTimer);
            reject(new Error('Không thể xuất video từ canvas.'));
          };

          recorder.onstop = () => {
            window.clearInterval(progressTimer);
            onProgress(100);
            const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bia-quy-hoach-tphcm-1920x1300.webm';
            a.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 4000);
            resolve();
          };

          recorder.start(250);
          window.setTimeout(() => {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          }, durationMs);
        });
      },
      enterFullscreen: () => {
        const el = containerRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        }
      },
      restartVideo: () => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = 0;
        engineRef.current?.resetHeadline();
        networkOverlayRef.current?.reset();
        if (!configRef.current.paused) {
          video.play().catch(() => {});
        }
      },
    }));

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full bg-[#0D5CB6] overflow-hidden select-none ${
          isFullscreenView ? 'h-full' : ''
        }`}
      >
        {/* Instant first-paint 1920x1300 cover poster so mobile & slow networks NEVER show a loading screen */}
        <img
          src={resolvedPosterSrc}
          alt=""
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-0 block w-full h-full object-cover object-[6%_center] md:object-[16%_center] lg:object-center pointer-events-none"
          aria-hidden="true"
        />

        {/* Full-box near-zero opacity video prevents iOS Safari / Zalo WebView from throttling sr-only off-screen media */}
        <video
          ref={videoRef}
          src={resolvedVideoSrc}
          poster={resolvedPosterSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => {
            engineRef.current?.resetHeadline();
            if (!configRef.current.paused) {
              videoRef.current?.play().catch(() => {});
            }
          }}
          className="absolute inset-0 w-full h-full object-cover opacity-[0.001] pointer-events-none"
          aria-hidden="true"
        />

        {/* True native 1920x1300 website cover output canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`relative z-10 block w-full h-full object-cover object-[6%_center] md:object-[16%_center] lg:object-center transition-opacity duration-200 ${
            canvasReady ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Bìa website Quy hoạch tổng thể TP.HCM giai đoạn 2025-2050 kích thước 1920 nhân 1300 với Landmark 81 và đường sáng mảnh chuyển động qua cầu Sài Gòn"
        />
      </div>
    );
  }
);

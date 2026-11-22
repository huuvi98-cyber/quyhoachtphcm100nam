import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { DigitalNetworkOverlay } from '../lib/digitalNetworkOverlay';
import { resolveAssetUrl } from '../lib/embeddedAssets';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  TrafficConfig,
  TrafficEngine,
} from '../lib/trafficEngine';

const VIDEO_SRC =
  '/assets/aistudio/Quy_ho_ch_t_ng_th__TPHCM_th_i_k__2025-2050__t_m_nh_n_100_n_m__3__29f4ee55.mp4';
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
      ctx.drawImage(finalImg, 850 - SUB_PATCH_X, 169, w, SUB_PATCH_H - 169, 850, SUB_PATCH_Y + 169, w, SUB_PATCH_H - 169);
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
    const skyPatchRef = useRef<HTMLImageElement | null>(null);
    const headlineBandCleanRef = useRef<HTMLImageElement | null>(null);
    const coverSubSkyRef = useRef<HTMLImageElement | null>(null);
    const coverSubFinalRef = useRef<HTMLImageElement | null>(null);
    const engineRef = useRef<TrafficEngine | null>(null);
    const networkOverlayRef = useRef<DigitalNetworkOverlay | null>(null);
    const configRef = useRef<TrafficConfig>(config);

    const [videoReady, setVideoReady] = useState(false);
    const [assetsReady, setAssetsReady] = useState(false);
    const [videoError, setVideoError] = useState(false);

    configRef.current = config;

    const resolvedVideoSrc = useMemo(() => resolveAssetUrl(VIDEO_SRC), []);

    // Preload clean sky & final sub-headline patches (eliminates dark-blue wipe bars under headline text)
    useEffect(() => {
      if (config.mode === 'original') {
        let subSkyLoaded = false;
        let subFinalLoaded = false;
        const checkOriginalReady = () => {
          if (subSkyLoaded && subFinalLoaded) {
            setAssetsReady(true);
          }
        };

        const subSkyImg = new Image();
        subSkyImg.decoding = 'async';
        subSkyImg.src = resolveAssetUrl(COVER3_SUB_SKY_SRC);
        subSkyImg.onload = () => {
          coverSubSkyRef.current = subSkyImg;
          subSkyLoaded = true;
          checkOriginalReady();
        };
        subSkyImg.onerror = () => {
          subSkyLoaded = true;
          checkOriginalReady();
        };

        const subFinalImg = new Image();
        subFinalImg.decoding = 'async';
        subFinalImg.src = resolveAssetUrl(COVER3_SUB_FINAL_SRC);
        subFinalImg.onload = () => {
          coverSubFinalRef.current = subFinalImg;
          subFinalLoaded = true;
          checkOriginalReady();
        };
        subFinalImg.onerror = () => {
          subFinalLoaded = true;
          checkOriginalReady();
        };
        return;
      }

      let skyLoaded = false;
      let bandLoaded = false;
      const checkReady = () => {
        if (skyLoaded && bandLoaded) {
          setAssetsReady(true);
        }
      };

      const skyImg = new Image();
      skyImg.decoding = 'async';
      skyImg.src = resolveAssetUrl(SKY_PATCH_SRC);
      skyImg.onload = () => {
        skyPatchRef.current = skyImg;
        skyLoaded = true;
        checkReady();
      };

      const bandImg = new Image();
      bandImg.decoding = 'async';
      bandImg.src = resolveAssetUrl(HEADLINE_BAND_CLEAN_SRC);
      bandImg.onload = () => {
        headlineBandCleanRef.current = bandImg;
        bandLoaded = true;
        checkReady();
      };
    }, [config.mode]);

    // Sync video playback with play/pause state
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (config.paused) {
        video.pause();
      } else {
        video.play().catch(() => {
          // Autoplay might wait for first gesture in strict browsers
        });
      }
    }, [config.paused]);

    // Main 60fps 1920x1300 animation loop
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
        engine.update(dt, configRef.current, video ? video.currentTime : undefined);
        engine.render(ctx, null, video, configRef.current, {
          skyPatch: skyPatchRef.current,
          headlineBandClean: headlineBandCleanRef.current,
        });

        // Cleanly suppress the dark-blue wipe bars running under the cover headline text
        if (video && video.readyState >= 2 && configRef.current.mode === 'original') {
          drawCleanCoverSubHeadline(
            ctx,
            video.currentTime,
            coverSubSkyRef.current,
            coverSubFinalRef.current
          );
        }

        // Render cyan, electric blue & gold digital infrastructure light network radiating from city center
        if (video && video.readyState >= 2) {
          networkOverlay.update(dt, configRef.current.paused);
          networkOverlay.render(ctx);
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
        {/* Native 1920x1300 video source composited cleanly onto canvas */}
        <video
          ref={videoRef}
          src={resolvedVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => {
            setVideoReady(true);
            setVideoError(false);
            engineRef.current?.resetHeadline();
            networkOverlayRef.current?.reset();
          }}
          onError={() => setVideoError(true)}
          className="sr-only"
          aria-hidden="true"
        />

        {/* True native 1920x1300 website cover output canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block w-full h-full object-cover object-[6%_center] md:object-[16%_center] lg:object-center"
          aria-label="Bìa website Quy hoạch tổng thể TP.HCM giai đoạn 2025-2050 kích thước 1920 nhân 1300 với Landmark 81 và đường sáng mảnh chuyển động qua cầu Sài Gòn"
        />

        {(!videoReady || !assetsReady) && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0D5CB6]/95 text-sm text-[#EAF4FF]">
            Đang tải khung hình 1920 × 1300…
          </div>
        )}

        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0D5CB6] text-sm text-[#EAF4FF] px-6 text-center">
            Không thể tải tệp video nguồn. Vui lòng kiểm tra lại kết nối và tải lại trang.
          </div>
        )}
      </div>
    );
  }
);

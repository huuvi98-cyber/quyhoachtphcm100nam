import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  TrafficConfig,
  TrafficEngine,
} from '../lib/trafficEngine';

const VIDEO_SRC =
  '/assets/aistudio/Quy_ho_ch_t_ng_th__TPHCM_th_i_k__2025-2050__t_m_nh_n_100_n_m__2__91fa1a70.mp4';
const SKY_PATCH_SRC = '/assets/sky_clean_dinhhinh.png?v=2';
const HEADLINE_BAND_CLEAN_SRC = '/assets/headline_band_clean.png';

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
    const engineRef = useRef<TrafficEngine | null>(null);
    const configRef = useRef<TrafficConfig>(config);

    const [videoReady, setVideoReady] = useState(false);
    const [assetsReady, setAssetsReady] = useState(false);
    const [videoError, setVideoError] = useState(false);

    configRef.current = config;

    // Preload exact clean sky patch & clean horizontal headline band for static vector DINH HINH & gliding lime bar
    useEffect(() => {
      let skyLoaded = false;
      let bandLoaded = false;
      const checkReady = () => {
        if (skyLoaded && bandLoaded) {
          setAssetsReady(true);
        }
      };

      const skyImg = new Image();
      skyImg.decoding = 'async';
      skyImg.src = SKY_PATCH_SRC;
      skyImg.onload = () => {
        skyPatchRef.current = skyImg;
        skyLoaded = true;
        checkReady();
      };

      const bandImg = new Image();
      bandImg.decoding = 'async';
      bandImg.src = HEADLINE_BAND_CLEAN_SRC;
      bandImg.onload = () => {
        headlineBandCleanRef.current = bandImg;
        bandLoaded = true;
        checkReady();
      };
    }, []);

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
        const video = videoRef.current;
        engine.update(dt, configRef.current, video ? video.currentTime : undefined);
        engine.render(ctx, null, video, configRef.current, {
          skyPatch: skyPatchRef.current,
          headlineBandClean: headlineBandCleanRef.current,
        });

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
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => {
            setVideoReady(true);
            setVideoError(false);
            engineRef.current?.resetHeadline();
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
          className="block w-full h-full object-cover object-center"
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

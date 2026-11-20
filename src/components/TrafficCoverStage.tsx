import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  TrafficConfig,
  TrafficEngine,
} from '../lib/trafficEngine';

const VIDEO_SRC =
  '/assets/aistudio/Quy_ho_ch_t_ng_th__TPHCM_th_i_k__2025-2050__t_m_nh_n_100_n_m_2c0c071a.mp4';
const BASE_PLATE_SRC = '/assets/hcmc_cover_base.jpg?v=2';

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
    const baseImgRef = useRef<HTMLImageElement | null>(null);
    const engineRef = useRef<TrafficEngine | null>(null);
    const configRef = useRef<TrafficConfig>(config);

    const [plateReady, setPlateReady] = useState(false);
    const [videoError, setVideoError] = useState(false);

    configRef.current = config;

    // Preload clean 1920x1080 base plate (extracted from t=4.90s of source video without baked-in text)
    useEffect(() => {
      const img = new Image();
      img.onload = () => {
        baseImgRef.current = img;
        setPlateReady(true);
      };
      img.src = BASE_PLATE_SRC;
    }, []);

    // Replay smooth bottom-up reveal whenever user switches headline animation mode
    useEffect(() => {
      engineRef.current?.resetHeadline();
    }, [config.headlineMode]);

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

    // Main 60fps 1920x1080 animation loop
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
        engine.update(dt, configRef.current);
        engine.render(ctx, baseImgRef.current, videoRef.current, configRef.current);

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
        link.download = 'bia-quy-hoach-tphcm-1920x1080.png';
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

        // Restart headline reveal & source video at t=0 so exported clip begins cleanly from bottom-up entry
        engineRef.current?.resetHeadline();
        if (video) {
          video.currentTime = 0;
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
          videoBitsPerSecond: 14_000_000, // Crisp 14 Mbps 60fps for 1920x1080 website cover
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
            a.download = `bia-quy-hoach-tphcm-1920x1080.webm`;
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
        engineRef.current?.resetHeadline();
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = 0;
        if (!configRef.current.paused) {
          video.play().catch(() => {});
        }
      },
    }));

    return (
      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-[#A61C24] overflow-hidden select-none ${
          isFullscreenView ? 'h-full' : ''
        }`}
      >
        {/* Source 4K footage kept in DOM offscreen for "Video gốc" comparison */}
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => {
            setPlateReady(true);
            setVideoError(false);
          }}
          onError={() => {
            if (!baseImgRef.current) setVideoError(true);
          }}
          className="sr-only"
          aria-hidden="true"
        />

        {/* True native 1920x1080 website cover output canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block w-full h-full object-cover"
          aria-label="Bìa website Quy hoạch tổng thể TP.HCM giai đoạn 2025-2050 kích thước 1920 nhân 1080 với đường sáng mảnh chuyển động và tiêu đề Định hình siêu đô thị toàn cầu, lấy con người làm trung tâm"
        />

        {!plateReady && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#A61C24]/95 text-sm text-[#FCEEEB]">
            Đang tải khung hình 1920 × 1080…
          </div>
        )}

        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#A61C24] text-sm text-[#FCEEEB] px-6 text-center">
            Không thể tải tệp video nguồn. Vui lòng kiểm tra lại kết nối và tải lại trang.
          </div>
        )}
      </div>
    );
  }
);

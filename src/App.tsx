import { HcmcMasterPlanReport } from './components/HcmcMasterPlanReport';
import { InteractiveHcmcMap } from './components/InteractiveHcmcMap';
import { SkylinePillarsIcon } from './components/SkylinePillarsIcon';
import { TrafficCoverStage } from './components/TrafficCoverStage';
import { TrafficConfig } from './lib/trafficEngine';

const COVER_CONFIG: TrafficConfig = {
  mode: 'original',
  headlineMode: 'hidden',
  speed: 1.1,
  density: 1.15,
  trailIntensity: 0,
  lineThinness: 1.0,
  showMetro: false,
  showFrontage: false,
  showAiLines: false,
  paused: false,
};

export default function App() {
  return (
    <main className="w-full min-h-screen bg-[#0D5CB6] flex flex-col items-center justify-start overflow-x-clip">
      <div className="w-full flex flex-col items-center justify-start pt-5 pb-14 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20">
        <div className="w-[80%] max-w-[1536px] aspect-[5/4] md:aspect-[4/3] lg:aspect-[1920/1300]">
          <TrafficCoverStage config={COVER_CONFIG} isFullscreenView />
        </div>

        <section
          aria-label="Sapo giới thiệu"
          className="w-[84%] max-w-4xl mx-auto mt-7 md:mt-10 lg:mt-12 flex flex-col items-center text-center"
        >
          <SkylinePillarsIcon className="w-[230px] sm:w-[270px] md:w-[320px] h-auto mb-5 md:mb-6" />

          <p className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] leading-[1.72] font-medium text-[#F4F8FF] tracking-[-0.005em] text-pretty">
            UBND TPHCM vừa ban hành Quyết định số 7308/QĐ-UBND ngày 31-10-2026 phê duyệt quy hoạch tổng thể TPHCM thời kỳ 2025-2050, tầm nhìn 100 năm. Quy hoạch mang tính bước ngoặt chiến lược, định hình tương lai phát triển của siêu đô thị lớn nhất cả nước trong kỷ nguyên mới.
          </p>
        </section>

        <InteractiveHcmcMap />
      </div>

      <HcmcMasterPlanReport />
    </main>
  );
}

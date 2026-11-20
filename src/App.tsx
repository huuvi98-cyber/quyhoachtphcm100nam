import { TrafficCoverStage } from './components/TrafficCoverStage';
import { TrafficConfig } from './lib/trafficEngine';

const COVER_CONFIG: TrafficConfig = {
  mode: 'lines',
  headlineMode: 'rise-loop',
  speed: 1.1,
  density: 1.15,
  trailIntensity: 0.92,
  lineThinness: 1.0,
  showMetro: true,
  showFrontage: true,
  showAiLines: true,
  paused: false,
};

export default function App() {
  return (
    <main className="w-full bg-[#0D5CB6] pt-5 pb-4 md:pt-6 md:pb-5 lg:p-0 overflow-x-hidden">
      <div className="w-full aspect-[5/4] md:aspect-[4/3] lg:aspect-[1920/1300]">
        <TrafficCoverStage config={COVER_CONFIG} isFullscreenView />
      </div>
    </main>
  );
}

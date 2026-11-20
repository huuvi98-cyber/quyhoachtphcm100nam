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
    <main className="w-full min-h-screen bg-[#0D5CB6] flex flex-col items-center justify-start lg:justify-center py-5 md:py-6 lg:py-8 overflow-x-hidden">
      <div className="w-[80%] max-w-[1536px] aspect-[5/4] md:aspect-[4/3] lg:aspect-[1920/1300]">
        <TrafficCoverStage config={COVER_CONFIG} isFullscreenView />
      </div>
    </main>
  );
}

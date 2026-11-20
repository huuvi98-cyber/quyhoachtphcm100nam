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
    <main className="w-full min-h-screen bg-[#A61C24] flex items-center justify-center overflow-x-hidden">
      <div className="w-full aspect-video">
        <TrafficCoverStage config={COVER_CONFIG} isFullscreenView />
      </div>
    </main>
  );
}

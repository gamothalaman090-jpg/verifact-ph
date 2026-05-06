// ─────────────────────────────────────────────
// App.tsx — Page orchestrator
// Assembles all sections in scroll sequence
// ─────────────────────────────────────────────

import Masthead from './components/Masthead';
import EditorialHero from './components/EditorialHero';
import InkCanvas from './components/InkCanvas';
import AnalyzerSection from './components/AnalyzerSection';
import TrustSignals from './components/TrustSignals';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';

export default function App() {
  return (
    <div className="min-h-screen bg-void relative">
      {/* Custom cursor */}
      <CustomCursor />

      {/* Global grain overlay */}
      <div className="grain-overlay" />

      {/* Fixed navigation */}
      <Masthead />

      {/* Section 1: Monumental typography intro */}
      <EditorialHero />

      {/* Section 2: Sticky canvas — the "document scan" animation */}
      <InkCanvas />

      {/* Section 3: "How It Works" methodology strip */}
      <TrustSignals />

      {/* Section 4: The actual analyzer tool */}
      <AnalyzerSection />

      {/* Section 5: Minimal footer */}
      <Footer />
    </div>
  );
}

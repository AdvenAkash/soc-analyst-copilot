import { useState } from "react";
import GlobalNav from "./components/layout/GlobalNav.jsx";
import SubNav from "./components/layout/SubNav.jsx";
import HeroSection from "./components/sections/HeroSection.jsx";
import StatsStrip from "./components/sections/StatsStrip.jsx";
import AgentPipeline from "./components/sections/AgentPipeline.jsx";
import AlertFeed from "./components/alerts/AlertFeed.jsx";
import IncidentQueue from "./components/incidents/IncidentQueue.jsx";
import IncidentDetail from "./components/incidents/IncidentDetail.jsx";
import StickyBar from "./components/layout/StickyBar.jsx";
import { useAnalysis } from "./hooks/useAnalysis.js";
import { SAMPLE_ALERTS } from "./constants/alerts.js";
import { COLOR, SPACE } from "./constants/tokens.js";

export default function App() {
  const { state, dispatch, startAnalysis } = useAnalysis();
  const [selectedIncident, setSelectedIncident] = useState(null);

  const handleRun = () => {
    setSelectedIncident(null);
    startAnalysis(SAMPLE_ALERTS);
  };

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
  };

  return (
    <div style={{ background: COLOR.canvasParchment, minHeight: "100vh" }}>
      <GlobalNav />
      <SubNav
        status={state.status}
        alertCount={SAMPLE_ALERTS.length}
        incidentCount={state.incidents.length}
        onRun={handleRun}
      />
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: `0 ${SPACE.lg}px` }}>
        <HeroSection status={state.status} onRun={handleRun} />
        <StatsStrip
          alertCount={SAMPLE_ALERTS.length}
          incidentCount={state.incidents.length}
          fpCount={state.incidents.reduce((n, i) => n + (i.fp_ids?.length || 0), 0)}
          agentsDone={state.agentResults.filter((a) => a.status === "done").length}
        />
        <AgentPipeline agents={state.agentResults} />

        {/* Two-column incident workspace */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selectedIncident ? "1fr 1.6fr" : "1fr 2fr",
            gap: SPACE.lg,
            marginTop: SPACE.lg,
            marginBottom: 120,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
            <AlertFeed alerts={SAMPLE_ALERTS} activeIds={state.activeAlertIds} />
            <IncidentQueue
              incidents={state.incidents}
              selected={selectedIncident}
              onSelect={handleSelectIncident}
            />
          </div>
          <IncidentDetail incident={selectedIncident} />
        </div>
      </main>
      <StickyBar incidents={state.incidents} status={state.status} />
    </div>
  );
}

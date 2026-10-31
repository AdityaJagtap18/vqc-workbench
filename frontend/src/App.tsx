import { Route, Routes } from "react-router-dom";

import { Topbar } from "./components/layout/Topbar";
import DatasetExplorer from "./pages/DatasetExplorer";
import Documentation from "./pages/Documentation";
import ExperimentDetailPage from "./pages/ExperimentDetailPage";
import ExperimentHistory from "./pages/ExperimentHistory";
import ModelComparison from "./pages/ModelComparison";
import NewExperiment from "./pages/NewExperiment";
import Overview from "./pages/Overview";

export default function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <Topbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/datasets" element={<DatasetExplorer />} />
          <Route path="/experiments/new" element={<NewExperiment />} />
          <Route path="/experiments/:id" element={<ExperimentDetailPage />} />
          <Route path="/history" element={<ExperimentHistory />} />
          <Route path="/comparison" element={<ModelComparison />} />
          <Route path="/docs" element={<Documentation />} />
        </Routes>
      </main>
    </div>
  );
}

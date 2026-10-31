import { Route, Routes } from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";
import DatasetExplorer from "./pages/DatasetExplorer";
import Documentation from "./pages/Documentation";
import ExperimentDetailPage from "./pages/ExperimentDetailPage";
import ExperimentHistory from "./pages/ExperimentHistory";
import ModelComparison from "./pages/ModelComparison";
import NewExperiment from "./pages/NewExperiment";
import Overview from "./pages/Overview";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
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

import { createFileRoute } from "@tanstack/react-router";
import { QuantumHardwareResultsPage } from "@/components/QuantumHardwareResults";

export const Route = createFileRoute("/quantum-hardware-results")({
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: typeof search.jobId === "string" ? search.jobId : "",
  }),
  head: () => ({
    meta: [
      { title: "Real Quantum Hardware Results - QDNA" },
      {
        name: "description",
        content: "Raw real-hardware quantum circuit results with resource-aware backend selection.",
      },
    ],
  }),
  component: HardwareResultsRoute,
});

function HardwareResultsRoute() {
  const { jobId } = Route.useSearch();
  return <QuantumHardwareResultsPage jobId={jobId} />;
}

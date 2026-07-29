import { createFileRoute } from "@tanstack/react-router";
import { QuantumSearchResultsPage } from "@/components/QuantumSearch";

export const Route = createFileRoute("/quantum-search-results")({
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: typeof search.jobId === "string" ? search.jobId : "",
  }),
  head: () => ({
    meta: [
      { title: "Quantum Search Results - QDNA" },
      {
        name: "description",
        content:
          "Quantum genomic search results, validation, downloads, and scientific boundaries.",
      },
    ],
  }),
  component: ResultsRoute,
});

function ResultsRoute() {
  const { jobId } = Route.useSearch();
  return <QuantumSearchResultsPage jobId={jobId} />;
}

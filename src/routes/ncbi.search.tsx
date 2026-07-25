import { createFileRoute } from "@tanstack/react-router";
import { NcbiSearchResults } from "@/components/NcbiSearchResults";

export const Route = createFileRoute("/ncbi/search")({
  head: () => ({
    meta: [
      { title: "NCBI Gene Search - QDNA" },
      {
        name: "description",
        content: "NCBI Entrez gene search results for nucleotide records and quantum analysis handoff.",
      },
    ],
  }),
  component: NcbiSearchResults,
});

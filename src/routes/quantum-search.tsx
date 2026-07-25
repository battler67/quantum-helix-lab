import { createFileRoute } from "@tanstack/react-router";
import { QuantumSearch } from "@/components/QuantumSearch";

export const Route = createFileRoute("/quantum-search")({
  head: () => ({
    meta: [
      { title: "Genomic Quantum Search - QDNA" },
      {
        name: "description",
        content: "NCBI genomic nucleotide retrieval with FRQI or Grover quantum similarity search.",
      },
    ],
  }),
  component: QuantumSearch,
});

import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — QDNA" },
      { name: "description", content: "Quantum DNA alignment workspace with FRQI encoding and Grover search." },
    ],
  }),
  component: Dashboard,
});

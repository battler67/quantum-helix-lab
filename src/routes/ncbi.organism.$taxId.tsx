import { createFileRoute } from "@tanstack/react-router";
import { NcbiOrganismDetails } from "@/components/NcbiOrganismDetails";

export const Route = createFileRoute("/ncbi/organism/$taxId")({
  head: () => ({
    meta: [
      { title: "NCBI Organism - QDNA" },
      {
        name: "description",
        content: "NCBI taxonomy details for organisms found in quantum and BLAST DNA search results.",
      },
    ],
  }),
  component: OrganismRoute,
});

function OrganismRoute() {
  const { taxId } = Route.useParams();
  return <NcbiOrganismDetails taxId={taxId} />;
}

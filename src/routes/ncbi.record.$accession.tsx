import { createFileRoute } from "@tanstack/react-router";
import { NcbiRecordDetails } from "@/components/NcbiRecordDetails";

export const Route = createFileRoute("/ncbi/record/$accession")({
  head: () => ({
    meta: [
      { title: "NCBI Record - QDNA" },
      {
        name: "description",
        content: "Complete NCBI nucleotide record details with selective download and sequence analysis.",
      },
    ],
  }),
  component: RecordRoute,
});

function RecordRoute() {
  const { accession } = Route.useParams();
  return <NcbiRecordDetails accession={accession} />;
}

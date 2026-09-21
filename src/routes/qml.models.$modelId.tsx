import { createFileRoute } from "@tanstack/react-router";
import { QmlModelDetails } from "@/components/QmlPages";

function ModelRoute() {
  const { modelId } = Route.useParams();
  return <QmlModelDetails modelId={modelId} />;
}

export const Route = createFileRoute("/qml/models/$modelId")({ component: ModelRoute });

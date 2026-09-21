import { createFileRoute } from "@tanstack/react-router";
import { QmlEvidence } from "@/components/QmlPages";

export const Route = createFileRoute("/qml/evidence")({ component: QmlEvidence });

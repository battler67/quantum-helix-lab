import { createFileRoute } from "@tanstack/react-router";
import { QmlResults } from "@/components/QmlPages";

export const Route = createFileRoute("/qml/results")({ component: QmlResults });

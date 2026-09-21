import { createFileRoute } from "@tanstack/react-router";
import { QmlLanding } from "@/components/QmlPages";

export const Route = createFileRoute("/qml/")({ component: QmlLanding });

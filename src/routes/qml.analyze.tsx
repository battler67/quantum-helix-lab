import { createFileRoute } from "@tanstack/react-router";
import { QmlAnalyze } from "@/components/QmlPages";

export const Route = createFileRoute("/qml/analyze")({ component: QmlAnalyze });

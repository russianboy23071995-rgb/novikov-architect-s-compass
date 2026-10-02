import { createFileRoute } from "@tanstack/react-router";
import { CadWorkspace } from "@/components/cad/CadWorkspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOVIKOV CAD — Professional Architecture Workspace" },
      {
        name: "description",
        content: "AI-native professional 2D and 3D architecture CAD workspace.",
      },
      { property: "og:title", content: "NOVIKOV CAD — Professional Architecture Workspace" },
      {
        property: "og:description",
        content: "AI-native professional 2D and 3D architecture CAD workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CadWorkspace,
});

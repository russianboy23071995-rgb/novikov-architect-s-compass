import type { Plugin } from "vite";
/** Explicit pilot build only. Fail closed if the production render seam changes. */
export function imageResourceInstrumentation(): Plugin {
  return {
    name: "isolated-image-resources",
    enforce: "pre",
    apply: "build",
    transform(source, id) {
      const path = id.split("?")[0]!.replaceAll("\\", "/");
      if (path.endsWith("/src/components/cad/PlanSceneRun.tsx")) {
        if (
          source.split("<image").length !== 2 ||
          source.split("href={checkedImageUrl(a)}").length !== 2
        )
          throw new Error("Image resource pilot render seam changed");
        return {
          code:
            'import { PilotReferenceImage } from "/benchmarks/image-resource-pilot.tsx";\n' +
            source
              .replace("<image", "<PilotReferenceImage")
              .replace("href={checkedImageUrl(a)}", "asset={a}"),
          map: null,
        };
      }
      if (path.endsWith("/src/components/cad/CadWorkspace.tsx")) {
        const marker = "const project = history.present;";
        if (source.split(marker).length !== 2)
          throw new Error("Image resource pilot scope seam changed");
        return {
          code:
            'import { usePilotImageSources } from "/benchmarks/image-resource-pilot.tsx";\n' +
            source.replace(marker, marker + "\n  usePilotImageSources(project);"),
          map: null,
        };
      }
      return null;
    },
  };
}

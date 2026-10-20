import { Redirect } from "expo-router";
import { HostRouteBootstrapBoundary } from "@/components/host-route-bootstrap-boundary";
import { isWorkspacesOnlyBuild } from "@/constants/workspaces-only";
import { useEarliestOnlineHostServerId } from "@/app/_layout";
import { buildPluginSurfaceRoute } from "@/plugins/routes";
import { OpenProjectScreen } from "@/screens/open-project-screen";

export default function OpenProjectRoute() {
  return (
    <HostRouteBootstrapBoundary>
      <OpenProjectContent />
    </HostRouteBootstrapBoundary>
  );
}

function OpenProjectContent() {
  const serverId = useEarliestOnlineHostServerId();
  if (isWorkspacesOnlyBuild && serverId) {
    return (
      <Redirect
        href={buildPluginSurfaceRoute(serverId, "workspaces-bridge", {
          kind: "surface",
          id: "main",
        })}
      />
    );
  }
  return <OpenProjectScreen />;
}

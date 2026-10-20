import { Redirect } from "expo-router";
import { useHostRouteServerId } from "@/navigation/host-route-context";
import {
  resolveHostIndexRoute,
  resolveWorkspaceSelectionStatus,
} from "@/navigation/host-runtime-bootstrap";
import { StartupSplashScreen } from "@/screens/startup-splash-screen";
import { useHasHydratedWorkspaces, useWorkspaceExists } from "@/stores/session-store-hooks";
import {
  useIsLastWorkspaceSelectionHydrated,
  useLastWorkspaceSelection,
} from "@/stores/navigation-active-workspace-store";
import { isWorkspacesOnlyBuild } from "@/constants/workspaces-only";
import { buildPluginSurfaceRoute } from "@/plugins/routes";

export default function HostIndexRoute() {
  const serverId = useHostRouteServerId();
  const workspaceSelection = useLastWorkspaceSelection();
  const isWorkspaceSelectionLoaded = useIsLastWorkspaceSelectionHydrated();
  const workspaceSelectionWorkspaceId =
    workspaceSelection?.serverId === serverId ? workspaceSelection.workspaceId : null;
  const hasHydratedWorkspaces = useHasHydratedWorkspaces(serverId);
  const workspaceSelectionExists = useWorkspaceExists(serverId, workspaceSelectionWorkspaceId);

  if (!serverId || !isWorkspaceSelectionLoaded) {
    return <StartupSplashScreen />;
  }

  if (isWorkspacesOnlyBuild) {
    return (
      <Redirect
        href={buildPluginSurfaceRoute(serverId, "workspaces-bridge", {
          kind: "surface",
          id: "main",
        })}
      />
    );
  }

  return (
    <Redirect
      href={resolveHostIndexRoute({
        serverId,
        workspaceSelection,
        workspaceSelectionStatus: resolveWorkspaceSelectionStatus({
          hasHydratedWorkspaces,
          workspaceExists: workspaceSelectionExists,
        }),
      })}
    />
  );
}

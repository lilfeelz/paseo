import { useCallback } from "react";
import { router, usePathname } from "expo-router";
import { useKeyboardActionHandler } from "@/hooks/use-keyboard-action-handler";
import type { KeyboardActionId } from "@/keyboard/keyboard-action-dispatcher";
import { useActiveWorkspaceSelection } from "@/stores/navigation-active-workspace-store";
import { useLocalDaemonServerId } from "@/hooks/use-is-local-daemon";
import { isWorkspacesOnlyBuild } from "@/constants/workspaces-only";
import { buildPluginSurfaceRoute, hostIdFromPathname } from "@/plugins/routes";

const WORKSPACES_PICKER_ACTIONS: readonly KeyboardActionId[] = ["workspaces.overlay.open"];

export function useGlobalWorkspacesPickerAction() {
  const pathname = usePathname();
  const activeWorkspace = useActiveWorkspaceSelection();
  const localServerId = useLocalDaemonServerId();
  const handle = useCallback(() => {
    const serverId = hostIdFromPathname(pathname) ?? activeWorkspace?.serverId ?? localServerId;
    if (!serverId) return false;
    router.push(
      buildPluginSurfaceRoute(
        serverId,
        "workspaces-bridge",
        { kind: "surface", id: "main" },
        { overlay: "1" },
      ) as never,
    );
    return true;
  }, [activeWorkspace?.serverId, localServerId, pathname]);

  useKeyboardActionHandler({
    handlerId: "workspaces-picker-global",
    actions: WORKSPACES_PICKER_ACTIONS,
    enabled: isWorkspacesOnlyBuild,
    priority: 0,
    handle,
  });
}

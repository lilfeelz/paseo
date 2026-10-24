import { useCallback, useEffect, useRef } from "react";
import { router, usePathname } from "expo-router";
import { useKeyboardActionHandler } from "@/hooks/use-keyboard-action-handler";
import type { KeyboardActionId } from "@/keyboard/keyboard-action-dispatcher";
import {
  useActiveWorkspaceSelection,
  navigateToWorkspace,
} from "@/stores/navigation-active-workspace-store";
import type { ActiveWorkspaceSelection } from "@/stores/navigation-active-workspace-store";
import { useLocalDaemonServerId } from "@/hooks/use-is-local-daemon";
import { isWorkspacesOnlyBuild } from "@/constants/workspaces-only";
import { buildPluginSurfaceRoute, hostIdFromPathname } from "@/plugins/routes";
import { useWorkspace } from "@/stores/session-store-hooks";
import { projectKeyFromWorkspacePath } from "@/utils/workspaces-project";

const WORKSPACES_PICKER_ACTIONS: readonly KeyboardActionId[] = ["workspaces.overlay.open"];
const PREVIOUS_WORKSPACE_ACTIONS: readonly KeyboardActionId[] = ["workspace.previous"];
const PROJECT_WORKSPACES_ACTIONS: readonly KeyboardActionId[] = ["workspace.project.list"];
const SESSIONS_LIST_ACTIONS: readonly KeyboardActionId[] = ["sessions.list"];

export function useGlobalWorkspacesPickerAction() {
  const pathname = usePathname();
  const selection = useActiveWorkspaceSelection();
  const workspace = useWorkspace(selection?.serverId ?? null, selection?.workspaceId ?? null);
  const localServerId = useLocalDaemonServerId();
  const current = useRef<ActiveWorkspaceSelection | null>(selection);
  const previous = useRef<ActiveWorkspaceSelection | null>(null);

  useEffect(() => {
    const serverId = selection?.serverId;
    const workspaceId = selection?.workspaceId;
    if (!serverId || !workspaceId) return;
    const next = { serverId, workspaceId };
    const before = current.current;
    if (before && (before.serverId !== serverId || before.workspaceId !== workspaceId)) {
      previous.current = before;
    }
    current.current = next;
  }, [selection?.serverId, selection?.workspaceId]);

  const handle = useCallback(() => {
    const serverId = hostIdFromPathname(pathname) ?? selection?.serverId ?? localServerId;
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
  }, [localServerId, pathname, selection?.serverId]);

  useKeyboardActionHandler({
    handlerId: "workspaces-picker-global",
    actions: WORKSPACES_PICKER_ACTIONS,
    enabled: isWorkspacesOnlyBuild,
    priority: 0,
    handle,
  });

  const handlePrevious = useCallback(() => {
    const target = previous.current;
    const active = current.current;
    if (!target || !active) return false;
    previous.current = active;
    current.current = target;
    navigateToWorkspace(target);
    return true;
  }, []);
  useKeyboardActionHandler({
    handlerId: "workspace-previous-global",
    actions: PREVIOUS_WORKSPACE_ACTIONS,
    enabled: isWorkspacesOnlyBuild,
    isActive: () => previous.current !== null,
    priority: 0,
    handle: handlePrevious,
  });

  const handleProjectWorkspaces = useCallback(() => {
    if (!selection || !workspace) return false;
    const projectKey = projectKeyFromWorkspacePath(workspace.workspaceDirectory);
    if (!projectKey) return false;
    router.push(
      buildPluginSurfaceRoute(
        selection.serverId,
        "workspaces-bridge",
        { kind: "surface", id: "main" },
        { overlay: "1", projectKey },
      ) as never,
    );
    return true;
  }, [selection, workspace]);
  useKeyboardActionHandler({
    handlerId: "workspace-project-list-global",
    actions: PROJECT_WORKSPACES_ACTIONS,
    enabled: isWorkspacesOnlyBuild && selection !== null && workspace !== null,
    priority: 0,
    handle: handleProjectWorkspaces,
  });

  const handleSessionsList = useCallback(() => {
    router.push((isWorkspacesOnlyBuild ? "/sessions?overlay=1" : "/sessions") as never);
    return true;
  }, []);
  useKeyboardActionHandler({
    handlerId: "sessions-list-global",
    actions: SESSIONS_LIST_ACTIONS,
    enabled: isWorkspacesOnlyBuild,
    priority: 0,
    handle: handleSessionsList,
  });
}

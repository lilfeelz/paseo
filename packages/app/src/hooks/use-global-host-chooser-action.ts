import { useCallback } from "react";
import { router } from "expo-router";
import { useHostChooser } from "@/hosts/host-chooser";
import { useKeyboardActionHandler } from "@/hooks/use-keyboard-action-handler";
import type { KeyboardActionId } from "@/keyboard/keyboard-action-dispatcher";
import { useHosts } from "@/runtime/host-runtime";
import { isWorkspacesOnlyBuild } from "@/constants/workspaces-only";

const HOST_CHOOSER_ACTIONS: readonly KeyboardActionId[] = ["hosts.overlay.open"];

export function useGlobalHostChooserAction() {
  const hosts = useHosts();
  const chooseHost = useHostChooser();
  const handle = useCallback(() => {
    chooseHost({
      title: "Choose host",
      onChooseHost: (serverId) => router.replace(`/h/${encodeURIComponent(serverId)}`),
    });
    return true;
  }, [chooseHost]);

  useKeyboardActionHandler({
    handlerId: "hosts-chooser-global",
    actions: HOST_CHOOSER_ACTIONS,
    enabled: isWorkspacesOnlyBuild && hosts.length > 0,
    priority: 0,
    handle,
  });
}

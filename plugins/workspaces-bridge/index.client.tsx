import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  usePaseo,
  useRpc,
  type PluginClientContext,
  type PluginScreenProps,
  type PluginSidebarItemProps,
} from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { listWorkspacesRpc } from "./shared/rpc.js";

interface WorkspaceEntry {
  name: string;
  directory: string;
  active: boolean;
  command: string;
}

function WorkspacesItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  const open = useCallback(() => openScreen({ screenId: "main" }), [openScreen]);
  return (
    <SidebarRow icon="FolderOpen" active={currentScreen?.screenId === "main"} onPress={open} />
  );
}

function WorkspaceRow({
  entry,
  busy,
  onOpen,
  styles,
}: {
  entry: WorkspaceEntry;
  busy: boolean;
  onOpen: (entry: WorkspaceEntry) => void;
  styles: { text: object; detail: object; row: object };
}) {
  const open = useCallback(() => onOpen(entry), [entry, onOpen]);
  return (
    <Pressable accessibilityRole="button" disabled={busy} onPress={open} style={styles.row}>
      <Text style={styles.text}>{entry.name}</Text>
      <Text style={styles.detail}>{entry.active ? "Active in zmx" : "No active pane"}</Text>
    </Pressable>
  );
}

function Workspaces({ theme }: PluginScreenProps) {
  const paseo = usePaseo();
  const listWorkspaces = useRpc(listWorkspacesRpc);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [entries, setEntries] = useState<WorkspaceEntry[]>([]);
  const styles = useMemo(
    () => ({
      root: { flex: 1, padding: 16, gap: 12, backgroundColor: theme.colors.surface0 },
      title: { color: theme.colors.foreground, fontSize: 20 },
      text: { color: theme.colors.foreground },
      detail: { color: theme.colors.foregroundMuted },
      row: { padding: 14, borderRadius: 10, backgroundColor: theme.colors.surface1, gap: 4 },
      error: { color: theme.colors.statusDanger },
    }),
    [theme],
  );
  const refresh = useCallback(async () => {
    try {
      setError("");
      setEntries((await listWorkspaces({})).entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [listWorkspaces]);
  const onRefresh = useCallback(() => void refresh(), [refresh]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const open = useCallback(
    async (entry: WorkspaceEntry) => {
      try {
        setBusy(entry.name);
        setError("");
        const workspace = await paseo.workspaces.open({ cwd: entry.directory });
        await workspace.terminals.create({
          name: "ws surface",
          command: entry.command,
          args: ["surface", entry.directory],
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy("");
      }
    },
    [paseo],
  );
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Workspaces</Text>
      <Pressable accessibilityRole="button" onPress={onRefresh}>
        <Text style={styles.text}>Refresh</Text>
      </Pressable>
      {entries.map((entry) => (
        <WorkspaceRow
          key={entry.name}
          entry={entry}
          busy={busy !== ""}
          onOpen={open}
          styles={styles}
        />
      ))}
      {busy ? <Text style={styles.detail}>Opening {busy}…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "main", title: "Workspaces", Component: Workspaces });
  client.addSidebarHeaderItem({ id: "workspaces", title: "Workspaces", Component: WorkspacesItem });
  return () => {};
}

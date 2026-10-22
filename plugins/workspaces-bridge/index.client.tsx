import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  usePaseo,
  type PluginClientContext,
  type PluginScreenProps,
  type PluginSidebarItemProps,
} from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { useRpc } from "@getpaseo/plugin/client";
import { Modal, ScrollView, TextInput } from "@getpaseo/plugin/client/react-native";
import { listWorkspacesRpc } from "./shared/rpc.js";
import { fuzzySearchWorkspaces } from "./shared/workspaces.js";

interface WorkspaceEntry {
  name: string;
  directory: string;
  active: boolean;
  command: string;
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

function WorkspacesItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  const open = useCallback(() => openScreen({ screenId: "main" }), [openScreen]);
  return (
    <SidebarRow icon="FolderOpen" active={currentScreen?.screenId === "main"} onPress={open} />
  );
}

function Workspaces({ theme, host, params, navigation }: PluginScreenProps) {
  const paseo = usePaseo();
  const listWorkspaces = useRpc(listWorkspacesRpc);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [entries, setEntries] = useState<WorkspaceEntry[]>([]);
  const [query, setQuery] = useState("");
  const opening = useRef(false);
  const filteredEntries = useMemo(() => fuzzySearchWorkspaces(entries, query), [entries, query]);
  const styles = useMemo(
    () => ({
      root: { flex: 1, padding: 16, gap: 12, backgroundColor: theme.colors.surface0 },
      title: { color: theme.colors.foreground, fontSize: 20 },
      host: { color: theme.colors.foregroundMuted, fontSize: 12 },
      text: { color: theme.colors.foreground },
      detail: { color: theme.colors.foregroundMuted, fontSize: 12 },
      row: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: theme.colors.surface1,
        gap: 4,
      },
      list: { flex: 1, minHeight: 160 },
      listContent: { gap: 6, paddingBottom: 12 },
      search: {
        color: theme.colors.foreground,
        backgroundColor: theme.colors.surface1,
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderRadius: 8,
      },
      error: { color: theme.colors.statusDanger },
      footer: { paddingTop: 8, borderTopWidth: 1, borderColor: theme.colors.border },
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
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const openEntry = useCallback(
    async (entry: WorkspaceEntry) => {
      if (opening.current) return;
      opening.current = true;
      try {
        setBusy(entry.name);
        setError("");
        const workspace = await paseo.workspaces.open({ cwd: entry.directory });
        const terminal = await workspace.terminals.create({
          name: "ws surface",
          command: entry.command,
          args: ["surface", entry.directory],
        });
        const openWorkspaceTarget = navigation?.openWorkspace as
          | ((input: {
              workspaceId: string;
              target: { kind: "terminal"; terminalId: string };
            }) => void)
          | undefined;
        openWorkspaceTarget?.({
          workspaceId: workspace.id,
          target: { kind: "terminal", terminalId: terminal.id },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        opening.current = false;
        setBusy("");
      }
    },
    [navigation, paseo],
  );
  const handleSubmit = useCallback(() => {
    if (busy === "" && filteredEntries[0]) void openEntry(filteredEntries[0]);
  }, [busy, filteredEntries, openEntry]);
  const handleModalOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) navigation?.close?.();
    },
    [navigation],
  );
  const handleRefresh = useCallback(() => void refresh(), [refresh]);
  const search = (
    <TextInput
      accessibilityLabel="Search workspaces"
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus={params.overlay === "1"}
      editable={busy === ""}
      onSubmitEditing={handleSubmit}
      placeholder="Search workspaces…"
      placeholderTextColor={theme.colors.foregroundMuted}
      returnKeyType="go"
      value={query}
      onChangeText={setQuery}
      style={styles.search}
    />
  );
  const results = (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
    >
      {filteredEntries.map((entry) => (
        <WorkspaceRow
          key={entry.name}
          entry={entry}
          busy={busy !== ""}
          onOpen={openEntry}
          styles={styles}
        />
      ))}
      {filteredEntries.length === 0 ? (
        <Text style={styles.detail}>
          {query.trim() ? "No matching workspaces." : "No workspaces found."}
        </Text>
      ) : null}
    </ScrollView>
  );
  const feedback = (
    <>
      {busy ? <Text style={styles.detail}>Opening {busy}…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
  if (params.overlay === "1") {
    return (
      <Modal open title="Choose workspace" onOpenChange={handleModalOpenChange}>
        <Modal.Content scrollable={false}>
          <Text style={styles.host}>{host.label}</Text>
          {search}
          {results}
          {feedback}
          <Pressable accessibilityRole="button" onPress={handleRefresh}>
            <Text style={styles.detail}>Refresh list · Type to filter · Enter to open</Text>
          </Pressable>
        </Modal.Content>
      </Modal>
    );
  }
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Workspaces</Text>
      <Text style={styles.host}>{host.label}</Text>
      {search}
      {results}
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={handleRefresh}>
          <Text style={styles.detail}>Refresh list</Text>
        </Pressable>
      </View>
      {feedback}
    </View>
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "main", title: "Workspaces", Component: Workspaces });
  client.addSidebarHeaderItem({ id: "workspaces", title: "Workspaces", Component: WorkspacesItem });
  return () => {};
}

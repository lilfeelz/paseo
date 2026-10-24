import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  usePaseo,
  type PluginClientContext,
  type PluginScreenProps,
} from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { Modal, ScrollView, TextInput } from "@getpaseo/plugin/client/react-native";
import { listWorkspacesRpc } from "./shared/rpc.js";
import { fuzzySearchWorkspaces, projectKeyFromWorkspacePath } from "./shared/workspaces.js";

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
  selected,
  onSelect,
  onLayout,
  index,
  styles,
}: {
  entry: WorkspaceEntry;
  busy: boolean;
  onOpen: (entry: WorkspaceEntry) => void;
  selected: boolean;
  onSelect: (index: number) => void;
  onLayout: (index: number, layout: { y: number; height: number }) => void;
  index: number;
  styles: { text: object; detail: object; row: object; rowSelected: object };
}) {
  const open = useCallback(() => onOpen(entry), [entry, onOpen]);
  const select = useCallback(() => onSelect(index), [index, onSelect]);
  const layout = useCallback(
    (event: { nativeEvent: { layout: { y: number; height: number } } }) =>
      onLayout(index, event.nativeEvent.layout),
    [index, onLayout],
  );
  const rowStyle = useCallback(
    ({ hovered = false, pressed }: { hovered?: boolean; pressed: boolean }) => [
      styles.row,
      selected && styles.rowSelected,
      (hovered || pressed) && styles.rowSelected,
    ],
    [selected, styles],
  );
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onHoverIn={select}
      onLayout={layout}
      onPress={open}
      style={rowStyle}
    >
      <Text style={styles.text}>{entry.name}</Text>
      <Text style={styles.detail}>{entry.active ? "Active in zmx" : "No active pane"}</Text>
    </Pressable>
  );
}

function Workspaces({ theme, host, params, navigation }: PluginScreenProps) {
  const paseo = usePaseo();
  const listWorkspaces = useRpc(listWorkspacesRpc);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [entries, setEntries] = useState<WorkspaceEntry[]>([]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [overlayOpen, setOverlayOpen] = useState(true);
  const opening = useRef(false);
  const resultsRef = useRef<import("react-native").ScrollView>(null);
  const rowLayouts = useRef(new Map<number, { y: number; height: number }>());
  const viewportHeight = useRef(0);
  const currentOffset = useRef(0);
  const handleViewportLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      viewportHeight.current = event.nativeEvent.layout.height;
    },
    [],
  );
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    currentOffset.current = event.nativeEvent.contentOffset.y;
  }, []);
  const handleRowLayout = useCallback((index: number, layout: { y: number; height: number }) => {
    rowLayouts.current.set(index, layout);
  }, []);
  const projectEntries = useMemo(
    () =>
      params.projectKey
        ? entries.filter(
            (entry) => projectKeyFromWorkspacePath(entry.directory) === params.projectKey,
          )
        : entries,
    [entries, params.projectKey],
  );
  const filteredEntries = useMemo(
    () => fuzzySearchWorkspaces(projectEntries, query),
    [projectEntries, query],
  );
  const selectedIndex =
    filteredEntries.length > 0 ? Math.min(activeIndex, filteredEntries.length - 1) : -1;
  useEffect(() => {
    const row = rowLayouts.current.get(selectedIndex);
    if (!row || viewportHeight.current <= 0) return;
    const scroll = resultsRef.current;
    if (!scroll) return;
    // Reveal the hovered/keyboard-selected row only when it leaves the viewport;
    // fixed row-height guesses made pointer selection jump the list downward.
    const currentTop = currentOffset.current;
    if (row.y < currentTop) scroll.scrollTo({ y: row.y, animated: false });
    else if (row.y + row.height > currentTop + viewportHeight.current) {
      scroll.scrollTo({ y: row.y + row.height - viewportHeight.current, animated: false });
    }
  }, [filteredEntries, selectedIndex]);
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
      rowSelected: { backgroundColor: theme.colors.surface2 },
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
    if (busy === "" && selectedIndex >= 0) void openEntry(filteredEntries[selectedIndex]!);
  }, [busy, filteredEntries, openEntry, selectedIndex]);
  const handleKeyPress = useCallback(
    (event: { nativeEvent?: { key?: string } }) => {
      const key = event.nativeEvent?.key;
      if ((key !== "ArrowDown" && key !== "ArrowUp") || filteredEntries.length === 0) return;
      setActiveIndex((index) => {
        const current = Math.min(index, filteredEntries.length - 1);
        return key === "ArrowDown"
          ? (current + 1) % filteredEntries.length
          : (current - 1 + filteredEntries.length) % filteredEntries.length;
      });
    },
    [filteredEntries.length],
  );
  const handleModalOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setOverlayOpen(false);
        navigation?.close?.();
      }
    },
    [navigation],
  );
  const handleRefresh = useCallback(() => void refresh(), [refresh]);
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(0);
  }, []);
  const search = (
    <TextInput
      accessibilityLabel="Search workspaces"
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus={params.overlay === "1"}
      editable={busy === ""}
      onSubmitEditing={handleSubmit}
      onKeyPress={handleKeyPress}
      placeholder="Search workspaces…"
      placeholderTextColor={theme.colors.foregroundMuted}
      returnKeyType="go"
      value={query}
      onChangeText={handleQueryChange}
      style={styles.search}
    />
  );
  const results = (
    <ScrollView
      ref={resultsRef}
      style={styles.list}
      onLayout={handleViewportLayout}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
    >
      {filteredEntries.map((entry, index) => (
        <WorkspaceRow
          key={entry.name}
          entry={entry}
          busy={busy !== ""}
          onOpen={openEntry}
          styles={styles}
          selected={index === selectedIndex}
          onSelect={setActiveIndex}
          onLayout={handleRowLayout}
          index={index}
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
  if (params.overlay === "1" && overlayOpen) {
    return (
      <Modal
        open
        title={params.projectKey ? `Workspaces · ${params.projectKey}` : "Choose workspace"}
        onOpenChange={handleModalOpenChange}
      >
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
  client.addCommandCenterItem({
    id: "choose-workspace",
    title: "Choose workspace",
    icon: "Search",
    context: "global",
    onSelect({ openScreen }) {
      openScreen({ screenId: "main", params: { overlay: "1" } });
    },
  });
  client.addCommandCenterItem({
    id: "list-project-workspaces",
    title: "List project workspaces",
    icon: "FolderOpen",
    keywords: ["project", "workspace", "checkout"],
    context: "workspace",
    onSelect({ workspace, openScreen }) {
      const projectKey = projectKeyFromWorkspacePath(workspace.directory);
      if (!projectKey) return;
      openScreen({
        screenId: "main",
        params: { overlay: "1", projectKey },
      });
    },
  });
  return () => {};
}

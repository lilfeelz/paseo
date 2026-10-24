export function projectKeyFromWorkspacePath(value: string): string | null {
  const parts = value.replace(/\\/g, "/").split("/").filter(Boolean);
  const root = parts.lastIndexOf("Workspaces");
  const context = parts[root + 1];
  const project = parts[root + 2];
  if (root < 0 || !context || !project) return null;
  return `${context}/${project.replace(/\.tree$/, "")}`;
}

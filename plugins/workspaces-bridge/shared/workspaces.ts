export interface WorkspaceEntry {
  name: string;
  active: boolean;
}

export function parseWorkspaces(output: string): WorkspaceEntry[] {
  return output.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([* ]) (\S(?:.*\S)?)$/);
    return match ? [{ name: match[2]!, active: match[1] === "*" }] : [];
  });
}

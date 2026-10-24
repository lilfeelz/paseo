import { execCommand, type PluginServerContext } from "@getpaseo/plugin/server";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseWorkspaces } from "./shared/workspaces.js";
import { listWorkspacesRpc } from "./shared/rpc.js";

export default function contribute(server: PluginServerContext) {
  server.handle(listWorkspacesRpc, async () => {
    const local = join(process.env.HOME || "", ".local", "bin", "ws");
    const command = process.env.WS_BIN || (existsSync(local) ? local : "ws");
    const { stdout } = await execCommand(command, ["list"], { timeout: 5000, maxBuffer: 65536 });
    const entries = parseWorkspaces(stdout);
    return {
      entries: await Promise.all(
        entries.map(async (entry) => {
          const { stdout: directory } = await execCommand(command, ["dir", entry.name], {
            timeout: 5000,
            maxBuffer: 8192,
          });
          return { name: entry.name, active: entry.active, directory: directory.trim(), command };
        }),
      ),
    };
  });
  return () => {};
}

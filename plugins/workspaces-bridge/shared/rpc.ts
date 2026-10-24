import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const listWorkspacesRpc = defineRpc({
  name: "workspaces.list",
  input: z.object({}),
  output: z.object({
    entries: z.array(
      z.object({
        name: z.string(),
        directory: z.string(),
        active: z.boolean(),
        command: z.string(),
      }),
    ),
  }),
});

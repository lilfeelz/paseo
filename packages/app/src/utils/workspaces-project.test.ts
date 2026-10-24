import { describe, expect, it } from "vitest";
import { projectKeyFromWorkspacePath } from "./workspaces-project";

describe("projectKeyFromWorkspacePath", () => {
  it("groups a project checkout and its managed worktrees", () => {
    expect(projectKeyFromWorkspacePath("/Users/j/Workspaces/lilfeelz/paseo")).toBe(
      "lilfeelz/paseo",
    );
    expect(
      projectKeyFromWorkspacePath("/Users/j/Workspaces/lilfeelz/paseo.tree/worktrees/feature-x"),
    ).toBe("lilfeelz/paseo");
  });

  it("rejects paths outside the Workspaces layout", () => {
    expect(projectKeyFromWorkspacePath("/Users/j/Notes")).toBeNull();
    expect(projectKeyFromWorkspacePath("/Users/j/Workspaces/lilfeelz")).toBeNull();
  });
});

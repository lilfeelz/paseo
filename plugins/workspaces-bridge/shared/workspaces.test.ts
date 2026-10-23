import { describe, expect, it } from "vitest";
import {
  fuzzySearchWorkspaces,
  parseWorkspaces,
  projectKeyFromWorkspacePath,
} from "./workspaces.js";

describe("parseWorkspaces", () => {
  it("parses workspace names and zmx activity", () => {
    expect(parseWorkspaces("* lilfeelz/workspaces\n  lilfeelz/paseo\n")).toEqual([
      { name: "lilfeelz/workspaces", active: true },
      { name: "lilfeelz/paseo", active: false },
    ]);
  });

  it("ignores empty and malformed lines", () => {
    expect(parseWorkspaces("\n-- invalid\n ")).toEqual([]);
  });
});

describe("fuzzySearchWorkspaces", () => {
  it("matches subsequences and ranks closer workspace names first", () => {
    const entries = [
      { name: "JakobMelchard/content", active: false },
      { name: "lilfeelz/workspaces", active: true },
      { name: "lilfeelz/workspaces.tree", active: false },
    ];
    expect(fuzzySearchWorkspaces(entries, "lf/ws").map(({ name }) => name)).toEqual([
      "lilfeelz/workspaces",
      "lilfeelz/workspaces.tree",
    ]);
  });

  it("supports multiple case-insensitive terms and preserves rows for an empty query", () => {
    const entries = [
      { name: "lilfeelz/workspaces", active: true },
      { name: "JakobMelchard/content", active: false },
    ];
    expect(fuzzySearchWorkspaces(entries, "LFLZ wsp").map(({ name }) => name)).toEqual([
      "lilfeelz/workspaces",
    ]);
    expect(fuzzySearchWorkspaces(entries, "")).toEqual(entries);
  });

  it("ranks a closer subsequence above an earlier scattered match", () => {
    const entries = [{ name: "acb" }, { name: "aab" }];
    expect(fuzzySearchWorkspaces(entries, "ab").map(({ name }) => name)).toEqual(["aab", "acb"]);
  });

  it("ranks a closer subsequence above an earlier scattered match", () => {
    const entries = [{ name: "acb" }, { name: "aab" }];
    expect(fuzzySearchWorkspaces(entries, "ab").map(({ name }) => name)).toEqual(["aab", "acb"]);
  });
});

describe("projectKeyFromWorkspacePath", () => {
  it("groups the main checkout and its managed worktrees", () => {
    expect(projectKeyFromWorkspacePath("/Users/j/Workspaces/lilfeelz/paseo")).toBe(
      "lilfeelz/paseo",
    );
    expect(
      projectKeyFromWorkspacePath("/Users/j/Workspaces/lilfeelz/paseo.tree/worktrees/feature-x"),
    ).toBe("lilfeelz/paseo");
    expect(projectKeyFromWorkspacePath("/Users/j/Notes")).toBeNull();
  });
});

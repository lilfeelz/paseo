import { describe, expect, it } from "vitest";
import { parseWorkspaces } from "./workspaces.js";

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

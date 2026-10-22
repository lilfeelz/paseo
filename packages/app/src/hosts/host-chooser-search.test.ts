import { describe, expect, test } from "vitest";
import { scoreHostQuery } from "./host-chooser-search";

const host = (label: string, serverId: string) => ({ label, serverId });

describe("host chooser fuzzy search", () => {
  test("matches subsequences across host labels and ids", () => {
    expect(scoreHostQuery(host("Book", "book.local"), "bk")).not.toBeNull();
    expect(scoreHostQuery(host("Mac mini", "mimi"), "mm")).not.toBeNull();
    expect(scoreHostQuery(host("Mac mini", "mimi"), "xyz")).toBeNull();
  });

  test("ranks closer subsequences higher and accepts multiple terms", () => {
    expect(scoreHostQuery(host("Bok", "alpha"), "bk")).toBeGreaterThan(
      scoreHostQuery(host("Backup keeper", "zulu"), "bk") ?? Number.NEGATIVE_INFINITY,
    );
    expect(scoreHostQuery(host("Book local", "book.local"), "bk loc")).not.toBeNull();
  });
});

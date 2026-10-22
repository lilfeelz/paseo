export interface WorkspaceEntry {
  name: string;
  active: boolean;
}

function scoreSubsequence(value: string, query: string): number | null {
  let previousScores = Array<number>(value.length).fill(Number.NEGATIVE_INFINITY);

  for (let queryIndex = 0; queryIndex < query.length; queryIndex += 1) {
    const character = query[queryIndex];
    const scores = Array<number>(value.length).fill(Number.NEGATIVE_INFINITY);
    let bestNonAdjacent = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < value.length; index += 1) {
      if (queryIndex > 0 && index >= 2) {
        bestNonAdjacent = Math.max(bestNonAdjacent, previousScores[index - 2] + index - 2);
      }
      if (value[index] !== character) continue;

      let boundaryScore = 0;
      if (index === 0) boundaryScore = 6;
      else if (/[\s/._-]/.test(value[index - 1] ?? "")) boundaryScore = 5;
      if (queryIndex === 0) {
        scores[index] = boundaryScore - index * 0.25;
        continue;
      }

      const adjacentScore = index > 0 ? previousScores[index - 1] + 8 : Number.NEGATIVE_INFINITY;
      const gappedScore = bestNonAdjacent - (index - 1);
      scores[index] = Math.max(adjacentScore, gappedScore) + boundaryScore;
    }

    previousScores = scores;
  }

  const bestScore = Math.max(...previousScores);
  return Number.isFinite(bestScore) ? bestScore - (value.length - query.length) * 0.015 : null;
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function fuzzySearchWorkspaces<T extends Pick<WorkspaceEntry, "name">>(
  entries: readonly T[],
  query: string,
): T[] {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...entries];

  return entries
    .map((entry, index) => {
      const name = normalize(entry.name);
      let score = 0;
      for (const term of terms) {
        const termScore = scoreSubsequence(name, term);
        if (termScore === null) return null;
        score += termScore;
      }
      return { entry, index, score };
    })
    .filter((result): result is { entry: T; index: number; score: number } => result !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ entry }) => entry);
}

export function parseWorkspaces(output: string): WorkspaceEntry[] {
  return output.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([* ]) (\S(?:.*\S)?)$/);
    return match ? [{ name: match[2]!, active: match[1] === "*" }] : [];
  });
}

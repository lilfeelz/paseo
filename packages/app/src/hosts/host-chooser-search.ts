import type { HostProfile } from "@/types/host-connection";

export function scoreHostQuery(
  host: Pick<HostProfile, "label" | "serverId">,
  query: string,
): number | null {
  const terms = query.normalize("NFKD").toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;
  const values = [host.label, host.serverId].map((value) => value.normalize("NFKD").toLowerCase());
  let total = 0;
  for (const term of terms) {
    const scores = values.map((value) => {
      let start = -1;
      let previous = -1;
      let gap = 0;
      let termIndex = 0;
      for (let index = 0; index < value.length; index += 1) {
        if (value[index] !== term[termIndex]) continue;
        if (start < 0) start = index;
        if (previous >= 0) gap += index - previous - 1;
        previous = index;
        termIndex += 1;
        if (termIndex === term.length) return -(gap + start * 0.1);
      }
      return null;
    });
    const best = scores.reduce<number | null>(
      (value, score) => (score !== null && (value === null || score > value) ? score : value),
      null,
    );
    if (best === null) return null;
    total += best;
  }
  return total;
}

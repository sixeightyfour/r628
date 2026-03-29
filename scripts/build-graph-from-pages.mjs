import fs from "node:fs/promises";

const INPUT = "demos-build/assets/all_pages.json";
const OUTPUT = "demos-build/assets/graph_from_pages.json";

function seededPositionFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const rand = (shift) => {
    let x = (h >>> shift) ^ h;
    x = Math.imul(x, 2246822519);
    return ((x >>> 0) / 4294967295) * 2 - 1;
  };

  return {
    x: rand(1) * 100,
    y: rand(7) * 100,
    z: rand(13) * 100,
  };
}

function isValidPage(page) {
  return page && typeof page === "object" && typeof page.link === "string" && page.link.length > 0;
}

function normalizeReference(ref) {
  if (typeof ref !== "string") return null;
  const trimmed = ref.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function main() {
  const raw = JSON.parse(await fs.readFile(INPUT, "utf8"));

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Expected all_pages.json to be an object keyed by URL");
  }

  const pages = Object.values(raw).filter(isValidPage);

  const nodeById = new Map();
  for (const page of pages) {
    const pos = seededPositionFromString(page.link);

    nodeById.set(page.link, {
      id: page.link,
      label: page.title ?? page.link,
      title: page.title ?? page.link,
      tags: Array.isArray(page.tags) ? page.tags : [],
      rating: typeof page.rating === "number" ? page.rating : null,
      page_type: typeof page.page_type === "string" ? page.page_type : null,
      url: page.url ?? null,
      x: pos.x,
      y: pos.y,
      z: pos.z,
    });
  }

  const edgeSeen = new Set();
  const edges = [];

  for (const page of pages) {
    const source = page.link;
    const refs = Array.isArray(page.references) ? page.references : [];

    for (const rawRef of refs) {
      const target = normalizeReference(rawRef);
      if (!target) continue;

      if (!nodeById.has(target)) continue;
      if (target === source) continue;

      const key = `${source}->${target}`;
      if (edgeSeen.has(key)) continue;
      edgeSeen.add(key);

      edges.push({
        source,
        target,
      });
    }
  }

  const graph = {
    nodes: Array.from(nodeById.values()),
    edges,
  };

  await fs.writeFile(OUTPUT, JSON.stringify(graph));
  console.log(`Wrote ${OUTPUT}`);
  console.log(`nodes=${graph.nodes.length}, edges=${graph.edges.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

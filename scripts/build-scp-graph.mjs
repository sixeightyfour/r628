import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const API_ROOT = "https://scp-data.tedivm.com/data/scp";
const OUT_DIR = path.resolve(process.cwd(), "demos-build/assets");
const OUT_FILE = path.join(OUT_DIR, "scp-graph.json");
const WIKI_ROOT = "https://scp-wiki.wikidot.com/";

function log(...args) {
  console.log("[build-scp-graph]", ...args);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "r628-scp-graph-builder/1.0 (+github-actions)",
      accept: "application/json,text/plain,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

function normalizeSlug(input) {
  if (!input) return null;

  let s = String(input).trim();
  if (!s) return null;

  s = s.replace(/^:scp-wiki:/i, "");

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      s = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    } catch {
      s = s.replace(/^https?:\/\/[^/]+\//i, "");
    }
  }

  s = decodeURIComponent(s);
  s = s.split("#")[0].split("?")[0].trim();
  s = s.replace(/^\/+/, "");
  s = s.replace(/^:scp-wiki:/i, "");
  s = s.toLowerCase();

  return s || null;
}

function slugToUrl(slug) {
  return `${WIKI_ROOT}${slug}`;
}

function hashBytes(value) {
  return crypto.createHash("sha256").update(value).digest();
}

function deterministicPosition(key) {
  const h = hashBytes(key);
  const u0 = h[0] / 255;
  const u1 = h[1] / 255;
  const u2 = h[2] / 255;
  const u3 = h[3] / 255;
  const u4 = h[4] / 255;
  const u5 = h[5] / 255;

  const theta = u0 * Math.PI * 2;
  const phi = Math.acos(2 * u1 - 1);
  const radius = 50 + u2 * 120;

  return {
    x: Math.sin(phi) * Math.cos(theta) * radius + (u3 - 0.5) * 6,
    y: Math.sin(phi) * Math.sin(theta) * radius + (u4 - 0.5) * 6,
    z: Math.cos(phi) * radius + (u5 - 0.5) * 6,
  };
}

async function readPreviousGraph() {
  try {
    const raw = await fs.readFile(OUT_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function previousPositionMap(previousGraph) {
  const map = new Map();
  if (!previousGraph || !Array.isArray(previousGraph.nodes)) return map;

  for (const node of previousGraph.nodes) {
    if (
      node &&
      typeof node.id === "string" &&
      typeof node.x === "number" &&
      typeof node.y === "number" &&
      typeof node.z === "number"
    ) {
      map.set(node.id, { x: node.x, y: node.y, z: node.z });
    }
  }

  return map;
}

function dedupeStrings(values) {
  return [...new Set((values || []).filter(Boolean).map(String))];
}

function extractFragmentSlugs(text) {
  if (!text || typeof text !== "string") return [];

  const out = new Set();

  const patterns = [
    /\[\[include\s+(?::scp-wiki:)?(fragment:[^\]\s]+)[^\]]*\]\]/gi,
    /https?:\/\/scp-wiki\.wikidot\.com\/(fragment:[^\s<>"'`\])]+)/gi,
    /\b(fragment:[a-z0-9._\-:%]+)\b/gi,
  ];

  for (const re of patterns) {
    for (const match of text.matchAll(re)) {
      const slug = normalizeSlug(match[1]);
      if (slug?.startsWith("fragment:")) out.add(slug);
    }
  }

  return [...out];
}

async function loadIndex(section) {
  const url = `${API_ROOT}/${section}/index.json`;
  return await fetchJson(url);
}

async function loadContentMap(section) {
  const contentIndexUrl = `${API_ROOT}/${section}/content_index.json`;
  const contentIndex = await fetchJson(contentIndexUrl);
  const map = new Map();

  for (const relPath of Object.values(contentIndex)) {
    const chunkUrl = new URL(relPath, contentIndexUrl).toString();
    log(`fetching content chunk: ${chunkUrl}`);
    const chunk = await fetchJson(chunkUrl);

    for (const [key, value] of Object.entries(chunk)) {
      const slug = normalizeSlug(value?.link ?? key);
      if (!slug) continue;
      map.set(slug, value);
    }
  }

  return map;
}

function createNodeStore() {
  return new Map();
}

function upsertNode(store, id, patch = {}) {
  if (!store.has(id)) {
    store.set(id, {
      id,
      kind: patch.kind ?? "unknown",
      label: patch.label ?? id,
      title: patch.title ?? patch.label ?? id,
      url: patch.url ?? slugToUrl(id),
      tags: new Set(patch.tags ?? []),
      rating: patch.rating ?? null,
      parent: patch.parent ?? null,
    });
  }

  const node = store.get(id);

  if (patch.kind && node.kind === "unknown") node.kind = patch.kind;
  if (patch.label && node.label === node.id) node.label = patch.label;
  if (patch.title && node.title === node.id) node.title = patch.title;
  if (patch.url && !node.url) node.url = patch.url;
  if (patch.rating != null && node.rating == null) node.rating = patch.rating;
  if (patch.parent && !node.parent) node.parent = patch.parent;

  for (const tag of patch.tags ?? []) {
    node.tags.add(tag);
  }

  return node;
}

function createEdgeStore() {
  return new Map();
}

function edgeKey(source, target, kind) {
  return `${source}__${target}__${kind}`;
}

function addEdge(edges, source, target, kind) {
  if (!source || !target || source === target) return;
  edges.set(edgeKey(source, target, kind), { source, target, kind });
}

function ingestSection(nodes, edges, kind, dataset) {
  for (const [key, raw] of Object.entries(dataset)) {
    const slug = normalizeSlug(raw?.link ?? key);
    if (!slug) continue;

    upsertNode(nodes, slug, {
      kind,
      label: raw?.title ?? slug,
      title: raw?.title ?? slug,
      url: slugToUrl(slug),
      tags: raw?.tags ?? [],
      rating: raw?.rating ?? null,
    });

    if (!slug.startsWith("fragment:")) {
      for (const ref of raw?.references ?? []) {
        const refSlug = normalizeSlug(ref);
        if (!refSlug || refSlug.startsWith("fragment:")) continue;

        upsertNode(nodes, refSlug, {
          label: refSlug,
          title: refSlug,
        });

        addEdge(edges, slug, refSlug, "reference");
      }
    }

    for (const hub of raw?.hubs ?? []) {
      const hubSlug = normalizeSlug(hub);
      if (!hubSlug) continue;

      upsertNode(nodes, hubSlug, {
        kind: "hub",
        label: hubSlug,
        title: hubSlug,
      });

      if (!slug.startsWith("fragment:")) {
        addEdge(edges, slug, hubSlug, "in_hub");
      }
    }

    if (kind === "hub") {
      for (const member of raw?.references ?? []) {
        const memberSlug = normalizeSlug(member);
        if (!memberSlug || memberSlug.startsWith("fragment:")) continue;

        upsertNode(nodes, memberSlug, {
          label: memberSlug,
          title: memberSlug,
        });

        addEdge(edges, memberSlug, slug, "in_hub");
      }
    }
  }
}

function addFragmentsFromContent(nodes, edges, contentMap) {
  for (const [parentSlug, contentObj] of contentMap.entries()) {
    const text =
      contentObj?.raw_source ??
      contentObj?.raw_content ??
      contentObj?.content ??
      "";

    const fragmentSlugs = extractFragmentSlugs(text);

    for (const fragmentSlug of fragmentSlugs) {
      upsertNode(nodes, fragmentSlug, {
        kind: "fragment",
        label: fragmentSlug,
        title: fragmentSlug,
        parent: parentSlug,
        tags: ["fragment"],
      });

      addEdge(edges, fragmentSlug, parentSlug, "fragment_of");
    }
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const previousGraph = await readPreviousGraph();
  const prevPositions = previousPositionMap(previousGraph);

  log("loading metadata indexes");
  const [items, tales, hubs] = await Promise.all([
    loadIndex("items"),
    loadIndex("tales"),
    loadIndex("hubs"),
  ]);

  log("loading content indexes for fragment discovery");
  const [itemsContent, talesContent] = await Promise.all([
    loadContentMap("items"),
    loadContentMap("tales"),
  ]);

  const nodes = createNodeStore();
  const edges = createEdgeStore();

  ingestSection(nodes, edges, "item", items);
  ingestSection(nodes, edges, "tale", tales);
  ingestSection(nodes, edges, "hub", hubs);

  addFragmentsFromContent(nodes, edges, itemsContent);
  addFragmentsFromContent(nodes, edges, talesContent);

  const finalNodes = [...nodes.values()]
    .map((node) => {
      const pos = prevPositions.get(node.id) ?? deterministicPosition(node.id);

      return {
        id: node.id,
        kind: node.kind,
        label: node.label,
        title: node.title,
        url: node.url,
        tags: dedupeStrings([...node.tags]),
        rating: node.rating,
        parent: node.parent,
        x: pos.x,
        y: pos.y,
        z: pos.z,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const validIds = new Set(finalNodes.map((n) => n.id));

  const finalEdges = [...edges.values()]
    .filter((e) => validIds.has(e.source) && validIds.has(e.target))
    .sort(
      (a, b) =>
        a.source.localeCompare(b.source) ||
        a.target.localeCompare(b.target) ||
        a.kind.localeCompare(b.kind),
    );

  const graph = {
    generatedAt: new Date().toISOString(),
    counts: {
      nodes: finalNodes.length,
      edges: finalEdges.length,
      items: finalNodes.filter((n) => n.kind === "item").length,
      tales: finalNodes.filter((n) => n.kind === "tale").length,
      hubs: finalNodes.filter((n) => n.kind === "hub").length,
      fragments: finalNodes.filter((n) => n.kind === "fragment").length,
    },
    nodes: finalNodes,
    edges: finalEdges,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(graph, null, 2) + "\n", "utf8");

  log(`wrote ${OUT_FILE}`);
  log(graph.counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

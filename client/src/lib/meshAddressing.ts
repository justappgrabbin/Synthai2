import { publishMeshEvent } from "@/lib/meshEvents";

export type MeshNodeKind =
  | "person"
  | "place"
  | "thing"
  | "app"
  | "tool"
  | "game"
  | "template"
  | "file"
  | "action"
  | "system";

export type MeshNodeDescriptor = {
  kind: MeshNodeKind;
  name: string;
  domain?: string;
  parent?: string;
  purpose?: string;
  tags?: string[];
  address?: Partial<CanonicalMeshAddress>;
  agentId?: string | null;
  payload?: Record<string, unknown>;
};

export type CanonicalMeshAddress = {
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  degree: number;
  minute: number;
  second: number;
  arc: string;
  zodiac: string;
  house: number;
};

const DEFAULT_ADDRESS: CanonicalMeshAddress = {
  gate: 1,
  line: 1,
  color: 1,
  tone: 1,
  base: 1,
  degree: 0,
  minute: 0,
  second: 0,
  arc: "root",
  zodiac: "aries",
  house: 1,
};

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "node";
}

export function normalizeCanonicalAddress(address?: Partial<CanonicalMeshAddress>): CanonicalMeshAddress {
  return {
    ...DEFAULT_ADDRESS,
    ...(address || {}),
  };
}

export function addressToIndex(address: Partial<CanonicalMeshAddress>) {
  const a = normalizeCanonicalAddress(address);
  return (a.gate - 1) * 1080 + (a.line - 1) * 180 + (a.color - 1) * 30 + (a.tone - 1) * 5 + (a.base - 1);
}

export function createOntologicalAddress(node: MeshNodeDescriptor) {
  const domain = slug(node.domain || "you-n-i-verse");
  const kind = slug(node.kind);
  const name = slug(node.name);
  const parent = node.parent ? `/${slug(node.parent)}` : "";
  const a = normalizeCanonicalAddress(node.address);
  const agent = node.agentId ? `/agent/${slug(node.agentId)}` : "";
  const field = `g${a.gate}.l${a.line}.c${a.color}.t${a.tone}.b${a.base}`;
  const astro = `deg${a.degree}.m${a.minute}.s${a.second}.${slug(a.arc)}.${slug(a.zodiac)}.h${a.house}`;

  return `mesh://${domain}/${kind}${parent}/${field}/${astro}${agent}/${name}`;
}

export async function publishMeshNode(
  node: MeshNodeDescriptor,
  eventType = "node.touched",
) {
  const address = createOntologicalAddress(node);
  const canonicalAddress = normalizeCanonicalAddress(node.address);

  await publishMeshEvent({
    source: "mesh-addressing",
    type: eventType,
    topic: address,
    payload: {
      address,
      canonicalAddress,
      addressIndex: addressToIndex(canonicalAddress),
      kind: node.kind,
      name: node.name,
      domain: node.domain || "you-n-i-verse",
      parent: node.parent,
      agentId: node.agentId || null,
      purpose: node.purpose,
      tags: node.tags || [],
      ...(node.payload || {}),
    },
  });

  return address;
}

export function gameTemplateNode(template: {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
}) {
  return {
    kind: "template" as const,
    domain: "games",
    parent: "game-creator",
    name: template.id || template.title,
    purpose: template.description || "Game template",
    tags: template.tags || [],
    agentId: null,
    payload: {
      templateId: template.id,
      title: template.title,
    },
  };
}

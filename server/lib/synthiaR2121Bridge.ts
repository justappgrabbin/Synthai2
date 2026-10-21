import { verifyR2121Archive, stageR2121Donor, addressR2121Donor } from "./synthiaR2121Plugin";
import { publishMeshEvent } from "./meshEventStore";

/**
 * Plugin bridge for Synthai2. Verification and staging are separate from execution.
 * The MCP/mesh transports events; it does not become Synthia's reasoning engine.
 */
export async function registerR2121Plugin(zipBytes: Buffer, workspaceRoot: string, ownerApproved: boolean) {
  const receipt = await verifyR2121Archive(zipBytes);
  if (!ownerApproved) return { ...receipt, address: addressR2121Donor(), staged: false, connected: false, reason: "owner-approval-required" };
  const staged = await stageR2121Donor(zipBytes, workspaceRoot);
  const event = publishMeshEvent({
    source: "synthia-r21.21-plugin",
    type: "plugin.donor.staged",
    topic: "plugin",
    payload: {
      identity: staged.address.identity,
      sha256: staged.sha256,
      entry: staged.unit,
      activation: "inactive",
    },
  });
  return {...staged, staged:true, connected:true, meshEventId:event?.id ?? null};
}

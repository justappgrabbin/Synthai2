/**
 * SubstrateKernel — bridge between AION dimensional engine and NovelWriter.
 * Provides access to Klein tools and gate addressing.
 * Stub wired to AionBridge; full implementation connects to Python server.
 */
import { AionBridge, type MorphAddress } from '@/lib/aionBridge';

export interface SubstrateKernel {
  addressToIndex(address: MorphAddress): number;
  queryGate(gate: number): Promise<any[]>;
  getIntegrationNetwork(): readonly number[];
  fuseWeights(): typeof AionBridge.FUSE;
  isActive(): boolean;
  spawn(actor: Record<string, unknown>): void;
  send(message: Record<string, unknown>): void;
}

export const SubstrateKernel = {
  TRAY_ADDR: 'system.tray',
} as const;

class SubstrateKernelImpl implements SubstrateKernel {
  private actors = new Map<string, Record<string, unknown>>();
  private messages: Record<string, unknown>[] = [];

  addressToIndex(address: MorphAddress): number {
    return AionBridge.addressToIndex(address);
  }
  async queryGate(gate: number) {
    return AionBridge.queryGate(gate);
  }
  getIntegrationNetwork() {
    return AionBridge.INTEGRATION_NETWORK;
  }
  fuseWeights() {
    return AionBridge.FUSE;
  }
  isActive() {
    return AionBridge.isActive;
  }
  spawn(actor: Record<string, unknown>) {
    const address = String(actor.address || `actor.${this.actors.size + 1}`);
    this.actors.set(address, actor);
  }
  send(message: Record<string, unknown>) {
    this.messages.push({ ...message, timestamp: new Date().toISOString() });
    this.messages = this.messages.slice(-200);
  }
}

const _kernel = new SubstrateKernelImpl();
export function getKernel(): SubstrateKernel { return _kernel; }

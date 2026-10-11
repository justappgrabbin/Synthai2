export interface StoredArtifact {
  id: string; originalName: string; originalContent: string; userId?: string;
  type: 'file' | 'code' | 'text' | 'url'; language?: string;
  understanding?: { intent: string };
}

/** Source text is authoritative. Generated code is never marked verified. */
export class ArtifactMemory {
  private artifacts = new Map<string, StoredArtifact>();
  private chunks = new Map<string, string[]>();

  store(artifact: StoredArtifact) {
    if (!artifact.id || typeof artifact.originalContent !== 'string') throw new Error('Invalid artifact');
    this.artifacts.set(artifact.id, structuredClone(artifact));
  }
  storeChunks(id: string, chunks: string[]) {
    if (!this.artifacts.has(id)) throw new Error('Store the artifact before its chunks');
    if (chunks.some(chunk => typeof chunk !== 'string')) throw new Error('Invalid code chunks');
    this.chunks.set(id, [...chunks]);
  }
  find(intent: string, userId: string, artifactId?: string): StoredArtifact {
    const candidates = [...this.artifacts.values()].filter(artifact =>
      (artifact.userId || 'default') === userId &&
      (artifactId ? artifact.id === artifactId : artifact.understanding?.intent === intent));
    if (candidates.length !== 1) throw new Error(candidates.length ?
      'Multiple artifacts match; select a specific artifact' : 'No stored artifact matches this request');
    return structuredClone(candidates[0]);
  }
  exact(intent: string, userId: string, artifactId?: string) {
    const artifact = this.find(intent, userId, artifactId);
    // Overlapping retrieval chunks must not be joined: that duplicates source text.
    return { artifact, code: artifact.originalContent, confidence: 100 };
  }
}

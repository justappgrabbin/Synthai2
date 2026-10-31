# Resonance Network bundle transport

The canonical `Resonance-Network-Social-Organism-MCP-Wired.zip` remains unchanged.

GitHub transport may store the ZIP as raw byte parts because the archive is larger than the available connector upload envelope. These parts are **not** an architectural split. They are concatenated in order and SHA-256 verified before installation.

Use:

```bash
node scripts/resonance-bundle.mjs split /path/to/Resonance-Network-Social-Organism-MCP-Wired.zip resonance-bundles
bash scripts/reconstruct-resonance.sh
```

The reconstruction command fails if even one byte differs from the manifest.

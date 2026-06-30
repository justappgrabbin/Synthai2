const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { ensureDir, listFiles, extOf } = require('./MorphUtils');

function pickPrimary(files) {
  return files.find((file) => file.toLowerCase() === 'index.html')
    || files.find((file) => ['pdf', 'docx', 'xlsx', 'csv', 'json', 'md', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav'].includes(extOf(file)))
    || files[0]
    || null;
}

function viewerKind(file) {
  const ext = extOf(file);
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['json', 'csv', 'md', 'txt'].includes(ext)) return 'text';
  if (['docx', 'xlsx'].includes(ext)) return 'office';
  if (ext === 'html') return 'html';
  return 'generic';
}

async function generateWrapper({ entryId, name, sourcePath, wrapperPath }) {
  const files = await listFiles(sourcePath);
  const primary = pickPrimary(files);
  const kind = viewerKind(primary || '');
  await ensureDir(wrapperPath);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(name)} · Morph Entry</title>
  <style>
    body{margin:0;font-family:Inter,system-ui,sans-serif;background:#080810;color:#fff;}
    header{padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);}
    main{padding:20px;display:grid;gap:16px;}
    .card{border:1px solid rgba(255,255,255,.16);border-radius:18px;background:rgba(255,255,255,.07);padding:16px;}
    iframe,img,video{width:100%;max-height:78vh;border:0;border-radius:14px;background:#111;}
    pre{white-space:pre-wrap;word-break:break-word;max-height:70vh;overflow:auto;}
    code{opacity:.84;}
    a{color:#d8ccff;}
  </style>
</head>
<body>
  <header>
    <strong>🧬 Morph Entry</strong>
    <div>${escapeHtml(name)}</div>
    <small>${escapeHtml(entryId)} · ${escapeHtml(kind)} wrapper</small>
  </header>
  <main>
    <section class="card" id="viewer">Loading wrapper...</section>
    <section class="card"><strong>Files</strong><pre>${escapeHtml(files.join('\n'))}</pre></section>
  </main>
  <script>
    const primary = ${JSON.stringify(primary)};
    const kind = ${JSON.stringify(kind)};
    const viewer = document.getElementById('viewer');
    const src = primary ? '/api/morph/${encodeURIComponent(entryId)}/source/' + encodeURIComponent(primary).replace(/%2F/g, '/') : '';
    if (!primary) viewer.innerHTML = '<strong>No source file found.</strong>';
    else if (kind === 'image') viewer.innerHTML = '<img src="' + src + '" />';
    else if (kind === 'video') viewer.innerHTML = '<video src="' + src + '" controls></video>';
    else if (kind === 'audio') viewer.innerHTML = '<audio src="' + src + '" controls style="width:100%"></audio>';
    else if (kind === 'pdf' || kind === 'html') viewer.innerHTML = '<iframe src="' + src + '" style="height:78vh"></iframe>';
    else if (kind === 'text') fetch(src).then(r => r.text()).then(t => { viewer.innerHTML = '<pre></pre>'; viewer.querySelector('pre').textContent = t; }).catch(() => viewer.innerHTML = '<a href="' + src + '">Open source file</a>');
    else viewer.innerHTML = '<p>This artifact is mounted as a Morph Entry wrapper.</p><p><a href="' + src + '">Open primary source</a></p>';
  </script>
</body>
</html>`;

  const server = `const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 4317;
app.use(express.static(__dirname));
app.listen(port, () => console.log('Morph wrapper ${entryId} on port ' + port));
`;

  await fsp.writeFile(path.join(wrapperPath, 'index.html'), html);
  await fsp.writeFile(path.join(wrapperPath, 'server.js'), server);
  await fsp.writeFile(path.join(wrapperPath, 'package.json'), JSON.stringify({
    name: `morph-wrapper-${entryId}`,
    version: '1.0.0',
    private: true,
    scripts: { start: 'node server.js' },
    dependencies: { express: '^4.18.2' }
  }, null, 2));

  return { primary, kind, files };
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

module.exports = { generateWrapper, pickPrimary, viewerKind };

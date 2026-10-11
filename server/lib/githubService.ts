export interface GitHubFile { path: string; content: string; }

export async function getGitHubAccessToken(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const identity = process.env.REPL_IDENTITY ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL ? 'depl ' + process.env.WEB_REPL_RENEWAL : null;
  if (!hostname || !identity) throw new Error('GitHub is not connected. Connect GitHub in the app’s Replit integrations.');
  const response = await fetch('https://' + hostname + '/api/v2/connection?include_secrets=true&connection_names=github', {
    headers: { Accept: 'application/json', 'X_REPLIT_TOKEN': identity }, signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error('GitHub connection could not be loaded. Reconnect GitHub in Replit.');
  const data = await response.json();
  const token = data.items?.[0]?.settings?.access_token;
  if (typeof token !== 'string' || !token) throw new Error('GitHub is not connected. Connect GitHub in Replit integrations.');
  return token;
}

async function github(token: string, path: string, method = 'GET', body?: unknown, allowMissing = false) {
  const response = await fetch(`https://api.github.com${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
  if (response.status === 404 && allowMissing) return null;
  if (!response.ok) throw new Error(`GitHub ${method} failed (${response.status}). Check connection permissions; no successful save has been confirmed.`);
  return response.json();
}

export function validateGitHubFiles(repoName: string, files: GitHubFile[]) {
  if (typeof repoName !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(repoName)) throw new Error('Use a repository name containing letters, numbers, dots, underscores or hyphens.');
  if (!Array.isArray(files) || !files.length || files.length > 500) throw new Error('Choose between 1 and 500 workspace files.');
  const seen = new Set<string>();
  let total = 0;
  for (const file of files) {
    if (!file || typeof file.path !== 'string' || typeof file.content !== 'string' || !file.path || file.path.startsWith('/') || /[\\\x00-\x1f]/.test(file.path) || file.path.split('/').some(p => p === '..' || p === '.' || !p)) throw new Error('Invalid workspace file path.');
    if (file.path.split('/').some(p => /^(?:\.git|\.env(?:\..*)?|id_rsa|id_ed25519|credentials(?:\.json)?)$/i.test(p) && !/^\.env\.(example|sample|template)$/i.test(p))) throw new Error('Remove credentials and environment secrets before saving to GitHub.');
    if (seen.has(file.path)) throw new Error('Duplicate workspace file path.');
    seen.add(file.path); total += Buffer.byteLength(file.content);
  }
  if (total > 5_000_000) throw new Error('Workspace exceeds the 5 MB GitHub save limit.');
}

export async function getGitHubConnectionStatus() {
  const token = await getGitHubAccessToken();
  const user = await github(token, '/user');
  if (!user.login) throw new Error('GitHub did not return an account name.');
  return { username: user.login };
}

// Serialize saves within a server process to avoid two simultaneous exports
// replacing one another's branch head. GitHub also rejects non-fast-forward updates.
let saves: Promise<unknown> = Promise.resolve();
export async function createOrUpdateGitHubRepo(repoName: string, files: GitHubFile[], description = 'Created from YOU–N–I–VERSE Studio') {
  validateGitHubFiles(repoName, files);
  const next = saves.then(() => saveRepo(repoName, files, description));
  saves = next.catch(() => undefined);
  return next;
}

async function saveRepo(repoName: string, files: GitHubFile[], description: string) {
  const token = await getGitHubAccessToken();
  const user = await github(token, '/user');
  if (!user.login) throw new Error('GitHub did not return an account name.');
  const username = user.login;
  const root = `/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}`;
  let repo = await github(token, root, 'GET', undefined, true);
  if (!repo) repo = await github(token, '/user/repos', 'POST', { name: repoName, description, private: true, auto_init: true });
  if (!repo.default_branch || !repo.html_url) throw new Error('GitHub repository initialization is incomplete. Check GitHub before retrying.');
  const refPath = `/git/refs/heads/${encodeURIComponent(repo.default_branch)}`;
  const ref = await github(token, root + refPath);
  const parent = await github(token, root + '/git/commits/' + ref.object.sha);
  const tree = await github(token, root + '/git/trees', 'POST', {
    base_tree: parent.tree.sha,
    tree: files.map(file => ({ path: file.path, mode: '100644', type: 'blob', content: file.content })),
  });
  const commit = await github(token, root + '/git/commits', 'POST', {
    message: 'Save IDE workspace with Synthia', tree: tree.sha, parents: [parent.sha],
  });
  await github(token, root + refPath, 'PATCH', { sha: commit.sha, force: false });
  return { url: repo.html_url, username, repoName, commitSha: commit.sha };
}

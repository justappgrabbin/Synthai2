import { FileSystem, type FileNode } from './fileSystem';

export type GitHubIntent = { kind: 'status' } | { kind: 'push'; repoName: string } | { kind: 'help' };

// Only explicit user requests invoke tools; assistant output is never executed.
export function parseGitHubIntent(text: string): GitHubIntent | null {
  const value = text.trim();
  if (/^(?:\/github\s+status|(?:check|show)\s+(?:my\s+)?github(?:\s+(?:connection|status))?)[.!?]?$/i.test(value)) return { kind: 'status' };
  const match = value.match(/^(?:\/github\s+push\s+|(?:push|save|upload|export)\s+(?:my\s+)?(?:app|project|workspace)\s+to\s+github\s+(?:as|to)\s+)([a-z0-9][a-z0-9._-]{0,99})[.!?]?$/i);
  if (match) return { kind: 'push', repoName: match[1] };
  if (/^\/github(?:\s|$)/i.test(value) || /^(?:push|save|upload|export)\s+.*\bgithub\b/i.test(value)) return { kind: 'help' };
  return null;
}

export function collectWorkspaceFiles(nodes: FileNode[]): { path: string; content: string }[] {
  return nodes.flatMap(node => node.type === 'folder'
    ? collectWorkspaceFiles(node.children || [])
    : [{ path: node.path, content: node.content || '' }]);
}

export async function runGitHubIntent(intent: GitHubIntent): Promise<string> {
  if (intent.kind === 'help') return 'I can check your GitHub connection or save the files in your current IDE workspace. Say “check my GitHub connection” or “push my app to GitHub as my-app-name”. GitHub access must be connected on this app’s server.';
  const response = intent.kind === 'status'
    ? await fetch('/api/github/status', { credentials: 'same-origin', signal: AbortSignal.timeout(30000) })
    : await fetch('/api/push/github', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName: intent.repoName, files: collectWorkspaceFiles(FileSystem.getAllFiles()), description: 'Saved by Synthia from the current IDE workspace' }),
    });
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.error || 'GitHub could not complete this request.');
  if (intent.kind === 'status') return `GitHub is connected as ${result.username}. I can save the current IDE workspace when you give me a repository name.`;
  if (!result.url || result.success !== true) throw new Error('GitHub did not confirm the upload.');
  return `I saved your current IDE workspace to ${result.url}. This uploads files; it does not deploy or verify the app.`;
}

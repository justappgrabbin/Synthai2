import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const load = async path => import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'))).toString('base64'));
const service = await load('../server/lib/githubService.ts');
const handsSource = stripTypeScriptTypes(readFileSync(new URL('../client/src/lib/synthiaHands.ts', import.meta.url), 'utf8')).replace(/import .* from '.\/fileSystem';/, 'const FileSystem = {getAllFiles: () => []};');
const hands = await import('data:text/javascript;base64,' + Buffer.from(handsSource).toString('base64'));

test('GitHub actions require an explicit user command', () => {
  assert.deepEqual(hands.parseGitHubIntent('check my GitHub connection'), { kind: 'status' });
  assert.deepEqual(hands.parseGitHubIntent('push my app to GitHub as my-app'), { kind: 'push', repoName: 'my-app' });
  assert.deepEqual(hands.parseGitHubIntent('/github push my-app'), { kind: 'push', repoName: 'my-app' });
  assert.equal(hands.parseGitHubIntent('How does GitHub work?'), null);
  assert.equal(hands.parseGitHubIntent('Do not push my app to GitHub as my-app'), null);
  assert.deepEqual(hands.parseGitHubIntent('push my app to github'), { kind: 'help' });
});
test('workspace export preserves nested files and empty content', () => {
  assert.deepEqual(hands.collectWorkspaceFiles([{type:'folder',children:[{type:'file',path:'src/a.ts',content:''}]}]), [{path:'src/a.ts',content:''}]);
});
test('credential files, path traversal, and duplicate files are rejected', () => {
  for (const path of ['../secret', '.env', '.env.production', '.git/config', 'a\\b', '/etc/passwd']) {
    assert.throws(() => service.validateGitHubFiles('app', [{path, content:'x'}]));
  }
  assert.throws(() => service.validateGitHubFiles('app',[{path:'a',content:''},{path:'a',content:''}]));
  assert.doesNotThrow(() => service.validateGitHubFiles('app',[{path:'.env.example',content:'KEY='}]));
});
test('an unsuccessful GitHub response never produces a success result', async () => {
  const oldFetch = globalThis.fetch;
  const oldHost = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const oldIdentity = process.env.REPL_IDENTITY;
  process.env.REPLIT_CONNECTORS_HOSTNAME = 'connector.example'; process.env.REPL_IDENTITY = 'test';
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1
    ? Response.json({items:[{settings:{access_token:'test-token'}}]})
    : Response.json({message:'Forbidden'}, {status:403});
  try { await assert.rejects(service.createOrUpdateGitHubRepo('app',[{path:'app.ts',content:'test'}]), /403/); }
  finally { globalThis.fetch = oldFetch; if (oldHost === undefined) delete process.env.REPLIT_CONNECTORS_HOSTNAME; else process.env.REPLIT_CONNECTORS_HOSTNAME = oldHost; if (oldIdentity === undefined) delete process.env.REPL_IDENTITY; else process.env.REPL_IDENTITY = oldIdentity; }
});
test('all files are committed together and branch updates cannot force overwrite', async () => {
  const oldFetch = globalThis.fetch;
  process.env.REPLIT_CONNECTORS_HOSTNAME = 'connector.example'; process.env.REPL_IDENTITY = 'test';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    const body = options.body && JSON.parse(options.body); calls.push({url, options, body});
    if (url.includes('/connection?')) return Response.json({items:[{settings:{access_token:'test-token'}}]});
    if (url.endsWith('/user')) return Response.json({login:'owner'});
    if (url.endsWith('/repos/owner/app')) return Response.json({default_branch:'main',html_url:'https://github.com/owner/app'});
    if (options.method === 'PATCH') return Response.json({object:{sha:'new'}});
    if (url.endsWith('/git/refs/heads/main')) return Response.json({object:{sha:'parent'}});
    if (url.endsWith('/git/commits/parent')) return Response.json({sha:'parent',tree:{sha:'base-tree'}});
    if (url.endsWith('/git/trees')) return Response.json({sha:'new-tree'});
    if (url.endsWith('/git/commits')) return Response.json({sha:'new'});
    throw new Error('Unexpected request');
  };
  try {
    const result = await service.createOrUpdateGitHubRepo('app',[{path:'a.ts',content:'a'},{path:'b.ts',content:'b'}]);
    assert.equal(result.commitSha,'new');
    assert.equal(calls.find(c=>c.url.endsWith('/git/trees')).body.tree.length,2);
    assert.deepEqual(calls.at(-1).body,{sha:'new',force:false});
  } finally {globalThis.fetch=oldFetch; delete process.env.REPLIT_CONNECTORS_HOSTNAME; delete process.env.REPL_IDENTITY;}
});

const chat = await load('../server/lib/synthiaChat.ts');
test('chat relay rejects unknown destinations and missing keys', async () => {
  let handler; chat.registerSynthiaChat({post: (_path, fn) => {handler=fn;}});
  let status, result;
  const res={setHeader(){},status(code){status=code;return this;},json(body){result=body;return this;}};
  await handler({body:{backend:'https://evil.example',apiKey:'key',payload:{messages:[],model:'test'}}},res);
  assert.equal(status,400); assert.ok(result.error);
});
test('chat relay forwards caller key only to its fixed provider and reports provider failure', async () => {
  let handler; chat.registerSynthiaChat({post: (_path, fn) => {handler=fn;}});
  const oldFetch=globalThis.fetch; let request, status;
  globalThis.fetch=async (url,options)=>{request={url,options};return Response.json({}, {status:401});};
  const res={setHeader(){},status(code){status=code;return this;},json(body){assert.ok(body.error);return this;}};
  try {
    await handler({body:{backend:'gpt',apiKey:'user-key',payload:{messages:[{role:'user',content:'Hello'}],model:'gpt-4o',max_tokens:99999}}},res);
    assert.equal(status,401); assert.equal(request.url,'https://api.openai.com/v1/chat/completions');
    assert.equal(request.options.headers.Authorization,'Bearer user-key');
    assert.equal(JSON.parse(request.options.body).max_tokens,4096);
  } finally {globalThis.fetch=oldFetch;}
});
test('AIService uses the same-origin chat relay', async () => {
  const {AIService}=await load('../client/src/lib/AIService.ts');
  const oldStorage=globalThis.localStorage, oldFetch=globalThis.fetch;
  globalThis.localStorage={getItem:key=>key==='ai_backend'?'gpt':key==='ai_key_gpt'?'user-key':null};
  globalThis.fetch=async (url,options)=>{
    assert.equal(url,'/api/synthia/chat');
    const body=JSON.parse(options.body); assert.equal(body.backend,'gpt'); assert.equal(body.apiKey,'user-key');
    return Response.json({choices:[{message:{content:'Hello'}}]});
  };
  try {assert.deepEqual(await AIService.sendMessage([{role:'user',content:'Hello'}]),{content:'Hello'});}
  finally {globalThis.localStorage=oldStorage;globalThis.fetch=oldFetch;}
});

const shona=await load('../client/src/lib/shonaMorphology.ts');
const contact=await load('../client/src/lib/contactReasoning.ts');
test('Shona source examples retain documented morphology and uncertainty',()=>{
  const result=shona.analyzeShona('Mwana kumhanya mumunda ndichakupai');
  assert.equal(result.tokens[0].features.NounClass,'1');
  assert.equal(result.tokens[2].features.NounClass,'18');
  assert.equal(result.tokens[3].features.Tense,'Future');
  assert.equal(result.linguisticTone,'UNKNOWN'); assert.equal(result.nsnfMapping,'UNRESOLVED');
  assert.ok(result.tokens.every(t=>t.source===shona.SHONA_SOURCE));
});
test('an unseen mu-prefix stays a candidate and a mixed-language word stays unknown',()=>{
  const result=shona.analyzeShona('muzzzz Hello');
  assert.equal(result.tokens[0].status,'candidate'); assert.equal(result.tokens[0].features.NounClass,undefined);
  assert.equal(result.tokens[1].status,'unknown');
});
test('Shona analysis is invoked only with an explicitly named language',()=>{
  assert.equal(shona.parseShonaRequest('analyze this Shona: mwana'),'mwana');
  assert.equal(shona.parseShonaRequest('/shona analyze mwana'),'mwana');
  assert.equal(shona.parseShonaRequest('mwana'),null);
});
test('shared relation routing links an explicit action to its target and unknown constraints',()=>{
  const trace=contact.reasonAboutContact('push my app to GitHub as app');
  assert.equal(trace.macro.action,'github-save');
  assert.equal(trace.meso.relations[0].object,'app');
  assert.ok(trace.investigation.length>0);
  assert.equal(trace.observation.audio,'UNKNOWN');
  assert.equal(contact.reasonAboutContact('do not push my app to GitHub as app').macro.action,'conversation');
});
test('a failed save changes the next save to require a connection recheck',()=>{
  const oldStorage=globalThis.localStorage;
  const values=new Map();globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  try {
    const trace=contact.reasonAboutContact('push my app to GitHub as app');
    contact.recordContactOutcome(trace,'succeeded','Saved');assert.equal(contact.needsGitHubRecheck(),false);
    contact.recordContactOutcome(contact.reasonAboutContact('push my app to GitHub as app'),'failed','Connection expired');
    assert.equal(contact.needsGitHubRecheck(),true);assert.equal(contact.readContactHistory().length,2);
  } finally {globalThis.localStorage=oldStorage;}
});

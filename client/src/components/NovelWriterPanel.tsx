import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, UserPlus, Globe, Sparkles, Play, 
  FileText, Users, AlertTriangle, Zap
} from 'lucide-react';
import { novelWriter } from '@/engine/NovelWriter';
import { kleinAutoLing } from '@/engine/KleinAutoLing';
import type { Character, Scene, WorldState, PlotArc } from '@/engine/NovelWriter';

export default function NovelWriterPanel() {
  const [writer] = useState(() => novelWriter);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [world, setWorld] = useState<WorldState | null>(null);
  const [plot, setPlot] = useState<PlotArc | null>(null);
  const [novelText, setNovelText] = useState<string>('');
  const [activeTab, setActiveTab] = useState('characters');
  const [generating, setGenerating] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState<'protagonist' | 'antagonist' | 'supporting'>('protagonist');
  const [chapterCount, setChapterCount] = useState(2);
  const [scenesPerChapter, setScenesPerChapter] = useState(3);
  const [grammarResult, setGrammarResult] = useState<{text: string; coherence: number; transitions: any[]} | null>(null);

  const createCharacter = useCallback(() => {
    if (!newCharName.trim()) return;
    writer.createCharacter({
      name: newCharName.trim(),
      role: newCharRole,
      goals: [{ id: `g_${Date.now()}`, description: `Understand the nature of ${newCharRole}hood`, priority: 8, progress: 0, status: 'active', obstacles: [] }],
      traits: ['curious', 'determined']
    });
    setCharacters(writer.getAllCharacters());
    setWorld(writer.getWorldState());
    setPlot(writer.getPlot());
    setNewCharName('');
  }, [writer, newCharName, newCharRole]);

  const generateScene = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const scene = writer.generateScene();
      setScenes(prev => [...prev, scene]);
      setWorld(writer.getWorldState());
      setPlot(writer.getPlot());
      setGenerating(false);
    }, 100);
  }, [writer]);

  const generateChapter = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const { scenes: newScenes } = writer.generateChapter(scenesPerChapter);
      setScenes(prev => [...prev, ...newScenes]);
      setWorld(writer.getWorldState());
      setPlot(writer.getPlot());
      setGenerating(false);
    }, 200);
  }, [writer, scenesPerChapter]);

  const generateNovel = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      for (let chIdx = 0; chIdx < chapterCount; chIdx++) {
        writer.generateChapter(scenesPerChapter);
      }
      const text = writer.renderNovel();
      setNovelText(text);
      setWorld(writer.getWorldState());
      setPlot(writer.getPlot());
      setCharacters(writer.getAllCharacters());
      setScenes(writer.getScenes().map((s) => ({
        id: s.id, chapter: s.chapter, scene: s.scene,
        location: s.location, characters: [],
        opening: s.summary, dialogue: [], action: s.events,
        transition: '', tension: s.tension,
        goalsAdvanced: s.outcomes.filter(o => !o.includes('blocked')),
        goalsBlocked: s.outcomes.filter(o => o.includes('blocked'))
      })));
      setGenerating(false);
      setActiveTab('novel');
    }, 500);
  }, [writer, chapterCount, scenesPerChapter]);

  const testTransitionGrammar = useCallback(() => {
    const result = kleinAutoLing.generate(
      'Explore the tension between structure and emergence',
      'consciousness', 'G', 4, 'Movement', 'narrative', 8
    );
    setGrammarResult(result);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-lg font-semibold">Klein Automatic Novel Writer</h2>
            <p className="text-sm text-white/50">Persistent state-driven narrative engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/20 text-xs">
            <Users className="w-3 h-3 mr-1" /> {characters.length} chars
          </Badge>
          <Badge variant="outline" className="border-white/20 text-xs">
            <FileText className="w-3 h-3 mr-1" /> {scenes.length} scenes
          </Badge>
          <Badge variant="outline" className="border-white/20 text-xs">
            {plot?.state || 'exposition'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="characters" className="data-[state=active]:bg-violet-600 gap-1 text-xs">
            <Users className="w-3 h-3" /> Characters
          </TabsTrigger>
          <TabsTrigger value="world" className="data-[state=active]:bg-violet-600 gap-1 text-xs">
            <Globe className="w-3 h-3" /> World
          </TabsTrigger>
          <TabsTrigger value="scenes" className="data-[state=active]:bg-violet-600 gap-1 text-xs">
            <Sparkles className="w-3 h-3" /> Scenes ({scenes.length})
          </TabsTrigger>
          <TabsTrigger value="grammar" className="data-[state=active]:bg-violet-600 gap-1 text-xs">
            <Zap className="w-3 h-3" /> Transition Grammar
          </TabsTrigger>
          <TabsTrigger value="novel" className="data-[state=active]:bg-violet-600 gap-1 text-xs">
            <BookOpen className="w-3 h-3" /> Novel
          </TabsTrigger>
        </TabsList>

        {/* CHARACTERS TAB */}
        <div className="mt-4">
          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-white/5 border-white/10 p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Create Character
                </h3>
                <Input 
                  value={newCharName} 
                  onChange={e => setNewCharName(e.target.value)}
                  placeholder="Character name..."
                  className="bg-white/5 border-white/10 text-sm"
                  onKeyDown={e => e.key === 'Enter' && createCharacter()}
                />
                <div className="flex gap-2">
                  {(['protagonist', 'antagonist', 'supporting'] as const).map(role => (
                    <Button key={role} size="sm" variant={newCharRole === role ? 'default' : 'outline'}
                      onClick={() => setNewCharRole(role)}
                      className={newCharRole === role ? 'bg-violet-600 text-xs' : 'border-white/10 text-xs hover:bg-white/10'}>
                      {role}
                    </Button>
                  ))}
                </div>
                <Button onClick={createCharacter} disabled={!newCharName.trim()} className="w-full bg-violet-600 hover:bg-violet-700 text-xs">
                  <UserPlus className="w-3 h-3 mr-1" /> Create
                </Button>

                <Separator className="bg-white/10" />

                <h3 className="text-sm font-semibold">Generate Novel</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-white/40">Chapters</label>
                    <Input type="number" value={chapterCount} onChange={e => setChapterCount(Number(e.target.value))} className="bg-white/5 border-white/10 text-xs h-7" min={1} max={10} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-white/40">Scenes/Ch</label>
                    <Input type="number" value={scenesPerChapter} onChange={e => setScenesPerChapter(Number(e.target.value))} className="bg-white/5 border-white/10 text-xs h-7" min={1} max={8} />
                  </div>
                </div>
                <Button onClick={generateNovel} disabled={generating || characters.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs">
                  <Play className="w-3 h-3 mr-1" /> {generating ? 'Writing...' : 'Write Full Novel'}
                </Button>
                <Button onClick={generateScene} disabled={generating || characters.length === 0} variant="outline" className="w-full border-white/10 hover:bg-white/10 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" /> Generate Scene
                </Button>
                <Button onClick={generateChapter} disabled={generating || characters.length === 0} variant="outline" className="w-full border-white/10 hover:bg-white/10 text-xs">
                  <FileText className="w-3 h-3 mr-1" /> Generate Chapter
                </Button>
              </Card>

              <div className="lg:col-span-2 space-y-2">
                {characters.length === 0 && (
                  <Card className="bg-white/5 border-white/10 p-8 text-center">
                    <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">Create characters to begin</p>
                    <p className="text-white/30 text-xs mt-1">Characters persist between generations with goals, memory, and emotional state</p>
                  </Card>
                )}
                {characters.map(char => (
                  <Card key={char.id} className="bg-white/5 border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={char.role === 'protagonist' ? 'bg-amber-600' : char.role === 'antagonist' ? 'bg-rose-600' : 'bg-violet-600'}>{char.role}</Badge>
                      <span className="font-medium text-sm">{char.name}</span>
                      <span className="text-xs text-white/30">age {char.age}</span>
                      <span className="text-xs text-white/30 ml-auto">{char.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {char.traits.map(t => <Badge key={t} variant="outline" className="text-[9px] border-white/10">{t}</Badge>)}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-white/30">Goals:</span>
                        {char.goals.map(g => (
                          <div key={g.id} className="flex items-center gap-1">
                            <div className="w-8 h-1 bg-white/10 rounded overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${g.progress * 100}%` }} />
                            </div>
                            <span className={g.status === 'completed' ? 'text-emerald-400 line-through' : 'text-white/50'}>{g.description.slice(0, 30)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="text-white/30">Emotions:</span>
                        {Object.entries(char.emotionalState).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="text-white/30 w-12">{k}:</span>
                            <div className="w-12 h-1 bg-white/10 rounded overflow-hidden">
                              <div className="h-full bg-violet-500" style={{ width: `${v * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="text-white/30">Memories ({char.memories.length}):</span>
                        {char.memories.slice(-2).map(m => (
                          <div key={m.id} className="text-white/40 truncate">{m.event.slice(0, 40)}</div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* WORLD TAB */}
          {activeTab === 'world' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10 p-4">
                <h3 className="text-sm font-semibold mb-3">World State</h3>
                {world ? (
                  <div className="space-y-3 text-xs">
                    <p className="text-white/60 italic">{world.atmosphere}</p>
                    <div>
                      <span className="text-white/30">Rules:</span>
                      <ul className="mt-1 space-y-1">
                        {world.rules.map((r, i) => <li key={i} className="text-white/50">{i + 1}. {r}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-white/30">Timeline: {world.timeline}</span>
                    </div>
                    <div>
                      <span className="text-white/30">Global Events ({world.globalEvents.length}):</span>
                      {world.globalEvents.map(e => (
                        <div key={e.id} className="text-white/40 mt-1">{e.description}</div>
                      ))}
                    </div>
                  </div>
                ) : <p className="text-white/40">Create characters to initialize world</p>}
              </Card>

              <Card className="bg-white/5 border-white/10 p-4">
                <h3 className="text-sm font-semibold mb-3">Plot State Machine</h3>
                {plot ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-600">{plot.state}</Badge>
                      <span className="text-white/30">Ch.{plot.chapter} Sc.{plot.scene}</span>
                    </div>
                    <p className="text-white/50">{plot.mainConflict}</p>
                    <div>
                      <span className="text-white/30">Tension:</span>
                      <div className="w-full h-2 bg-white/10 rounded overflow-hidden mt-1">
                        <div className="h-full bg-rose-500" style={{ width: `${plot.tension * 100}%` }} />
                      </div>
                      <span className="text-white/30">{(plot.tension * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-white/30">Pacing: {plot.pacing}</span>
                    </div>
                    <div>
                      <span className="text-white/30">Sub-conflicts:</span>
                      {plot.subConflicts.map((c, i) => <div key={i} className="text-white/40">{c}</div>)}
                    </div>
                  </div>
                ) : <p className="text-white/40">Create characters to initialize plot</p>}
              </Card>

              {world && (
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from(world.locations.values()).map(loc => (
                    <Card key={loc.id} className="bg-white/5 border-white/10 p-3">
                      <h4 className="text-sm font-medium">{loc.name}</h4>
                      <p className="text-xs text-white/40">{loc.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[9px] border-white/10">{loc.atmosphere}</Badge>
                        {loc.charactersPresent.length > 0 && (
                          <Badge className="text-[9px] bg-emerald-600/50">{loc.charactersPresent.length} present</Badge>
                        )}
                      </div>
                      {loc.secrets.length > 0 && (
                        <div className="mt-1 text-[10px] text-amber-400/60">{loc.secrets.length} secrets</div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCENES TAB */}
          {activeTab === 'scenes' && (
            <div className="space-y-3">
              {scenes.length === 0 && (
                <Card className="bg-white/5 border-white/10 p-8 text-center">
                  <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">No scenes yet. Generate scenes to see state-driven narrative.</p>
                </Card>
              )}
              {scenes.map((scene) => (
                <Card key={scene.id} className="bg-white/5 border-white/10">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-white/20">Ch.{scene.chapter} Sc.{scene.scene}</Badge>
                      <span className="text-sm font-medium">{scene.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${scene.tension * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-white/30">{(scene.tension * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <p className="text-white/60 italic">{scene.opening}</p>
                    {scene.dialogue.length > 0 && (
                      <div className="pl-3 border-l-2 border-violet-500/30 space-y-1">
                        {scene.dialogue.map((line, j) => (
                          <div key={j}>
                            <p className="text-white/70">"{line.text}"</p>
                            <p className="text-white/30 text-[10px]">— {line.speaker} [{line.emotionalState}]</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {scene.action.map((a, j) => <p key={j} className="text-white/40">{a}</p>)}
                    {scene.goalsAdvanced.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scene.goalsAdvanced.map((g, j) => <Badge key={j} className="text-[9px] bg-emerald-600/50">{g}</Badge>)}
                      </div>
                    )}
                    <p className="text-white/30 italic">{scene.transition}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* GRAMMAR TAB */}
          {activeTab === 'grammar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10 p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Transition Grammar Engine
                </h3>
                <p className="text-xs text-white/40">
                  State-driven generation using constraint satisfaction and goal-directed transition selection.
                  Not template filling. Each transition is chosen based on current state, goal alignment, and coherence preservation.
                </p>
                <Button onClick={testTransitionGrammar} className="w-full bg-violet-600 hover:bg-violet-700 text-xs">
                  <Play className="w-3 h-3 mr-1" /> Generate with Transition Grammar
                </Button>
                <div className="text-xs text-white/30">
                  States: INIT → NP_BUILD → VP_BUILD → CLAUSE_CLOSE → CONNECT → COMPLETE
                  <br />With branches: DESCRIBE, DIALOGUE_OPEN, DIALOGUE_BODY, DIALOGUE_CLOSE
                </div>
              </Card>

              <div className="space-y-3">
                {grammarResult && (
                  <>
                    <Card className="bg-white/5 border-white/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-emerald-600/50 text-xs">Coherence: {(grammarResult.coherence * 100).toFixed(0)}%</Badge>
                        <span className="text-[10px] text-white/30">{grammarResult.transitions.length} transitions</span>
                      </div>
                      <pre className="text-xs text-white/60 whitespace-pre-wrap">{grammarResult.text}</pre>
                    </Card>
                    <Card className="bg-white/5 border-white/10 p-3">
                      <h4 className="text-xs font-semibold text-white/40 mb-2">Transition Path</h4>
                      <div className="flex flex-wrap gap-1">
                        {grammarResult.transitions.map((t, i) => (
                          <div key={i} className="flex items-center gap-1 text-[10px]">
                            <span className="text-violet-400">{t.from}</span>
                            <span className="text-white/20">→</span>
                            <span className="text-emerald-400">{t.to}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}

          {/* NOVEL TAB */}
          {activeTab === 'novel' && (
            <div className="space-y-4">
              {novelText ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-white/20 text-xs">{writer.getScenes().length} scenes</Badge>
                      <Badge variant="outline" className="border-white/20 text-xs">{writer.getConsistencyIssues().length} issues</Badge>
                      <Badge variant="outline" className="border-white/20 text-xs">plot: {writer.getPlot().state}</Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setNovelText(''); }} className="border-white/10 hover:bg-white/10 text-xs">
                      <Sparkles className="w-3 h-3 mr-1" /> New Novel
                    </Button>
                  </div>

                  {writer.getConsistencyIssues().length > 0 && (
                    <Card className="bg-amber-950/30 border-amber-500/20 p-3">
                      <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1 mb-2">
                        <AlertTriangle className="w-3 h-3" /> Consistency Issues
                      </h4>
                      {writer.getConsistencyIssues().map((issue, i) => (
                        <div key={i} className="text-[10px] text-amber-300/60">
                          [{issue.severity}] {issue.description}
                        </div>
                      ))}
                    </Card>
                  )}

                  <Card className="bg-white/5 border-white/10">
                    <ScrollArea className="h-[600px]">
                      <pre className="p-4 text-xs text-white/70 whitespace-pre-wrap font-mono leading-relaxed">
                        {novelText}
                      </pre>
                    </ScrollArea>
                  </Card>
                </>
              ) : (
                <Card className="bg-white/5 border-white/10 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">Generate a novel to see the full output</p>
                  <p className="text-white/30 text-sm mt-1">The system tracks persistent character state, world simulation, plot machine, and narrative memory</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

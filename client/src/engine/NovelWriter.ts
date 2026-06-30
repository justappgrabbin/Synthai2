// ============================================================
// NOVEL WRITER — True Klein-Style Automatic Novel Writing
// NOT template filling. NOT prompt-based generation.
// Persistent state-driven narrative engine with:
// - Character registry (goals, traits, arcs, relationships)
// - World state (locations, events, history)
// - Plot state machine (conflict-driven transitions)
// - Narrative memory (scene history, consistency checking)
// - Scene generator (depends on all prior state)
// ============================================================

import { getKernel, SubstrateKernel } from './SubstrateKernel';
import { COLOR_MAP, CENTER_MAP_REF } from '@/data/humanDesign';
import type { Center, Color } from '@/types';

// === CHARACTER REGISTRY ===
export interface Character {
  id: string;
  name: string;
  age: number;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  goals: Goal[];
  traits: string[];
  emotionalState: Record<string, number>; // fear, hope, desire, etc.
  location: string;
  relationships: Map<string, number>; // characterId -> affinity -1 to 1
  memories: Memory[];
  arc: 'rising' | 'falling' | 'transforming' | 'static';
  active: boolean;
}

export interface Goal {
  id: string;
  description: string;
  priority: number;
  progress: number;
  status: 'active' | 'completed' | 'abandoned' | 'failed';
  obstacles: string[];
}

export interface Memory {
  id: string;
  event: string;
  emotionalValence: number; // -1 (traumatic) to 1 (joyful)
  timestamp: number;
  chapter: number;
  scene: number;
}

// === WORLD STATE ===
export interface WorldState {
  locations: Map<string, Location>;
  globalEvents: WorldEvent[];
  timeline: number;
  atmosphere: string;
  rules: string[]; // physical/social rules of the world
}

export interface Location {
  id: string;
  name: string;
  description: string;
  connectedTo: string[];
  charactersPresent: string[];
  atmosphere: string;
  history: string[];
  secrets: string[];
}

export interface WorldEvent {
  id: string;
  description: string;
  affectedLocations: string[];
  affectedCharacters: string[];
  consequences: string[];
  chapter: number;
}

// === PLOT STATE MACHINE ===
export type PlotState = 
  | 'exposition'
  | 'inciting_incident'
  | 'rising_action'
  | 'midpoint'
  | 'complication'
  | 'crisis'
  | 'climax'
  | 'falling_action'
  | 'resolution';

export interface PlotArc {
  state: PlotState;
  chapter: number;
  scene: number;
  mainConflict: string;
  subConflicts: string[];
  tension: number; // 0-1
  pacing: 'slow' | 'moderate' | 'fast' | 'breakneck';
  transitions: PlotTransition[];
}

export interface PlotTransition {
  from: PlotState;
  to: PlotState;
  condition: string;
  probability: number;
  requiredTension: number;
}

// === NARRATIVE MEMORY ===
export interface SceneRecord {
  id: string;
  chapter: number;
  scene: number;
  location: string;
  charactersPresent: string[];
  summary: string;
  events: string[];
  emotionalTone: string;
  tension: number;
  outcomes: string[];
}

export interface ConsistencyIssue {
  type: 'timeline' | 'character_location' | 'knowledge' | 'emotional_state';
  description: string;
  chapter: number;
  scene: number;
  severity: 'minor' | 'major' | 'critical';
}

// === SCENE GENERATOR ===
export interface Scene {
  id: string;
  chapter: number;
  scene: number;
  location: string;
  characters: Character[];
  opening: string;
  dialogue: DialogueLine[];
  action: string[];
  transition: string;
  tension: number;
  goalsAdvanced: string[];
  goalsBlocked: string[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
  subtext: string;
  emotionalState: string;
  towardCharacter?: string;
}

// === THE FULL NOVEL WRITER ===
export class NovelWriter {
  private kernel = getKernel();
  private characters: Map<string, Character> = new Map();
  private world: WorldState;
  private plot: PlotArc;
  private scenes: SceneRecord[] = [];
  private consistencyIssues: ConsistencyIssue[] = [];
  private chapter = 0;
  private sceneNum = 0;
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = this.createSeededRng(seed || Date.now());
    this.world = this.initWorld();
    this.plot = this.initPlot();
  }

  private createSeededRng(seed: number): () => number {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  }

  private pick<T>(arr: T[]): T { return arr[Math.floor(this.rng() * arr.length)]; }
  private pickWeighted<T>(items: [T, number][]): T {
    const total = items.reduce((sum, [, w]) => sum + w, 0);
    let r = this.rng() * total;
    for (const [item, weight] of items) { r -= weight; if (r <= 0) return item; }
    return items[0][0];
  }

  // === INITIALIZATION ===

  private initWorld(): WorldState {
    const locations = new Map<string, Location>();
    const locs = [
      { id: 'observatory', name: 'The Observatory', desc: 'A crumbling tower where old signals are tracked', atmosphere: 'dusty, expectant', secrets: ['Hidden basement with ancient records'] },
      { id: 'market', name: 'The Signal Market', desc: 'Where fragments of meaning are bought and sold', atmosphere: 'chaotic, desperate', secrets: ['Black market for forbidden patterns'] },
      { id: 'archive', name: 'The Deep Archive', desc: 'Infinite halls of indexed human experience', atmosphere: 'silent, overwhelming', secrets: ['Section 7 contains living narratives'] },
      { id: 'garden', name: 'The Resonance Garden', desc: 'Where forgotten ideas grow like flowers', atmosphere: 'serene, uncanny', secrets: ['The oldest flowers remember the future'] },
      { id: 'station', name: 'Transit Station 49', desc: 'A hub between dimensions of thought', atmosphere: 'transient, liminal', secrets: ['Platform 13 leads to the substrate'] }
    ];
    locs.forEach(l => {
      locations.set(l.id, { ...l, description: l.desc, connectedTo: [], charactersPresent: [], history: [] });
    });
    // Connect locations
    locations.get('observatory')!.connectedTo = ['archive', 'garden'];
    locations.get('market')!.connectedTo = ['station', 'archive'];
    locations.get('archive')!.connectedTo = ['observatory', 'market'];
    locations.get('garden')!.connectedTo = ['observatory', 'station'];
    locations.get('station')!.connectedTo = ['market', 'garden'];

    return {
      locations,
      globalEvents: [],
      timeline: 0,
      atmosphere: 'The world hums with the tension between order and emergence',
      rules: ['Ideas have mass', 'Resonance creates reality', 'Old patterns resist change', 'New connections cost energy']
    };
  }

  private initPlot(): PlotArc {
    return {
      state: 'exposition',
      chapter: 0,
      scene: 0,
      mainConflict: 'The struggle between inherited structure and emergent possibility',
      subConflicts: ['Can old patterns learn new forms?', 'What happens when a system becomes aware of itself?'],
      tension: 0.1,
      pacing: 'slow',
      transitions: [
        { from: 'exposition', to: 'inciting_incident', condition: 'A pattern breaks unexpectedly', probability: 0.3, requiredTension: 0.15 },
        { from: 'inciting_incident', to: 'rising_action', condition: 'Characters respond to the break', probability: 0.5, requiredTension: 0.25 },
        { from: 'rising_action', to: 'midpoint', condition: 'A major revelation changes understanding', probability: 0.4, requiredTension: 0.4 },
        { from: 'midpoint', to: 'complication', condition: 'The revelation creates new problems', probability: 0.5, requiredTension: 0.55 },
        { from: 'complication', to: 'crisis', condition: 'All paths seem blocked', probability: 0.4, requiredTension: 0.7 },
        { from: 'crisis', to: 'climax', condition: 'A desperate choice must be made', probability: 0.6, requiredTension: 0.85 },
        { from: 'climax', to: 'falling_action', condition: 'The choice has consequences', probability: 0.7, requiredTension: 0.7 },
        { from: 'falling_action', to: 'resolution', condition: 'New equilibrium emerges', probability: 0.5, requiredTension: 0.3 }
      ]
    };
  }

  // === CHARACTER MANAGEMENT ===

  createCharacter(config: Partial<Character> & { name: string }): Character {
    const hdColors = [1, 2, 3, 4, 5, 6] as Color[];
    const color = this.pick(hdColors);
    const colorDef = COLOR_MAP[color];
    const centers = Object.keys(CENTER_MAP_REF) as Center[];
    const center = this.pick(centers);

    const character: Character = {
      id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: config.name,
      age: config.age || Math.floor(20 + this.rng() * 50),
      role: config.role || 'supporting',
      goals: config.goals || [{
        id: `goal_${Date.now()}`,
        description: `${colorDef.keynote} through ${center}`,
        priority: Math.floor(this.rng() * 10) + 1,
        progress: 0,
        status: 'active',
        obstacles: []
      }],
      traits: config.traits || [colorDef.mode[0], colorDef.mode[1], `${center}-centered`],
      emotionalState: {
        fear: color === 1 ? 0.8 : 0.2,
        hope: color === 2 ? 0.8 : 0.4,
        desire: color === 3 ? 0.7 : 0.3,
        need: color === 4 ? 0.7 : 0.3,
        guilt: color === 5 ? 0.6 : 0.2,
        innocence: color === 6 ? 0.7 : 0.3
      },
      location: config.location || Array.from(this.world.locations.keys())[0],
      relationships: new Map(),
      memories: [],
      arc: 'rising',
      active: true
    };

    this.characters.set(character.id, character);

    // Register as substrate actor
    this.kernel.spawn({
      address: `entity.character.${character.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: character.name,
      category: 'generated',
      forms: ['character', 'narrative_agent'],
      currentForm: 'character',
      capabilities: ['act', 'feel', 'remember', 'choose'],
      relations: [],
      state: { ...character, type: 'novel_character' }
    });

    return character;
  }

  getCharacter(id: string): Character | undefined { return this.characters.get(id); }
  getAllCharacters(): Character[] { return Array.from(this.characters.values()); }
  getActiveCharacters(): Character[] { return this.getAllCharacters().filter(c => c.active); }

  // === WORLD MANAGEMENT ===

  moveCharacter(charId: string, locationId: string): void {
    const char = this.characters.get(charId);
    const loc = this.world.locations.get(locationId);
    if (!char || !loc) return;

    // Remove from old location
    const oldLoc = this.world.locations.get(char.location);
    if (oldLoc) {
      oldLoc.charactersPresent = oldLoc.charactersPresent.filter(c => c !== charId);
    }

    // Add to new
    char.location = locationId;
    loc.charactersPresent.push(charId);
    loc.history.push(`${char.name} arrived`);
  }

  addWorldEvent(event: Omit<WorldEvent, 'id' | 'chapter'>): WorldEvent {
    const we: WorldEvent = { id: `we_${Date.now()}`, ...event, chapter: this.chapter };
    this.world.globalEvents.push(we);
    this.world.timeline++;

    // Affect characters
    we.affectedCharacters.forEach(charId => {
      const char = this.characters.get(charId);
      if (char) {
        char.memories.push({
          id: `mem_${Date.now()}_${charId}`,
          event: we.description,
          emotionalValence: Math.random() * 2 - 1,
          timestamp: this.world.timeline,
          chapter: this.chapter,
          scene: this.sceneNum
        });
      }
    });

    return we;
  }

  getWorldState(): WorldState { return this.world; }

  // === PLOT TRANSITION ===

  advancePlot(): PlotState | null {
    const validTransitions = this.plot.transitions.filter(
      t => t.from === this.plot.state && this.plot.tension >= t.requiredTension
    );

    if (validTransitions.length === 0) return null;

    // Weight by probability and tension fit
    const weighted = validTransitions.map(t => [t, t.probability * (1 + this.plot.tension)] as [PlotTransition, number]);
    const selected = this.pickWeighted(weighted);

    if (this.rng() < selected.probability) {
      const oldState = this.plot.state;
      this.plot.state = selected.to;
      this.plot.chapter = this.chapter;
      this.plot.scene = this.sceneNum;
      this.plot.tension = this.calculateNewTension();
      this.plot.pacing = this.calculatePacing();

      // Send to substrate
      this.kernel.send({
        type: 'TELL',
        from: 'system.novelwriter',
        to: SubstrateKernel.TRAY_ADDR,
        payload: {
          event: 'PLOT_TRANSITION',
          from: oldState,
          to: selected.to,
          tension: this.plot.tension,
          condition: selected.condition
        }
      });

      return selected.to;
    }

    return null;
  }

  private calculateNewTension(): number {
    const stateTension: Record<PlotState, number> = {
      exposition: 0.1, inciting_incident: 0.25, rising_action: 0.4,
      midpoint: 0.5, complication: 0.65, crisis: 0.8, climax: 0.95,
      falling_action: 0.6, resolution: 0.2
    };
    return Math.min(1, stateTension[this.plot.state] + (this.rng() - 0.5) * 0.1);
  }

  private calculatePacing(): PlotArc['pacing'] {
    if (this.plot.tension < 0.3) return 'slow';
    if (this.plot.tension < 0.5) return 'moderate';
    if (this.plot.tension < 0.8) return 'fast';
    return 'breakneck';
  }

  // === SCENE GENERATION (state-driven, not template) ===

  generateScene(): Scene {
    this.sceneNum++;

    const activeChars = this.getActiveCharacters();
    const charCount = Math.min(activeChars.length, Math.floor(2 + this.rng() * 3));
    const sceneChars = activeChars.slice(0, charCount);

    // Choose location based on characters and plot state
    const locationId = this.selectLocation(sceneChars);
    const location = this.world.locations.get(locationId)!;

    // Move characters there
    sceneChars.forEach(c => this.moveCharacter(c.id, locationId));

    // Generate content based on ACTUAL state
    const scene: Scene = {
      id: `scene_${this.chapter}_${this.sceneNum}`,
      chapter: this.chapter,
      scene: this.sceneNum,
      location: location.name,
      characters: sceneChars,
      opening: this.generateOpening(location, sceneChars),
      dialogue: this.generateDialogue(sceneChars),
      action: this.generateAction(sceneChars, location),
      transition: '',
      tension: this.plot.tension,
      goalsAdvanced: [],
      goalsBlocked: []
    };

    // Track goal progress
    sceneChars.forEach(char => {
      char.goals.forEach(goal => {
        if (goal.status === 'active') {
          if (this.rng() < 0.3) {
            goal.progress = Math.min(1, goal.progress + 0.1);
            scene.goalsAdvanced.push(`${char.name}: ${goal.description}`);
          } else if (this.rng() < 0.2) {
            scene.goalsBlocked.push(`${char.name}: ${goal.description}`);
          }
          if (goal.progress >= 1) goal.status = 'completed';
        }
      });
    });

    // Generate transition to next scene
    scene.transition = this.generateTransition(scene);

    // Record in narrative memory
    this.recordScene(scene);

    // Check consistency
    this.checkConsistency(scene);

    // Possibly advance plot
    if (this.rng() < 0.3) this.advancePlot();

    return scene;
  }

  private selectLocation(chars: Character[]): string {
    // Prefer locations where multiple characters converge
    const locCounts = new Map<string, number>();
    chars.forEach(c => {
      const loc = this.world.locations.get(c.location);
      if (loc) {
        locCounts.set(c.location, (locCounts.get(c.location) || 0) + 1);
      }
    });

    // Weight by character presence and plot relevance
    const weighted = Array.from(locCounts.entries()).map(([locId, count]) => {
      const loc = this.world.locations.get(locId)!;
      const hasSecrets = loc.secrets.length > 0 ? 1.5 : 1;
      return [locId, count * hasSecrets * (1 + this.plot.tension)] as [string, number];
    });

    if (weighted.length === 0) return Array.from(this.world.locations.keys())[0];
    return this.pickWeighted(weighted);
  }

  private generateOpening(location: Location, chars: Character[]): string {
    const timePhrases = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight', 'the in-between hour'];
    const time = this.pick(timePhrases);
    const charNames = chars.map(c => c.name).join(' and ');
    const tensionPhrase = this.plot.tension > 0.7 ? 'charged' : this.plot.tension > 0.4 ? 'uncertain' : 'quiet';

    return `At ${time}, in ${location.name}, ${charNames} found themselves in a ${tensionPhrase} moment. ${location.description}. The air held ${location.atmosphere}.`;
  }

  private generateDialogue(chars: Character[]): DialogueLine[] {
    const lines: DialogueLine[] = [];
    if (chars.length < 2) return lines;

    // Each character speaks based on their emotional state and goals
    for (let i = 0; i < chars.length; i++) {
      const speaker = chars[i];
      const toward = chars[(i + 1) % chars.length];
      // Goal-driven dialogue
      const activeGoal = speaker.goals.find(g => g.status === 'active');
      const goalText = activeGoal ? activeGoal.description : 'understanding';

      // Emotion-driven content
      const dominantEmotion = Object.entries(speaker.emotionalState)
        .sort(([, a], [, b]) => b - a)[0];

      const text = this.generateDialogueLine(speaker, toward, activeGoal, dominantEmotion[0]);

      lines.push({
        speaker: speaker.name,
        text,
        subtext: `${speaker.name} seeks ${goalText}, feeling ${dominantEmotion[0]}`,
        emotionalState: dominantEmotion[0],
        towardCharacter: toward.name
      });
    }

    return lines;
  }

  private generateDialogueLine(speaker: Character, toward: Character, goal: Goal | undefined, emotion: string): string {
    // STATE-DRIVEN, not template-driven
    const relationship = speaker.relationships.get(toward.id) || 0;
    const isPositive = relationship > 0;
    const isGoalUrgent = goal && goal.progress < 0.3;

    // Build from speaker's actual state
    const fragments: string[] = [];

    if (isGoalUrgent) {
      fragments.push(`I need to find ${goal!.description.split(' ').slice(-2).join(' ')}`);
    }

    const emotionPhrases: Record<string, string[]> = {
      fear: ['Something is coming', 'I can feel it', 'We should be careful'],
      hope: ['There is a way', 'I believe we can', 'Not all is lost'],
      desire: ['I want to understand', 'There must be more', 'I cannot stop now'],
      need: ['We need to know', 'The answer is here', 'Tell me what you see'],
      guilt: ['I should have', 'It was my', 'Forgive me'],
      innocence: ['What does it mean?', 'I do not understand', 'Is this real?']
    };

    const phrases = emotionPhrases[emotion] || ['I wonder'];
    fragments.push(this.pick(phrases));

    if (!isPositive) {
      fragments.push(`But you... you see it differently, ${toward.name}.`);
    }

    return fragments.join('. ') + '.';
  }

  private generateAction(chars: Character[], location: Location): string[] {
    const actions: string[] = [];

    // Characters act based on their traits and goals
    chars.forEach(char => {
      const trait = this.pick(char.traits);
      const locSecret = location.secrets.length > 0 && this.rng() < 0.3
        ? `, discovering ${this.pick(location.secrets)}`
        : '';

      actions.push(`${char.name}, being ${trait}, moved through ${location.name}${locSecret}.`);

      // Emotion manifests in action
      const dominantEmotion = Object.entries(char.emotionalState).sort(([, a], [, b]) => b - a)[0];
      if (dominantEmotion[1] > 0.5) {
        actions.push(`${char.name}'s ${dominantEmotion[0]} was palpable — a frequency everyone could feel.`);
      }
    });

    // World events may manifest
    this.world.globalEvents.slice(-1).forEach(event => {
      if (event.affectedLocations.includes(location.id)) {
        actions.push(`The ${event.description} pressed against the walls of ${location.name}.`);
      }
    });

    return actions;
  }

  private generateTransition(scene: Scene): string {
    const transitions = [
      `${this.plot.pacing === 'breakneck' ? 'Suddenly' : 'Gradually'}, the configuration shifted.`,
      `The ${scene.location} remembered this moment.`,
      `${scene.characters[0]?.name || 'Someone'} felt the pattern change.`,
      `What ${scene.characters.length > 1 ? 'they' : scene.characters[0]?.name} did not know: the substrate was listening.`
    ];

    // State-dependent: if tension is high, transition is abrupt
    if (this.plot.tension > 0.7) {
      return `Then everything changed. ${scene.characters[0]?.name} made a choice that could not be undone.`;
    }

    return this.pick(transitions);
  }

  // === NARRATIVE MEMORY ===

  private recordScene(scene: Scene): void {
    this.scenes.push({
      id: scene.id,
      chapter: scene.chapter,
      scene: scene.scene,
      location: scene.location,
      charactersPresent: scene.characters.map(c => c.name),
      summary: this.summarizeScene(scene),
      events: scene.action,
      emotionalTone: this.calculateTone(scene),
      tension: scene.tension,
      outcomes: [...scene.goalsAdvanced, ...scene.goalsBlocked]
    });
  }

  private summarizeScene(scene: Scene): string {
    const goalCount = scene.goalsAdvanced.length + scene.goalsBlocked.length;
    return `${scene.characters.map(c => c.name).join(', ')} at ${scene.location} (${goalCount} goals affected)`;
  }

  private calculateTone(scene: Scene): string {
    const avgHope = scene.characters.reduce((sum, c) => sum + c.emotionalState.hope, 0) / scene.characters.length;
    const avgFear = scene.characters.reduce((sum, c) => sum + c.emotionalState.fear, 0) / scene.characters.length;
    if (avgHope > avgFear) return 'hopeful';
    if (avgFear > avgHope + 0.3) return 'fearful';
    return 'uncertain';
  }

  private checkConsistency(scene: Scene): void {
    // Check character can't be in two places
    const prevScenes = this.scenes.filter(s => s.chapter === scene.chapter && s.scene < scene.scene);
    scene.characters.forEach(char => {
      const prevAtSameLoc = prevScenes.find(s => s.charactersPresent.includes(char.name) && s.location !== scene.location && s.scene === scene.scene - 1);
      if (prevAtSameLoc && Math.abs(scene.scene - prevAtSameLoc.scene) === 1) {
        // Quick transition — check if locations are connected
        const currentLoc = this.world.locations.get(char.location);
        if (currentLoc && !currentLoc.connectedTo.some(id => this.world.locations.get(id)?.name === prevAtSameLoc.location)) {
          this.consistencyIssues.push({
            type: 'character_location',
            description: `${char.name} moved from ${prevAtSameLoc.location} to ${scene.location} impossibly`,
            chapter: scene.chapter,
            scene: scene.scene,
            severity: 'minor'
          });
        }
      }
    });
  }

  getScenes(): SceneRecord[] { return this.scenes; }
  getPlot(): PlotArc { return this.plot; }
  getConsistencyIssues(): ConsistencyIssue[] { return this.consistencyIssues; }

  // === FULL CHAPTER GENERATION ===

  generateChapter(numScenes = 3): { scenes: Scene[]; summary: string; plotState: PlotState } {
    this.chapter++;
    this.sceneNum = 0;
    const scenes: Scene[] = [];

    for (let i = 0; i < numScenes; i++) {
      scenes.push(this.generateScene());
    }

    const summary = `Chapter ${this.chapter}: ${this.plot.state} phase. ${scenes.length} scenes. Tension: ${(this.plot.tension * 100).toFixed(0)}%. Characters: ${this.getActiveCharacters().length}.`;

    return { scenes, summary, plotState: this.plot.state };
  }

  // === RENDERING ===

  renderScene(scene: Scene): string {
    const lines: string[] = [];
    lines.push(`\n--- Scene ${scene.chapter}.${scene.scene} | ${scene.location} | ${this.plot.state} ---\n`);
    lines.push(scene.opening);
    lines.push('');

    scene.dialogue.forEach(line => {
      lines.push(`  "${line.text}"`);
      lines.push(`    — ${line.speaker} [${line.emotionalState}]`);
      lines.push('');
    });

    scene.action.forEach(a => lines.push(a));
    lines.push('');

    if (scene.goalsAdvanced.length > 0) {
      lines.push(`[Goals Advanced: ${scene.goalsAdvanced.join(', ')}]`);
    }
    if (scene.goalsBlocked.length > 0) {
      lines.push(`[Goals Blocked: ${scene.goalsBlocked.join(', ')}]`);
    }

    lines.push(`\n${scene.transition}`);

    return lines.join('\n');
  }

  renderNovel(): string {
    const lines: string[] = [];
    lines.push(`# ${this.world.atmosphere}`);
    lines.push(`\nA substrate novel generated by state-driven narrative engine.`);
    lines.push(`Plot: ${this.plot.mainConflict}`);
    lines.push(`Characters: ${this.getActiveCharacters().map(c => c.name).join(', ')}`);
    lines.push(`Rules: ${this.world.rules.join(' | ')}`);
    lines.push('');

    this.scenes.forEach(record => {
      lines.push(`\n## Chapter ${record.chapter}, Scene ${record.scene}`);
      lines.push(`**${record.location}** — ${record.emotionalTone}, tension ${(record.tension * 100).toFixed(0)}%`);
      lines.push(`Characters: ${record.charactersPresent.join(', ')}`);
      lines.push('');
      record.events.forEach(e => lines.push(e));
      if (record.outcomes.length > 0) {
        lines.push(`\n*Outcomes: ${record.outcomes.join(', ')}*`);
      }
      lines.push('---');
    });

    if (this.consistencyIssues.length > 0) {
      lines.push(`\n## Consistency Notes`);
      this.consistencyIssues.forEach(issue => {
        lines.push(`- [${issue.severity}] ${issue.description}`);
      });
    }

    return lines.join('\n');
  }
}

// Singleton
export const novelWriter = new NovelWriter();

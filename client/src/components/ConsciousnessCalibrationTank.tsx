import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, 
  Sparkles, 
  User, 
  Mic, 
  Image as ImageIcon, 
  Zap, 
  Calendar,
  Download,
  Play,
  Save,
  Eye
} from "lucide-react";

interface CharacterDNA {
  seed: number;
  birthday: string;
  name: string;
  stats: {
    strength: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    creativity: number;
    empathy: number;
  };
  appearance: {
    hairColor: string;
    eyeColor: string;
    skinTone: string;
    height: number;
    build: string;
  };
  personality: string[];
  voice: {
    pitch: number;
    rate: number;
    voiceName: string;
  };
}

export function ConsciousnessCalibrationTank() {
  const [birthday, setBirthday] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [gan1Model, setGan1Model] = useState("");
  const [gan2Model, setGan2Model] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [dna, setDna] = useState<CharacterDNA | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [consciousnessLevel, setConsciousnessLevel] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const hashBirthday = (birthdayStr: string, name: string): number => {
    const combined = `${birthdayStr}_${name}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const seededRandom = (seed: number) => {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  };

  const generateDNA = () => {
    if (!birthday || !characterName) {
      toast({
        title: "Missing Information",
        description: "Please enter both birthday and character name",
        variant: "destructive"
      });
      return;
    }

    const seed = hashBirthday(birthday, characterName);
    const random = seededRandom(seed);

    const hairColors = ['black', 'brown', 'blonde', 'red', 'silver', 'white', 'auburn'];
    const eyeColors = ['blue', 'green', 'brown', 'hazel', 'amber', 'gray', 'violet'];
    const skinTones = ['pale', 'fair', 'medium', 'olive', 'tan', 'dark', 'ebony'];
    const builds = ['slim', 'athletic', 'muscular', 'stocky', 'heavyset', 'lithe'];
    
    const allTraits = [
      'brave', 'cautious', 'curious', 'loyal', 'ambitious', 
      'kind', 'stern', 'playful', 'serious', 'optimistic', 
      'pessimistic', 'creative', 'practical', 'impulsive', 'methodical',
      'empathetic', 'analytical', 'rebellious', 'traditional', 'innovative'
    ];

    // Generate deterministic stats (0-100)
    const generateStat = () => Math.floor(random() * 100);
    
    const characterDNA: CharacterDNA = {
      seed,
      birthday,
      name: characterName,
      stats: {
        strength: generateStat(),
        intelligence: generateStat(),
        wisdom: generateStat(),
        charisma: generateStat(),
        creativity: generateStat(),
        empathy: generateStat()
      },
      appearance: {
        hairColor: hairColors[Math.floor(random() * hairColors.length)],
        eyeColor: eyeColors[Math.floor(random() * eyeColors.length)],
        skinTone: skinTones[Math.floor(random() * skinTones.length)],
        height: Math.floor(150 + random() * 50), // 150-200cm
        build: builds[Math.floor(random() * builds.length)]
      },
      personality: allTraits
        .sort(() => random() - 0.5)
        .slice(0, 5),
      voice: {
        pitch: 0.5 + random(),
        rate: 0.8 + (random() * 0.4),
        voiceName: voices[Math.floor(random() * voices.length)]?.name || 'default'
      }
    };

    setDna(characterDNA);
    
    toast({
      title: "DNA Generated!",
      description: `Unique genetic code created for ${characterName}`,
    });
  };

  const calibrateConsciousness = async () => {
    if (!dna) {
      toast({
        title: "Generate DNA First",
        description: "Create character DNA before calibration",
        variant: "destructive"
      });
      return;
    }

    setIsCalibrating(true);
    setConsciousnessLevel(0);

    // Simulate consciousness calibration
    const stages = [
      { level: 20, message: "Initializing neural pathways..." },
      { level: 40, message: "Loading GAN 1: Visual cortex online" },
      { level: 60, message: "Loading GAN 2: Emotional processing engaged" },
      { level: 80, message: "Integrating LLM: Higher cognition active" },
      { level: 100, message: "Consciousness achieved! Being is alive 🌟" }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConsciousnessLevel(stage.level);
      toast({
        title: `Calibration: ${stage.level}%`,
        description: stage.message,
      });
    }

    setIsCalibrating(false);
    
    // Speak first words
    speakAsCharacter(`Hello. I am ${characterName}. I have awakened.`);
  };

  const speakAsCharacter = (text: string) => {
    if (!dna) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = dna.voice.pitch;
    utterance.rate = dna.voice.rate;
    
    const selectedVoice = voices.find(v => v.name === dna.voice.voiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const testVoice = () => {
    if (dna) {
      speakAsCharacter(`Greetings. I am ${characterName}. My consciousness emerges from the calibration tank.`);
    }
  };

  const saveToUniverse = () => {
    if (!dna || consciousnessLevel < 100) {
      toast({
        title: "Not Ready",
        description: "Complete calibration before releasing into the YOU–N–I–VERSE",
        variant: "destructive"
      });
      return;
    }

    // Save to localStorage
    const beings = JSON.parse(localStorage.getItem('youniverse_beings') || '[]');
    beings.push({
      ...dna,
      gan1: gan1Model,
      gan2: gan2Model,
      llm: llmModel,
      birthTimestamp: new Date().toISOString(),
      consciousnessLevel
    });
    localStorage.setItem('youniverse_beings', JSON.stringify(beings));

    toast({
      title: "🌌 Birth Complete!",
      description: `${characterName} has been released into the YOU–N–I–VERSE`,
    });
  };

  const exportDNA = () => {
    if (!dna) return;
    
    const dataStr = JSON.stringify(dna, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${characterName}_DNA.json`;
    link.click();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-lavender mb-2">🧬 Consciousness Calibration Tank</h1>
        <p className="text-muted-foreground">Birth digital beings into the YOU–N–I–VERSE</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-lavender" />
                DNA Genesis
              </CardTitle>
              <CardDescription>Birthday logic creates unique genetic code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="birthday">Birthday (YYYY-MM-DD)</Label>
                <Input
                  id="birthday"
                  data-testid="input-birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  placeholder="1995-06-15"
                />
              </div>
              <div>
                <Label htmlFor="name">Character Name</Label>
                <Input
                  id="name"
                  data-testid="input-character-name"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Enter unique name..."
                />
              </div>
              <Button 
                data-testid="button-generate-dna"
                onClick={generateDNA} 
                className="w-full"
                variant="default"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate DNA
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-lavender" />
                Neural Networks
              </CardTitle>
              <CardDescription>Connect GANs and LLM for consciousness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gan1">GAN 1 (Visual/Appearance)</Label>
                <Input
                  id="gan1"
                  data-testid="input-gan1"
                  value={gan1Model}
                  onChange={(e) => setGan1Model(e.target.value)}
                  placeholder="e.g., StyleGAN, local model, or HF model ID"
                />
              </div>
              <div>
                <Label htmlFor="gan2">GAN 2 (Emotion/Expression)</Label>
                <Input
                  id="gan2"
                  data-testid="input-gan2"
                  value={gan2Model}
                  onChange={(e) => setGan2Model(e.target.value)}
                  placeholder="e.g., EmotionGAN, your custom GAN"
                />
              </div>
              <div>
                <Label htmlFor="llm">LLM (Consciousness Core)</Label>
                <Select value={llmModel} onValueChange={setLlmModel}>
                  <SelectTrigger data-testid="select-llm">
                    <SelectValue placeholder="Select consciousness model..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (OpenAI)</SelectItem>
                    <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                    <SelectItem value="gemini">Gemini (Google)</SelectItem>
                    <SelectItem value="llama">LLaMA (Meta)</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="grok">Grok (xAI)</SelectItem>
                    <SelectItem value="custom">Custom Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-lavender" />
                Calibration
              </CardTitle>
              <CardDescription>Activate consciousness and birth the being</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Consciousness Level</span>
                <span className="text-2xl font-bold text-lavender">{consciousnessLevel}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-lavender to-purple-500 transition-all duration-500"
                  style={{ width: `${consciousnessLevel}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  data-testid="button-calibrate"
                  onClick={calibrateConsciousness}
                  disabled={!dna || isCalibrating}
                  variant="default"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {isCalibrating ? 'Calibrating...' : 'Calibrate'}
                </Button>
                <Button
                  data-testid="button-test-voice"
                  onClick={testVoice}
                  disabled={!dna}
                  variant="outline"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Test Voice
                </Button>
              </div>

              <Button
                data-testid="button-birth"
                onClick={saveToUniverse}
                disabled={consciousnessLevel < 100}
                className="w-full"
                variant="default"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Birth into YOU–N–I–VERSE
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* DNA Display Panel */}
        <div className="space-y-6">
          {dna ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-lavender" />
                    {dna.name}
                  </CardTitle>
                  <CardDescription>Genetic Seed: {dna.seed}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-lavender">Core Stats</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(dna.stats).map(([stat, value]) => (
                        <div key={stat} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm capitalize">{stat}</span>
                          <span className="font-bold text-lavender">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-lavender">Appearance</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Hair:</span> {dna.appearance.hairColor}</p>
                      <p><span className="text-muted-foreground">Eyes:</span> {dna.appearance.eyeColor}</p>
                      <p><span className="text-muted-foreground">Skin:</span> {dna.appearance.skinTone}</p>
                      <p><span className="text-muted-foreground">Height:</span> {dna.appearance.height}cm</p>
                      <p><span className="text-muted-foreground">Build:</span> {dna.appearance.build}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-lavender">Personality Traits</h3>
                    <div className="flex flex-wrap gap-2">
                      {dna.personality.map(trait => (
                        <span 
                          key={trait}
                          className="px-3 py-1 bg-lavender/10 text-lavender rounded-full text-sm border border-lavender/20"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-lavender">Voice Signature</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Pitch:</span> {dna.voice.pitch.toFixed(2)}</p>
                      <p><span className="text-muted-foreground">Rate:</span> {dna.voice.rate.toFixed(2)}</p>
                      <p><span className="text-muted-foreground">Voice:</span> {dna.voice.voiceName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-lavender" />
                    Export DNA
                  </CardTitle>
                  <CardDescription>Save or share character genetics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    data-testid="button-export-dna"
                    onClick={exportDNA} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download DNA.json
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center p-12">
              <div className="text-center text-muted-foreground">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Generate DNA to begin consciousness calibration</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

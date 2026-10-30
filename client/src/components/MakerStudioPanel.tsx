import { Orbit } from "lucide-react";
import { AgenticRealityLab } from "@/components/AgenticRealityLab";
import { FlyUpScreen } from "@/components/FlyUpScreen";

// YOU-N-I-VERSE: opened from the bottom bars (openFlyUp("verse")), no floating button.
export function MakerStudioPanel() {
  return (
    <FlyUpScreen id="verse" testId="flyup-verse" title="YOU-N-I-VERSE" icon={<Orbit className="h-5 w-5" />}
      description="Agentic reality bridge recovered from the YOU-N-I-VERSE browser source.">
      <AgenticRealityLab />
    </FlyUpScreen>
  );
}

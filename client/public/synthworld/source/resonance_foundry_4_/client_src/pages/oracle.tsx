import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { HexagramDisplay } from "@/components/hexagram-display";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BookOpen, 
  Sparkles, 
  History,
  Dice6,
  Send
} from "lucide-react";
import type { Casting, Hexagram } from "@shared/schema";

export default function Oracle() {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");

  const { data: castings, isLoading: castingsLoading } = useQuery<Casting[]>({
    queryKey: ["/api/castings"]
  });

  const castMutation = useMutation({
    mutationFn: async (question: string) => {
      return apiRequest("POST", "/api/castings", { question });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/castings"] });
      setQuestion("");
      toast({
        title: "Hexagram Cast",
        description: "The oracle has spoken!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCast = () => {
    castMutation.mutate(question);
  };

  const latestCasting = castings?.[0];
  const previousCastings = castings?.slice(1, 6);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          I Ching Oracle
        </h1>
        <p className="text-muted-foreground mt-1">
          Seek guidance through the ancient wisdom of the I Ching
        </p>
      </div>

      <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dice6 className="w-5 h-5 text-primary" />
            Cast a Hexagram
          </CardTitle>
          <CardDescription>
            Focus on your question and let the oracle reveal your path
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What guidance do you seek? (Optional - you can also cast without a specific question)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-24 resize-none"
            data-testid="input-oracle-question"
          />
          <Button 
            onClick={handleCast}
            disabled={castMutation.isPending}
            className="w-full"
            size="lg"
            data-testid="button-cast-hexagram"
          >
            {castMutation.isPending ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Casting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Cast Hexagram
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {castMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">Consulting the oracle...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {latestCasting && latestCasting.hexagram && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Your Reading
          </h2>
          
          {latestCasting.question && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Your question:</p>
                <p className="font-medium italic">"{latestCasting.question}"</p>
              </CardContent>
            </Card>
          )}

          <HexagramDisplay 
            hexagram={latestCasting.hexagram as Hexagram}
            size="lg"
          />

          {latestCasting.interpretation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interpretation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-interpretation">
                  {latestCasting.interpretation}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {previousCastings && previousCastings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            Previous Readings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previousCastings.map((casting) => (
              <Card key={casting.id} className="overflow-hidden">
                {casting.hexagram && (
                  <HexagramDisplay 
                    hexagram={casting.hexagram as Hexagram}
                    size="sm"
                    showDetails={false}
                  />
                )}
                {casting.question && (
                  <CardContent className="pt-0 pb-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      "{casting.question}"
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {castingsLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!castingsLoading && (!castings || castings.length === 0) && !castMutation.isPending && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">Welcome to the Oracle</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              The I Ching, or Book of Changes, is an ancient Chinese divination system 
              that provides wisdom and guidance through 64 hexagrams. Each hexagram 
              represents a unique situation and offers insight into your path forward.
            </p>
            <p className="text-sm text-muted-foreground">
              Focus on your question, clear your mind, and cast your first hexagram above.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-secondary/5 border-secondary/20">
        <CardHeader>
          <CardTitle className="text-base">How the Oracle Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">1. Focus your intention:</strong> Whether you have a specific 
            question or seek general guidance, take a moment to center yourself.
          </p>
          <p>
            <strong className="text-foreground">2. Cast the hexagram:</strong> The system generates six lines 
            (yin or yang) that form your hexagram, mirroring the traditional coin-toss method.
          </p>
          <p>
            <strong className="text-foreground">3. Receive wisdom:</strong> Each of the 64 hexagrams carries 
            ancient wisdom applicable to your current situation. Changing lines indicate transformation.
          </p>
          <p>
            <strong className="text-foreground">4. Apply to resonance:</strong> In the context of Pathways to Purpose, 
            hexagrams help guide group decisions, role assignments, and timing of actions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

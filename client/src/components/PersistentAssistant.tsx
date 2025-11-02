/**
 * Persistent AI Assistant
 * Professional AI chat interface docked to bottom-right corner
 */

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, MessageSquare, Upload, Brain, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIService } from "@/lib/AIService";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  thinking?: string;
}

export function PersistentAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast} = useToast();

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!isSpeechEnabled) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File attached",
        description: `${file.name} (${(file.size / 1024).toFixed(1)}KB)`
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let messageContent = input.trim();
    if (uploadedFile) {
      messageContent += `\n\n[Attached: ${uploadedFile.name}]`;
    }

    const userMessage: Message = {
      role: "user",
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setUploadedFile(null);
    setIsLoading(true);

    try {
      const response = await AIService.sendMessage([
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage.content }
      ]);

      if (response.error) {
        const assistantMessage: Message = {
          role: "assistant",
          content: `${response.error}\n\nPlease go to Settings and configure your AI backend with an API key.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      // Extract thinking from response
      const thinkingMatch = response.content.match(/<think>([\s\S]*?)<\/think>/);
      const thinking = thinkingMatch ? thinkingMatch[1].trim() : undefined;
      const contentWithoutThinking = response.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      const assistantMessage: Message = {
        role: "assistant",
        content: contentWithoutThinking || response.content,
        timestamp: new Date(),
        thinking
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      try {
        speakText(assistantMessage.content);
      } catch (e) {
        console.log('Text-to-speech failed');
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Failed to reach AI service. Please go to Settings and configure your AI backend with an API key.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "Conversation history has been reset"
    });
  };

  return (
    <>
      {!isOpen && (
        <Button
          data-testid="button-open-assistant"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[100]"
          size="icon"
          title="AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 w-[95vw] sm:w-96 h-[500px] bg-card border rounded-lg shadow-xl z-[100] flex flex-col"
          data-testid="panel-assistant"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Ask anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                data-testid="button-toggle-speech"
                variant="ghost"
                size="icon"
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                title={isSpeechEnabled ? "Disable speech" : "Enable speech"}
              >
                {isSpeechEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button
                data-testid="button-close-assistant"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <Bot className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium mb-2">AI Assistant</p>
                <p className="text-xs mb-3">Ask questions about your project</p>
                <div className="text-xs bg-muted p-3 rounded-md">
                  <p className="font-medium mb-1">First time setup:</p>
                  <p className="mb-2">Go to Settings → AI Configuration</p>
                  <p>Choose your backend and add API key</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.role}-${idx}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm"
                          : "space-y-1"
                      }`}
                    >
                      {msg.role === "assistant" && msg.thinking && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs gap-1 px-2 mb-1"
                              data-testid={`button-toggle-thinking-${idx}`}
                            >
                              <Brain className="h-3 w-3" />
                              <span className="text-muted-foreground">View thinking</span>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="bg-muted/50 border border-border rounded-md px-2 py-1.5 text-xs text-muted-foreground mb-1">
                            {msg.thinking}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      <div className={msg.role === "assistant" ? "bg-muted rounded-lg px-3 py-2 text-sm" : ""}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 text-primary-foreground animate-pulse" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t">
            {uploadedFile && (
              <div className="mb-2 flex items-center gap-2 text-xs bg-muted rounded-md px-2 py-1">
                <span className="text-muted-foreground">📎 {uploadedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => setUploadedFile(null)}
                  data-testid="button-remove-file"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                data-testid="input-assistant-message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button
                  data-testid="button-send-message"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  data-testid="button-upload-file"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="icon"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    data-testid="button-clear-chat"
                    onClick={clearChat}
                    variant="outline"
                    size="icon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              data-testid="input-file-upload"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}

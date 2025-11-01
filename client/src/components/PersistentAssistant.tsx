/**
 * Persistent AI Assistant - The Guard Dog
 * THIS COMPONENT CANNOT BE REMOVED - It is core architecture
 * Only modify styling, not structure
 */

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Minimize2, Maximize2, X, MoveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIService } from "@/lib/AIService";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function PersistentAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('ai_assistant_position_v2');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 450, y: 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('ai_assistant_position_v2', JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 400));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await AIService.sendMessage([
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage.content }
      ]);

      if (response.error) {
        const assistantMessage: Message = {
          role: "assistant",
          content: `⚠️ ${response.error}\n\nPlease go to Settings and configure your AI backend with an API key.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "⚠️ Failed to reach AI service. Please go to Settings and configure your AI backend with an API key.",
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

  const resetPosition = () => {
    const newPos = { x: window.innerWidth - 450, y: 100 };
    setPosition(newPos);
    localStorage.setItem('ai_assistant_position_v2', JSON.stringify(newPos));
    toast({
      title: "Position Reset",
      description: "Guard Dog moved to default position"
    });
  };

  return (
    <>
      {!isOpen && (
        <Button
          data-testid="button-open-assistant"
          onClick={(e) => {
            if (!isDragging) {
              setIsOpen(true);
            }
          }}
          onMouseDown={handleMouseDown}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          className="fixed h-16 w-16 rounded-full shadow-2xl bg-lavender hover:bg-lavender-hover z-[100] touch-manipulation border-2 border-white/20 backdrop-blur-sm"
          size="icon"
          title="AI Guard Dog 🐕 - Drag to reposition"
        >
          <Bot className="h-7 w-7 text-white" />
        </Button>
      )}

      {isOpen && (
        <div 
          className={`fixed bg-card/95 backdrop-blur-sm border-2 border-lavender/20 rounded-lg shadow-2xl z-[100] flex flex-col
            ${isMinimized ? 'w-[90vw] sm:w-80 h-14' : 'w-[95vw] sm:w-96 h-[85vh] sm:h-[600px]'}
          `}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
          data-testid="panel-assistant"
        >
          <div 
            className="flex items-center justify-between p-3 border-b border-lavender/20 bg-gradient-to-r from-lavender/10 to-transparent cursor-move select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-lavender flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Guard Dog 🐕</h3>
                <p className="text-xs text-muted-foreground">Your creative companion</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                data-testid="button-minimize-assistant"
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-7 sm:w-7 touch-manipulation"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-5 w-5 sm:h-4 sm:w-4" /> : <Minimize2 className="h-5 w-5 sm:h-4 sm:w-4" />}
              </Button>
              <Button
                data-testid="button-close-assistant"
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-7 sm:w-7 touch-manipulation"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                    <Bot className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium mb-2">AI Guard Dog ready to assist! 🐕</p>
                    <p className="text-xs mb-3">Ask me anything about code, design, or creativity</p>
                    <div className="text-xs bg-lavender/10 p-3 rounded-md border border-lavender/20">
                      <p className="text-lavender font-medium mb-1">💡 First time setup:</p>
                      <p className="text-muted-foreground mb-2">Go to Settings → AI Configuration</p>
                      <p className="text-muted-foreground">Choose your backend: Claude, GPT-4, DeepSeek, Grok, or local CodeLlama</p>
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
                          <div className="h-6 w-6 rounded-full bg-lavender flex items-center justify-center flex-shrink-0">
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-lavender text-white"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-2 justify-start">
                        <div className="h-6 w-6 rounded-full bg-lavender flex items-center justify-center flex-shrink-0">
                          <Bot className="h-3 w-3 text-white animate-pulse" />
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

              <div className="p-3 border-t border-lavender/20">
                <div className="flex gap-2">
                  <Textarea
                    data-testid="input-assistant-message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask for help, advice, or warnings..."
                    className="min-h-[60px] resize-none"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      data-testid="button-send-message"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="bg-lavender hover:bg-lavender-hover touch-manipulation min-h-[44px] min-w-[44px]"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    {messages.length > 0 && (
                      <Button
                        data-testid="button-clear-chat"
                        onClick={clearChat}
                        variant="outline"
                        size="icon"
                        className="border-lavender/20 touch-manipulation min-h-[44px] min-w-[44px]"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

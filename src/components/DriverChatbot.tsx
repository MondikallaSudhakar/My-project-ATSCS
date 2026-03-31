import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Bot, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  actions?: string[];
  actionLabel?: string;
  timestamp: Date;
}

interface DriverChatbotProps {
  vehicleId?: string;
  driverName?: string;
  currentLat?: number;
  currentLng?: number;
}

export const DriverChatbot = ({ vehicleId, driverName, currentLat, currentLng }: DriverChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Hello! I'm your emergency assistant. I can help you with:\n• Alert hospitals about incoming patients\n• Request police backup\n• Update your vehicle status\n• Find nearest ICU-equipped hospitals\n• Reroute your path\n\nHow can I assist you?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("driver-chatbot", {
        body: {
          message: userMessage.content,
          vehicleId,
          driverName,
          currentLat: currentLat || 13.5550,
          currentLng: currentLng || 78.8738,
        },
      });

      if (error) throw error;

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: data.reply || "I processed your request.",
        actions: data.actions,
        actionLabel: data.action_label,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Patient critical, arriving in 5 mins",
    "Need police backup",
    "Which hospital has ICU?",
    "Mark me as en route",
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] flex flex-col">
      <Card className="flex flex-col h-[560px] shadow-2xl border-2 border-primary/20">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Emergency Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-white/20 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-primary-foreground/80">AI-powered driver support</p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-white/20 pt-2">
                        {msg.actions.map((action, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs block w-fit bg-white/20 text-inherit"
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] opacity-60 mt-1 block">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="px-3 py-2 border-t flex gap-1 overflow-x-auto">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => { setInput(action); }}
                className="text-[10px] px-2 py-1 bg-muted rounded-full whitespace-nowrap hover:bg-accent transition-colors flex-shrink-0"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="text-sm h-9"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

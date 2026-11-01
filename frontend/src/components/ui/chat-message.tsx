import { Button } from "@/components/ui/button";
import type { ChatMessage } from "../../types/index";

interface ChatMessageProps {
  message: ChatMessage;
  onPlay?: (text: string) => void;
  isPlaying?: boolean;
}

export default function ChatMessage({ message, onPlay, isPlaying }: ChatMessageProps) {
  const isBot = message.sender === "bot";
  const timeString = message.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex items-start space-x-3 fade-in ${isBot ? '' : 'justify-end'}`}>
      {isBot && (
        <div className="bg-primary p-2 rounded-full shrink-0">
          <i className="fas fa-robot text-primary-foreground text-sm"></i>
        </div>
      )}
      
      <div className={`rounded-2xl p-4 max-w-md ${
        isBot 
          ? 'bg-secondary rounded-tl-lg'
          : 'bg-primary text-primary-foreground rounded-tr-lg'
      }`}>
        <p className={isBot ? 'text-foreground' : 'text-primary-foreground'}>
          {message.message}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs ${
            isBot ? 'text-muted-foreground' : 'text-primary-foreground/70'
          }`}>
            {timeString}
          </span>
          {isBot && onPlay && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPlay(message.message)}
              disabled={isPlaying}
              className="text-primary hover:text-primary/80 transition-colors p-1 h-auto"
              data-testid={`button-play-message-${message.id}`}
            >
              <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'} text-sm`}></i>
            </Button>
          )}
        </div>
      </div>

      {!isBot && (
        <div className="bg-muted p-2 rounded-full shrink-0">
          <i className="fas fa-user text-foreground text-sm"></i>
        </div>
      )}
    </div>
  );
}

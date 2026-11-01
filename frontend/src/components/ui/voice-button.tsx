import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VoiceButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function VoiceButton({ isRecording, onClick, disabled }: VoiceButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={onClick}
          disabled={disabled}
          className={`p-3 rounded-full transition-all duration-300 ${
            isRecording 
              ? 'voice-pulse bg-destructive text-destructive-foreground hover:bg-destructive/90' 
              : 'bg-muted hover:bg-muted/80'
          }`}
          data-testid="button-voice-input"
        >
          <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-foreground`}></i>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isRecording ? "Stop Recording" : "Voice Input"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

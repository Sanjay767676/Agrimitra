import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export default function FloatingChatButton() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-110 z-50 h-14 w-14"
          onClick={() => setLocation("/chat")}
          data-testid="floating-chat-button"
        >
          <i className="fas fa-comments text-xl"></i>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Open KRISHI SAKHI Chat</p>
      </TooltipContent>
    </Tooltip>
  );
}

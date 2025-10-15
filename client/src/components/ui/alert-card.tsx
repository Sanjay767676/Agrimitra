import type { Alert } from "../../types/index";

interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
}

export default function AlertCard({ alert, onClick }: AlertCardProps) {
  const severityColors = {
    low: "bg-primary/10 border-primary/30 text-primary",
    medium: "bg-accent/10 border-accent/30 text-accent-foreground",
    high: "bg-destructive/10 border-destructive/20 text-destructive",
  };

  const severityLabels = {
    low: "Low Priority",
    medium: "Medium Priority", 
    high: "High Priority",
  };

  const typeIcons = {
    weather: "fa-cloud-rain",
    pest: "fa-bug",
    market: "fa-chart-line",
  };

  return (
    <div 
      className={`alert-notification ${severityColors[alert.severity]} border rounded-lg p-4 cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onClick}
      data-testid={`alert-card-${alert.id}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`${severityColors[alert.severity].split(' ')[0]}/20 p-2 rounded-lg`}>
          <i className={`fas ${typeIcons[alert.type]} ${severityColors[alert.severity].split(' ')[2]}`}></i>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
          <span className={`text-xs font-medium ${severityColors[alert.severity].split(' ')[2]}`}>
            {severityLabels[alert.severity]}
          </span>
        </div>
      </div>
    </div>
  );
}

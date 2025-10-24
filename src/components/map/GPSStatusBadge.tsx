import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

interface GPSStatusBadgeProps {
  lastUpdate: string | null;
  className?: string;
}

export const GPSStatusBadge = ({ lastUpdate, className }: GPSStatusBadgeProps) => {
  if (!lastUpdate) {
    return (
      <Badge variant="outline" className={className}>
        <Circle className="w-2 h-2 mr-1 fill-gray-400 text-gray-400" />
        Offline
      </Badge>
    );
  }

  const minutesAgo = Math.floor(
    (Date.now() - new Date(lastUpdate).getTime()) / 60000
  );

  if (minutesAgo < 5) {
    return (
      <Badge variant="outline" className={className}>
        <Circle className="w-2 h-2 mr-1 fill-green-500 text-green-500 animate-pulse" />
        Active
      </Badge>
    );
  }

  if (minutesAgo < 30) {
    return (
      <Badge variant="outline" className={className}>
        <Circle className="w-2 h-2 mr-1 fill-yellow-500 text-yellow-500" />
        Idle ({minutesAgo}m ago)
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      <Circle className="w-2 h-2 mr-1 fill-red-500 text-red-500" />
      Offline ({minutesAgo}m ago)
    </Badge>
  );
};

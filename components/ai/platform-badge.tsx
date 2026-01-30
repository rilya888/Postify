import React from "react";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS } from "@/lib/constants/platforms";
import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
  variant?: "default" | "secondary" | "outline" | "destructive" | "success";
  className?: string;
}

const PlatformBadge: React.FC<PlatformBadgeProps> = ({ 
  platform, 
  variant = "default", 
  className 
}) => {
  const platformConfig = PLATFORMS[platform as keyof typeof PLATFORMS];
  
  if (!platformConfig) {
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        {platform}
      </Badge>
    );
  }

  // Map platform to badge variant
  const badgeVariant = variant === "success" 
    ? "default" 
    : variant === "destructive" 
      ? "destructive" 
      : "secondary";

  return (
    <Badge variant={badgeVariant} className={cn("text-xs", className)}>
      <span className="mr-1">{platformConfig.icon}</span>
      {platformConfig.name}
    </Badge>
  );
};

export default PlatformBadge;
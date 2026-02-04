"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PLATFORMS } from "@/lib/constants/platforms";

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformToggle: (platform: string) => void;
  disabled?: boolean;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformToggle,
  disabled = false,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Platforms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(PLATFORMS).map(([key, platform]) => (
          <div key={key} className="flex items-center space-x-3">
            <Checkbox
              id={`platform-${key}`}
              checked={selectedPlatforms.includes(key)}
              onCheckedChange={() => !disabled && onPlatformToggle(key)}
              disabled={disabled}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={`platform-${key}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.name}
              </Label>
              <p className="text-xs text-muted-foreground">
                {platform.description} • Max: {platform.maxLength} chars
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PlatformSelector;
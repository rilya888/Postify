"use client";

import React from "react";
import { useTranslations } from "next-intl";
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
  const tGen = useTranslations("generatePage");
  const tPlatforms = useTranslations("platforms");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{tGen("selectPlatformsTitle")}</CardTitle>
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
                {tPlatforms(`${key}.name`)}
              </Label>
              <p className="text-xs text-muted-foreground">
                {tPlatforms(`${key}.description`)} • {tGen("maxChars", { count: platform.maxLength })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PlatformSelector;

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/constants/platforms";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X } from "lucide-react";

type ProjectsFiltersProps = {
  onFilterChange: (filters: {
    searchTerm?: string;
    platforms?: string[];
  }) => void;
};

/**
 * Filters component for projects list
 */
export function ProjectsFilters({ onFilterChange }: ProjectsFiltersProps) {
  const t = useTranslations("projectsFilters");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ searchTerm: value, platforms: selectedPlatforms });
  };

  const handlePlatformToggle = (platform: string) => {
    const newPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];

    setSelectedPlatforms(newPlatforms);
    onFilterChange({ searchTerm, platforms: newPlatforms });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPlatforms([]);
    onFilterChange({});
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {t("filtersButton")}
        </Button>
      </div>

      {showFilters && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{t("filterByPlatform")}</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
              <X className="h-4 w-4" />
              {t("clear")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            {Object.entries(PLATFORMS).map(([key, platform]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`platform-${key}`}
                  checked={selectedPlatforms.includes(key)}
                  onCheckedChange={() => handlePlatformToggle(key)}
                />
                <label
                  htmlFor={`platform-${key}`}
                  className="flex items-center gap-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <span>{platform.icon}</span>
                  <span>{platform.name}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

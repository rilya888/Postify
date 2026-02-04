"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectsFilters } from "@/components/projects/projects-filters";

/**
 * Client wrapper for projects page to handle filtering
 */
export function ProjectsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);

  const termFromUrl = searchParams.get("term") ?? "";
  const platformsFromUrl = useMemo(
    () => searchParams.get("platforms")?.split(",").filter(Boolean) ?? [],
    [searchParams]
  );
  const platformsFromUrlKey = platformsFromUrl.join(",");

  const [filters, setFilters] = useState({
    term: termFromUrl,
    platforms: platformsFromUrl,
  });

  useEffect(() => {
    setFilters({
      term: termFromUrl,
      platforms: platformsFromUrl,
    });
  }, [termFromUrl, platformsFromUrlKey, platformsFromUrl]);

  const filtersTerm = filters.term;
  const filtersPlatformsKey = filters.platforms.join(",");

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (filtersTerm) params.set("term", filtersTerm);
    if (filters.platforms.length > 0) params.set("platforms", filters.platforms.join(","));
    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (newQuery !== currentQuery) {
      router.replace(newQuery ? `?${newQuery}` : "/projects");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filters.term/platforms are derived from filtersTerm/filtersPlatformsKey
  }, [filtersTerm, filtersPlatformsKey, router, searchParams]);

  const handleFilterChange = (newFilters: {
    searchTerm?: string;
    platforms?: string[];
  }) => {
    setFilters((prev) => ({
      term: newFilters.searchTerm ?? prev.term,
      platforms: newFilters.platforms ?? prev.platforms,
    }));
  };

  return <ProjectsFilters onFilterChange={handleFilterChange} />;
}
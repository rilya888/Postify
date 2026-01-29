"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectsFilters } from "@/components/projects/projects-filters";

/**
 * Client wrapper for projects page to handle filtering
 */
export function ProjectsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    term: searchParams.get("term") || "",
    platforms: searchParams.get("platforms")?.split(",") || [],
  });

  useEffect(() => {
    // Update URL when filters change
    const params = new URLSearchParams();
    
    if (filters.term) {
      params.set("term", filters.term);
    }
    
    if (filters.platforms.length > 0) {
      params.set("platforms", filters.platforms.join(","));
    }
    
    router.push(`?${params.toString()}`);
  }, [filters, router]);

  const handleFilterChange = (newFilters: {
    searchTerm?: string;
    platforms?: string[];
  }) => {
    setFilters(prev => ({
      term: newFilters.searchTerm || prev.term,
      platforms: newFilters.platforms || prev.platforms,
    }));
  };

  return <ProjectsFilters onFilterChange={handleFilterChange} />;
}
"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import type { NewsFilter, NewsStory } from "@/lib/news/types";
import { NEWS_FILTERS } from "@/lib/news/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceChip, MockBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { NewsCard } from "@/components/finance/news-card";
import { Newspaper } from "lucide-react";

interface NewsPayload {
  stories: NewsStory[];
  source: import("@/lib/providers/types").DataSourceInfo;
}

export default function NewsPage() {
  const [category, setCategory] = useState<NewsFilter>("All");
  const { data, loading, error, refetch } = useAsyncData<NewsPayload>(
    () => fetchJson("/api/news?limit=50"),
    [],
  );

  const stories = data?.stories ?? [];

  const filtered = useMemo(
    () => (category === "All" ? stories : stories.filter((s) => s.category === category)),
    [stories, category],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const story of stories) {
      map.set(story.category, (map.get(story.category) ?? 0) + 1);
    }
    return map;
  }, [stories]);

  const [featured, ...rest] = filtered;

  return (
    <div>
      <PageHeader
        title="News"
        description="Finance-focused story feed with clustering — one event, multiple sources. Demo stories until v0.4 wires live providers."
        actions={
          <>
            <MockBadge />
            {data && <DataSourceChip source={data.source} />}
            <Button variant="outline" size="sm" onClick={refetch} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh
            </Button>
          </>
        }
      />

      <div className="mb-5">
        <Tabs
          items={NEWS_FILTERS.map((filter) => ({
            value: filter,
            label: filter,
            count:
              filter === "All"
                ? stories.length
                : counts.get(filter) ?? 0,
          }))}
          value={category}
          onChange={(v) => setCategory(v as NewsFilter)}
          label="News categories"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-44 w-full rounded-lg lg:col-span-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={`No ${category} stories right now`}
          description="Demo story set is small. Live feeds with category coverage arrive in v0.4."
          action={{ label: "Show all stories", onClick: () => setCategory("All") }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <NewsCard story={featured} />
          </div>
          {rest.map((story) => (
            <NewsCard key={story.id} story={story} />
          ))}
        </div>
      )}

      <p className="mt-5 text-2xs text-faint">
        Demo headlines and summaries — fabricated for UI development, never real journalism.
        Source links point to publisher homepages. Story deduplication + AI summaries arrive in v0.4.
      </p>
    </div>
  );
}

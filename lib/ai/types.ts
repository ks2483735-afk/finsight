/**
 * AI router contracts.
 *
 * The UI never calls a model provider directly. It calls the AI router
 * (lib/ai/router.ts), which selects a configured, implemented adapter.
 * In v0.1 no adapter is implemented yet — the router reports that honestly
 * instead of faking answers.
 */

import type { DataSourceInfo } from "@/lib/providers/types";

export type AIUnavailableReason =
  | "not-configured"
  | "adapter-not-implemented"
  | "provider-error";

/** Evidence collected for a research query, kept separate from AI output. */
export interface ResearchEvidence {
  id: string;
  kind: "market" | "news" | "fundamentals" | "filings" | "macro" | "sector";
  label: string;
  status: "collected" | "unavailable";
  detail: string;
  source: DataSourceInfo;
}

export interface ResearchStep {
  id: string;
  label: string;
  status: "collected" | "unavailable" | "pending";
  detail: string;
}

export interface AIResult {
  available: boolean;
  providerId: string | null;
  reason?: AIUnavailableReason;
  /** Human-readable, honest explanation of the current state. */
  message: string;
  /** Present only when a real adapter produced an answer (not in v0.1). */
  answer?: string;
  citations?: { title: string; url: string }[];
}

/**
 * Contract every AI adapter implements (Gemini, AIMLAPI, BazaarLink, ...).
 * No adapter ships in v0.1 — the router reports "unavailable" honestly
 * rather than fabricating model output.
 */
export interface AIProviderAdapter {
  id: string;
  label: string;
  /** Performs a grounded analysis over retrieved evidence. */
  analyze(input: {
    prompt: string;
    evidence: ResearchEvidence[];
  }): Promise<{ answer: string; citations: { title: string; url: string }[] }>;
}

export interface ResearchResult {
  query: string;
  /** Securities detected in the query (deterministic matching). */
  matchedSymbols: string[];
  steps: ResearchStep[];
  evidence: ResearchEvidence[];
  /** Deterministic, code-computed observations (NOT AI output). */
  observations: string[];
  quotes: import("@/lib/market-data/types").Quote[];
  stories: import("@/lib/news/types").NewsStory[];
  ai: AIResult;
  generatedAt: string;
  isMock: boolean;
}

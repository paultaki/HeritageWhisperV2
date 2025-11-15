"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, BookOpen, MessageSquare, Sparkles, ExternalLink } from "lucide-react";

interface AIPrompt {
  id: string;
  name: string;
  category: string;
  description: string;
  filePath: string;
  lineNumber: string;
  model: string;
  temperature: number;
  maxTokens: number;
  reasoningEffort?: string;
  usage: string;
  promptText: string;
}

interface APIResponse {
  success: boolean;
  prompts: AIPrompt[];
  totalCount: number;
  categories: string[];
}

export default function AIPromptsPage() {
  const { session } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  const { data, isLoading } = useQuery<APIResponse>({
    queryKey: ["ai-prompts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ai-prompts", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch AI prompts");
      return res.json();
    },
    enabled: !!session,
  });

  const filteredPrompts = data?.prompts.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  ) || [];

  const getCategoryIcon = (category: string) => {
    if (category === "Conversation AI") return <MessageSquare className="w-4 h-4" />;
    if (category === "Prompt Generation") return <Sparkles className="w-4 h-4" />;
    if (category === "Story Processing") return <BookOpen className="w-4 h-4" />;
    return <Code className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    if (category === "Conversation AI") return "bg-blue-100 text-blue-800 border-blue-300";
    if (category === "Prompt Generation") return "bg-purple-100 text-purple-800 border-purple-300";
    if (category === "Story Processing") return "bg-green-100 text-green-800 border-green-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center hw-page">
        <p className="text-muted-foreground">Loading AI prompts...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Prompts Inspector</h1>
        <p className="text-muted-foreground">
          View all AI system prompts sent to OpenAI models throughout the app. Use this to diagnose
          issues, understand model behavior, and optimize prompts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalCount || 0}</div>
          </CardContent>
        </Card>

        {data?.categories.map((category) => {
          const count = data.prompts.filter((p) => p.category === category).length;
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
        >
          All ({data?.totalCount || 0})
        </Button>
        {data?.categories.map((category) => {
          const count = data.prompts.filter((p) => p.category === category).length;
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="gap-2"
            >
              {getCategoryIcon(category)}
              {category} ({count})
            </Button>
          );
        })}
      </div>

      {/* Prompts List */}
      <div className="space-y-4">
        {filteredPrompts.map((prompt) => {
          const isExpanded = expandedPrompt === prompt.id;

          return (
            <Card key={prompt.id} className="overflow-hidden">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedPrompt(isExpanded ? null : prompt.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      {getCategoryIcon(prompt.category)}
                      {prompt.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mb-3">
                      {prompt.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={getCategoryColor(prompt.category)}>
                        {prompt.category}
                      </Badge>
                      <Badge variant="secondary">
                        {prompt.model}
                      </Badge>
                      <Badge variant="outline">
                        Temp: {prompt.temperature}
                      </Badge>
                      <Badge variant="outline">
                        Max Tokens: {prompt.maxTokens}
                      </Badge>
                      {prompt.reasoningEffort && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                          Reasoning: {prompt.reasoningEffort}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                  >
                    {isExpanded ? "Hide" : "View"} Prompt
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t bg-muted/30">
                  <div className="space-y-4">
                    {/* Usage Context */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        When This Prompt is Used
                      </h4>
                      <p className="text-sm text-muted-foreground">{prompt.usage}</p>
                    </div>

                    {/* File Location */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Source Code Location
                      </h4>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded border">
                          {prompt.filePath}:{prompt.lineNumber}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => {
                            // Copy file path to clipboard
                            navigator.clipboard.writeText(`${prompt.filePath}:${prompt.lineNumber}`);
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Model Configuration */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Model Configuration</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Model:</span>
                          <div className="font-mono">{prompt.model}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Temperature:</span>
                          <div className="font-mono">{prompt.temperature}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max Tokens:</span>
                          <div className="font-mono">{prompt.maxTokens}</div>
                        </div>
                        {prompt.reasoningEffort && (
                          <div>
                            <span className="text-muted-foreground">Reasoning:</span>
                            <div className="font-mono">{prompt.reasoningEffort}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prompt Text */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Full System Prompt</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(prompt.promptText);
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-background border rounded-lg p-4 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap font-mono">
                        {prompt.promptText}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredPrompts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No prompts found for this category</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

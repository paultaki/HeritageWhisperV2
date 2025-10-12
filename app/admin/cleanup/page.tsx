"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Eye, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CleanupSummary {
  totalScanned: number;
  highQuality: number;
  lowQuality: number;
  dryRun: boolean;
  issues: Array<{
    id: string;
    text: string;
    score: number;
    issues: string[];
  }>;
  issueTypeCounts: Record<string, number>;
}

export default function CleanupPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<CleanupSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCleanup = async (dryRun: boolean, verbose: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(
        "POST",
        `/api/prompts/cleanup?dryRun=${dryRun}&verbose=${verbose}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Cleanup failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600">Please sign in to access cleanup tools</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-heritage-brown mb-2">
            Prompt Quality Cleanup
          </h1>
          <p className="text-gray-600">
            Remove low-quality prompts that are too generic, long, or lack specificity
          </p>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Cleanup Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={() => runCleanup(true, true)}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Preview (Dry Run)
              </Button>
              
              <Button
                onClick={() => runCleanup(false, false)}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clean Up Now
              </Button>
            </div>
            
            <p className="text-sm text-gray-500">
              Preview shows what would be removed without making changes. Clean Up Now removes poor quality prompts permanently.
            </p>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Cleanup Summary
                {summary.dryRun && (
                  <span className="text-sm font-normal text-amber-600">
                    (Preview - No Changes Made)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.totalScanned}
                  </div>
                  <div className="text-sm text-gray-600">Total Scanned</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {summary.highQuality}
                  </div>
                  <div className="text-sm text-gray-600">High Quality</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {summary.lowQuality}
                  </div>
                  <div className="text-sm text-gray-600">Low Quality</div>
                </div>
              </div>

              {/* Issue Types */}
              {summary.issueTypeCounts && Object.keys(summary.issueTypeCounts).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Most Common Issues</h3>
                  <div className="space-y-2">
                    {Object.entries(summary.issueTypeCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <div
                          key={type}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm font-medium capitalize">
                            {type.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-600">
                            {count} prompt{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Low Quality Prompts */}
              {summary.issues && summary.issues.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Low Quality Prompts ({summary.issues.length})
                  </h3>
                  <div className="space-y-3">
                    {summary.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <p className="text-sm mb-2 text-gray-800 italic">
                          "{issue.text}"
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-700 font-medium">
                            Issues: {issue.issues.join(', ')}
                          </span>
                          <span className="text-gray-600">
                            Score: {issue.score}/100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {!summary.dryRun && summary.lowQuality > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✓ Successfully removed {summary.lowQuality} low quality prompt
                    {summary.lowQuality !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quality Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <div>
                  <span className="font-medium">Too Generic:</span>{' '}
                  <span className="text-gray-600">
                    "Tell me more", "What else", "How did that make you feel"
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <div>
                  <span className="font-medium">Too Long:</span>{' '}
                  <span className="text-gray-600">Over 35 words</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <div>
                  <span className="font-medium">Lacks Specificity:</span>{' '}
                  <span className="text-gray-600">
                    No references to user's actual stories
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <div>
                  <span className="font-medium">Psychology Jargon:</span>{' '}
                  <span className="text-gray-600">
                    "journey", "growth", "resilience", "shaped you"
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <div>
                  <span className="font-medium">Yes/No Questions:</span>{' '}
                  <span className="text-gray-600">
                    "Did you...", "Was it...", "Were you..."
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

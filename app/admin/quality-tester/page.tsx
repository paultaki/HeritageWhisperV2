"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TestResult {
  prompt: string;
  wordCount: number;
  isValid: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  passedChecks: string[];
  hasGenericWords: boolean;
  hasBannedPhrases: boolean;
  hasEmotionalDepth: boolean;
  hasExactPhrases: boolean;
  isQuestion: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    label: "Good: Exact Phrase",
    text: "You felt 'housebroken by love.' What freedom did you trade for that feeling?",
  },
  {
    label: "Good: Pattern",
    text: "You sacrifice for family in every story. Where did you learn that's what love looks like?",
  },
  {
    label: "Bad: Generic Noun",
    text: "Tell me more about the girl you mentioned.",
  },
  {
    label: "Bad: Banned Phrase",
    text: "In your story about childhood, how did that make you feel?",
  },
  {
    label: "Bad: Too Long",
    text: "I noticed in your story about growing up that you mentioned your father was very strict and demanding which must have been really difficult for you as a child trying to figure out who you were and what you wanted to become in life.",
  },
];

export default function QualityTesterPage() {
  const { user } = useAuth();
  const [promptText, setPromptText] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testPrompt = async () => {
    if (!promptText.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/test-prompt", {
        prompt: promptText,
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
      }
    } catch (err) {
      console.error("Test failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (text: string) => {
    setPromptText(text);
    setResult(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F3]">
        <p className="text-gray-600">Please sign in to access admin tools</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-heritage-brown mb-2">
            Quality Gate Tester
          </h1>
          <p className="text-gray-600">
            Test individual prompts through the quality gates to see validation details
          </p>
        </div>

        {/* Example Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Example Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXAMPLE_PROMPTS.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => loadExample(example.text)}
                  className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {example.label}
                  </div>
                  <div className="text-xs text-gray-500 italic line-clamp-2">
                    "{example.text}"
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Test Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter a prompt to test..."
              rows={4}
              className="font-serif text-base"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {promptText.trim().split(/\s+/).filter(Boolean).length} words
              </div>
              <Button 
                onClick={testPrompt}
                disabled={!promptText.trim() || isLoading}
              >
                Test Prompt
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className={result.isValid ? "border-green-300" : "border-red-300"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.isValid ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <span className="text-green-700">Valid Prompt</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <span className="text-red-700">Invalid Prompt</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prompt Text */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-lg italic text-gray-800">
                  "{result.prompt}"
                </p>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {result.wordCount}
                  </div>
                  <div className="text-sm text-gray-600">Words</div>
                  <div className={`text-xs mt-1 ${result.wordCount <= 30 ? "text-green-600" : "text-red-600"}`}>
                    {result.wordCount <= 30 ? "✓ Under limit" : "✗ Over limit (30 max)"}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div
                    className={`text-3xl font-bold mb-1 ${
                      result.score >= 80
                        ? "text-green-600"
                        : result.score >= 60
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {result.score}
                  </div>
                  <div className="text-sm text-gray-600">Quality Score</div>
                  <div className="text-xs mt-1 text-gray-500">
                    {result.score >= 80 ? "Excellent" : result.score >= 60 ? "Good" : "Poor"}
                  </div>
                </div>
              </div>

              {/* Quality Checks */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Quality Checks</h3>
                <div className="space-y-2">
                  <QualityCheck
                    passed={!result.hasGenericWords}
                    label="No Generic Nouns"
                    description="girl, boy, man, woman, house, room, etc."
                  />
                  <QualityCheck
                    passed={!result.hasBannedPhrases}
                    label="No Banned Phrases"
                    description="tell me more, how did that make you feel, etc."
                  />
                  <QualityCheck
                    passed={result.isQuestion}
                    label="Is a Question"
                    description="Prompts should be questions that invite reflection"
                  />
                  <QualityCheck
                    passed={result.wordCount <= 30}
                    label="Word Count (≤30)"
                    description="Concise prompts are more engaging"
                  />
                </div>
              </div>

              {/* Positive Signals */}
              {result.passedChecks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Positive Signals
                  </h3>
                  <div className="space-y-2">
                    {result.passedChecks.map((check, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
                      >
                        ✓ {check}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Warnings
                  </h3>
                  <div className="space-y-2">
                    {result.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800"
                      >
                        ⚠ {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {result.issues.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-700 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Issues
                  </h3>
                  <div className="space-y-2">
                    {result.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
                      >
                        ✗ {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Gate Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Generic Nouns (Rejected)</h3>
              <p className="text-gray-600">
                girl, boy, man, woman, person, house, home, room, chair, table, place, thing, 
                stuff, kid, child, guy, lady, someone, something
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Banned Phrases (Rejected)</h3>
              <p className="text-gray-600">
                "tell me more", "what else", "how did that make you feel", 
                "what's the clearest memory", "in your story about", "describe the"
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Emotional Depth Signals (Bonus Points)</h3>
              <p className="text-gray-600">
                felt, realized, learned, taught, changed, chose, decided, traded, 
                lost, gained, never, always, first, last
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Exact Phrases (Bonus Points)</h3>
              <p className="text-gray-600">
                Using quotes around specific user words proves deep listening
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QualityCheck({ passed, label, description }: { 
  passed: boolean; 
  label: string; 
  description: string;
}) {
  return (
    <div className={`p-3 rounded-lg border ${
      passed 
        ? "bg-green-50 border-green-200" 
        : "bg-red-50 border-red-200"
    }`}>
      <div className="flex items-start gap-2">
        {passed ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
        )}
        <div className="flex-1">
          <div className={`font-medium ${passed ? "text-green-900" : "text-red-900"}`}>
            {label}
          </div>
          <div className={`text-xs ${passed ? "text-green-700" : "text-red-700"}`}>
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

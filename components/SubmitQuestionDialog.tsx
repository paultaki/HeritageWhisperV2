'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquarePlus, Loader2 } from 'lucide-react';

interface SubmitQuestionDialogProps {
  storytellerId: string;
  sessionToken: string;
  storytellerName: string;
}

export function SubmitQuestionDialog({
  storytellerId,
  sessionToken,
  storytellerName,
}: SubmitQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/family/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          storytellerUserId: storytellerId,
          promptText: question,
          context: context || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit question');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Question submitted!',
        description: `${storytellerName} will see your question and can record a story to answer it.`,
      });
      setOpen(false);
      setQuestion('');
      setContext('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit question',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (question.trim().length < 10) {
      toast({
        title: 'Question too short',
        description: 'Please write at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    if (question.length > 500) {
      toast({
        title: 'Question too long',
        description: 'Please keep it under 500 characters',
        variant: 'destructive',
      });
      return;
    }

    submitMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Submit a Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Ask {storytellerName} a Question</DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-2">
              Submit a question you'd like {storytellerName} to answer. They'll see it when they're ready to record their next story.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-6">
            <div>
              <Label htmlFor="question" className="text-base font-semibold">
                Your Question *
              </Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: What was your first job like?"
                className="mt-2 min-h-[100px] text-base resize-none"
                required
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {question.length}/500 characters
              </p>
            </div>

            <div>
              <Label htmlFor="context" className="text-base">
                Why do you want to know? (Optional)
              </Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Example: I'm curious about your career journey..."
                className="mt-2 min-h-[80px] text-base resize-none"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Adding context helps them give a better answer
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending || question.trim().length < 10}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Question'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

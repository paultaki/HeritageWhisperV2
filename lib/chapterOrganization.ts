import { chat } from "@/lib/ai/gatewayClient";

export interface ChapterSuggestion {
  title: string;
  storyIds: string[];
  orderIndex: number;
}

export async function suggestChapters(stories: any[]): Promise<ChapterSuggestion[]> {
  const storiesInput = stories.map(s => ({
    id: s.id,
    title: s.title,
    date: s.storyDate || s.storyYear,
    transcript: s.transcription ? s.transcription.substring(0, 500) : "", // Truncate for token limit
  }));

  const systemPrompt = `You are an expert biographer and editor. Your task is to organize a collection of life stories into a coherent book structure with chapters.
  
  Rules:
  1. Group stories chronologically and thematically.
  2. Create 6-12 chapters (adjust based on number of stories).
  3. Give each chapter a warm, book-like title (e.g., "Early Years", "Building a Family", "Career & Passion").
  4. Ensure EVERY story is assigned to exactly one chapter.
  5. Return JSON only.
  
  Output Format:
  {
    "chapters": [
      {
        "title": "Chapter Title",
        "storyIds": ["id1", "id2"],
        "orderIndex": 0
      }
    ]
  }`;

  const userPrompt = JSON.stringify(storiesInput);

  const { text } = await chat({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
  });

  if (!text) throw new Error("No response from AI");

  try {
    // Remove markdown code blocks if present
    const jsonText = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(jsonText);
    return result.chapters;
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Invalid AI response format");
  }
}

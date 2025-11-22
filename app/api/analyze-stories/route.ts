import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { transcript, userName } = await request.json();

        if (!transcript) {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        const systemPrompt = `
    You are an expert editor and biographer. Your task is to analyze an interview transcript between a "Grandchild" (interviewer) and a "Grandparent" (user).
    
    GOAL:
    1. Identify distinct stories or topics within the conversation.
    2. For each story, create a "bridged" narrative version.
    
    BRIDGING RULES:
    - Remove the interviewer's questions.
    - Lightly edit the user's answers to form a continuous narrative.
    - Keep the user's original voice, tone, and words as much as possible.
    - Add very minimal connecting phrases if needed (e.g., "Then," "After that,").
    - DO NOT embellish or make up details.
    
    OUTPUT FORMAT:
    Return a JSON object with a "stories" array. Each story should have:
    - "title": A short, engaging title for the story.
    - "summary": A 1-sentence summary.
    - "bridged_text": The continuous narrative text.
    - "start_time": The start time (in seconds) of the first message in this story.
    - "end_time": The end time (in seconds) of the last message in this story.
    - "reasoning": Why you split it here.
    
    If the conversation is just one continuous story, return a single item in the array.
    `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Here is the transcript with timestamps:\n\n${JSON.stringify(transcript)}` }
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        const result = JSON.parse(content);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error analyzing stories:', error);
        return NextResponse.json(
            { error: 'Failed to analyze stories' },
            { status: 500 }
        );
    }
}

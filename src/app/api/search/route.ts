import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const { documentContext, documentGoal, noteContent } = body;

    // Validate input
    if (!noteContent) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    // Generate a query for web search using OpenAI
    const searchQuery = await generateSearchQuery(documentContext, documentGoal, noteContent);
    
    // Use OpenAI to generate mock search results (in a real app, you would use a real search API)
    const webResults = await generateWebResults(searchQuery, documentContext);

    return NextResponse.json({ webResults });
  } catch (error) {
    console.error('Error in web search API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate search results' },
      { status: 500 }
    );
  }
}

async function generateSearchQuery(documentContext: string, documentGoal: string, noteContent: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant that helps generate effective search queries. 
        Based on the following information, create a concise search query (max 10 words) that would help find relevant academic or informational sources.
        
        Document Goal: "${documentGoal}"
        Document Context: "${documentContext}"
        User's Note: "${noteContent}"
        
        Return ONLY the search query text, and also explain how it could fit into the document goal and context.`
      }
    ],
    temperature: 0.3,
    max_tokens: 50
  });

  return response.choices[0].message.content?.trim() || noteContent;
}

async function generateWebResults(searchQuery: string, documentContext: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant that generates mock search results. The user is searching for: "${searchQuery}" in the context of: "${documentContext}".
        
        Create 3 highly relevant search results that would be helpful for research on this topic. Each result should include:
        1. Title (be specific, include names, dates, and institutions where appropriate)
        2. URL (create a plausible URL, using real domains like academic institutions, online journals, etc.)
        3. Brief description (2-3 sentences summarizing what the user would find)
        
        Format as JSON array with title, url, and description fields. URLs should be properly formatted and look realistic (e.g., https://www.example.com/path).`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 600
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    // Parse the JSON response
    const parsedContent = JSON.parse(content);
    return parsedContent.results || [];
  } catch (error) {
    console.error('Error parsing search results:', error);
    return [];
  }
} 
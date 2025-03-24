import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();

    // TODO: Change the documentContext to the actual document context, not dummy data
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

  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        "role": "system",
        "content": `You are a helpful essay-writing assistant that generates concise search queries from user input. 
        Based on the submitted note and essay prompt, create a concise search query (max 10 words) that would help find relevant academic or informational sources.
        
        Essay Prompt: "${documentGoal}"
        SubmittedNote: "${noteContent}"
        
        Return ONLY the search query text`
      }
    ],
    text: {
      "format": {
        "type": "text"
      }
    },
    temperature: 0.3,
    max_output_tokens: 50,
  });
  console.log(response.output_text);
  return response.output_text|| noteContent;
}

async function generateWebResults(searchQuery: string, documentContext: string) {
  const response = await openai.responses.create({
    model: 'gpt-4o',
    tools: [ { type: "web_search_preview", search_context_size: "medium"} ],
    input: [
      {
        role: 'system',
        "content": `You are an AI assistant that generates mock search results. The user is searching for: "${searchQuery}" in the context of: "${documentContext}".
        
        Create 3 highly relevant search results that would be helpful for research on this topic. Each result should include:
        1. Title (be specific, include names, dates, and institutions where appropriate)
        2. URL (create a plausible URL, using real domains like academic institutions, online journals, etc.)
        3. Brief description (2-3 sentences summarizing what the user would find)
        
        Format as JSON array with title, url, and description fields. URLs should be properly formatted and look realistic (e.g., https://www.example.com/path).`
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "SearchResults",
        schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string"
                  },
                  url: {
                    type: "string"
                  },
                  description: {
                    type: "string"
                  }
                },
                required: ["title", "url", "description"],
                additionalProperties: false
              }
            }
          },
          required: ["results"],
          additionalProperties: false
        }
      }
    },
    temperature: 0.7,
    max_output_tokens: 1000
  });
  console.log(response.output_text);


  try {
    const content = response.output_text;
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
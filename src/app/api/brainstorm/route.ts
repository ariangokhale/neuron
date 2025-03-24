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

    // Generate a structured prompt using the provided format
    const prompt = generatePrompt(documentContext, documentGoal, noteContent);

    // Call OpenAI API with the new client
    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: [
        {
          role: 'system',
          content: prompt
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
                    label: {
                      type: "string",
                      enum: ["Expansion Ideas", "Alternative Perspectives", "Relevance"],
                      description: "The section of the response"
                    },
                    description: {
                      type: "string",
                      description: "Detailed description of the section"
                    }
                  },
                  required: ["label", "description"],
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
      max_output_tokens: 800
    });
    // Extract content from the response
    const content = response.output_text;
    
    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from AI service' },
        { status: 500 }
      );
    }

    // Parse the response to extract sections
    const sections = parseAIResponse(content);

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error in brainstorm API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate brainstorm ideas' },
      { status: 500 }
    );
  }
}

function generatePrompt(documentContext: string, documentGoal: string, noteContent: string) {
  return `
 You are an AI writing assistant that helps users integrate research notes into their documents. The available context:

### Context:
The user is working on a document with prompt: "${documentGoal}"
The current document content is: "${documentContext}"
The user has added a note they want to incorporate: "${noteContent}"

Your task is to analyze the note in relation to the document and essay prompt and provide the following:
1. **Expansion Ideas**: Suggest ways to develop the note further with supporting details.
2. **Alternative Perspectives**: Challenge the note or offer contrasting viewpoints IF some evidence supports a contrasting viewpoint.
3. ** Relevance**: Try and guess the note's relevance to the overall document and essay prompt. 

Create 1 bullet point for each section and make them thought-provoking and engaging. 

Format as JSON array with label (Expansion Ideas, Alternative Perspectives, Relevance) and description fields 
`;
}

function parseAIResponse(aiResponse: string) {
  try {
    // Parse the JSON response
    const parsed = JSON.parse(aiResponse);
    
    // Map the results to bullet points
    return {
      bulletPoints: parsed.results.map((item: { label: string; description: string }) => {
        switch (item.label) {
          case "Expansion Ideas":
            return `Expand: ${item.description}`;
          case "Alternative Perspectives":
            return `Alternative: ${item.description}`;
          case "Relevance":
            return `Relevance: ${item.description}`;
          default:
            return "";
        }
      }).filter(Boolean)
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return { bulletPoints: [] };
  }
} 

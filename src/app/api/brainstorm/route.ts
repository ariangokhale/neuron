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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    // Extract content from the response
    const content = response.choices[0].message.content;
    
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
You are an AI writing assistant that helps users integrate research notes into their document. 

### Context:
The user is working on a document with the goal: "${documentGoal}"
The current document content is: "${documentContext}"
The user has added a note they want to incorporate: "${noteContent}"

Your task is to analyze the note in relation to the document and provide the following:
 
1. **Expansion Ideas**: Suggest ways to develop the note further with supporting details.  
2. **Alternative Perspectives**: Challenge the note or offer contrasting viewpoints. 

Create a few bullet points for each, make them thought provoking and engaging. 

### Provide a structured response:
- **Expansion Ideas:** 
- **Alternative Perspectives:** 
`;
}

function parseAIResponse(aiResponse: string) {
  // Create an object to store the parsed sections
  const result: any = {
    integrationSuggestions: [],
    expansionIdeas: [],
    relevantLinks: [],
    alternativePerspectives: []
  };

  // Current section being processed
  let currentSection = '';
  
  // Split the response into lines and process each line
  const lines = aiResponse.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Determine which section we're in
    if (trimmedLine.includes('Integration Suggestions:')) {
      currentSection = 'integrationSuggestions';
      continue;
    } else if (trimmedLine.includes('Expansion Ideas:')) {
      currentSection = 'expansionIdeas';
      continue;
    } else if (trimmedLine.includes('Relevant Links:')) {
      currentSection = 'relevantLinks';
      continue;
    } else if (trimmedLine.includes('Alternative Perspectives:')) {
      currentSection = 'alternativePerspectives';
      continue;
    }
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Process the line based on the current section
    if (currentSection && trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.match(/^\d+\./)) {
      // Clean up the line (remove the bullet point or number)
      const cleanedLine = trimmedLine.replace(/^[-•]|\d+\.\s+/, '').trim();
      
      // Extract link information if in the relevant links section
      if (currentSection === 'relevantLinks' && trimmedLine.includes('[') && trimmedLine.includes(']')) {
        const linkMatch = trimmedLine.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          result[currentSection].push({
            title: linkMatch[1],
            url: linkMatch[2]
          });
        } else {
          result[currentSection].push(cleanedLine);
        }
      } else if (cleanedLine) {
        result[currentSection].push(cleanedLine);
      }
    }
  }
  
  // Convert to the expected format for the frontend
  return {
    bulletPoints: [
      ...result.integrationSuggestions.map((item: string) => `Integration: ${item}`),
      ...result.expansionIdeas.map((item: string) => `Expand: ${item}`),
      ...result.relevantLinks.map((item: any) => 
        typeof item === 'string' 
          ? `Source: ${item}` 
          : `Source: ${item.title} (${item.url})`
      ),
      ...result.alternativePerspectives.map((item: string) => `Alternative: ${item}`)
    ]
  };
} 

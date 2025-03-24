// This file will contain our AI service logic

interface BrainstormResponse {
  bulletPoints: string[];
}

interface BrainstormRequest {
  documentContext: string;
  documentGoal: string;
  noteContent: string;
}

interface WebSearchRequest {
  documentContext: string;
  documentGoal: string;
  noteContent: string;
}

interface WebSearchResult {
  title: string;
  url: string;
  description: string;
}

interface WebSearchResponse {
  webResults: WebSearchResult[];
}

// Different mock responses based on input patterns - used as fallback if API fails
const mockBrainstormResponses: Record<string, BrainstormResponse> = {
  default: {
    bulletPoints: [
      "Consider relating this to key enlightenment thinkers like Kant, Locke, or Rousseau",
      "Explore how this connects to the scientific revolution of the 17th century",
      "Examine the impact on political structures and governance models",
      "Compare and contrast with earlier philosophical traditions",
      "Incorporate primary sources that demonstrate these ideas in practice",
      "Analyze how this influenced art and culture during the period"
    ]
  },
  voltaire: {
    bulletPoints: [
      "Examine Voltaire's criticism of religious intolerance in 'Treatise on Tolerance'",
      "Explore his impact on the separation of church and state",
      "Consider his relationship with European monarchs, especially Frederick the Great",
      "Analyze how his ideas on freedom of speech influenced later thinkers",
      "Look at his contributions to Enlightenment philosophy",
      "Investigate his role in popularizing Newton's scientific ideas in France"
    ]
  },
  science: {
    bulletPoints: [
      "Research the impact of the Royal Society on scientific progress",
      "Explore how Bacon's scientific method influenced enlightenment thinking",
      "Examine Newton's contribution to physics and mathematics",
      "Consider how scientific progress challenged religious authority",
      "Investigate the role of scientific academies across Europe",
      "Look at how scientific discoveries influenced enlightenment philosophy"
    ]
  },
  politics: {
    bulletPoints: [
      "Analyze Montesquieu's theory of separation of powers",
      "Examine how Enlightenment ideas influenced the American and French Revolutions",
      "Consider Locke's theories of natural rights and their political impact",
      "Look at Rousseau's ideas about the social contract",
      "Explore how enlightenment concepts shaped modern democracy",
      "Investigate how different countries implemented enlightenment political ideas"
    ]
  },
  empty: {
    bulletPoints: [
      "Start by defining the scope of your research paper",
      "Consider which enlightenment thinkers you want to focus on",
      "Think about the timeline you want to cover in your paper",
      "Determine if you want to focus on philosophical, political, or cultural aspects",
      "Research some primary sources you could incorporate",
      "Consider the long-term impact of the Enlightenment on modern society"
    ]
  }
};

// Mock web search results as fallback
const mockWebSearchResults: WebSearchResult[] = [
  {
    title: "The Stanford Encyclopedia of Philosophy: The Enlightenment",
    url: "https://plato.stanford.edu/entries/enlightenment/",
    description: "A comprehensive academic resource on the Enlightenment period. Includes detailed analysis of major thinkers and their contributions to philosophy, science, and political thought."
  },
  {
    title: "Enlightenment and Revolution - History.com",
    url: "https://www.history.com/topics/enlightenment-and-revolution",
    description: "An overview of how Enlightenment ideas influenced revolutions across Europe and the Americas. Explores the connection between philosophical concepts and practical political changes."
  },
  {
    title: "The Age of Enlightenment: A History of European Thought - Oxford University Press",
    url: "https://global.oup.com/academic/product/the-age-of-enlightenment-9780198735830",
    description: "This scholarly work examines the intellectual, social, and political developments during the Enlightenment era. It analyzes how new ideas about reason, science, and human rights transformed European society."
  }
];

/**
 * Generate brainstorming bullet points based on a note and document context
 * Makes API calls to our server endpoint which securely handles OpenAI API requests
 * Falls back to mock data if there's an error
 */
export async function generateBrainstormIdeas(request: BrainstormRequest): Promise<BrainstormResponse> {
  console.log("Generating brainstorm ideas for:", request);
  
  try {
    // Make a request to our server API endpoint
    const response = await fetch('/api/brainstorm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log("Brainstorm Response:", data);
    // Check if the API returned an error
    if (data.error) {
      console.error("API returned an error:", data.error);
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error("Error generating brainstorm ideas:", error);
    console.warn("Falling back to mock data...");
    
    // Fall back to mock data in case of an error
    const lowerContent = request.noteContent.toLowerCase();
  
    if (!request.noteContent.trim()) {
      return mockBrainstormResponses.empty;
    } else if (lowerContent.includes('voltaire')) {
      return mockBrainstormResponses.voltaire;
    } else if (lowerContent.includes('science') || lowerContent.includes('newton') || lowerContent.includes('experiment')) {
      return mockBrainstormResponses.science;
    } else if (lowerContent.includes('politic') || lowerContent.includes('government') || lowerContent.includes('revolution')) {
      return mockBrainstormResponses.politics;
    }
    
    return mockBrainstormResponses.default;
  }
}

/**
 * Perform a web search to find relevant sources based on a note and document context
 * Makes API calls to our server endpoint which securely handles OpenAI API requests
 * Falls back to mock data if there's an error
 */
export async function performWebSearch(request: WebSearchRequest): Promise<WebSearchResponse> {
  console.log("Performing web search for:", request);
  
  try {
    // Make a request to our server API endpoint
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the API returned an error
    if (data.error) {
      console.error("API returned an error:", data.error);
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error("Error performing web search:", error);
    console.warn("Falling back to mock data...");
    
    // Fall back to mock data in case of an error
    return { webResults: mockWebSearchResults };
  }
}

// This will be used to get the current document context
// In a real implementation, this would need to be connected to
// the actual document editor content
export function getDocumentContext(): string {
  return "The Age of Enlightenment, also known as the Age of Reason, was an intellectual and philosophical movement that dominated the world of ideas in Europe during the 17th and 18th centuries.";
}

// This will be used to get the document goal
// In a real implementation, this would be stored with the document
export function getDocumentGoal(): string {
  // Get the document goal from localStorage
  if (typeof window !== 'undefined') {
    const storedGoal = window.localStorage.getItem('document-goal');
    if (storedGoal) {
      try {
        return JSON.parse(storedGoal);
      } catch (e) {
        console.error('Error parsing document goal from localStorage', e);
      }
    }
  }
  
  // Fallback to default goal
  return "Research paper on the enlightenment";
} 
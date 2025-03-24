"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { UploadCloud, X, FileText, Plus, Save, Sparkles, Edit, Loader2, Search, Link, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/lib/useLocalStorage"
import { generateBrainstormIdeas, getDocumentContext, getDocumentGoal, performWebSearch } from "@/lib/ai-service"

interface WebSearchResult {
  title: string;
  url: string;
  description: string;
}

interface Note {
  id: string
  content: string
  isEditing: boolean
  brainstormBullets?: string[]
  isLoadingAI?: boolean
  webResults?: WebSearchResult[]
  isSearchingWeb?: boolean
}

interface ComposerProps {
  onExpandChange?: (expanded: boolean) => void
  documentContent?: string
  documentGoal?: string
}

export default function Composer({ onExpandChange, documentContent, documentGoal }: ComposerProps) {
  // Separate current note state from saved notes
  const [currentNote, setCurrentNote] = useState("")
  const [isProcessingCurrent, setIsProcessingCurrent] = useState({
    isLoadingAI: false,
    isSearchingWeb: false
  })
  
  // Previously saved notes
  const [savedNotes, setSavedNotes] = useLocalStorage<Note[]>("composer-notes", [])
  
  // Other existing state
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [tempNoteContents, setTempNoteContents] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  useEffect(() => {
    console.log("Current notes state:", savedNotes);
  }, [savedNotes]);

  const processFiles = useCallback((files: FileList | File[]) => {
    if (!files || files.length === 0) return

    // Process each file
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const newNote: Note = {
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: event.target.result as string,
            isEditing: false
          }
          setSavedNotes(prev => [...prev, newNote])
        }
      }
      reader.readAsText(file)
    })
  }, [setSavedNotes])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    processFiles(files!)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    processFiles(files)
  }, [processFiles])

  const handleAddNote = async () => {
    if (!currentNote.trim()) return;
    
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: currentNote,
      isEditing: false
    };
    
    setSavedNotes(prev => [newNote, ...prev]); // Add to beginning of list
    setCurrentNote(""); // Clear the input
    setIsProcessingCurrent({
      isLoadingAI: false,
      isSearchingWeb: false
    });
  };

  const handleAnalyzeCurrentWithAI = async () => {
    if (!currentNote.trim()) return;
    
    setIsProcessingCurrent(prev => ({ ...prev, isLoadingAI: true }));
    
    try {
      // Make both API calls in parallel
      const [brainstormResponse, searchResponse] = await Promise.all([
        generateBrainstormIdeas({
          documentContext: documentContent || "",
          documentGoal: documentGoal || "",
          noteContent: currentNote
        }),
        performWebSearch({
          documentContext: documentContent || "",
          documentGoal: documentGoal || "",
          noteContent: currentNote
        })
      ]);
      
      // Create new note with both AI analysis and web results
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: currentNote,
        isEditing: false,
        brainstormBullets: brainstormResponse.bulletPoints,
        webResults: searchResponse.webResults
      };
      setSavedNotes(prev => [newNote, ...prev]);
      setCurrentNote("");
    } catch (error) {
      console.error("Error processing with AI:", error);
      
      // Create note with error state
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: currentNote,
        isEditing: false,
        brainstormBullets: [
          "Sorry, there was an error generating ideas.",
          "Please try again in a moment."
        ],
        webResults: [{
          title: "Error occurred",
          url: "#",
          description: "Sorry, there was an error searching the web. Please try again in a moment."
        }]
      };
      
      setSavedNotes(prev => [newNote, ...prev]);
    } finally {
      setIsProcessingCurrent(prev => ({ ...prev, isLoadingAI: false }));
    }
  };

  const handleSearchCurrentWeb = async () => {
    if (!currentNote.trim()) return;
    
    setIsProcessingCurrent(prev => ({ ...prev, isSearchingWeb: true }));
    
    try {
      const response = await performWebSearch({
        documentContext: documentContent || "",
        documentGoal: documentGoal || "",
        noteContent: currentNote
      });
      
      // Create new note with web results
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: currentNote,
        isEditing: false,
        webResults: response.webResults
      };
      
      setSavedNotes(prev => [newNote, ...prev]);
      setCurrentNote("");
    } catch (error) {
      console.error("Error searching web:", error);
    } finally {
      setIsProcessingCurrent(prev => ({ ...prev, isSearchingWeb: false }));
    }
  };

  const handleToggleComposer = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartEditing = (id: string) => {
    // First find the note content
    const note = savedNotes.find(n => n.id === id);
    if (note) {
      // Initialize the temp content for this specific note
      setTempNoteContents(prev => ({
        ...prev,
        [id]: note.content
      }))
      
      // Mark this note as being edited
      setSavedNotes(prev => 
        prev.map(n => 
          n.id === id ? { ...n, isEditing: true } : n
        )
      );
    }
  };

  const handleNoteContentChange = (id: string, content: string) => {
    // Update only this note's temporary content
    setTempNoteContents(prev => ({
      ...prev,
      [id]: content
    }))
  }

  const handleSaveNote = (id: string) => {
    const content = tempNoteContents[id] || ""
    setSavedNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, content, isEditing: false } : note
      )
    );
    
    // Clean up the temp content for this note
    setTempNoteContents(prev => {
      const newContents = {...prev}
      delete newContents[id]
      return newContents
    })
  };

  const handleCancelEditing = (id: string) => {
    setSavedNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, isEditing: false } : note
      )
    );
    
    // Clean up the temp content for this note
    setTempNoteContents(prev => {
      const newContents = {...prev}
      delete newContents[id]
      return newContents
    })
  };

  const handleAnalyzeWithAI = async (id: string) => {
    // Set loading state for this note
    setSavedNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, isLoadingAI: true } : note
      )
    );
    
    try {
      // Get note content - either from temp content if editing, or from saved content
      const note = savedNotes.find(n => n.id === id);
      if (!note) return;
      
      const noteContent = note.isEditing ? (tempNoteContents[id] || "") : note.content;
      
      // Don't process empty notes
      if (!noteContent.trim()) {
        setSavedNotes(prev => 
          prev.map(note => 
            note.id === id ? { 
              ...note, 
              isLoadingAI: false,
              brainstormBullets: [
                "Please add some content to your note first.",
                "The AI needs something to work with!"
              ]
            } : note
          )
        );
        return;
      }
      
      // Use the documentContent and documentGoal props if provided, otherwise use the helper functions
      const context = documentContent || getDocumentContext();
      const goal = documentGoal || getDocumentGoal();
      
      // Call the AI service
      const response = await generateBrainstormIdeas({
        documentContext: context,
        documentGoal: goal,
        noteContent
      });
            
      // Update the note with brainstorm bullets
      setSavedNotes(prev => {
        const updatedNotes = prev.map(note => 
          note.id === id ? { 
            ...note, 
            brainstormBullets: response.bulletPoints,
            isLoadingAI: false
          } : note
        );
        return updatedNotes;
      });
    } catch (error) {
      console.error("Error analyzing with AI:", error);
      
      // Set error state with a user-friendly message
      setSavedNotes(prev => 
        prev.map(note => 
          note.id === id ? { 
            ...note, 
            isLoadingAI: false,
            brainstormBullets: [
              "Sorry, there was an error generating ideas.",
              "Please try again in a moment.",
              "If the problem persists, check your API key configuration."
            ]
          } : note
        )
      );
    }
  };

  const handleSearchWeb = async (id: string) => {
    // Set searching state for this note
    setSavedNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, isSearchingWeb: true } : note
      )
    );
    
    try {
      // Get note content - either from temp content if editing, or from saved content
      const note = savedNotes.find(n => n.id === id);
      if (!note) return;
      
      const noteContent = note.isEditing ? (tempNoteContents[id] || "") : note.content;
      
      // Don't search with empty notes
      if (!noteContent.trim()) {
        setSavedNotes(prev => 
          prev.map(note => 
            note.id === id ? { 
              ...note, 
              isSearchingWeb: false,
              webResults: [{
                title: "Note is empty",
                url: "#",
                description: "Please add some content to your note before searching for relevant sources."
              }]
            } : note
          )
        );
        return;
      }
      
      // Use the documentContent and documentGoal props if provided, otherwise use the helper functions
      const context = documentContent || getDocumentContext();
      const goal = documentGoal || getDocumentGoal();
      
      // Call the web search service
      const response = await performWebSearch({
        documentContext: context,
        documentGoal: goal,
        noteContent
      });
            
      // Update the note with search results
      setSavedNotes(prev => {
        const updatedNotes = prev.map(note => 
          note.id === id ? { 
            ...note, 
            webResults: response.webResults,
            isSearchingWeb: false
          } : note
        );
        return updatedNotes;
      });
    } catch (error) {
      console.error("Error searching web:", error);
      
      // Set error state with a user-friendly message
      setSavedNotes(prev => 
        prev.map(note => 
          note.id === id ? { 
            ...note, 
            isSearchingWeb: false,
            webResults: [{
              title: "Error occurred",
              url: "#",
              description: "Sorry, there was an error searching the web. Please try again in a moment."
            }]
          } : note
        )
      );
    }
  };

  // Function to clear AI brainstorm results
  const handleClearBrainstorm = (id: string) => {
    setSavedNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, brainstormBullets: undefined } : note
      )
    );
  };

  // Function to clear web search results
  const handleClearWebResults = (id: string) => {
    setSavedNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, webResults: undefined } : note
      )
    );
  };

  return (
    <div className={cn(
      "h-full rounded-lg transition-all duration-300 ease-in-out overflow-hidden",
      isExpanded ? "w-full" : "flex items-center justify-center"
    )}>
      {isExpanded ? (
        <div className="flex flex-col h-full bg-[#FFFCF5]">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Notes</h3>
              <button 
                onClick={() => {
                  // Create a note with pre-filled content
                  const newNoteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  const newNote: Note = {
                    id: newNoteId,
                    content: "I'm thinking about the influence of Voltaire on political thought.",
                    isEditing: false,
                    brainstormBullets: [
                      "Integration: Connect Voltaire's criticism of religious intolerance to your document's exploration of Enlightenment values",
                      "Expand: Examine how Voltaire's satirical works challenged political systems",
                      "Expand: Consider Voltaire's relationship with European monarchs like Frederick the Great",
                      "Alternative: Some scholars argue Voltaire was more conservative than revolutionary", 
                      "Source: Stanford Encyclopedia of Philosophy: Voltaire (https://plato.stanford.edu/entries/voltaire/)"
                    ]
                  };
                  setSavedNotes(prev => [...prev, newNote]);
                }}
                className="text-xs text-amber-800 px-1.5 py-0.5 bg-amber-50 rounded hover:bg-amber-100"
              >
                Test AI
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full" 
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full" 
                onClick={handleToggleComposer}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Input Section - Fixed at top */}
          <div className="p-4">
            <textarea
              placeholder="Add a new note..."
              className="w-full min-h-[200px] p-4 text-gray-600 placeholder:text-gray-400 text-base resize-none focus:outline-none"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                onClick={handleAddNote}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-6"
                disabled={!currentNote.trim()}
              >
                Submit
              </Button>
              <Button
                onClick={handleAnalyzeCurrentWithAI}
                className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-6 flex items-center gap-2"
                disabled={isProcessingCurrent.isLoadingAI || !currentNote.trim()}
              >
                {isProcessingCurrent.isLoadingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Submit with AI
              </Button>
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-px bg-gray-200" />

          {/* Saved Notes Section - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {savedNotes.length > 0 ? (
                savedNotes.map((note) => (
                  <div 
                    key={note.id}
                    className="bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="whitespace-pre-wrap text-sm text-gray-800 font-serif leading-relaxed">
                      {note.content}
                    </div>
                    
                    {/* AI Results */}
                    {note.brainstormBullets && (
                      <div className="mt-3 pl-3 border-l-2 border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 text-xs text-blue-700">
                            <Sparkles className="h-3 w-3" />
                            <span className="font-medium">AI Analysis</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 rounded-full hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening edit mode when clicking the clear button
                              handleClearBrainstorm(note.id);
                            }}
                          >
                            <X className="h-2.5 w-2.5 text-blue-700" />
                          </Button>
                        </div>
                        <ul className="space-y-2">
                          {note.brainstormBullets.map((bullet, idx) => {
                            // Determine the type of bullet point based on its prefix
                            let icon = null;
                            let bulletClass = "text-xs leading-tight";
                            let bulletPrefix = "";
                            
                            if (bullet.startsWith("Integration:")) {
                              bulletPrefix = "Integration:";
                              bulletClass += " text-emerald-700";
                              icon = <FileText className="h-3 w-3 text-emerald-600 flex-shrink-0" />;
                            } else if (bullet.startsWith("Expand:")) {
                              // bulletPrefix = "Expand:";
                              bulletClass += " text-blue-700";
                              icon = <Plus className="h-3 w-3 text-blue-600 flex-shrink-0" />;
                            } else if (bullet.startsWith("Relevance:")) {
                              // bulletPrefix = "Relevance:";
                              bulletClass += " text-green-700";
                              icon = <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />;
                            }
                            else if (bullet.startsWith("Source:")) {
                              bulletPrefix = "Source:";
                              bulletClass += " text-purple-700";
                              icon = <Link className="h-3 w-3 text-purple-600 flex-shrink-0" />;
                            } else if (bullet.startsWith("Alternative:")) {
                              // bulletPrefix = "Alternative:";
                              bulletClass += " text-amber-800";
                              icon = <Sparkles className="h-3 w-3 text-amber-700 flex-shrink-0" />;
                            } else {
                              bulletClass += " text-amber-900";
                            }
                            
                            // Remove the prefix from the content
                            const bulletContent = bullet.replace(bulletPrefix, "").trim();
                            
                            return (
                              <li key={idx} className="flex items-start gap-2">
                                {icon && <span className="mt-0.5">{icon}</span>}
                                <span className={bulletClass}>
                                  {bulletPrefix && (
                                    <span className="font-medium">{bulletPrefix.replace(":", "")} </span>
                                  )}
                                  {bulletContent}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {/* Web Results */}
                    {note.webResults && (
                      <div className="mt-3 pl-3 border-l-2 border-purple-200">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 text-xs text-purple-700">
                            <Search className="h-3 w-3" />
                            <span className="font-medium">Web Results</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 rounded-full hover:bg-purple-100"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening edit mode when clicking the clear button
                              handleClearWebResults(note.id);
                            }}
                          >
                            <X className="h-2.5 w-2.5 text-purple-700" />
                          </Button>
                        </div>
                        <ul className="space-y-3">
                          {note.webResults.map((result, idx) => (
                            <li key={idx} className="text-xs">
                              <div className="font-medium text-purple-600">
                                <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {result.title}
                                </a>
                              </div>
                              <div className="text-gray-600 text-[10px] mb-0.5 truncate">
                                {result.url}
                              </div>
                              <div className="text-gray-800 leading-tight">
                                {result.description}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-sm py-6 text-gray-500">
                  <p>No saved notes yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-amber-100 transition-colors"
          onClick={handleToggleComposer}
          title="Expand Composer"
        >
          <FileText className="h-5 w-5 text-black" />
        </Button>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        multiple
        accept=".txt,.md,.html,.css,.js,.ts,.jsx,.tsx,.json"
      />
    </div>
  )
} 
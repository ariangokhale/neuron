"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { UploadCloud, X, FileText, Plus, Save, Sparkles, Edit, Loader2, Search, Link } from "lucide-react"
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
  const [notes, setNotes] = useLocalStorage<Note[]>("composer-notes", [])
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
    console.log("Current notes state:", notes);
  }, [notes]);

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
          setNotes(prev => [...prev, newNote])
        }
      }
      reader.readAsText(file)
    })
  }, [setNotes])

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

  const handleAddNewNote = () => {
    const newNoteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNote: Note = {
      id: newNoteId,
      content: "",
      isEditing: true
    }
    // Initialize empty content for this note
    setTempNoteContents(prev => ({
      ...prev,
      [newNoteId]: ""
    }))
    setNotes(prev => [...prev, newNote])
  }

  const handleDeleteNote = (id: string) => {
    // Clean up the temp content when deleting a note
    setTempNoteContents(prev => {
      const newContents = {...prev}
      delete newContents[id]
      return newContents
    })
    setNotes(prev => prev.filter(note => note.id !== id))
  }

  const handleUpdateNote = (id: string, content: string) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, content } : note
      )
    )
  }

  const handleToggleComposer = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartEditing = (id: string) => {
    // First find the note content
    const note = notes.find(n => n.id === id);
    if (note) {
      // Initialize the temp content for this specific note
      setTempNoteContents(prev => ({
        ...prev,
        [id]: note.content
      }))
      
      // Mark this note as being edited
      setNotes(prev => 
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
    setNotes(prev => 
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
    setNotes(prev => 
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
    setNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, isLoadingAI: true } : note
      )
    );
    
    try {
      // Get note content - either from temp content if editing, or from saved content
      const note = notes.find(n => n.id === id);
      if (!note) return;
      
      const noteContent = note.isEditing ? (tempNoteContents[id] || "") : note.content;
      
      // Don't process empty notes
      if (!noteContent.trim()) {
        setNotes(prev => 
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
      
      console.log("AI Brainstorm Response:", response);
      
      // Update the note with brainstorm bullets
      setNotes(prev => {
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
      setNotes(prev => 
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
    setNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, isSearchingWeb: true } : note
      )
    );
    
    try {
      // Get note content - either from temp content if editing, or from saved content
      const note = notes.find(n => n.id === id);
      if (!note) return;
      
      const noteContent = note.isEditing ? (tempNoteContents[id] || "") : note.content;
      
      // Don't search with empty notes
      if (!noteContent.trim()) {
        setNotes(prev => 
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
      
      console.log("Web Search Response:", response);
      
      // Update the note with search results
      setNotes(prev => {
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
      setNotes(prev => 
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
    setNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, brainstormBullets: undefined } : note
      )
    );
  };

  // Function to clear web search results
  const handleClearWebResults = (id: string) => {
    setNotes(prev => 
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
        <div className="flex flex-col h-full">
          {/* Header with debug button */}
          <div className="flex items-center justify-between bg-white p-2 border-b border-amber-100 shadow-sm">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-black">Notes</h3>
              
              {/* Debug button - to add a test note with AI results */}
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
                  setNotes(prev => [...prev, newNote]);
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
                className="h-6 w-6 rounded-full hover:bg-amber-50" 
                onClick={() => fileInputRef.current?.click()}
                title="Upload File"
              >
                <UploadCloud className="h-3.5 w-3.5 text-black" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-amber-50" 
                onClick={handleToggleComposer}
                title="Collapse"
              >
                <X className="h-3.5 w-3.5 text-black" />
              </Button>
            </div>
          </div>
          
          {/* Notes document area */}
          <div 
            className="flex-1 overflow-y-auto bg-white p-3"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={dropAreaRef}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-amber-50/70 flex items-center justify-center z-10 border border-dashed border-amber-300 rounded">
                <div className="text-center text-black">
                  <UploadCloud className="h-8 w-8 mx-auto mb-2 text-amber-700" />
                  <p className="text-sm">Drop files to upload</p>
                </div>
              </div>
            )}
            
            {/* Notes list in document style */}
            <div className="space-y-2">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div 
                    key={note.id}
                    className="group relative border-b border-amber-100 py-2.5 hover:bg-amber-50/30 transition-colors"
                  >
                    {note.isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full h-16 p-2 text-sm border border-amber-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none font-serif text-black leading-relaxed"
                          value={tempNoteContents[note.id] || ""}
                          onChange={(e) => handleNoteContentChange(note.id, e.target.value)}
                          placeholder="Type your note here..."
                          autoFocus
                        />
                        <div className="flex space-x-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 hover:bg-amber-100 rounded-md px-2 transition-colors"
                            onClick={() => handleAnalyzeWithAI(note.id)}
                            disabled={note.isLoadingAI}
                          >
                            {note.isLoadingAI ? (
                              <Loader2 className="h-3 w-3 text-black animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 text-black" />
                            )}
                            <span className="text-black text-xs">AI</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 hover:bg-amber-100 rounded-md px-2 transition-colors"
                            onClick={() => handleSearchWeb(note.id)}
                            disabled={note.isSearchingWeb}
                          >
                            {note.isSearchingWeb ? (
                              <Loader2 className="h-3 w-3 text-black animate-spin" />
                            ) : (
                              <Search className="h-3 w-3 text-black" />
                            )}
                            <span className="text-black text-xs">Search</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 hover:bg-red-50 rounded-md px-2 transition-colors"
                            onClick={() => handleCancelEditing(note.id)}
                          >
                            <X className="h-3 w-3 text-black" />
                            <span className="text-black text-xs">Cancel</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 hover:bg-amber-100 rounded-md px-2 transition-colors"
                            onClick={() => handleSaveNote(note.id)}
                          >
                            <Save className="h-3 w-3 text-black" />
                            <span className="text-black text-xs">Save</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div 
                          className="whitespace-pre-wrap text-sm text-black font-serif leading-relaxed pr-10"
                          onClick={() => handleStartEditing(note.id)}
                        >
                          {note.content || <span className="text-gray-400 italic text-xs">Empty note - click to edit</span>}
                        </div>
                        
                        {/* AI Brainstorm Results */}
                        {note.brainstormBullets && note.brainstormBullets.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 border-amber-200">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1 text-xs text-amber-700">
                                <Sparkles className="h-3 w-3" />
                                <span className="font-medium">AI Analysis</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full hover:bg-amber-100"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening edit mode when clicking the clear button
                                  handleClearBrainstorm(note.id);
                                }}
                              >
                                <X className="h-2.5 w-2.5 text-amber-700" />
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
                                  bulletPrefix = "Expand:";
                                  bulletClass += " text-blue-700";
                                  icon = <Plus className="h-3 w-3 text-blue-600 flex-shrink-0" />;
                                } else if (bullet.startsWith("Source:")) {
                                  bulletPrefix = "Source:";
                                  bulletClass += " text-purple-700";
                                  icon = <Link className="h-3 w-3 text-purple-600 flex-shrink-0" />;
                                } else if (bullet.startsWith("Alternative:")) {
                                  bulletPrefix = "Alternative:";
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
                        
                        {/* Web Search Results */}
                        {note.webResults && note.webResults.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1 text-xs text-blue-700">
                                <Search className="h-3 w-3" />
                                <span className="font-medium">Web Results</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full hover:bg-blue-100"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening edit mode when clicking the clear button
                                  handleClearWebResults(note.id);
                                }}
                              >
                                <X className="h-2.5 w-2.5 text-blue-700" />
                              </Button>
                            </div>
                            <ul className="space-y-3">
                              {note.webResults.map((result, idx) => (
                                <li key={idx} className="text-xs">
                                  <div className="font-medium text-blue-600">
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
                        
                        {/* Loading States */}
                        {note.isLoadingAI && (
                          <div className="mt-2 pl-3 border-l-2 border-amber-200">
                            <div className="flex items-center gap-2 text-xs text-amber-700">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Generating ideas...</span>
                            </div>
                          </div>
                        )}
                        
                        {note.isSearchingWeb && (
                          <div className="mt-2 pl-3 border-l-2 border-blue-200">
                            <div className="flex items-center gap-2 text-xs text-blue-700">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Searching for sources...</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-amber-100"
                            onClick={() => handleStartEditing(note.id)}
                          >
                            <Edit className="h-3 w-3 text-black" />
                          </Button>
                          {!note.isLoadingAI && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-amber-100"
                              onClick={() => handleAnalyzeWithAI(note.id)}
                              disabled={note.isLoadingAI}
                            >
                              <Sparkles className="h-3 w-3 text-black" />
                            </Button>
                          )}
                          {!note.isSearchingWeb && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-blue-100"
                              onClick={() => handleSearchWeb(note.id)}
                              disabled={note.isSearchingWeb}
                            >
                              <Search className="h-3 w-3 text-black" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-red-100"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <X className="h-3 w-3 text-black" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-sm py-6 text-gray-500">
                  <p>No notes yet</p>
                </div>
              )}
              
              {/* Add note button - minimal version */}
              <button 
                onClick={handleAddNewNote}
                className="w-full flex items-center py-2 hover:bg-amber-50/30 text-black transition-colors border-b border-dashed border-amber-100"
              >
                <div className="flex items-center text-sm text-amber-800">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span>Add note</span>
                </div>
              </button>
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
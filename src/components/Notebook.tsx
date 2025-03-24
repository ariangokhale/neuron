"use client"

import { useRef, useEffect, useState } from "react"
import { Save, Bold, Italic, Underline, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Composer from "./Composer"
import DocumentGoalModal from "./DocumentGoalModal"
import { useLocalStorage } from "@/lib/useLocalStorage"

export default function NotebookEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const lineColor = "bg-amber-700/20"
  const [composerExpanded, setComposerExpanded] = useState(true)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [documentGoal, setDocumentGoal] = useLocalStorage<string>("document-goal", "")
  const [documentContent, setDocumentContent] = useState("")

  // Check if this is the first time loading the document (no goal set)
  useEffect(() => {
    if (!documentGoal) {
      // Show the goal modal on first load
      setIsGoalModalOpen(true)
    }
  }, [documentGoal])

  // Function to get the current document content for AI context
  const getDocumentContent = () => {
    if (editorRef.current) {
      return editorRef.current.innerText || "";
    }
    return "";
  };

  // Update document content whenever the editor changes
  useEffect(() => {
    const updateDocumentContent = () => {
      setDocumentContent(getDocumentContent());
    };

    const editorElement = editorRef.current;
    if (editorElement) {
      // Listen for input events on the editor
      editorElement.addEventListener('input', updateDocumentContent);
      
      // Initial content
      updateDocumentContent();
      
      // Clean up
      return () => {
        editorElement.removeEventListener('input', updateDocumentContent);
      };
    }
  }, []);

  const handleFormat = (command: string) => {
    // TODO: Implement formatting
  }

  const handleSave = () => {
    // TODO: Save the content to the database
  }

  const handleComposerExpandChange = (expanded: boolean) => {
    setComposerExpanded(expanded);
  }

  const handleSaveDocumentGoal = (goal: string) => {
    setDocumentGoal(goal);
  }

  useEffect(() => {
    // Initialize empty editor
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
      editorRef.current.focus()
    }
  }, [])

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <div className="flex h-full">
        {/* Main content area - shifted left to make room for Composer */}
        <div className={`transition-all duration-300 ${composerExpanded ? 'w-[60%]' : 'w-[calc(100%-80px)]'} pr-4`}>
          <div className="max-w-3xl mx-auto flex flex-col">
            {/* Floating toolbar */}
            <div className="flex items-center justify-between mb-2 px-4 sticky top-4 z-10">
              {documentGoal && (
                <div className="text-sm text-amber-800 font-medium bg-amber-50/80 px-3 py-1.5 rounded-md shadow-sm backdrop-blur-sm">
                  <span className="opacity-70">Working on:</span> {documentGoal}
                </div>
              )}
              <div className="flex items-center gap-2 bg-stone-100/80 backdrop-blur-sm p-2 rounded-lg shadow-sm">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFormat('bold')}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFormat('italic')}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFormat('underline')}>
                  <Underline className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="gap-1" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 ml-2" 
                  onClick={() => setIsGoalModalOpen(true)}
                  title="Document Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Paper */}
            <div className="bg-amber-50 rounded-lg shadow-md relative overflow-hidden border border-amber-100">
              {/* Horizontal lines */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(100)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-full h-[1px] ${lineColor}`} 
                    style={{ 
                      top: `${(i + 1) * 24}px`,
                      boxShadow: '0 0 0 0.1px rgba(146, 64, 14, 0.1)' 
                    }} 
                  />
                ))}
              </div>

              {/* Margin line */}
              <div className={`absolute top-0 bottom-0 left-16 w-[0.5px] ${lineColor}`} />

              {/* Editor */}
              <div
                ref={editorRef}
                contentEditable
                className="w-full h-[600px] bg-transparent p-6 pt-6 pl-20 focus:outline-none text-stone-800 font-serif leading-6"
                style={{ lineHeight: "24px" }}
              />

              {/* Corner fold */}
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-amber-100 border-r-amber-50" />
            </div>
          </div>
        </div>

        {/* Composer section - fixed on the right */}
        <div className={`transition-all duration-300 ${composerExpanded ? 'w-[40%]' : 'w-[60px]'} fixed right-4 top-6 bottom-6`}>
          <div className="h-full bg-amber-50 rounded-lg shadow-md border border-amber-200 overflow-hidden">
            <Composer 
              onExpandChange={handleComposerExpandChange} 
              documentContent={documentContent}
              documentGoal={documentGoal}
            />
          </div>
        </div>
      </div>

      {/* Document Goal Modal */}
      <DocumentGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveDocumentGoal}
      />
    </div>
  )
}

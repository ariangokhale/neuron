"use client"

import { useRef, useEffect } from "react"
import { Save, Bold, Italic, Underline } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotebookEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const lineColor = "bg-amber-700/20"

  const handleFormat = (command: string) => {
    // TODO: Implement formatting
  }

  const handleSave = () => {
    // TODO: Save the content to the database
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
      <div className="w-full max-w-4xl mx-auto flex flex-col">
        {/* Floating toolbar */}
        <div className="flex items-center justify-end mb-2 px-4 sticky top-4 z-10">
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
  )
}

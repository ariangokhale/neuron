"use client"

import { useRef } from "react"
import { Save, Bold, Italic, Underline } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotebookEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const lineColor = "bg-amber-700/40"

  const handleFormat = (command: string) => {
    document.execCommand(command, false)
  }

  const handleSave = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      localStorage.setItem('notebook-content', content)
    }
  }

  // Load saved content on initial render
  useRef(() => {
    const savedContent = localStorage.getItem('notebook-content')
    if (savedContent && editorRef.current) {
      editorRef.current.innerHTML = savedContent
    }
  }, [])

  return (
    <div className="min-h-screen bg-stone-100 p-6 flex justify-center">
      <div className="w-full max-w-4xl flex flex-col">
        {/* Notebook header with controls */}
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

        {/* Notebook container */}
        <div className="flex">
          {/* Paper */}
          <div className="flex-1 bg-amber-50 rounded-lg shadow-md relative overflow-hidden border border-amber-200 min-h-[calc(100vh-8rem)]">
            {/* Paper texture overlay */}
            <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=600')] opacity-5 pointer-events-none"></div>

            {/* Horizontal lines - now dynamically generated based on height */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(100)].map((_, i) => (
                <div key={i} className={`w-full h-[1px] ${lineColor}`} style={{ top: `${(i + 1) * 24}px` }} />
              ))}
            </div>

            {/* Vertical line */}
            <div className={`absolute top-0 bottom-0 left-16 w-[1px] ${lineColor} pointer-events-none`} />

            {/* Contenteditable div */}
            <div
              ref={editorRef}
              contentEditable
              className="w-full min-h-[calc(100vh-8rem)] bg-transparent p-6 pt-6 pl-20 focus:outline-none text-stone-800 font-serif leading-6"
              style={{ lineHeight: "24px" }}
            />

            {/* Page corner fold */}
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-amber-200 border-r-amber-50 shadow-md pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}

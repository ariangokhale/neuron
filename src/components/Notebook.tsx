"use client"

import { useRef, useEffect, useState } from "react"
import { Save, Bold, Italic, Underline, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Composer from "./Composer"
import DocumentEditor from "./DocumentEditor"
import { useLocalStorage } from "@/lib/useLocalStorage"

export default function NotebookEditor() {
  const [composerExpanded, setComposerExpanded] = useState(true)
  const [documentGoal, setDocumentGoal] = useLocalStorage<string>("document-goal", "")
  const [documentContent, setDocumentContent] = useState("")

  const handleComposerExpandChange = (expanded: boolean) => {
    setComposerExpanded(expanded);
  }

  return (
    <div className="min-h-screen bg-stone-100 p-6 space-y-6">
      {/* Document Goal Input */}
      <div className="flex items-center gap-3">
        <span className="text-gray-600 font-medium">Working on:</span>
        <input
          type="text"
          placeholder="e.g., Research paper on climate change"
          value={documentGoal}
          onChange={(e) => setDocumentGoal(e.target.value)}
          className="w-[50%] p-2 text-gray-600 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
        />
      </div>

      <div className="flex h-full">
        {/* Composer section - now scrolls normally */}
        <div className={`transition-all duration-300 ${composerExpanded ? 'w-[40%]' : 'w-[60px]'}`}>
          <div className="h-full bg-amber-50 rounded-lg shadow-md border border-amber-200 overflow-hidden">
            <Composer 
              onExpandChange={handleComposerExpandChange} 
              documentContent={documentContent}
              documentGoal={documentGoal}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className={`transition-all duration-300 ${composerExpanded ? 'w-[60%]' : 'w-[calc(100%-80px)]'} pl-4`}>
          <DocumentEditor 
            documentGoal={documentGoal}
            onContentChange={setDocumentContent}
            onOpenSettings={() => {}} // Remove settings functionality
          />
        </div>
      </div>
    </div>
  )
}

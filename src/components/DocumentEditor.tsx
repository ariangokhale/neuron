"use client"

import { useRef, useEffect } from "react"
import { 
  Save, 
  Bold, 
  Italic, 
  Underline, 
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface DocumentEditorProps {
  documentGoal?: string
  onContentChange: (content: string) => void
  onOpenSettings: () => void
}

export default function DocumentEditor({ documentGoal, onContentChange, onOpenSettings }: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Update document content whenever the editor changes
  useEffect(() => {
    const updateDocumentContent = () => {
      if (editorRef.current) {
        onContentChange(editorRef.current.innerText || "");
      }
    };

    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('input', updateDocumentContent);
      
      // Initial content
      updateDocumentContent();
      
      // Clean up
      return () => {
        editorElement.removeEventListener('input', updateDocumentContent);
      };
    }
  }, [onContentChange]);

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
    <div className="max-w-4xl mx-auto flex flex-col">
      {/* Toolbar */}
      <div className="bg-white rounded-t-lg shadow-sm border border-gray-200">
        <div className="flex items-center h-12 px-3 gap-1">
          {/* Text formatting group */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded">
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* Alignment group */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded">
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* List group */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded">
              <List className="h-4 w-4" />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded"
              onClick={onOpenSettings}
              title="Document Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-lg">
        <div
          ref={editorRef}
          contentEditable
          className="w-full min-h-[calc(100vh-12rem)] p-8 focus:outline-none text-gray-800 font-serif text-base"
          style={{ lineHeight: "1.5" }}
        />
      </div>

      {/* Document goal indicator */}
      {documentGoal && (
        <div className="mt-4 text-sm text-gray-600 px-2">
          <span className="font-medium">Working on:</span> {documentGoal}
        </div>
      )}
    </div>
  )
} 
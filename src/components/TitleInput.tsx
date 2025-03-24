"use client"

import { useRef } from "react"

interface TitleInputProps {
  onSave?: (content: string) => void
}

export default function TitleInput({ onSave }: TitleInputProps) {
  const titleRef = useRef<HTMLDivElement>(null)

  const handleBlur = () => {
    if (titleRef.current && onSave) {
      onSave(titleRef.current.innerHTML)
    }
  }

  return (
    <div className="mb-4 flex items-start">
      <div
        ref={titleRef}
        contentEditable
        onBlur={handleBlur}
        className="bg-amber-50 p-3 rounded-lg shadow-sm border border-amber-100 
          min-w-[300px] min-h-[60px] focus:outline-none text-stone-800 font-serif
          empty:before:content-['Type_your_title_here...'] empty:before:text-stone-400 
          empty:before:pointer-events-none"
      />
    </div>
  )
} 
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DocumentGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (goal: string) => void
}

export default function DocumentGoalModal({ isOpen, onClose, onSave }: DocumentGoalModalProps) {
  const [goal, setGoal] = useState("")

  const handleSave = () => {
    if (goal.trim()) {
      onSave(goal.trim())
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Document Goal</DialogTitle>
          <DialogDescription>
            Describe what you're working on. This helps our AI better understand your context.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="goal">Document Goal</Label>
            <Input
              id="goal"
              placeholder="e.g., Research paper on the enlightenment"
              value={goal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoal(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Examples: "Research paper on climate change", "Novel outline for sci-fi story", "Lecture notes on quantum physics"
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
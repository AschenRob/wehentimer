import { useState } from 'react'
import { Milk, Ruler } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FeedingForm } from '@/components/FeedingForm'
import { MeasurementForm } from '@/components/MeasurementForm'
import type { FeedingDraft } from '@/types/feeding'

interface AddEntryButtonProps {
  lastWeight: number
  lastHeight: number
  onSubmit: (draft: FeedingDraft) => Promise<unknown>
}

/** Plus-Button: fragt zuerst, ob eine Mahlzeit oder nur Größe/Gewicht erfasst werden soll. */
export function AddEntryButton({ lastWeight, lastHeight, onSubmit }: AddEntryButtonProps) {
  const [isChooserOpen, setIsChooserOpen] = useState(false)
  const [isMealOpen, setIsMealOpen] = useState(false)
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false)

  function choose(kind: 'meal' | 'measurement') {
    setIsChooserOpen(false)
    if (kind === 'meal') setIsMealOpen(true)
    else setIsMeasurementOpen(true)
  }

  return (
    <>
      <Button
        size="icon"
        className="size-10 rounded-full"
        aria-label="Eintrag hinzufügen"
        onClick={() => setIsChooserOpen(true)}
      >
        <span className="text-xl leading-none">+</span>
      </Button>

      <Dialog open={isChooserOpen} onOpenChange={setIsChooserOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Was möchtest du erfassen?</DialogTitle>
            <DialogDescription>
              Größe und Gewicht lassen sich auch ohne Mahlzeit eintragen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => choose('meal')}
            >
              <Milk className="size-7" />
              Mahlzeit
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => choose('measurement')}
            >
              <Ruler className="size-7" />
              Größe / Gewicht
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <FeedingForm
        mode="create"
        lastWeight={lastWeight}
        lastHeight={lastHeight}
        open={isMealOpen}
        onOpenChange={setIsMealOpen}
        onSubmit={onSubmit}
      />
      <MeasurementForm
        mode="create"
        lastWeight={lastWeight}
        lastHeight={lastHeight}
        open={isMeasurementOpen}
        onOpenChange={setIsMeasurementOpen}
        onSubmit={onSubmit}
      />
    </>
  )
}

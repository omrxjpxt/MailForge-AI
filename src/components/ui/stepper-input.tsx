import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface StepperInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'min' | 'max' | 'step'> {
  min?: number | string
  max?: number | string
  step?: number | string
}

export const StepperInput = React.forwardRef<HTMLInputElement, StepperInputProps>(
  ({ className, min = 0, max, step = 1, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const minVal = Number(min)
    const maxVal = max !== undefined ? Number(max) : undefined
    const stepVal = Number(step)

    // Merge refs so react-hook-form's register can still attach to the input
    const setRefs = React.useCallback(
      (node: HTMLInputElement) => {
        inputRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
      },
      [ref]
    )

    const updateNativeValue = (newValue: number) => {
      if (inputRef.current) {
        // Native setter bypasses React's value setter so that a true change event is triggered for react-hook-form
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set
        nativeInputValueSetter?.call(inputRef.current, newValue)
        
        const ev = new Event("input", { bubbles: true })
        inputRef.current.dispatchEvent(ev)
      }
    }

    const handleIncrement = (e: React.MouseEvent) => {
      e.preventDefault()
      const current = inputRef.current?.value ? Number(inputRef.current.value) : minVal
      const newValue = maxVal !== undefined ? Math.min(current + stepVal, maxVal) : current + stepVal
      updateNativeValue(newValue)
    }

    const handleDecrement = (e: React.MouseEvent) => {
      e.preventDefault()
      const current = inputRef.current?.value ? Number(inputRef.current.value) : minVal
      const newValue = Math.max(current - stepVal, minVal)
      updateNativeValue(newValue)
    }

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <Input
          type="number"
          ref={setRefs}
          className={cn("pr-20", className)}
          min={min}
          max={max}
          step={step}
          {...props}
        />
        <div className="absolute right-1 top-1 bottom-1 flex items-center border border-border rounded-md overflow-hidden bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full w-8 rounded-none border-r border-border hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={handleDecrement}
            tabIndex={-1}
          >
            <Minus className="h-3 w-3" />
            <span className="sr-only">Decrease</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full w-8 rounded-none hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={handleIncrement}
            tabIndex={-1}
          >
            <Plus className="h-3 w-3" />
            <span className="sr-only">Increase</span>
          </Button>
        </div>
      </div>
    )
  }
)
StepperInput.displayName = "StepperInput"

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
}

interface PopoverContextProps {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}

const PopoverContext = React.createContext<PopoverContextProps | undefined>(undefined)

function usePopoverContext() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("usePopoverContext must be used within a Popover")
  }
  return context
}

const Popover = ({ children }: PopoverProps) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ onClick, children, asChild, ...props }, forwardedRef) => {
    const { setOpen, open, triggerRef } = usePopoverContext()
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(!open)
      onClick?.(e)
    }

    const ref = React.useCallback(
      (node: HTMLButtonElement | null) => {
        if (node) {
          // @ts-ignore
          triggerRef.current = node
        }
        // Pass the node to the forwarded ref if it exists
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef, triggerRef]
    )

    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement
      return React.cloneElement(child, {
        ref,
        onClick: handleClick,
        ...props,
      })
    }

    return (
      <button
        type="button"
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)

PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => {
    const { open, triggerRef } = usePopoverContext()
    const [position, setPosition] = React.useState({ top: 0, left: 0 })
    const internalRef = React.useRef<HTMLDivElement>(null)

    // Forward the internal ref to the provided ref
    React.useImperativeHandle(ref, () => internalRef.current as HTMLDivElement)

    React.useEffect(() => {
      // Only run this effect when the popover is open
      if (!open || !triggerRef.current) return;
      
      // Use requestAnimationFrame to ensure the content is rendered before measuring
      const frameId = requestAnimationFrame(() => {
        // Check both refs are valid before proceeding
        if (!internalRef.current || !triggerRef.current) return;
        
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = internalRef.current.getBoundingClientRect();
        
        let top = triggerRect.bottom + sideOffset;
        let left = triggerRect.left;
        
        if (align === "center") {
          left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
        } else if (align === "end") {
          left = triggerRect.right - contentRect.width;
        }
        
        // Make sure the popover doesn't go off screen
        if (left < 10) left = 10;
        if (left + contentRect.width > window.innerWidth - 10) {
          left = window.innerWidth - contentRect.width - 10;
        }
        
        // Check if popover goes below viewport and reposition if needed
        if (top + contentRect.height > window.innerHeight - 10) {
          // Position above the trigger instead
          top = triggerRect.top - contentRect.height - sideOffset;
        }
        
        setPosition({ top, left });
      });
      
      return () => cancelAnimationFrame(frameId);
    }, [open, triggerRef, align, sideOffset])
    
    if (!open) return null
    
    return (
      <div
        ref={internalRef}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 50
        }}
        className={cn(
          "w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
          className
        )}
        {...props}
      />
    )
  }
)

PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }

"use client"

import * as React from "react"
import { VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

interface ToggleGroupContextType extends VariantProps<typeof toggleVariants> {
  type?: "single" | "multiple"
  value?: string | string[]
  onValueChange?: (itemValue: string, pressed: boolean) => void
}

const ToggleGroupContext = React.createContext<ToggleGroupContextType>({
  size: "default",
  variant: "default",
})

interface ToggleGroupProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toggleVariants> {
  type?: "single" | "multiple"
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  disabled?: boolean
}

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  ToggleGroupProps
>(({ className, variant, size, children, type = "single", value, onValueChange, ...props }, ref) => {
  const [selectedValue, setSelectedValue] = React.useState<string | string[]>(value || (type === "multiple" ? [] : ""))

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  const internalHandleValueChange = React.useCallback((itemValue: string, pressed: boolean) => {
    let newValue: string | string[];

    if (type === "single") {
      newValue = pressed ? itemValue : ""
    } else {
      const currentValues = Array.isArray(selectedValue) ? selectedValue : []
      if (pressed) {
        newValue = [...currentValues, itemValue]
      } else {
        newValue = currentValues.filter((v) => v !== itemValue)
      }
    }

    setSelectedValue(newValue)
    if (onValueChange) onValueChange(newValue)
  }, [type, selectedValue, onValueChange])

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, type, value: selectedValue, onValueChange: internalHandleValueChange }}>
        {children}
      </ToggleGroupContext.Provider>
    </div>
  )
})

ToggleGroup.displayName = "ToggleGroup"

interface ToggleGroupItemProps 
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onChange">,
    VariantProps<typeof toggleVariants> {
  value: string
}

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ className, children, variant, size, value, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  
  const isSelected = React.useMemo(() => {
    if (!context.value) return false
    return Array.isArray(context.value) 
      ? context.value.includes(value)
      : context.value === value
  }, [context.value, value])

  const handlePress = React.useCallback((pressed: boolean) => {
    if (context.onValueChange) {
      context.onValueChange(value, pressed)
    }
  }, [value, context.onValueChange])

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? "on" : "off"}
      data-value={value}
      className={cn(
        toggleVariants({
          variant: variant || context.variant,
          size: size || context.size,
        }),
        className
      )}
      onClick={() => handlePress(!isSelected)}
      {...props}
    >
      {children}
    </button>
  )
})

ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }

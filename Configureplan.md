# Output Configuration Implementation Plan

## Overview
This plan outlines the steps to implement the Output Configuration tab in the Report Generator with the following features:
- Text field input box for "How do you want this formatted?"
- Mic icon to dictate format
- Add up to 7 output fields via "+" button
- RAG Generation submit button that leads to the Generate tab

## Implementation Steps

### 1. Component Structure
- [x] Create a dedicated OutputConfigTab component
- [x] Design the layout with responsive considerations
- [x] Implement state management for configuration options

### 2. Text Field Input Implementation
- [x] Create a text field component for format input
- [x] Add placeholder text "How do you want this formatted?"
- [x] Implement onChange handlers to update state
- [x] Add validation for input format

### 3. Microphone Dictation Feature
- [x] Implement microphone button component
- [x] Connect to browser's Speech Recognition API
- [x] Create start/stop dictation functionality
- [x] Add visual indicator for active recording
- [x] Implement error handling for unsupported browsers

### 4. Dynamic Output Fields
- [x] Create a field component with input and type selection
- [x] Implement "+" button to add new fields (up to 7 max)
- [x] Add removal functionality for each field
- [x] Implement field validation
- [x] Add field type selector (text, number, date, etc.)

### 5. RAG Generation Button
- [x] Create a submit button component
- [x] Implement onClick handler to validate and process configuration
- [x] Add loading state during processing
- [x] Implement navigation to Generate tab on successful submission

### 6. State Management
- [x] Define state structure for output configuration
- [x] Create context provider or use existing context
- [x] Implement state persistence between tab navigation
- [x] Add session storage for configuration data

### 7. Integration with Existing Components
- [x] Connect to the main Report Generator workflow
- [x] Ensure data flows correctly between tabs
- [x] Update session context with configuration data

### 8. Styling and UI Enhancements
- [x] Apply consistent styling with the application theme
- [x] Add animations for field additions/removals
- [x] Implement responsive design for all screen sizes
- [x] Add accessibility features (ARIA labels, keyboard navigation)

### 9. Testing
- [ ] Write unit tests for the component
- [ ] Test edge cases (max fields, empty inputs)
- [ ] Test browser compatibility
- [ ] Perform performance testing

### 10. Documentation
- [ ] Document component API and usage
- [ ] Add inline code comments
- [ ] Update project documentation

## Implementation Details

### Component Structure
```tsx
// OutputConfigTab.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic } from 'lucide-react'
// Additional imports...

interface OutputField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select'
}

interface OutputConfigProps {
  onSave: (config: OutputConfigData) => void
  initialConfig?: OutputConfigData
  onBack: () => void
}

export function OutputConfigTab({ onSave, initialConfig, onBack }: OutputConfigProps) {
  // State management
  const [formatText, setFormatText] = useState(initialConfig?.outputFormat || '')
  const [fields, setFields] = useState<OutputField[]>(initialConfig?.fields || [])
  const [isRecording, setIsRecording] = useState(false)
  
  // Functions for handling fields, dictation, and submission
  // ...
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Output</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Format input with mic button */}
        {/* Dynamic fields */}
        {/* Add field button */}
      </CardContent>
      <CardFooter>
        {/* Back button */}
        {/* Submit button */}
      </CardFooter>
    </Card>
  )
}
```

### Speech Recognition Implementation
```tsx
// Speech recognition functionality
const startDictation = () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      setIsRecording(true)
    }
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setFormatText(prev => prev + ' ' + transcript)
    }
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error)
      setIsRecording(false)
    }
    
    recognition.onend = () => {
      setIsRecording(false)
    }
    
    recognition.start()
  } else {
    alert('Speech recognition is not supported in your browser')
  }
}
```

## Field Format Enhancement Plan

### 1. Update Data Model
- [x] Modify the OutputField interface to include a format property
- [x] Update state initialization to include empty format for each field
- [x] Ensure backward compatibility with existing data

### 2. UI Component Updates
- [x] Redesign the field component to include both name and format inputs
- [x] Add a label for the format input ("How do you want this formatted?")
- [x] Implement proper spacing and layout for the new field structure
- [x] Ensure responsive design for the enhanced field component

### 3. Functionality Implementation
- [x] Create handler function for format text changes
- [x] Add validation for format text input
- [x] Update field addition logic to include format property
- [x] Ensure format data is properly saved with field data

### 4. State Management
- [x] Update the configuration save function to include format data
- [x] Ensure format data is included in session storage
- [x] Implement proper state updates when editing existing fields

### 5. Integration and Testing
- [x] Test the enhanced field component with various inputs
- [x] Verify that format data is properly saved and retrieved
- [x] Test the component in different screen sizes
- [x] Ensure proper error handling for invalid inputs

## UI Refinement Plan

### 1. Remove Initial Format Input and Language Selector
- [x] Remove the initial "How do you want this formatted?" input field
- [x] Remove the language selector component
- [x] Adjust the layout to fill the empty space
- [x] Update the state management to remove these properties

### 2. Add Microphone Button to Each Field
- [x] Add microphone button to each field's format input
- [x] Implement dictation functionality for each field
- [x] Add visual indicators for active recording on each field
- [x] Ensure only one field can record at a time

### 3. Update Validation and State Management
- [x] Update form validation to focus on field-level format inputs
- [x] Modify the configuration save function to handle the new structure
- [x] Ensure backward compatibility with existing data
- [x] Update error handling for field-specific dictation

### 4. Testing and Refinement
- [x] Test microphone functionality on each field
- [x] Verify that dictation works correctly for all fields
- [x] Test the UI layout in different screen sizes
- [x] Ensure proper error handling for all scenarios

## RAG Generation Implementation Plan

### 1. Component Structure
- [x] Create a dedicated GenerateTab component
- [x] Design the layout with accordion-based output display
- [x] Implement state management for generation results

### 2. Accordion Component Implementation
- [x] Create/import Accordion components (using Radix UI)
- [x] Style the accordion to match the design requirements
- [x] Implement animation for accordion expansion/collapse

### 3. RAG Generation Functionality
- [x] Implement "Generate" button to trigger AI output
- [x] Create loading state during generation
- [x] Design output display with field-based sections
- [x] Map each field to its own accordion section

### 4. Refinement Workflow
- [x] Implement text selection highlighting functionality
- [x] Create refinement overlay component
- [x] Add editable prompt for each highlighted section
- [x] Implement "Refine" button for each highlight
- [x] Create "Done" button to confirm all refinements

### 5. Final Actions
- [x] Implement "Copy" functionality for the generated content
- [x] Add "Save for Later" option to store the report
- [x] Ensure re-entry pulls from original uploads
- [x] Implement session reset for new uploads

### 6. State Management
- [x] Create state for generated content
- [x] Implement state for refinements
- [x] Add persistence for generated reports
- [x] Ensure proper state updates during the workflow

### 7. Integration with Existing Components
- [x] Connect to the main Report Generator workflow
- [x] Ensure data flows correctly between tabs
- [x] Update session context with generation results

### 8. Testing and Optimization
- [ ] Test the generation process with various inputs
- [ ] Verify that refinements work correctly
- [ ] Test the component in different screen sizes
- [ ] Optimize performance for large outputs

## Next Steps
After implementing the RAG Generation tab according to this plan, we will need to:
1. Test the component thoroughly
2. Integrate it with the main Report Generator workflow
3. Ensure proper data persistence between sessions
4. Optimize performance for large configurations

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

# RAG Generation Implementation Plan

## Overview
This plan outlines the steps to implement a functional RAG (Retrieval-Augmented Generation) feature for the NDISuite Report Writer. The feature will process uploaded files and audio recordings to generate professional, formatted text based on user queries.

## Implementation Steps

### 1. Create RAG Service Layer

- [x] Create a new service file `ragService.ts` in the services/api directory
- [x] Implement methods to process text from files and transcriptions
- [x] Add error handling and fallback mechanisms
- [x] Create OpenAI integration with proper API key handling

### 2. Update GenerateTab Component

- [x] Modify handleGenerate function to use RAG service
- [x] Implement content processing based on field prompts
- [x] Add loading states and error handling
- [x] Update the UI to display generated content in accordion sections

### 3. Implement Session Integration

- [x] Update session context to store generated content
- [x] Add methods to retrieve and process files from current session
- [x] Implement content saving mechanism
- [x] Ensure persistence of generated content between sessions

### 4. Create Mock RAG Implementation

- [x] Develop fallback generation for development/demo purposes
- [x] Create realistic sample responses for common NDIS queries
- [x] Implement delay simulation for realistic experience
- [x] Add contextual awareness based on uploaded content

### 5. Testing and Refinement

- [ ] Test with various file types and audio recordings
- [ ] Verify accordion display and refinement workflow
- [ ] Ensure proper error handling for edge cases
- [ ] Optimize performance for large documents

## RAG Response Format Improvement Plan

### Overview
This plan outlines the steps to improve the RAG response format by removing introductory fluff and starting directly with the relevant content.

### Implementation Steps

#### 1. Update RAG Service Response Processing

- [x] Modify the `generateMockResponse` method to remove introductory phrases
- [x] Update the response templates to start directly with relevant content
- [x] Add a post-processing function to clean up responses

#### 2. Improve OpenAI Prompt Engineering

- [x] Update the system prompt to specify direct, concise responses
- [x] Add explicit instructions to avoid introductory phrases
- [x] Include examples of desired response format

#### 3. Add Response Cleanup Function

- [x] Create a utility function to remove common fluff phrases
- [x] Implement regex patterns to identify and remove introductory text
- [x] Add safeguards to prevent removing actual content

#### 4. Test and Refine

- [x] Test with various query types
- [x] Verify that responses start with relevant content
- [x] Ensure no important information is lost in cleanup

## Automatic Generation Implementation Plan

### Overview
This plan outlines the steps to automatically start the generation process when transitioning from the Configure tab to the Generate tab, eliminating the need to click the Generate button twice.

## Audio Recording Enhancement Plan

### Overview
This plan outlines the steps to enhance the audio recording functionality by adding a pause/resume button, fixing the timer that's stuck at 2 seconds, and preventing duplicate recordings when stopping the recording.

### Implementation Steps

#### 1. Update Tab Navigation Logic

- [x] Modify the OutputConfigTab component to pass a flag indicating generation should start
- [x] Update the parent component to handle this flag during tab transitions
- [x] Add state to track if automatic generation is pending

#### 2. Enhance GenerateTab Component

- [x] Add useEffect hook to detect when the tab is first mounted
- [x] Trigger the handleGenerate function automatically on initial mount if flag is set
- [x] Add loading state to indicate generation is in progress

#### 3. Improve User Experience

- [x] Add visual feedback during the transition between tabs
- [x] Ensure error handling works properly with automatic generation
- [x] Prevent duplicate generation if user manually clicks Generate button

### Audio Recording Enhancement Implementation Steps

#### 1. Add Pause/Resume Recording Functionality

- [x] Update the `useAudioRecorder` hook to support pausing and resuming recordings
  - [x] Add `isPaused` state to track when recording is paused
  - [x] Implement `pauseRecording` and `resumeRecording` functions
  - [x] Modify the timer to stop incrementing when paused
  - [x] Ensure MediaRecorder state is properly managed during pause/resume

#### 2. Fix Timer Issues

- [x] Debug the timer implementation in `useAudioRecorder` hook
  - [x] Ensure the interval is properly clearing and re-creating
  - [x] Add safeguards to prevent timer from getting stuck
  - [x] Implement a more robust time tracking mechanism
  - [x] Add visual feedback to show timer is actively updating

#### 3. Prevent Duplicate Recordings

- [x] Fix the issue causing duplicate recordings when stopping
  - [x] Ensure `handleRecordingSave` is only called once per recording session
  - [x] Add checks to prevent multiple recordings being added to the session
  - [x] Implement proper cleanup of recording data after saving
  - [x] Add validation to prevent empty or invalid recordings

#### 4. Update UI Components

- [x] Modify the `AudioRecorder` component to include pause/resume button
  - [x] Add a pause button that appears during active recording
  - [x] Update the UI to show paused state visually
  - [x] Ensure proper button state transitions between record/pause/resume/stop
  - [x] Add appropriate icons and tooltips for better usability

#### 5. Testing and Refinement

- [x] Test the recording functionality across different scenarios
  - [x] Verify timer updates correctly during recording
  - [x] Confirm pause/resume works without data loss
  - [x] Ensure no duplicate recordings are created
  - [x] Test with various recording durations

## Transcription Service Enhancement Plan

### Overview
This plan outlines the steps to fix the transcription timeout errors and improve error handling in the transcription service, ensuring more robust audio transcription functionality.

### Implementation Steps

#### 1. Enhance Transcription Service Error Handling

- [x] Improve error handling in the `transcriptionService.ts` file
  - [x] Add network connectivity checks before API calls
  - [x] Implement more robust error classification (network, timeout, API errors)
  - [x] Create more informative error messages with debugging context
  - [x] Add retry mechanism for transient errors

#### 2. Optimize Timeout Handling

- [x] Improve timeout handling in the transcription process
  - [x] Increase timeout duration for larger audio files
  - [x] Implement dynamic timeout based on audio length
  - [x] Add progress indicators during transcription
  - [x] Implement graceful cancellation of pending requests

#### 3. Implement Fallback Mechanisms

- [x] Create more robust fallback mechanisms
  - [x] Implement chunked audio processing for large files
  - [x] Add client-side transcription option using WebSpeech API
  - [x] Create more realistic mock transcriptions based on audio characteristics
  - [x] Preserve partial results if transcription fails mid-process

#### 4. Enhance Error Reporting

- [x] Improve error reporting and user feedback
  - [x] Add detailed logging for transcription errors
  - [x] Implement user-friendly error messages
  - [x] Provide recovery options in the UI
  - [x] Add telemetry for tracking common error patterns

#### 5. Testing and Validation

- [x] Test transcription service across various scenarios
  - [x] Test with different audio durations and formats
  - [x] Simulate network issues and timeouts
  - [x] Verify fallback mechanisms work correctly
  - [x] Ensure error messages are helpful and accurate

## Audio Recording and Transcription Bug Fixes

### Overview
This plan outlines the steps to fix remaining issues with the audio recording and transcription functionality, including empty error objects in console logs, zero recording time values, and timer display problems.

### Implementation Steps

#### 1. Fix Empty Error Objects in Console Logs

- [x] Update error handling in transcription service
  - [x] Modify error catching to properly serialize error objects
  - [x] Ensure all error properties are captured and logged
  - [x] Add error type checking before logging
  - [x] Implement custom error classes for better error identification

#### 2. Fix Recording Time and Duration Issues

- [x] Fix the recording time tracking mechanism
  - [x] Ensure recordingTime is properly updated during recording
  - [x] Add validation to prevent zero duration recordings
  - [x] Implement a minimum recording duration check
  - [x] Fix timing synchronization between components

#### 3. Improve Audio Blob Handling

- [x] Enhance audio blob validation and processing
  - [x] Add comprehensive validation for audio blobs
  - [x] Implement proper error handling for invalid blobs
  - [x] Add diagnostic logging for blob properties
  - [x] Create recovery mechanisms for corrupted audio data

#### 4. Fix Timer Display Issues

- [x] Update the timer display component
  - [x] Ensure timer updates are properly rendered
  - [x] Add visual indicators for timer state
  - [x] Implement fallback for zero recording time
  - [x] Add fallback display for error states

#### 5. Implement End-to-End Testing

- [x] Create comprehensive tests for the recording workflow
  - [x] Test recording, pausing, and stopping
  - [x] Verify transcription with various audio lengths
  - [x] Test error handling and recovery
  - [x] Validate UI feedback during all states

### Completed Fixes

1. **Fixed Empty Error Objects in Console Logs**
   - Implemented a custom `TranscriptionError` class for better error identification
   - Added proper error serialization to ensure all error properties are captured
   - Improved error categorization (network, server, authentication, etc.)
   - Added detailed diagnostic information to error logs

2. **Fixed Recording Time and Duration Issues**
   - Added validation to prevent zero duration recordings
   - Implemented fallback duration estimation based on audio blob size
   - Fixed timer synchronization between components
   - Added logging to track timing issues

3. **Improved Audio Blob Handling**
   - Added comprehensive validation for audio blobs
   - Implemented proper error handling for invalid blobs
   - Added diagnostic logging for blob properties
   - Created recovery mechanisms for corrupted audio data

4. **Fixed Timer Display Issues**
   - Ensured timer updates are properly rendered
   - Added fallback for zero recording time
   - Improved visual feedback during recording states
   - Implemented forced updates for stuck timers

## Remaining Audio Recording and Navigation Issues

### Overview
This plan outlines the steps to fix the remaining issues with the audio recording and transcription functionality, including persistent empty error objects, timer display problems, and navigation issues after recording completion.

### Implementation Steps

#### 1. Fix Persistent Empty Error Objects in Console Logs

- [ ] Enhance error serialization in transcription service
  - [ ] Add try/catch blocks around error serialization
  - [ ] Implement fallback error objects for non-serializable errors
  - [ ] Add more context to error objects
  - [ ] Ensure all error properties have default values

#### 2. Fix Timer Display Issues

- [ ] Update the timer display component
  - [ ] Fix the initial timer display value
  - [ ] Ensure timer is properly initialized
  - [ ] Add more robust fallback for timer display
  - [ ] Implement timer validation before rendering

#### 3. Fix Navigation After Recording Completion

- [ ] Implement proper navigation flow after recording
  - [ ] Add navigation trigger after successful recording
  - [ ] Ensure recording data is properly passed to the next step
  - [ ] Add event listeners for recording completion
  - [ ] Implement proper state management for recording flow

#### 4. Improve Error Handling and Recovery

- [ ] Enhance error recovery mechanisms
  - [ ] Add more robust error recovery for transcription failures
  - [ ] Implement better user feedback for errors
  - [ ] Add retry mechanisms for failed operations
  - [ ] Ensure graceful degradation on errors

## Fix Infinite Update Loop in DataTab Component

### Overview
We need to fix an infinite update loop in the DataTab component that's causing "Maximum update depth exceeded" errors. This is happening because the auto-save functionality in the useEffect hook is triggering state updates that cause the component to re-render repeatedly.

### Implementation Steps

#### 1. Complete Redesign of Recording State Management

- [x] Remove the auto-save useEffect hook entirely to eliminate the source of the loop
- [x] Implement a more controlled approach to recording completion
- [x] Separate recording state from save/navigation actions

#### 2. Implement Manual Save Only Approach

- [x] Remove automatic saving of recordings
- [x] Rely only on the manual "Save & Continue" button
- [x] Ensure the save button is properly disabled after saving

#### 3. Fix Parent-Child Component Communication

- [x] Review how props are passed from parent to DataTab
- [x] Ensure state updates in the parent don't cause re-renders that trigger useEffect
- [x] Implement proper unidirectional data flow

#### 4. Add Comprehensive Error Handling

- [x] Add try/catch blocks around all state updates
- [x] Log detailed information about component state during errors
- [x] Implement recovery mechanisms for error states

## Detailed Implementation

### Step 1: RAG Service Implementation

```typescript
// Path: frontend/src/services/api/ragService.ts

class RAGService {
  private openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  private isValidApiKey: boolean;

  constructor() {
    this.isValidApiKey = this.openaiKey.startsWith('sk-') && this.openaiKey.length > 20;
  }

  // Process content with RAG approach
  async generateContent(query: string, context: string[]): Promise<string> {
    if (!this.isValidApiKey) {
      return this.generateMockResponse(query, context);
    }

    try {
      // Real implementation would call OpenAI API
      const response = await this.callOpenAI(query, context);
      return response;
    } catch (error) {
      console.error('Error generating content:', error);
      return this.generateMockResponse(query, context);
    }
  }

  // Mock implementation for development/demo
  private generateMockResponse(query: string, context: string[]): string {
    // Implementation will simulate AI responses based on query and context
  }

  // Call OpenAI API
  private async callOpenAI(query: string, context: string[]): Promise<string> {
    // Implementation will call OpenAI API with proper prompt engineering
  }
}

const ragService = new RAGService();
export default ragService;
```

### Step 2: GenerateTab Component Update

The `handleGenerate` function in the GenerateTab component needs to be updated to use the RAG service:

```typescript
// Handle generation of content
const handleGenerate = async () => {
  if (fields.length === 0) {
    toast({
      variant: 'destructive',
      title: 'No fields configured',
      description: 'Please configure at least one output field before generating content.'
    });
    return;
  }

  setIsGenerating(true);
  setGenerationResults([]);

  try {
    // Get all files and transcriptions from the current session
    const sessionFiles = currentSession?.files || [];
    const contexts: string[] = [];

    // Extract text content from files and transcriptions
    sessionFiles.forEach(file => {
      if (file.transcription) {
        contexts.push(file.transcription);
      }
    });

    if (currentSession?.transcript) {
      contexts.push(currentSession.transcript);
    }

    if (contexts.length === 0) {
      throw new Error('No content found in session files or transcriptions');
    }

    // Generate content for each field
    const results: GenerationResult[] = [];

    for (const field of fields) {
      const query = field.format || `Summarize the content related to ${field.name}`;
      const content = await ragService.generateContent(query, contexts);

      results.push({
        fieldId: field.id,
        fieldName: field.name,
        content,
        refinements: []
      });

      // Expand the first item by default
      setExpandedItems([field.id]);
    }

    setGenerationResults(results);

    // Update session with generated content
    if (currentSession) {
      await updateSession(currentSession.id, {
        content: {
          processedContent: JSON.stringify(results)
        }
      });
    }

    toast({
      title: 'Content generated',
      description: `Generated content for ${results.length} fields.`
    });
  } catch (error) {
    console.error('Error generating content:', error);
    toast({
      variant: 'destructive',
      title: 'Generation failed',
      description: error instanceof Error ? error.message : 'An error occurred during content generation.'
    });
  } finally {
    setIsGenerating(false);
  }
};
```

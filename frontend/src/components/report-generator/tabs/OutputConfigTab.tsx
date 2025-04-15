"use client"

import React, { useState, useEffect } from 'react'

// Define types for Web Speech API since TypeScript doesn't include them by default
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, Mic, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from '@/contexts/session/session-context'
import { generateId } from '@/lib/utils'

// Define types for our component
export interface OutputField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  format: string
}

export interface OutputConfigurationData {
  fields: OutputField[]
}

interface OutputConfigTabProps {
  initialConfig?: OutputConfigurationData
  onSave: (config: OutputConfigurationData) => void
  onBack: () => void
}

function OutputConfigTab({ initialConfig, onSave, onBack }: OutputConfigTabProps) {
  const { toast } = useToast()
  const { currentSession } = useSession()
  
  // Initialize state with default values or values from initialConfig
  const [fields, setFields] = useState<OutputField[]>(
    initialConfig?.fields && initialConfig.fields.length > 0 
      ? initialConfig.fields.map(field => ({
          ...field,
          format: field.format || '' // Ensure backward compatibility
        }))
      : [{ id: generateId(), name: '', type: 'text', format: '' }]
  )
  const [recordingFieldId, setRecordingFieldId] = useState<string | null>(null)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  
  // Check if we've reached the maximum number of fields (7)
  const canAddMoreFields = fields.length < 7
  
  // Check if the form is valid for submission
  const isFormValid = fields.every(field => 
    field.name.trim() !== '' && field.format.trim() !== ''
  )
  
  // Handle adding a new field
  const addField = () => {
    if (canAddMoreFields) {
      setFields([...fields, { id: generateId(), name: '', type: 'text', format: '' }])
    } else {
      toast({
        variant: 'destructive',
        title: 'Maximum fields reached',
        description: 'You can add up to 7 output fields.'
      })
    }
  }
  
  // Handle removing a field
  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter(field => field.id !== id))
    } else {
      toast({
        variant: 'destructive',
        title: 'Cannot remove field',
        description: 'You need at least one output field.'
      })
    }
  }
  
  // Handle field name change
  const handleFieldNameChange = (id: string, value: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, name: value } : field
    ))
  }
  
  // Handle field format change
  const handleFieldFormatChange = (id: string, value: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, format: value } : field
    ))
  }
  
  // Handle field type change
  const handleFieldTypeChange = (id: string, value: OutputField['type']) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, type: value } : field
    ))
  }
  
  // Handle speech recognition for dictation
  const startDictation = (fieldId: string) => {
    setRecordingError(null)
    
    // Check if the browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US' // Always use English
      
      recognition.onstart = () => {
        setRecordingFieldId(fieldId)
      }
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setFields(fields.map(field => {
          if (field.id === fieldId) {
            // If there's already text, add a space before the new transcript
            const newFormat = field.format.trim() 
              ? `${field.format.trim()} ${transcript}` 
              : transcript
            return { ...field, format: newFormat }
          }
          return field
        }))
      }
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error)
        setRecordingFieldId(null)
        setRecordingError(`Error: ${event.error}. Please try again.`)
      }
      
      recognition.onend = () => {
        setRecordingFieldId(null)
      }
      
      try {
        recognition.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setRecordingFieldId(null)
        setRecordingError('Could not start speech recognition. Please try again.')
      }
    } else {
      setRecordingError('Speech recognition is not supported in your browser.')
    }
  }
  
  // Handle form submission
  const handleSubmit = () => {
    if (isFormValid) {
      const config: OutputConfigurationData = {
        fields
      }
      
      onSave(config)
      
      toast({
        title: 'Configuration saved',
        description: 'Your output configuration has been saved.'
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid configuration',
        description: 'Please fill in all required fields.'
      })
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configure Output</CardTitle>
        <CardDescription>
          Define how you want your report to be formatted and what fields to include.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {recordingError && (
          <div className="text-sm text-destructive flex items-center gap-1 mb-4 p-2 border border-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{recordingError}</span>
          </div>
        )}
        
        {/* Output fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Output Fields (up to 7)</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addField} 
              disabled={!canAddMoreFields}
              title="Add field"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
          
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-3 p-4 border rounded-md mb-4">
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Label htmlFor={`field-name-${field.id}`} className="mb-1 block">Field Name</Label>
                    <Input
                      id={`field-name-${field.id}`}
                      value={field.name}
                      onChange={(e) => handleFieldNameChange(field.id, e.target.value)}
                      placeholder={`Field ${index + 1} name`}
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`field-type-${field.id}`} className="mb-1 block">Type</Label>
                    <Select 
                      value={field.type} 
                      onValueChange={(value: any) => handleFieldTypeChange(field.id, value)}
                    >
                      <SelectTrigger id={`field-type-${field.id}`}>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-6">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeField(field.id)}
                      disabled={fields.length <= 1}
                      title="Remove field"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <Label htmlFor={`field-format-${field.id}`} className="mb-1 block">How do you want this formatted?</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`field-format-${field.id}`}
                      value={field.format}
                      onChange={(e) => handleFieldFormatChange(field.id, e.target.value)}
                      placeholder="E.g., 'A brief summary of the key points'"
                      className="flex-1"
                    />
                    <Button 
                      variant={recordingFieldId === field.id ? "destructive" : "outline"} 
                      size="icon" 
                      onClick={() => startDictation(field.id)}
                      disabled={recordingFieldId !== null}
                      title="Dictate format"
                    >
                      <Mic className={`h-4 w-4 ${recordingFieldId === field.id ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid}
          className="gap-1"
        >
          Generate Report
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default OutputConfigTab;

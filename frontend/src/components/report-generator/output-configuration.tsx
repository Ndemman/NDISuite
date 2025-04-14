"use client"

import React, { useState } from 'react'
import { Check, Mic, Plus, Trash, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface OutputField {
  id: string
  name: string
  description?: string
}

interface OutputConfigurationProps {
  onSubmit: (config: OutputConfigurationData) => void
  initialConfig?: OutputConfigurationData
}

export interface OutputConfigurationData {
  language: 'en' | 'ar'
  outputFormat: string
  fields: OutputField[]
}

export function OutputConfiguration({ onSubmit, initialConfig }: OutputConfigurationProps) {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [config, setConfig] = useState<OutputConfigurationData>(
    initialConfig || {
      language: 'en',
      outputFormat: '',
      fields: []
    }
  )

  // Handle language change
  const handleLanguageChange = (value: string) => {
    if (value) {
      setConfig(prev => ({
        ...prev,
        language: value as 'en' | 'ar'
      }))
    }
  }

  // Handle format change
  const handleFormatChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig(prev => ({
      ...prev,
      outputFormat: e.target.value
    }))
  }

  // Add new field
  const addField = () => {
    if (config.fields.length >= 7) {
      toast({
        title: "Maximum fields reached",
        description: "You can't add more than 7 fields.",
        variant: "destructive"
      })
      return
    }

    setConfig(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: `field-${Date.now()}`,
          name: `Field ${prev.fields.length + 1}`,
          description: ''
        }
      ]
    }))
  }

  // Update field
  const updateField = (id: string, field: Partial<OutputField>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => 
        f.id === id ? { ...f, ...field } : f
      )
    }))
  }

  // Remove field
  const removeField = (id: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }))
  }

  // Toggle voice recording for dictating format
  const toggleRecording = () => {
    if (!isRecording) {
      // Check if the browser supports speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        
        recognition.lang = config.language === 'en' ? 'en-US' : 'ar-SA'
        recognition.continuous = true
        recognition.interimResults = true
        
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('')
            
          setConfig(prev => ({
            ...prev,
            outputFormat: transcript
          }))
        }
        
        recognition.onend = () => {
          setIsRecording(false)
        }
        
        recognition.start()
        setIsRecording(true)
        
        // Store the recognition instance
        window.speechRecognition = recognition
      } else {
        toast({
          title: "Speech recognition not supported",
          description: "Your browser doesn't support speech recognition.",
          variant: "destructive"
        })
      }
    } else {
      // Stop recording
      if (window.speechRecognition) {
        window.speechRecognition.stop()
      }
      setIsRecording(false)
    }
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!config.outputFormat) {
      toast({
        title: "Output format required",
        description: "Please specify an output format.",
        variant: "destructive"
      })
      return
    }
    
    onSubmit(config)
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Output Configuration</CardTitle>
          <CardDescription>
            Specify how you want your report to be structured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Language</Label>
            <ToggleGroup 
              type="single" 
              variant="outline"
              value={config.language}
              onValueChange={handleLanguageChange}
              className="justify-start"
            >
              <ToggleGroupItem value="en" aria-label="English">
                English
              </ToggleGroupItem>
              <ToggleGroupItem value="ar" aria-label="Arabic">
                العربية
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="outputFormat">Output Format</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  id="outputFormat"
                  value={config.outputFormat}
                  onChange={handleFormatChange}
                  placeholder="Describe the structure and format you'd like for your report. For example: 'A detailed technical report with sections for Introduction, Methodology, Findings, and Conclusion.'"
                  className="h-24"
                />
              </div>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={toggleRecording}
                className="shrink-0"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isRecording ? "Recording... Speak clearly about the format you want." : "Click the microphone to dictate the format."}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Output Fields (max 7)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addField}
                disabled={config.fields.length >= 7}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </div>
            
            <div className="space-y-3">
              {config.fields.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No fields added yet. Add fields to structure your output.
                </p>
              ) : (
                config.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <Input 
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          placeholder="Field name"
                          className="flex-1"
                        />
                      </div>
                      <Input 
                        value={field.description || ''}
                        onChange={(e) => updateField(field.id, { description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeField(field.id)}
                      className="shrink-0 text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit">
            Save Configuration
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// Add type declaration for the SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
    speechRecognition: any
  }
}

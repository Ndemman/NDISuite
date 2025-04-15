"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from '@/contexts/session/session-context'
import { Loader2, Copy, Save, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { OutputField } from './OutputConfigTab'

// Types for our component
interface GenerationResult {
  fieldId: string
  fieldName: string
  content: string
  refinements: Refinement[]
}

interface Refinement {
  id: string
  originalText: string
  prompt: string
  refinedText: string
  isApplied: boolean
}

interface HighlightSelection {
  fieldId: string
  text: string
  startOffset: number
  endOffset: number
}

interface GenerateTabProps {
  fields: OutputField[]
  onBack: () => void
  onReset: () => void
}

function GenerateTab({ fields, onBack, onReset }: GenerateTabProps) {
  const { toast } = useToast()
  const { currentSession, updateSession } = useSession()
  
  // State for generation process
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([])
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // State for refinement process
  const [activeHighlight, setActiveHighlight] = useState<HighlightSelection | null>(null)
  const [refinementPrompt, setRefinementPrompt] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [showRefinementOverlay, setShowRefinementOverlay] = useState(false)
  
  // References for content elements
  const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  // Handle text selection for refinement
  const handleTextSelection = (fieldId: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') return
    
    const range = selection.getRangeAt(0)
    const container = contentRefs.current[fieldId]
    
    if (container && container.contains(range.commonAncestorContainer)) {
      const text = selection.toString()
      
      // Calculate offsets relative to the container
      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(container)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const startOffset = preSelectionRange.toString().length
      
      const endOffset = startOffset + text.length
      
      setActiveHighlight({
        fieldId,
        text,
        startOffset,
        endOffset
      })
      
      setRefinementPrompt(`Refine this text: "${text}"`)
      setShowRefinementOverlay(true)
    }
  }
  
  // Handle refinement submission
  const handleRefineSubmit = async () => {
    if (!activeHighlight || !refinementPrompt.trim()) return
    
    setIsRefining(true)
    
    try {
      // Simulate API call for refinement
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const refinedText = `Refined version of: ${activeHighlight.text}`
      
      // Add refinement to the appropriate field
      setGenerationResults(prev => 
        prev.map(result => {
          if (result.fieldId === activeHighlight.fieldId) {
            const newRefinement = {
              id: `refinement-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              originalText: activeHighlight.text,
              prompt: refinementPrompt,
              refinedText,
              isApplied: false
            }
            
            return {
              ...result,
              refinements: [...result.refinements, newRefinement]
            }
          }
          return result
        })
      )
      
      toast({
        title: 'Refinement created',
        description: 'You can now apply the refinement to your content.'
      })
      
      // Close the overlay
      setShowRefinementOverlay(false)
      setActiveHighlight(null)
      setRefinementPrompt('')
    } catch (error) {
      console.error('Error refining text:', error)
      toast({
        variant: 'destructive',
        title: 'Refinement failed',
        description: 'There was an error refining your text. Please try again.'
      })
    } finally {
      setIsRefining(false)
    }
  }
  
  // Apply a refinement to the content
  const applyRefinement = (fieldId: string, refinementId: string) => {
    setGenerationResults(prev => 
      prev.map(result => {
        if (result.fieldId === fieldId) {
          const refinements = result.refinements.map(refinement => {
            if (refinement.id === refinementId) {
              return { ...refinement, isApplied: true }
            }
            return refinement
          })
          
          // Apply the refinement to the content
          let content = result.content
          const refinement = result.refinements.find(r => r.id === refinementId)
          
          if (refinement && !refinement.isApplied) {
            content = content.replace(refinement.originalText, refinement.refinedText)
          }
          
          return { ...result, content, refinements }
        }
        return result
      })
    )
    
    toast({
      title: 'Refinement applied',
      description: 'The refinement has been applied to your content.'
    })
  }
  
  // Handle generation of content
  const handleGenerate = async () => {
    if (fields.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No fields defined',
        description: 'Please define at least one field in the configuration tab.'
      })
      return
    }
    
    setIsGenerating(true)
    
    try {
      // Simulate API call for generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate content for each field
      const results = fields.map(field => ({
        fieldId: field.id,
        fieldName: field.name,
        content: `Generated content for ${field.name} based on format: ${field.format}. This is a sample of what the AI would generate for this field.`,
        refinements: []
      }))
      
      setGenerationResults(results)
      
      // Expand the first item by default
      if (results.length > 0) {
        setExpandedItems([results[0].fieldId])
      }
      
      toast({
        title: 'Content generated',
        description: 'Your report has been generated successfully.'
      })
    } catch (error) {
      console.error('Error generating content:', error)
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: 'There was an error generating your content. Please try again.'
      })
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Handle copying content to clipboard
  const handleCopy = () => {
    const fullContent = generationResults
      .map(result => `${result.fieldName}:\n${result.content}`)
      .join('\n\n')
    
    navigator.clipboard.writeText(fullContent)
      .then(() => {
        setCopied(true)
        toast({
          title: 'Copied to clipboard',
          description: 'The report has been copied to your clipboard.'
        })
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err)
        toast({
          variant: 'destructive',
          title: 'Copy failed',
          description: 'There was an error copying to clipboard. Please try again.'
        })
      })
  }
  
  // Handle saving the report
  const handleSave = () => {
    if (!currentSession) return
    
    try {
      const content = {
        ...currentSession.content,
        rawContent: JSON.stringify(generationResults),
        processedContent: generationResults
          .map(result => `${result.fieldName}:\n${result.content}`)
          .join('\n\n')
      }
      
      updateSession(currentSession.id, {
        status: 'completed',
        content
      })
      
      setSaved(true)
      toast({
        title: 'Report saved',
        description: 'Your report has been saved successfully.'
      })
      
      // Reset saved state after 2 seconds
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving report:', error)
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'There was an error saving your report. Please try again.'
      })
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
        <CardDescription>
          Generate your report based on the configured fields and format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {generationResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <p className="text-center text-muted-foreground">
              Click the Generate button to create your report based on your configuration.
            </p>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full max-w-xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Accordion
              type="multiple"
              value={expandedItems}
              onValueChange={setExpandedItems}
              className="w-full"
            >
              {generationResults.map((result) => (
                <AccordionItem key={result.fieldId} value={result.fieldId} className="border rounded-md mb-4">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="font-semibold">{result.fieldName}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div 
                      ref={el => contentRefs.current[result.fieldId] = el}
                      className="prose prose-sm max-w-none"
                      onMouseUp={() => handleTextSelection(result.fieldId)}
                    >
                      {result.content}
                    </div>
                    
                    {result.refinements.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-semibold mb-2">Refinements</h4>
                        <div className="space-y-2">
                          {result.refinements.map(refinement => (
                            <div 
                              key={refinement.id} 
                              className="border rounded-md p-3 text-xs"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-medium">Original: <span className="font-normal">{refinement.originalText}</span></div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => applyRefinement(result.fieldId, refinement.id)}
                                  disabled={refinement.isApplied}
                                >
                                  {refinement.isApplied ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    'Apply'
                                  )}
                                </Button>
                              </div>
                              <div className="font-medium">Refined: <span className="font-normal">{refinement.refinedText}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {/* Refinement overlay */}
            {showRefinementOverlay && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold mb-4">Refine Selected Text</h3>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Selected text:</p>
                    <div className="bg-muted p-2 rounded text-sm mb-4">
                      {activeHighlight?.text}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">Refinement prompt:</p>
                    <textarea
                      className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      placeholder="Describe how you want this text to be refined..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRefinementOverlay(false)
                        setActiveHighlight(null)
                        setRefinementPrompt('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRefineSubmit}
                      disabled={isRefining || !refinementPrompt.trim()}
                    >
                      {isRefining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refining...
                        </>
                      ) : (
                        'Refine'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}>
          Back
        </Button>
        
        {generationResults.length > 0 && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onReset}
              title="Start a new session"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={copied}
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={saved}
              title="Save for later"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// Default export for dynamic import
export default GenerateTab;

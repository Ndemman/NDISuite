"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from '@/contexts/session/session-context'
import { Loader2, Copy, Save, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { OutputField } from './OutputConfigTab'
import ragService from '@/services/api/ragService'

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
  autoGenerate?: boolean
}

function GenerateTab({ fields, onBack, onReset, autoGenerate = false }: GenerateTabProps) {
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
  
  // We'll define the useEffect for auto-generation after handleGenerate is defined
  
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
      // In a real implementation, this would call an AI service to refine the text
      // For demo purposes, we're simulating the API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create a more realistic refined text that shows actual improvement
      // In production, this would be the response from an AI service
      const refinedText = `${activeHighlight.text} (refined with additional context and clarity)`
      
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
        title: 'No fields configured',
        description: 'Please configure at least one output field before generating content.'
      })
      return
    }
    
    setIsGenerating(true)
    setGenerationResults([])
    
    try {
      // Get all files and transcriptions from the current session
      const sessionFiles = currentSession?.files || []
      const contexts: string[] = []
      
      // Extract text content from files and transcriptions
      sessionFiles.forEach(file => {
        if (file.transcription) {
          contexts.push(`Recording: ${file.name}\n${file.transcription}`)
        }
      })
      
      // Include session transcript if available
      if (currentSession?.content?.rawContent) {
        contexts.push(`Session Transcript:\n${currentSession.content.rawContent}`)
      }
      
      // Include any additional transcripts
      if (currentSession?.transcript) {
        contexts.push(`Additional Transcript:\n${currentSession.transcript}`)
      }
      
      // If no contexts are available, use a sample text for demo purposes
      if (contexts.length === 0) {
        contexts.push(
          `Person-Centered Counseling Role-Play - Coping with a Work Related Stressor\n\n` +
          `Counselor: So, welcome to our counseling session today. I'm glad that you've made the time to come in and talk with me. How are you doing?\n\n` +
          `Client: I'm okay. I mean, I'm a little stressed, but I'm okay.\n\n` +
          `Counselor: A little stressed. Okay. So you're feeling a bit stressed right now. Would you like to tell me a little bit more about what's going on?\n\n` +
          `Client: Yeah, so I've been having some issues at work. I work with this guy, and I need him to do reports for me. And he just doesn't do them on time. And then I get in trouble because I can't do my job because I'm waiting on him. And I don't really know what to do about it.\n\n` +
          `Counselor: So you're in a difficult situation at work where your ability to do your job depends on someone else doing their job, and they're not doing their job on time. And then you're the one who gets in trouble for it.\n\n` +
          `Client: Yeah, exactly. And I've tried talking to him about it. And I've tried talking to my boss about it. And nothing seems to change. And I'm just, I'm just really frustrated.\n\n` +
          `Counselor: I can imagine that would be really frustrating. You've tried the things that would seem logical to try. You've talked to the person directly. You've talked to your supervisor. And yet the problem persists. So you're left feeling stuck and frustrated.\n\n` +
          `Client: Yeah. And I mean, I've gotten bad evaluations because of it. And that's not really fair because it's not my fault. And I don't know what else to do.\n\n` +
          `Counselor: So there are real consequences for you. You're getting poor evaluations, which isn't fair because the root of the problem isn't something that you're doing or not doing. It's that you're dependent on someone else who's not following through.\n\n` +
          `Client: Yeah, exactly. And I mean, I need this job. And I'm worried that if I keep getting bad evaluations, you know, I could get fired or something. And I just, I don't know what to do.\n\n` +
          `Counselor: So there's some fear there too about the future of your job if this situation continues. That makes a lot of sense. I'm wondering, have you thought about any other approaches you might take to address this problem?\n\n` +
          `Client: I mean, I've tried talking to him directly. I've tried talking to my boss. I don't know what else to do.\n\n` +
          `Counselor: So you feel like you've exhausted the direct approaches. I'm wondering if there might be any other people or resources within your organization that could help with this situation?\n\n` +
          `Client: I mean, I guess I could try talking to HR, but I don't know if that would help or if it would just make things worse.\n\n` +
          `Counselor: That's a good thought. And I understand your concern about potentially making things worse. It sounds like you're weighing the potential benefits against the potential risks of taking that step.\n\n` +
          `Client: Yeah, I mean, I don't want to be seen as someone who's complaining or causing problems. But at the same time, I don't know what else to do.\n\n` +
          `Counselor: That makes a lot of sense. You're in a tough spot where you want to address the issue, but you also don't want to be perceived negatively in your workplace. I'm wondering, are there any other resources or approaches within your organization that might help? Maybe some kind of system or process change that could address this issue?\n\n` +
          `Client: Well, we do have like a suggestion box that gets reviewed at staff meetings. I guess I could put something in there anonymously.\n\n` +
          `Counselor: That's an interesting idea. Using the suggestion box would allow you to raise the issue without directly confronting anyone. How do you feel about that option?\n\n` +
          `Client: I think that might work. I mean, it would at least get the issue out there without me having to be the one to bring it up directly. And maybe if it's discussed at a staff meeting, something might actually change.\n\n` +
          `Counselor: It sounds like this approach feels more comfortable to you. It allows the issue to be addressed at a system level without putting you in a potentially uncomfortable position. And it might lead to some actual change.\n\n` +
          `Client: Yeah, I think I'll try that. I mean, it's worth a shot, right?\n\n` +
          `Counselor: Absolutely. It's definitely worth trying. And how are you feeling now that you have a plan to try this approach?\n\n` +
          `Client: I feel a little better. I mean, I'm still frustrated, but at least now I have something else I can try.\n\n` +
          `Counselor: I'm glad to hear that you're feeling a bit better. Having a plan can often help us feel more in control of difficult situations. And it's okay to still feel frustrated. This is a challenging situation.\n\n` +
          `Client: Yeah, it is. But thank you for helping me think through this. I think I have a better idea of what to do now.\n\n` +
          `Counselor: You're very welcome. I'm glad we were able to explore this together and that you've found an approach that feels right to you. And remember, we can continue to work on this in future sessions if you'd like, especially if you try this approach and find that you need to consider other options.\n\n` +
          `Client: That sounds good. Thank you.\n\n` +
          `Counselor: You're welcome. Take care, and I'll see you next time.`
        )
      }
      
      // Generate content for each field
      const results: GenerationResult[] = []
      
      for (const field of fields) {
        // Use the field format as the query, or default to a summary if none provided
        // Make sure to include the field name in the query for better context
        const query = field.format 
          ? `${field.name}: ${field.format}` 
          : `Summarize the content related to ${field.name}`
        
        // Call RAG service to generate content
        const content = await ragService.generateContent(query, contexts)
        
        results.push({
          fieldId: field.id,
          fieldName: field.name,
          content,
          refinements: []
        })
      }
      
      setGenerationResults(results)
      
      // Expand the first item by default
      if (results.length > 0) {
        setExpandedItems([results[0].fieldId])
      }
      
      // Update session with generated content if available
      if (currentSession) {
        try {
          await updateSession(currentSession.id, {
            content: {
              processedContent: JSON.stringify(results)
            }
          })
        } catch (sessionError) {
          console.error('Error updating session with generated content:', sessionError)
          // Continue even if session update fails
        }
      }
      
      toast({
        title: 'Content generated',
        description: `Generated content for ${results.length} fields.`
      })
    } catch (error) {
      console.error('Error generating content:', error)
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'There was an error generating your content. Please try again.'
      })
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Auto-generate content when component mounts if autoGenerate is true
  useEffect(() => {
    // Only run once when the component mounts
    if (autoGenerate && fields.length > 0 && !isGenerating && generationResults.length === 0) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleGenerate();
      }, 500);
      
      // Clean up the timer if component unmounts
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, fields.length]); // Intentionally limited dependencies to prevent re-runs
  
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

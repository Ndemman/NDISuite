"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextHighlighter, Highlight } from './text-highlighter'
import { useToast } from '@/components/ui/use-toast'
import { Sparkles, History, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

export interface RefinementHistory {
  id: string
  timestamp: Date
  originalContent: string
  refinedContent: string
  prompt?: string
}

export interface Section {
  id: string
  title: string
  content: string
  history: RefinementHistory[]
}

interface RefinementInterfaceProps {
  sections: Section[]
  onSectionUpdate: (sectionId: string, content: string) => void
  onHistoryAdd: (sectionId: string, history: RefinementHistory) => void
}

export function RefinementInterface({ 
  sections, 
  onSectionUpdate, 
  onHistoryAdd 
}: RefinementInterfaceProps) {
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState<string | null>(sections.length > 0 ? sections[0].id : null)
  const [editedContent, setEditedContent] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('highlight')
  const [promptText, setPromptText] = useState<string>('')
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>({})
  const [isRefining, setIsRefining] = useState<boolean>(false)
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<Record<string, number>>({})
  
  // Initialize highlighting state
  React.useEffect(() => {
    if (sections.length > 0) {
      const highlightState: Record<string, Highlight[]> = {}
      const historyIndices: Record<string, number> = {}
      
      sections.forEach(section => {
        highlightState[section.id] = []
        historyIndices[section.id] = 0
        
        if (section.id === activeSection) {
          setEditedContent(section.content)
        }
      })
      
      setHighlights(highlightState)
      setCurrentHistoryIndex(historyIndices)
    }
  }, [])

  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    
    if (!section) return
    
    setActiveSection(sectionId)
    setEditedContent(section.content)
    setPromptText('')
  }

  // Handle highlight add
  const handleHighlightAdd = (highlight: Highlight) => {
    if (!activeSection) return
    
    setHighlights(prev => ({
      ...prev,
      [activeSection]: [...(prev[activeSection] || []), highlight]
    }))
  }

  // Handle highlight update
  const handleHighlightUpdate = (id: string, data: Partial<Highlight>) => {
    if (!activeSection) return
    
    setHighlights(prev => ({
      ...prev,
      [activeSection]: prev[activeSection].map(h => 
        h.id === id ? { ...h, ...data } : h
      )
    }))
  }

  // Handle highlight delete
  const handleHighlightDelete = (id: string) => {
    if (!activeSection) return
    
    setHighlights(prev => ({
      ...prev,
      [activeSection]: prev[activeSection].filter(h => h.id !== id)
    }))
  }

  // Generate refinement prompt based on highlights and user prompts
  const generatePrompt = (): string => {
    if (!activeSection) return ''
    
    const currentHighlights = highlights[activeSection] || []
    let prompt = "Please refine the following text"
    
    if (promptText) {
      prompt += ` with these instructions: ${promptText}`
    }
    
    if (currentHighlights.length > 0) {
      prompt += ". Pay special attention to these highlighted sections:"
      
      currentHighlights.forEach((highlight, index) => {
        prompt += `\n\n${index + 1}. "${highlight.text}"`
        if (highlight.note) {
          prompt += ` - Note: ${highlight.note}`
        }
      })
    }
    
    return prompt
  }

  // Simulate AI refinement
  const refineContent = async () => {
    if (!activeSection) return
    
    const currentSection = sections.find(s => s.id === activeSection)
    if (!currentSection) return
    
    setIsRefining(true)
    
    try {
      const prompt = generatePrompt()
      
      // In a real app, this would call an API
      // For this demo, we'll simulate the refinement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create simulated refined content
      const originalContent = currentSection.content
      let refinedContent = originalContent
      
      // Simple simulation of content refinement
      // In a real app, this would come from the LLM
      const sectionHighlights = highlights[activeSection] || []
      
      if (sectionHighlights.length > 0) {
        // Simulate refining highlighted sections
        sectionHighlights.forEach(highlight => {
          const highlightedText = highlight.text
          const improvementText = highlight.note 
            ? `${highlightedText} (${highlight.note})` 
            : `${highlightedText} (improved)`
          
          refinedContent = refinedContent.replace(highlightedText, improvementText)
        })
      } else if (promptText) {
        // Simulate refinement based on prompt text
        if (promptText.toLowerCase().includes('summarize')) {
          refinedContent = `[Summarized version] ${originalContent.split(' ').slice(0, 50).join(' ')}...`
        } else if (promptText.toLowerCase().includes('expand')) {
          refinedContent = `${originalContent}\n\nAdditional details as requested: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
        } else if (promptText.toLowerCase().includes('formal')) {
          refinedContent = originalContent.replace(/I think/g, 'It is postulated').replace(/maybe/g, 'potentially')
        } else {
          refinedContent = `${originalContent}\n\n[Refined based on your instructions: "${promptText}"]`
        }
      }
      
      // Create history record
      const newHistory: RefinementHistory = {
        id: `history-${Date.now()}`,
        timestamp: new Date(),
        originalContent,
        refinedContent,
        prompt: promptText || undefined
      }
      
      // Update section
      onSectionUpdate(activeSection, refinedContent)
      onHistoryAdd(activeSection, newHistory)
      
      // Update UI
      setEditedContent(refinedContent)
      setPromptText('')
      
      // Clear highlights after refinement
      setHighlights(prev => ({
        ...prev,
        [activeSection]: []
      }))
      
      // Ensure the history index is set to the latest version
      const sectionHistoryCount = currentSection.history.length + 1 // +1 for the one we just added
      setCurrentHistoryIndex(prev => ({
        ...prev,
        [activeSection]: sectionHistoryCount - 1
      }))
      
      toast({
        title: "Refinement complete",
        description: "Your content has been refined."
      })
    } catch (error) {
      console.error('Error refining content:', error)
      toast({
        variant: "destructive",
        title: "Refinement failed",
        description: "An error occurred while refining your content."
      })
    } finally {
      setIsRefining(false)
    }
  }

  // Navigate through history
  const navigateHistory = (sectionId: string, direction: 'prev' | 'next') => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    
    const historyLength = section.history.length
    if (historyLength === 0) return
    
    const currentIndex = currentHistoryIndex[sectionId] || 0
    let newIndex: number
    
    if (direction === 'prev') {
      newIndex = Math.max(currentIndex - 1, -1) // -1 represents the original content
    } else {
      newIndex = Math.min(currentIndex + 1, historyLength - 1)
    }
    
    setCurrentHistoryIndex(prev => ({
      ...prev,
      [sectionId]: newIndex
    }))
    
    // Update content based on history index
    let newContent: string
    
    if (newIndex === -1) {
      // Show original content (before any refinements)
      newContent = section.history[0]?.originalContent || section.content
    } else {
      // Show a specific refinement
      newContent = section.history[newIndex].refinedContent
    }
    
    setEditedContent(newContent)
  }

  // Handle manual content edit
  const handleContentEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value)
  }
  
  // Save manual edits
  const saveManualEdits = () => {
    if (!activeSection) return
    
    onSectionUpdate(activeSection, editedContent)
    
    toast({
      title: "Changes saved",
      description: "Your edits have been saved."
    })
  }

  // Get current section
  const currentSection = activeSection 
    ? sections.find(s => s.id === activeSection) 
    : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Section navigation */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>
              Select a section to refine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sections.map(section => (
                <div
                  key={section.id}
                  className={`p-2 rounded-md cursor-pointer ${
                    section.id === activeSection
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => handleSectionChange(section.id)}
                >
                  <div className="font-medium">{section.title}</div>
                  <div className="text-xs">
                    {section.history.length} refinements
                  </div>
                </div>
              ))}
              
              {sections.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No sections available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Main content area */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>
              {currentSection ? currentSection.title : 'Select a section'}
            </CardTitle>
            <CardDescription>
              {currentSection?.history.length 
                ? `${currentSection.history.length} refinements made` 
                : 'No refinements yet'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSection && (
              <>
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="highlight">Highlight & Annotate</TabsTrigger>
                    <TabsTrigger value="edit">Manual Edit</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="highlight" className="space-y-4 mt-4">
                    <TextHighlighter
                      content={editedContent}
                      highlights={highlights[activeSection] || []}
                      onHighlightAdd={handleHighlightAdd}
                      onHighlightUpdate={handleHighlightUpdate}
                      onHighlightDelete={handleHighlightDelete}
                    />
                    
                    <div className="space-y-3">
                      <Label htmlFor="prompt">Refinement Instructions (Optional)</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Give instructions for refinement, e.g. 'Make this more formal' or 'Expand on the key points'"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      onClick={refineContent}
                      disabled={isRefining}
                      className="w-full"
                    >
                      {isRefining ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Refining Content...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Refine Content
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="edit" className="space-y-4 mt-4">
                    <Textarea
                      value={editedContent}
                      onChange={handleContentEdit}
                      className="min-h-[300px]"
                    />
                    
                    <Button 
                      onClick={saveManualEdits}
                      className="w-full"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="history" className="space-y-4 mt-4">
                    {currentSection && currentSection.history.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateHistory(activeSection, 'prev')}
                            disabled={(currentHistoryIndex[activeSection] || 0) <= -1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          
                          <div className="text-sm text-muted-foreground">
                            {(currentHistoryIndex[activeSection] || 0) === -1 
                              ? 'Original' 
                              : `Version ${(currentHistoryIndex[activeSection] || 0) + 1} of ${currentSection.history.length}`
                            }
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateHistory(activeSection, 'next')}
                            disabled={(currentHistoryIndex[activeSection] || 0) >= currentSection.history.length - 1}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                        
                        <div className="prose dark:prose-invert max-w-none">
                          <div 
                            className="whitespace-pre-wrap p-4 bg-card rounded-md border" 
                            dangerouslySetInnerHTML={{ __html: editedContent.replace(/\n/g, '<br/>') }}
                          />
                        </div>
                        
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="details">
                            <AccordionTrigger>Refinement Details</AccordionTrigger>
                            <AccordionContent>
                              {(currentHistoryIndex[activeSection] || 0) >= 0 && (
                                <div className="space-y-2 text-sm">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="font-medium">Date:</div>
                                    <div className="col-span-2">
                                      {new Date(currentSection.history[currentHistoryIndex[activeSection] || 0].timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                  {currentSection.history[currentHistoryIndex[activeSection] || 0].prompt && (
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="font-medium">Instructions:</div>
                                      <div className="col-span-2">
                                        {currentSection.history[currentHistoryIndex[activeSection] || 0].prompt}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <History className="h-6 w-6 text-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium">No history yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Refinement history will appear here once you make changes.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-xs text-muted-foreground">
              {(highlights[activeSection] || []).length} highlights
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

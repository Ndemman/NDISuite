"use client"

import React, { useState, useEffect } from 'react'
import { useSession, SessionData } from '@/contexts/session/session-context'
import { RefinementInterface, Section, RefinementHistory } from '@/components/refinement/refinement-interface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, FilePlus, FileText, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RefinementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { sessions, currentSession, updateSession } = useSession()
  
  const [sections, setSections] = useState<Section[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Initialize sections from the current session
  useEffect(() => {
    if (currentSession?.content?.processedContent) {
      initializeSections(currentSession)
    }
  }, [currentSession])
  
  // Initialize sections from report content
  const initializeSections = (session: SessionData) => {
    const content = session.content?.processedContent || ''
    
    // Parse content into sections using markdown headings
    // This is a simple implementation; a real app might use a markdown parser
    const sectionRegex = /^(#+)\s+(.+)$([\s\S]*?)(?=^#+\s+|\s*$)/gm
    const extractedSections: Section[] = []
    
    let match
    while ((match = sectionRegex.exec(content)) !== null) {
      const level = match[1].length
      const title = match[2].trim()
      const content = match[3].trim()
      
      if (level <= 2) { // Only include h1 and h2 headings as sections
        extractedSections.push({
          id: `section-${extractedSections.length + 1}`,
          title,
          content,
          history: []
        })
      }
    }
    
    // If no sections were found, create a single section for the entire content
    if (extractedSections.length === 0 && content) {
      extractedSections.push({
        id: 'section-1',
        title: 'Main Content',
        content,
        history: []
      })
    }
    
    setSections(extractedSections)
  }
  
  // Handle section content update
  const handleSectionUpdate = (sectionId: string, content: string) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? { ...section, content } 
          : section
      )
    )
  }
  
  // Handle adding refinement history
  const handleHistoryAdd = (sectionId: string, history: RefinementHistory) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              history: [history, ...section.history] 
            } 
          : section
      )
    )
  }
  
  // Save refined content back to the session
  const saveRefinedContent = () => {
    if (!currentSession) {
      toast({
        variant: 'destructive',
        title: 'No active session',
        description: 'You need to have an active session to save your refinements.'
      })
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Rebuild the content from all sections
      let refinedContent = ''
      
      sections.forEach(section => {
        refinedContent += `# ${section.title}\n\n${section.content}\n\n`
      })
      
      // Update the session with the refined content
      updateSession(currentSession.id, {
        content: {
          ...currentSession.content,
          processedContent: refinedContent
        }
      })
      
      toast({
        title: 'Refinements saved',
        description: 'Your refined report has been saved successfully.'
      })
    } catch (error) {
      console.error('Error saving refinements:', error)
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'An error occurred while saving your refinements.'
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Go back to report generator
  const goToReportGenerator = () => {
    router.push('/dashboard/report-generator')
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Refinement</h1>
          <p className="text-muted-foreground">
            Refine and polish your generated reports
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={goToReportGenerator}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generator
          </Button>
          
          <Button onClick={saveRefinedContent} disabled={isProcessing}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
      
      {currentSession ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{currentSession.name}</CardTitle>
                  <CardDescription>
                    {sections.length} sections available for refinement
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-1 text-xs bg-muted px-2 py-1 rounded-md">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {currentSession.files.length} source file{currentSession.files.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sections.length > 0 ? (
                <RefinementInterface
                  sections={sections}
                  onSectionUpdate={handleSectionUpdate}
                  onHistoryAdd={handleHistoryAdd}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No content to refine</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This session doesn't have any report content to refine.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={goToReportGenerator}
                  >
                    <FilePlus className="mr-2 h-4 w-4" />
                    Generate a Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No active session</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You need to select or generate a report to refine it.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={goToReportGenerator}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Go to Report Generator
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

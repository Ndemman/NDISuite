"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, FilePlus, FileText, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { OutputConfigurationData } from './output-configuration'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { SessionFile } from '@/contexts/session/session-context'

interface RAGGeneratorProps {
  files: SessionFile[]
  config: OutputConfigurationData
  onGenerationComplete: (result: RAGResult) => void
}

export interface RAGResult {
  id: string
  timestamp: Date
  content: string
  sections: {
    id: string
    title: string
    content: string
    collapsed?: boolean
  }[]
  metadata: {
    wordCount: number
    processingTime: number
    sourcesUsed: string[]
  }
}

export function RAGGenerator({ files, config, onGenerationComplete }: RAGGeneratorProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<RAGResult | null>(null)
  const [sections, setSections] = useState<{ id: string; title: string; content: string; collapsed: boolean }[]>([])
  const [editingContent, setEditingContent] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)

  // Generate the report
  const generateReport = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please add at least one file to generate a report.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // For this demo, we'll simulate the generation process
      // In a real app, this would call an API
      
      // Simulate processing
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15
        
        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(progressInterval)
        }
        
        setProgress(Math.min(Math.round(currentProgress), 100))
      }, 500)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Create a mock result based on the config
      const mockResult: RAGResult = {
        id: `report-${Date.now()}`,
        timestamp: new Date(),
        content: generateMockReportContent(config),
        sections: generateMockSections(config),
        metadata: {
          wordCount: Math.floor(Math.random() * 1500) + 500,
          processingTime: Math.floor(Math.random() * 10) + 2,
          sourcesUsed: files.map(f => f.name)
        }
      }
      
      setResult(mockResult)
      setSections(mockResult.sections.map(s => ({ ...s, collapsed: false })))
      setEditingContent(mockResult.content)
      
      // Notify parent component
      onGenerationComplete(mockResult)
      
      toast({
        title: "Report generated successfully",
        description: `Your report has been generated with ${mockResult.metadata.wordCount} words.`
      })
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Failed to generate report",
        description: "An error occurred while generating the report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Toggle section collapse
  const toggleSection = (id: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === id 
          ? { ...section, collapsed: !section.collapsed } 
          : section
      )
    )
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Save changes
      if (result) {
        const updatedResult = {
          ...result,
          content: editingContent
        }
        setResult(updatedResult)
        
        // Notify parent
        onGenerationComplete(updatedResult)
        
        toast({
          title: "Changes saved",
          description: "Your edits have been saved."
        })
      }
    }
    
    setIsEditing(!isEditing)
  }

  // Generate mock report content based on config
  const generateMockReportContent = (config: OutputConfigurationData): string => {
    const isEnglish = config.language === 'en'
    
    if (isEnglish) {
      return `# ${config.outputFormat || 'Comprehensive Report'}\n\n` +
             `${config.fields.map(f => `## ${f.name}\n${f.description || 'This section provides important information.'}\n\n` +
             `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.\n\n`).join('')}` +
             `## Conclusion\n\n` +
             `This report provides a comprehensive analysis based on the provided files and configuration settings. The findings indicate several key points that should be considered for future action.\n\n` +
             `Thank you for using NDISuite Report Writer.`
    } else {
      // Arabic lorem ipsum equivalent
      return `# ${config.outputFormat || 'تقرير شامل'}\n\n` +
             `${config.fields.map(f => `## ${f.name}\n${f.description || 'يوفر هذا القسم معلومات مهمة.'}\n\n` +
             `هناك حقيقة مثبتة منذ زمن طويل وهي أن المحتوى المقروء لصفحة ما سيلهي القارئ عن التركيز على الشكل الخارجي للنص أو شكل توضع الفقرات في الصفحة التي يقرأها.\n\n`).join('')}` +
             `## الخلاصة\n\n` +
             `يقدم هذا التقرير تحليلاً شاملاً استناداً إلى الملفات وإعدادات التكوين المقدمة. تشير النتائج إلى عدة نقاط رئيسية يجب مراعاتها للعمل المستقبلي.\n\n` +
             `شكرا لاستخدامك NDISuite Report Writer.`
    }
  }

  // Generate mock sections based on config
  const generateMockSections = (config: OutputConfigurationData) => {
    const isEnglish = config.language === 'en'
    const sections = [
      {
        id: 'section-1',
        title: isEnglish ? 'Introduction' : 'مقدمة',
        content: isEnglish 
          ? 'This report provides an analysis based on the provided data sources.'
          : 'يقدم هذا التقرير تحليلاً استناداً إلى مصادر البيانات المقدمة.',
        collapsed: false
      }
    ]
    
    // Add sections based on fields
    config.fields.forEach((field, index) => {
      sections.push({
        id: `section-${index + 2}`,
        title: field.name,
        content: field.description || (isEnglish 
          ? 'This section contains important information related to the analysis.'
          : 'يحتوي هذا القسم على معلومات مهمة تتعلق بالتحليل.'),
        collapsed: false
      })
    })
    
    // Add conclusion
    sections.push({
      id: `section-${sections.length + 1}`,
      title: isEnglish ? 'Conclusion' : 'الخلاصة',
      content: isEnglish
        ? 'Based on the analysis, several key findings have been identified that require attention.'
        : 'استناداً إلى التحليل، تم تحديد العديد من النتائج الرئيسية التي تتطلب الاهتمام.',
      collapsed: false
    })
    
    return sections
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
          <CardDescription>
            Generate a structured report based on your files and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium">Selected Files</h3>
              <div className="flex flex-wrap gap-2">
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files selected</p>
                ) : (
                  files.map((file) => (
                    <Badge key={file.id} variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {file.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium">Output Configuration</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{config.language === 'en' ? 'English' : 'العربية'}</Badge>
                {config.fields.length > 0 && (
                  <Badge variant="outline">{config.fields.length} fields</Badge>
                )}
              </div>
              {config.outputFormat && (
                <p className="text-sm text-muted-foreground">
                  {config.outputFormat.length > 100 
                    ? `${config.outputFormat.substring(0, 100)}...` 
                    : config.outputFormat}
                </p>
              )}
            </div>
            
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Generating report...</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={generateReport} 
            disabled={isGenerating || files.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Generated Report</CardTitle>
              <CardDescription>
                Generated on {result.timestamp.toLocaleString()}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleEditMode}
            >
              {isEditing ? 'Save Changes' : 'Edit Report'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <Textarea 
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="min-h-[300px] font-mono"
              />
            ) : (
              <>
                <div className="prose dark:prose-invert max-w-none">
                  {/* Format markdown content for display */}
                  <div dangerouslySetInnerHTML={{ 
                    __html: result.content.replace(/^# (.*)/gm, '<h1>$1</h1>')
                                         .replace(/^## (.*)/gm, '<h2>$1</h2>')
                                         .replace(/^### (.*)/gm, '<h3>$1</h3>')
                                         .replace(/\n\n/g, '</p><p>')
                                         .replace(/^(.+)$/gm, '$1')
                  }} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Report Sections</h3>
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <div key={section.id} className="border rounded-md">
                        <div 
                          className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted"
                          onClick={() => toggleSection(section.id)}
                        >
                          <span className="font-medium">{section.title}</span>
                          {section.collapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </div>
                        {!section.collapsed && (
                          <div className="p-2 pt-0 border-t">
                            <p className="text-sm">{section.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Word count:</span>
                <span>{result.metadata.wordCount} words</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Processing time:</span>
                <span>{result.metadata.processingTime} seconds</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sources used:</span>
                <span>{result.metadata.sourcesUsed.length} files</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              <FilePlus className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (result) {
                  // In a real app, this would save to backend
                  toast({
                    title: "Report saved",
                    description: "Your report has been saved successfully."
                  })
                }
              }}
            >
              Save Report
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

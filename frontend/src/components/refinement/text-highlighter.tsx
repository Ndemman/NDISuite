"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MessageSquare, Edit, Trash, Copy, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export interface Highlight {
  id: string
  startIndex: number
  endIndex: number
  text: string
  note?: string
  color?: string
}

interface TextHighlighterProps {
  content: string
  highlights: Highlight[]
  onHighlightAdd: (highlight: Highlight) => void
  onHighlightUpdate: (id: string, highlight: Partial<Highlight>) => void
  onHighlightDelete: (id: string) => void
  readOnly?: boolean
}

export function TextHighlighter({
  content,
  highlights,
  onHighlightAdd,
  onHighlightUpdate,
  onHighlightDelete,
  readOnly = false
}: TextHighlighterProps) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState<string>('')
  const [selectionRange, setSelectionRange] = useState<{ start: number, end: number } | null>(null)
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string>('')
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false)
  const [highlightColors] = useState<string[]>([
    'bg-yellow-200 text-yellow-800 dark:bg-yellow-500/30 dark:text-yellow-200',
    'bg-green-200 text-green-800 dark:bg-green-500/30 dark:text-green-200',
    'bg-blue-200 text-blue-800 dark:bg-blue-500/30 dark:text-blue-200',
    'bg-purple-200 text-purple-800 dark:bg-purple-500/30 dark:text-purple-200',
    'bg-pink-200 text-pink-800 dark:bg-pink-500/30 dark:text-pink-200'
  ])

  // Handle text selection
  const handleTextSelection = () => {
    if (readOnly) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) {
      setSelectedText('')
      setSelectionRange(null)
      return
    }

    // Get the container element
    const container = containerRef.current
    if (!container) return

    // Calculate the start and end indices
    const containerRange = document.createRange()
    containerRange.selectNodeContents(container)
    const startOffset = range.startOffset
    const startContainer = range.startContainer

    // Calculate the absolute start index
    let startIndex = 0
    if (startContainer.nodeType === Node.TEXT_NODE && startContainer.parentNode) {
      // Find all previous text nodes
      const treeWalker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      )
      
      let currentNode = treeWalker.nextNode()
      while (currentNode && currentNode !== startContainer) {
        startIndex += currentNode.textContent?.length || 0
        currentNode = treeWalker.nextNode()
      }
      
      startIndex += startOffset
    }

    const endIndex = startIndex + (range.toString().length || 0)
    
    // If selection is within an existing highlight, don't create a new one
    const isWithinHighlight = highlights.some(
      h => startIndex >= h.startIndex && endIndex <= h.endIndex
    )
    
    if (isWithinHighlight) {
      setSelectedText('')
      setSelectionRange(null)
      return
    }

    const selectedText = range.toString()
    if (selectedText && selectedText.trim().length > 0) {
      setSelectedText(selectedText)
      setSelectionRange({ start: startIndex, end: endIndex })
    }
  }

  // Create a new highlight
  const createHighlight = () => {
    if (!selectionRange || !selectedText || selectedText.trim().length === 0) return

    const randomColorIndex = Math.floor(Math.random() * highlightColors.length)
    
    const newHighlight: Highlight = {
      id: `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      startIndex: selectionRange.start,
      endIndex: selectionRange.end,
      text: selectedText,
      color: highlightColors[randomColorIndex]
    }
    
    onHighlightAdd(newHighlight)
    setActiveHighlight(newHighlight.id)
    setShowNoteInput(true)
    setSelectedText('')
    setSelectionRange(null)
    
    // Clear the selection
    window.getSelection()?.removeAllRanges()
  }

  // Update highlight note
  const updateHighlightNote = () => {
    if (!activeHighlight) return
    
    onHighlightUpdate(activeHighlight, { note: editingNote })
    setShowNoteInput(false)
    setEditingNote('')
    
    toast({
      title: "Note saved",
      description: "Your annotation has been saved."
    })
  }

  // Handle highlight click
  const handleHighlightClick = (id: string) => {
    setActiveHighlight(id === activeHighlight ? null : id)
    
    const highlight = highlights.find(h => h.id === id)
    setEditingNote(highlight?.note || '')
  }

  // Delete highlight
  const deleteHighlight = (id: string) => {
    onHighlightDelete(id)
    
    if (activeHighlight === id) {
      setActiveHighlight(null)
      setShowNoteInput(false)
      setEditingNote('')
    }
  }

  // Copy highlight to clipboard
  const copyHighlightText = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The highlighted text has been copied."
        })
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Failed to copy text to clipboard."
        })
      })
  }

  // Render the content with highlights
  const renderContentWithHighlights = () => {
    if (!content) return null

    let lastIndex = 0
    const pieces = []

    // Sort highlights by startIndex to process them in order
    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex)

    for (const highlight of sortedHighlights) {
      // Add text before this highlight
      if (highlight.startIndex > lastIndex) {
        pieces.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, highlight.startIndex)}
          </span>
        )
      }

      // Add the highlighted text
      pieces.push(
        <span
          key={highlight.id}
          className={`cursor-pointer ${highlight.color || 'bg-yellow-200'} rounded px-0.5 ${
            activeHighlight === highlight.id ? 'ring-2 ring-offset-2 ring-primary' : ''
          }`}
          onClick={() => handleHighlightClick(highlight.id)}
        >
          {content.substring(highlight.startIndex, highlight.endIndex)}
        </span>
      )

      lastIndex = highlight.endIndex
    }

    // Add any remaining text
    if (lastIndex < content.length) {
      pieces.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      )
    }

    return pieces
  }

  // Add selection event listener
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection)
    return () => {
      document.removeEventListener('mouseup', handleTextSelection)
    }
  }, [highlights, readOnly])

  // Get the active highlight
  const activeHighlightData = activeHighlight 
    ? highlights.find(h => h.id === activeHighlight) 
    : null

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Text container with highlights */}
        <div 
          ref={containerRef}
          className="prose dark:prose-invert max-w-none p-4 bg-card rounded-md border whitespace-pre-wrap"
        >
          {renderContentWithHighlights()}
        </div>
        
        {/* Floating toolbar for selection */}
        {selectedText && selectionRange && !readOnly && (
          <div className="absolute z-10 bg-popover text-popover-foreground shadow-md rounded-md p-1 flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={createHighlight}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Highlight and annotate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyHighlightText(selectedText)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      
      {/* Annotation editor */}
      {activeHighlightData && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Selected Text:</p>
                <p className="text-sm text-muted-foreground">
                  {activeHighlightData.text.length > 100 
                    ? `${activeHighlightData.text.substring(0, 100)}...` 
                    : activeHighlightData.text}
                </p>
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyHighlightText(activeHighlightData.text)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteHighlight(activeHighlightData.id)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Annotation:</p>
                {!showNoteInput && activeHighlightData.note && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowNoteInput(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {showNoteInput ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[80px] bg-background"
                    value={editingNote}
                    onChange={e => setEditingNote(e.target.value)}
                    placeholder="Add a note to this highlight..."
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowNoteInput(false)
                        setEditingNote(activeHighlightData.note || '')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={updateHighlightNote}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Save Note
                    </Button>
                  </div>
                </div>
              ) : (
                activeHighlightData.note ? (
                  <p className="text-sm p-2 bg-muted rounded-md">
                    {activeHighlightData.note}
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowNoteInput(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

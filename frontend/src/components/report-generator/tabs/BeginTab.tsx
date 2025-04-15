"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mic, Upload } from 'lucide-react'
import { SessionData } from '@/contexts/session/session-context'

interface BeginTabProps {
  sessions: SessionData[]
  onSessionSelect: (session: SessionData) => void
  onRecordingSelect: () => void
  onUploadSelect: () => void
  selectedOption: 'record' | 'upload' | null
  onContinue: () => void
}

export function BeginTab({
  sessions,
  onSessionSelect,
  onRecordingSelect,
  onUploadSelect,
  selectedOption,
  onContinue
}: BeginTabProps) {
  const recentRecordings = sessions
    .filter(s => s.type === 'recording' && s.status === 'completed')
    .slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Begin Your Report</CardTitle>
        <CardDescription>
          Choose how you want to start creating your report
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <Card 
            className="bg-card hover:bg-card/80 transition-colors cursor-pointer overflow-hidden border-2" 
            onClick={onRecordingSelect}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Record Audio</h3>
                  <p className="text-sm text-muted-foreground">Start a new audio recording</p>
                </div>
                <Button 
                  variant="ghost" 
                  className="mt-2 group" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecordingSelect();
                  }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-card hover:bg-card/80 transition-colors cursor-pointer overflow-hidden border-2" 
            onClick={onUploadSelect}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Upload Files</h3>
                  <p className="text-sm text-muted-foreground">Upload documents or audio files</p>
                </div>
                <Button 
                  variant="ghost" 
                  className="mt-2 group" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUploadSelect();
                  }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {recentRecordings.length > 0 && (
          <div className="w-full mt-6">
            <h3 className="text-lg font-medium mb-2">Recent Recordings</h3>
            {recentRecordings.map(session => (
              <div 
                key={session.id}
                className="flex items-center p-3 border rounded-md mb-2 cursor-pointer hover:bg-accent"
                onClick={() => onSessionSelect(session)}
              >
                <Mic className="h-4 w-4 mr-3 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  onSessionSelect(session);
                }}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={onContinue}
          disabled={!selectedOption}
        >
          Go to Data
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default React.memo(BeginTab)

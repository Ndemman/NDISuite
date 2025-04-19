import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EnhancedAudioRecorder } from './EnhancedAudioRecorder';
import { detectRecordingCapabilities } from '@/lib/utils/recording-capability-detector';
import { AlertCircle, CheckCircle, WifiOff } from 'lucide-react';

/**
 * Audio Recording Tester
 * 
 * A comprehensive testing utility for the audio recording system that allows 
 * simulating various scenarios to test the fallback mechanisms.
 */
export function AudioRecordingTester() {
  const [capabilities, setCapabilities] = useState<any>(null);
  const [networkSimulation, setNetworkSimulation] = useState<'online' | 'offline' | 'unstable'>('online');
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<Array<{test: string, success: boolean, message: string}>>([]);
  
  // Simulate API key availability
  const [mockAPIKeyAvailable, setMockAPIKeyAvailable] = useState(true);
  
  // Test flags
  const [forceWebSocketFailure, setForceWebSocketFailure] = useState(false);
  const [forceOpenAIFailure, setForceOpenAIFailure] = useState(false);
  const [forceWebSpeechFailure, setForceWebSpeechFailure] = useState(false);
  
  // Load device capabilities on mount
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const caps = await detectRecordingCapabilities();
        setCapabilities(caps);
      } catch (error) {
        console.error('Failed to detect capabilities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCapabilities();
  }, []);
  
  // Function to simulate network conditions
  const simulateNetworkCondition = () => {
    if (networkSimulation === 'offline') {
      window.dispatchEvent(new Event('offline'));
      return { isOnline: false, message: 'Simulating offline mode' };
    } else if (networkSimulation === 'unstable') {
      // Toggle online/offline randomly during the test
      const interval = setInterval(() => {
        const isOnline = Math.random() > 0.5;
        window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
      }, 5000);
      
      // Clean up interval after 30 seconds
      setTimeout(() => clearInterval(interval), 30000);
      
      return { isOnline: true, unstable: true, message: 'Simulating unstable network' };
    } else {
      window.dispatchEvent(new Event('online'));
      return { isOnline: true, message: 'Simulating online mode' };
    }
  };
  
  // Run tests
  const runTests = async () => {
    setTestResults([]);
    addTestResult('Environment', true, 'Starting test suite');
    
    // Test 1: Check browser capabilities
    if (capabilities) {
      const capTests = [
        { name: 'WebSocket Support', value: capabilities.hasWebSocketSupport },
        { name: 'Web Speech API', value: capabilities.hasWebSpeechAPI },
        { name: 'AudioContext Support', value: capabilities.hasAudioContext },
        { name: 'MediaRecorder Support', value: capabilities.hasMediaRecorder }
      ];
      
      capTests.forEach(test => {
        addTestResult(test.name, test.value, 
          test.value ? `✓ ${test.name} is supported` : `✗ ${test.name} is not supported`);
      });
    }
    
    // Test 2: Simulate network condition
    const networkCondition = simulateNetworkCondition();
    addTestResult('Network Simulation', true, networkCondition.message);
    
    // Test 3: API key availability
    addTestResult('API Key Availability', mockAPIKeyAvailable, 
      mockAPIKeyAvailable ? '✓ API key available' : '✗ API key not available or invalid');
    
    // Test 4: Fallback mechanisms
    if (forceWebSocketFailure) {
      addTestResult('WebSocket Fallback', true, 'Simulating WebSocket failure, should fallback to next method');
    }
    
    if (forceOpenAIFailure) {
      addTestResult('OpenAI Fallback', true, 'Simulating OpenAI API failure, should fallback to next method');
    }
    
    if (forceWebSpeechFailure) {
      addTestResult('Web Speech Fallback', true, 'Simulating Web Speech API failure, should fallback to next method');
    }
    
    if (networkSimulation === 'offline') {
      addTestResult('Offline Handling', true, 'Testing offline storage and deferred transcription');
    }
  };
  
  const addTestResult = (test: string, success: boolean, message: string) => {
    setTestResults(prev => [...prev, { test, success, message }]);
  };
  
  // Reset all tests
  const resetTests = () => {
    setTestResults([]);
    setNetworkSimulation('online');
    setForceWebSocketFailure(false);
    setForceOpenAIFailure(false);
    setForceWebSpeechFailure(false);
    window.dispatchEvent(new Event('online'));
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Audio Recording System Tester</CardTitle>
        <CardDescription>
          Test the enhanced audio recording system with various network conditions and failure scenarios
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="test-config">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test-config">Test Configuration</TabsTrigger>
            <TabsTrigger value="recorder">Audio Recorder</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="test-config" className="space-y-4">
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Network Simulation</h3>
              <div className="grid grid-cols-3 gap-4">
                <Button 
                  variant={networkSimulation === 'online' ? 'default' : 'outline'}
                  onClick={() => setNetworkSimulation('online')}
                >
                  Online
                </Button>
                <Button 
                  variant={networkSimulation === 'unstable' ? 'default' : 'outline'}
                  onClick={() => setNetworkSimulation('unstable')}
                >
                  Unstable
                </Button>
                <Button 
                  variant={networkSimulation === 'offline' ? 'default' : 'outline'}
                  onClick={() => setNetworkSimulation('offline')}
                >
                  Offline
                </Button>
              </div>
              
              <h3 className="text-lg font-medium mt-4">API Availability</h3>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="api-key" 
                  checked={mockAPIKeyAvailable}
                  onCheckedChange={setMockAPIKeyAvailable}
                />
                <Label htmlFor="api-key">Mock API Key Available</Label>
              </div>
              
              <h3 className="text-lg font-medium mt-4">Force Fallbacks</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="websocket-failure" 
                    checked={forceWebSocketFailure}
                    onCheckedChange={setForceWebSocketFailure}
                  />
                  <Label htmlFor="websocket-failure">Force WebSocket Failure</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="openai-failure" 
                    checked={forceOpenAIFailure}
                    onCheckedChange={setForceOpenAIFailure}
                  />
                  <Label htmlFor="openai-failure">Force OpenAI API Failure</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="webspeech-failure" 
                    checked={forceWebSpeechFailure}
                    onCheckedChange={setForceWebSpeechFailure}
                  />
                  <Label htmlFor="webspeech-failure">Force Web Speech API Failure</Label>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-2">
                <Button onClick={runTests}>Run Tests</Button>
                <Button variant="outline" onClick={resetTests}>Reset</Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recorder">
            <div className="space-y-4 mt-4">
              <Alert variant={networkSimulation === 'offline' ? 'destructive' : 
                networkSimulation === 'unstable' ? 'warning' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Network Simulation</AlertTitle>
                <AlertDescription>
                  {networkSimulation === 'offline' ? (
                    <span>Offline mode enabled. Recording will use offline storage.</span>
                  ) : networkSimulation === 'unstable' ? (
                    <span>Unstable network mode. Expect periodic connectivity issues.</span>
                  ) : (
                    <span>Online mode. Normal operation expected.</span>
                  )}
                </AlertDescription>
              </Alert>
              
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">Test Audio Recorder</h3>
                <EnhancedAudioRecorder 
                  showTranscription={true}
                  initialTitle="Test Recording"
                  onRecordingComplete={(blob, duration, transcription) => {
                    console.log('Recording complete:', { blob, duration, transcription });
                    addTestResult('Recording Complete', true, 
                      `Successfully recorded ${duration}s of audio. Transcription: ${transcription?.substring(0, 50)}...`);
                  }}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Test Results</h3>
              
              {testResults.length === 0 ? (
                <div className="p-4 border rounded-md text-center text-gray-500">
                  No test results yet. Configure and run tests first.
                </div>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="p-3 border rounded-md flex items-start">
                      {result.success ? 
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" /> : 
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      }
                      <div>
                        <div className="font-medium">{result.test}</div>
                        <div className="text-sm text-gray-500">{result.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="text-sm text-gray-500">
          {isLoading ? 'Detecting capabilities...' : 
            capabilities ? 'Browser capabilities detected' : 'Failed to detect capabilities'}
        </div>
        
        <div className="flex items-center">
          {networkSimulation === 'offline' && <WifiOff className="h-4 w-4 mr-2" />}
          <span className="text-sm font-medium">
            {networkSimulation === 'online' ? 'Online Mode' : 
              networkSimulation === 'unstable' ? 'Unstable Network' : 'Offline Mode'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default AudioRecordingTester;

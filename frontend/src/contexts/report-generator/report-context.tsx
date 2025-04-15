"use client"

import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'
import { SessionFile } from '@/contexts/session/session-context'
import { OutputConfigurationData } from '@/components/report-generator/output-configuration'
import { RAGResult } from '@/components/report-generator/rag-generator'

// Define the state types
type TabType = 'begin' | 'data' | 'sources' | 'output' | 'generate'
type OptionType = 'record' | 'upload' | null

interface ReportState {
  activeTab: TabType
  selectedOption: OptionType
  selectedFiles: SessionFile[]
  outputConfig: OutputConfigurationData
  generatedReport: RAGResult | null
  isRecordingDialogOpen: boolean
}

// Define action types
type ReportAction = 
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_SELECTED_OPTION'; payload: OptionType }
  | { type: 'ADD_FILES'; payload: SessionFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_OUTPUT_CONFIG'; payload: OutputConfigurationData }
  | { type: 'SET_GENERATED_REPORT'; payload: RAGResult }
  | { type: 'TOGGLE_RECORDING_DIALOG'; payload: boolean }
  | { type: 'RESET_STATE' }

// Initial state
const initialState: ReportState = {
  activeTab: 'begin',
  selectedOption: null,
  selectedFiles: [],
  outputConfig: {
    language: 'en',
    outputFormat: '',
    fields: []
  },
  generatedReport: null,
  isRecordingDialogOpen: false
}

// Create context
const ReportContext = createContext<{
  state: ReportState
  dispatch: React.Dispatch<ReportAction>
  // Helper functions
  navigateToTab: (tab: TabType) => void
  selectOption: (option: OptionType) => void
  addFiles: (files: SessionFile[]) => void
  removeFile: (fileId: string) => void
  setOutputConfig: (config: OutputConfigurationData) => void
  setGeneratedReport: (report: RAGResult) => void
  toggleRecordingDialog: (isOpen: boolean) => void
  resetState: () => void
  // Computed values
  canConfigureOutput: boolean
  canGenerateReport: boolean
} | undefined>(undefined)

// Reducer function
function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
    case 'SET_SELECTED_OPTION':
      return { ...state, selectedOption: action.payload }
    case 'ADD_FILES':
      return { 
        ...state, 
        selectedFiles: [...state.selectedFiles, ...action.payload] 
      }
    case 'REMOVE_FILE':
      return { 
        ...state, 
        selectedFiles: state.selectedFiles.filter(file => file.id !== action.payload) 
      }
    case 'SET_OUTPUT_CONFIG':
      return { ...state, outputConfig: action.payload }
    case 'SET_GENERATED_REPORT':
      return { ...state, generatedReport: action.payload }
    case 'TOGGLE_RECORDING_DIALOG':
      return { ...state, isRecordingDialogOpen: action.payload }
    case 'RESET_STATE':
      return initialState
    default:
      return state
  }
}

// Provider component
export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reportReducer, initialState)
  
  // Helper functions
  const navigateToTab = useCallback((tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
  }, [])
  
  const selectOption = useCallback((option: OptionType) => {
    dispatch({ type: 'SET_SELECTED_OPTION', payload: option })
  }, [])
  
  const addFiles = useCallback((files: SessionFile[]) => {
    dispatch({ type: 'ADD_FILES', payload: files })
  }, [])
  
  const removeFile = useCallback((fileId: string) => {
    dispatch({ type: 'REMOVE_FILE', payload: fileId })
  }, [])
  
  const setOutputConfig = useCallback((config: OutputConfigurationData) => {
    dispatch({ type: 'SET_OUTPUT_CONFIG', payload: config })
  }, [])
  
  const setGeneratedReport = useCallback((report: RAGResult) => {
    dispatch({ type: 'SET_GENERATED_REPORT', payload: report })
  }, [])
  
  const toggleRecordingDialog = useCallback((isOpen: boolean) => {
    dispatch({ type: 'TOGGLE_RECORDING_DIALOG', payload: isOpen })
  }, [])
  
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
  }, [])
  
  // Computed values
  const canConfigureOutput = useMemo(() => state.selectedFiles.length > 0, [state.selectedFiles])
  
  const canGenerateReport = useMemo(() => 
    state.outputConfig.outputFormat !== '' && state.selectedFiles.length > 0, 
    [state.outputConfig, state.selectedFiles]
  )
  
  // Create context value
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    navigateToTab,
    selectOption,
    addFiles,
    removeFile,
    setOutputConfig,
    setGeneratedReport,
    toggleRecordingDialog,
    resetState,
    canConfigureOutput,
    canGenerateReport
  }), [
    state, 
    navigateToTab, 
    selectOption, 
    addFiles, 
    removeFile, 
    setOutputConfig, 
    setGeneratedReport, 
    toggleRecordingDialog,
    resetState,
    canConfigureOutput,
    canGenerateReport
  ])
  
  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  )
}

// Custom hook to use the context
export function useReport() {
  const context = useContext(ReportContext)
  
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider')
  }
  
  return context
}

export default ReportContext

"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RecordingContextType {
  isRecording: boolean;
  recordingType: 'interview' | 'quick-story' | 'conversation' | null;
  startRecording: (type: 'interview' | 'quick-story' | 'conversation') => void;
  stopRecording: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'interview' | 'quick-story' | 'conversation' | null>(null);

  const startRecording = useCallback((type: 'interview' | 'quick-story' | 'conversation') => {
    setIsRecording(true);
    setRecordingType(type);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingType(null);
  }, []);

  return (
    <RecordingContext.Provider
      value={{
        isRecording,
        recordingType,
        startRecording,
        stopRecording
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecordingState() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecordingState must be used within a RecordingProvider');
  }
  return context;
}
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AccessibilityContextType {
  isLowBandwidthMode: boolean;
  setIsLowBandwidthMode: (isLow: boolean) => void;
  isVoiceGuidanceEnabled: boolean;
  setIsVoiceGuidanceEnabled: (isEnabled: boolean) => void;
  language: string;
  setLanguage: (language: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [isLowBandwidthMode, setIsLowBandwidthMode] = useState(false);
  const [isVoiceGuidanceEnabled, setIsVoiceGuidanceEnabled] = useState(false);
  const [language, setLanguage] = useState('en-US');

  return (
    <AccessibilityContext.Provider value={{ isLowBandwidthMode, setIsLowBandwidthMode, isVoiceGuidanceEnabled, setIsVoiceGuidanceEnabled, language, setLanguage }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

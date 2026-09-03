"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { WhiteLabelConfig } from "@/types/white-label.types";
import { defaultWhiteLabelConfig } from "@/config/white-label.config";

interface WhiteLabelContextType {
  config: WhiteLabelConfig;
  updateConfig: (newConfig: Partial<WhiteLabelConfig>) => void;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

export function WhiteLabelProvider({
  children,
  initialConfig = defaultWhiteLabelConfig,
}: {
  children: React.ReactNode;
  initialConfig?: WhiteLabelConfig;
}) {
  const [config, setConfig] = useState<WhiteLabelConfig>(initialConfig);

  const updateConfig = useCallback((newConfig: Partial<WhiteLabelConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return (
    <WhiteLabelContext.Provider value={{ config, updateConfig }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error("useWhiteLabel deve ser usado dentro de um WhiteLabelProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { DiseaseName } from "@/lib/simulation";

interface SimulationState {
  disease: DiseaseName;
  pca: number;
  noise: number;
  isSimulating: boolean;
  runStage: string;
  setDisease: (d: DiseaseName) => void;
  setPca: (p: number) => void;
  setNoise: (n: number) => void;
  runSimulation: () => void;
}

const SimulationContext = createContext<SimulationState | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [disease, setDisease] = useState<DiseaseName>("Breast Cancer");
  const [pca, setPca] = useState<number>(4);
  const [noise, setNoise] = useState<number>(0.15);
  const [isSimulating, setIsSimulating] = useState(false);
  const [runStage, setRunStage] = useState<string>("");

  const runSimulation = () => {
    setIsSimulating(true);
    setRunStage("Initializing Quantum Backend...");
    
    setTimeout(() => {
      setRunStage(`Encoding ${pca}D Features...`);
    }, 800);

    setTimeout(() => {
      setRunStage(`Injecting Depolarizing Noise (p=${noise.toFixed(2)})...`);
    }, 1600);

    setTimeout(() => {
      setRunStage("Evaluating Ensemble Predictors...");
    }, 2400);

    setTimeout(() => {
      setRunStage("Computing Secondary Metrics...");
    }, 3200);

    setTimeout(() => {
      setRunStage("");
      setIsSimulating(false);
    }, 4000);
  };

  return (
    <SimulationContext.Provider value={{
      disease, pca, noise, isSimulating, runStage,
      setDisease, setPca, setNoise, runSimulation
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}

"use client";

import { useSimulation } from "./SimulationContext";
import { Loader2, Play, Activity } from "lucide-react";
import { DiseaseName, simulateAccuracy } from "@/lib/simulation";

export function GlobalHeader() {
  const { disease, setDisease, pca, setPca, noise, setNoise, isSimulating, runStage, runSimulation } = useSimulation();

  // Calculate current runtime based on active context
  const currentSim = simulateAccuracy(disease, pca, noise);

  return (
    <div className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto justify-between">
        
        {/* Controls Section */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Dataset</label>
            <select 
              value={disease}
              onChange={(e) => setDisease(e.target.value as DiseaseName)}
              disabled={isSimulating}
              className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block w-40 p-1.5 outline-none disabled:opacity-50"
            >
              <option>Breast Cancer</option>
              <option>Acute Nephritis</option>
              <option>Heart Failure</option>
              <option>Thyroid Disease</option>
              <option>Hepatitis C</option>
              <option>Parkinson's</option>
              <option>Heart Disease</option>
            </select>
          </div>

          <div className="flex flex-col hidden sm:flex">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">PCA</label>
            <select 
              value={pca}
              onChange={(e) => setPca(Number(e.target.value))}
              disabled={isSimulating}
              className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block w-24 p-1.5 outline-none disabled:opacity-50"
            >
              <option value="2">2D</option>
              <option value="4">4D</option>
              <option value="8">8D</option>
              <option value="16">16D</option>
            </select>
          </div>

          <div className="flex flex-col w-32 hidden md:flex">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 flex justify-between">
              <span>Noise p</span>
              <span className="text-pink-400">{noise.toFixed(2)}</span>
            </label>
            <input 
              type="range" min="0" max="0.5" step="0.01" 
              value={noise}
              onChange={(e) => setNoise(Number(e.target.value))}
              disabled={isSimulating}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 mt-1.5 disabled:opacity-50" 
            />
          </div>

          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="ml-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium rounded text-xs px-4 py-1.5 flex items-center transition-colors h-[30px] self-end mb-[2px]"
          >
            {isSimulating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
            Run
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-4 lg:space-x-8 border-l border-gray-800 pl-4 lg:pl-8">
          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Backend</span>
            <span className="text-xs font-mono text-gray-300 flex items-center">
              AerSimulator
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Est. Runtime</span>
            <span className="text-xs font-mono text-blue-400">
              {isSimulating ? <span className="animate-pulse">Computing...</span> : currentSim.secondary.runtime}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">State</span>
            <span className="text-xs font-mono flex items-center">
              {isSimulating ? (
                <span className="text-yellow-400 animate-pulse flex items-center">
                  <Activity className="w-3 h-3 mr-1" /> Executing
                </span>
              ) : (
                <span className="text-green-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> Idle
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      
      {/* Loading Bar Overlay */}
      {isSimulating && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-blue-500 animate-[loading_4s_ease-in-out]" style={{ width: '100%' }}></div>
      )}
    </div>
  );
}

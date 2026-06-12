"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from "recharts";
import { ShieldAlert, Activity, Wifi, ArrowRight, Clock, Zap } from "lucide-react";
import { useSimulation } from "@/components/SimulationContext";
import { simulateAccuracy } from "@/lib/simulation";

const NOISE_LEVELS = [0.0, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50];

export default function NoiseAnalysis() {
  const { disease, pca, noise, isSimulating, runStage } = useSimulation();

  // Generate degradation curve using the simulation engine
  const noiseData = NOISE_LEVELS.map(p => {
    const acc = simulateAccuracy(disease, pca, p);
    return {
      probability: p,
      QK: acc.QK,
      Hybrid: acc.Hybrid
    };
  });

  // Calculate robustness score 
  const scoreAt30 = simulateAccuracy(disease, pca, 0.30);
  const robustnessScore = Math.max(0, Math.min(10, (scoreAt30.Hybrid - 40) / 6));

  const complexityLevel = pca > 8 ? "High" : pca > 4 ? "Moderate" : "Low";
  const complexityColor = pca > 8 ? "text-red-400" : pca > 4 ? "text-yellow-400" : "text-green-400";
  const currentSim = simulateAccuracy(disease, pca, noise);

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-100">Quantum Noise Analysis</h1>
        <p className="text-gray-400 mt-1">Evaluating meta-learner resilience to quantum depolarization</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="col-span-1 md:col-span-2 h-[500px] flex flex-col relative overflow-hidden group">
          {isSimulating && (
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
              <Activity className="w-10 h-10 text-pink-500 animate-pulse mb-4" />
              <p className="text-sm font-mono text-pink-400 animate-pulse tracking-widest">{runStage}</p>
            </div>
          )}
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl group-hover:bg-pink-500/10 transition-colors duration-700 z-0"></div>
          
          <h2 className="text-lg font-semibold text-gray-200 mb-6 flex justify-between items-center z-10">
            <span className="flex items-center"><Wifi className="w-5 h-5 mr-2 text-pink-400" /> Noise Degradation Curve</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full font-mono">Dataset: {disease}</span>
          </h2>
          <div className="flex-1 w-full h-full min-h-0 z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={noiseData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="probability" stroke="#9CA3AF" fontSize={12} 
                  label={{ value: 'Depolarizing Error Probability (p)', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
                />
                <YAxis 
                  domain={[30, 100]} stroke="#9CA3AF" fontSize={12} 
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6' }}
                  itemStyle={{ fontSize: 13, fontWeight: 500 }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Line type="monotone" dataKey="QK" name="Standalone QK-SVM" stroke="#ec4899" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="Hybrid" name="HQ-Stack Ensemble" stroke="#ef4444" strokeWidth={3} dot={{ r: 6, fill: '#ef4444' }} activeDot={{ r: 8 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="text-center py-6 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-t ${robustnessScore > 7 ? 'from-green-500/10' : 'from-yellow-500/10'} to-transparent`}></div>
            <Activity className={`w-8 h-8 mx-auto mb-2 ${robustnessScore > 7 ? 'text-green-400' : 'text-yellow-400'}`} />
            <h3 className="text-gray-400 font-medium text-xs uppercase tracking-wider">Hybrid Robustness Score</h3>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mt-2">
              {isSimulating ? "-" : robustnessScore.toFixed(1)}<span className="text-xl text-gray-500">/10</span>
            </div>
          </GlassCard>

          <GlassCard className="bg-gray-900/40">
            <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-indigo-400" />
              Runtime Metrics
            </h2>
            <ul className="space-y-3 text-xs text-gray-400">
              <li className="flex justify-between border-b border-gray-800 pb-1">
                <span>Circuit Execution</span>
                <span className="font-mono text-gray-200">{isSimulating ? "---" : currentSim.secondary.runtime}</span>
              </li>
              <li className="flex justify-between border-b border-gray-800 pb-1">
                <span>Shots Simulated</span>
                <span className="font-mono text-gray-200">1024</span>
              </li>
              <li className="flex justify-between border-b border-gray-800 pb-1">
                <span>Total Gate Count</span>
                <span className="font-mono text-gray-200">{pca * 8}</span>
              </li>
              <li className="flex justify-between pt-1">
                <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> Circuit Complexity</span>
                <span className={`font-semibold ${complexityColor}`}>{complexityLevel}</span>
              </li>
            </ul>
          </GlassCard>

          <GlassCard>
            <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2 text-blue-400" />
              HQ-Stack Pipeline Flow
            </h2>
            <div className="space-y-2">
              <div className="bg-gray-900/80 p-2 rounded-lg border border-gray-800 text-center text-xs font-medium text-gray-300">
                Classical Dataset ({disease})
              </div>
              <div className="flex justify-center"><ArrowRight className="w-3 h-3 text-gray-600 rotate-90" /></div>
              <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-900/50 text-center text-xs font-medium text-blue-400">
                PCA Compression ({pca}D)
              </div>
              <div className="flex justify-center"><ArrowRight className="w-3 h-3 text-gray-600 rotate-90" /></div>
              <div className={`p-2 rounded-lg border text-center text-xs font-medium ${isSimulating ? 'bg-pink-900/40 border-pink-500 animate-pulse text-pink-300' : 'bg-pink-900/20 border-pink-900/50 text-pink-400'}`}>
                ZZFeatureMap (p={noise.toFixed(2)})
              </div>
              <div className="flex justify-center"><ArrowRight className="w-3 h-3 text-gray-600 rotate-90" /></div>
              <div className="bg-red-900/20 p-2 rounded-lg border border-red-900/50 text-center text-xs font-medium text-red-400">
                Logistic Meta-Learner Correction
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

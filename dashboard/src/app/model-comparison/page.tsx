"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Cpu, Fingerprint, Activity, Clock, ShieldAlert, Target } from "lucide-react";
import { useSimulation } from "@/components/SimulationContext";
import { simulateAccuracy } from "@/lib/simulation";

const DATASET_SIZES = [
  { size: 50, mult: 0.1 },
  { size: 100, mult: 0.25 },
  { size: 150, mult: 0.4 },
  { size: 200, mult: 0.6 },
  { size: 300, mult: 0.8 },
  { size: 500, mult: 1.0 },
];

export default function ModelComparisonLab() {
  const { disease, pca, noise, isSimulating, runStage } = useSimulation();

  // Generate dynamic line chart data based on current state with pseudo-random jitter
  const chartData = DATASET_SIZES.map(({ size, mult }) => {
    const acc = simulateAccuracy(disease, pca, noise, mult);
    return {
      size,
      SVM: acc.SVM,
      LR: acc.LR,
      RF: acc.RF,
      QK: acc.QK,
      Hybrid: acc.Hybrid,
      varianceRetained: acc.varianceRetained
    };
  });

  const finalMetrics = simulateAccuracy(disease, pca, noise, 1.0);
  const currentVariance = finalMetrics.varianceRetained;
  const secondary = finalMetrics.secondary;

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-100">Model Comparison Lab</h1>
        <p className="text-gray-400 mt-1">Interactive scaling analysis for the HQ-Stack Hybrid Ensemble</p>
      </motion.div>

      {/* Main Chart Area */}
      <GlassCard className="h-[500px] flex flex-col relative overflow-hidden">
        {isSimulating && (
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Activity className="w-10 h-10 text-blue-500 animate-pulse mb-4" />
            <p className="text-sm font-mono text-blue-400 animate-pulse tracking-widest">{runStage}</p>
          </div>
        )}
        <h2 className="text-lg font-semibold text-gray-200 mb-6 flex justify-between items-center z-0">
          <span>Accuracy vs Dataset Size — {disease}</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full font-mono">p={noise.toFixed(2)} | PCA={pca}D</span>
        </h2>
        <div className="flex-1 w-full h-full min-h-0 z-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="size" stroke="#9CA3AF" fontSize={12} 
                label={{ value: 'Dataset Size (N)', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
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
              
              <Line type="monotone" dataKey="SVM" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="LR" name="Logistic Reg." stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="RF" name="Random Forest" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="QK" name="QK-SVM (Sim)" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="Hybrid" name="HQ-Stack" stroke="#ef4444" strokeWidth={3} dot={{ r: 6, fill: '#ef4444' }} activeDot={{ r: 8 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Secondary Metrics Mini-Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 bg-gray-900/40">
          <div className="flex items-center text-gray-400 mb-2">
            <Target className="w-4 h-4 mr-2" />
            <h3 className="text-xs uppercase font-semibold tracking-wider">ROC-AUC</h3>
          </div>
          <div className="text-2xl font-mono text-gray-200">
            {isSimulating ? "---" : secondary.rocAuc.toFixed(3)}
          </div>
        </GlassCard>

        <GlassCard className="p-4 bg-gray-900/40">
          <div className="flex items-center text-gray-400 mb-2">
            <Fingerprint className="w-4 h-4 mr-2" />
            <h3 className="text-xs uppercase font-semibold tracking-wider">F1 Score</h3>
          </div>
          <div className="text-2xl font-mono text-gray-200">
            {isSimulating ? "---" : secondary.f1Score.toFixed(3)}
          </div>
        </GlassCard>

        <GlassCard className="p-4 bg-gray-900/40">
          <div className="flex items-center text-gray-400 mb-2">
            <Clock className="w-4 h-4 mr-2" />
            <h3 className="text-xs uppercase font-semibold tracking-wider">Circuit Runtime</h3>
          </div>
          <div className="text-2xl font-mono text-gray-200">
            {isSimulating ? "---" : secondary.runtime}
          </div>
        </GlassCard>

        <GlassCard className="p-4 bg-gray-900/40">
          <div className="flex items-center text-gray-400 mb-2">
            <ShieldAlert className="w-4 h-4 mr-2" />
            <h3 className="text-xs uppercase font-semibold tracking-wider">Variance</h3>
          </div>
          <div className="text-2xl font-mono text-gray-200">
            {isSimulating ? "---" : `±${secondary.stability.toFixed(2)}`}
          </div>
        </GlassCard>
      </div>

      {/* Architectural Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="text-md font-semibold text-gray-200 mb-4 flex items-center">
            <Fingerprint className="w-5 h-5 mr-2 text-indigo-400" />
            Experiment Specs
          </h2>
          <ul className="space-y-4 text-sm">
            <li className="flex justify-between items-center pb-2 border-b border-gray-800">
              <span className="text-gray-400">PCA Retained Var.</span>
              <span className={`font-mono px-2 py-0.5 rounded ${currentVariance < 80 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                {currentVariance.toFixed(1)}%
              </span>
            </li>
            <li className="flex justify-between items-center pb-2 border-b border-gray-800">
              <span className="text-gray-400">Quantum Features</span>
              <span className="text-gray-200 font-mono bg-gray-800 px-2 py-0.5 rounded">{pca}</span>
            </li>
            <li className="flex justify-between items-center pb-2 border-b border-gray-800">
              <span className="text-gray-400">Noise Channel</span>
              <span className="text-gray-200 font-mono bg-gray-800 px-2 py-0.5 rounded">Depolarizing</span>
            </li>
          </ul>
        </GlassCard>

        <GlassCard className="bg-gray-900/50 border-gray-800 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${isSimulating ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'}`}></div>
          <h2 className="text-md font-semibold text-gray-200 mb-2 flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-blue-400" />
            Circuit Pipeline
          </h2>
          <div className="text-xs text-gray-400 font-mono bg-black/40 p-3 rounded-lg border border-gray-800 mt-4 leading-relaxed">
            <span className="text-pink-400">Encoding:</span> Angle (Ry)<br/>
            <span className="text-pink-400">FeatureMap:</span> ZZFeatureMap<br/>
            <span className="text-pink-400">Qubits:</span> {pca}<br/>
            <span className="text-pink-400">Entanglement:</span> Full<br/>
            <span className="text-pink-400">Depth:</span> {Math.max(2, pca / 2)}<br/>
            <span className="text-green-400 mt-2 block">
              {isSimulating ? "// Circuit execution pending..." : "// Ready"}
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

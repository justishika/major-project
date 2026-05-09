"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Trophy, TrendingUp, AlertTriangle, Database, Loader2 } from "lucide-react";
import { useSimulation } from "@/components/SimulationContext";
import { simulateAccuracy, DATASET_PROFILES, DiseaseName } from "@/lib/simulation";

const allDiseases: DiseaseName[] = [
  "Breast Cancer", "Acute Nephritis", "Parkinson's", "Hepatitis C", 
  "Heart Disease", "Thyroid Disease", "Heart Failure"
];

export default function CrossDiseaseBenchmarking() {
  const { pca, noise, disease, setDisease, isSimulating } = useSimulation();

  // Generate dynamic leaderboard
  const leaderboard = allDiseases.map(d => {
    const acc = simulateAccuracy(d, pca, noise);
    const bestClassical = Math.max(acc.SVM, acc.LR, acc.RF);
    
    let bestModel = "HQ-Stack";
    let maxAcc = acc.Hybrid;
    
    if (bestClassical > acc.Hybrid) {
      maxAcc = bestClassical;
      if (acc.SVM === bestClassical) bestModel = "SVM";
      else if (acc.LR === bestClassical) bestModel = "Logistic Reg.";
      else bestModel = "Random Forest";
    }

    const gain = acc.Hybrid - bestClassical;
    const gainStr = gain > 0 ? `+${gain.toFixed(1)}%` : `${gain.toFixed(1)}%`;

    return {
      name: d,
      difficulty: DATASET_PROFILES[d].difficulty,
      best: bestModel,
      acc: maxAcc,
      gain: gainStr,
      gainVal: gain
    };
  }).sort((a, b) => b.acc - a.acc);

  const currentProfile = DATASET_PROFILES[disease];

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-100">Cross-Disease Benchmark</h1>
        <p className="text-gray-400 mt-1">Dataset leaderboard and architectural insights</p>
      </motion.div>

      <GlassCard className="relative overflow-hidden">
        {isSimulating && (
          <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
             <p className="text-sm font-mono text-blue-400 animate-pulse">Evaluating benchmark distribution...</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-200">Global Leaderboard (p={noise.toFixed(2)}, PCA={pca}D)</h2>
          <div className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700">Sorted by Best Accuracy</div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Dataset</th>
                <th className="px-6 py-4">Complexity</th>
                <th className="px-6 py-4">Top Architecture</th>
                <th className="px-6 py-4 text-right">Max Accuracy</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">HQ-Stack Gain vs Best Class.</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr 
                  key={row.name} 
                  onClick={() => setDisease(row.name)}
                  className={`border-b border-gray-800 transition-colors cursor-pointer ${disease === row.name ? 'bg-blue-900/20' : 'hover:bg-gray-800/30'}`}
                >
                  <td className="px-6 py-4 font-medium text-gray-200">{row.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      row.difficulty === 'Low' ? 'bg-green-500/10 text-green-400' :
                      row.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {row.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {row.best.includes("HQ-Stack") && <Trophy className="w-4 h-4 text-yellow-500 mr-2" />}
                      <span className={row.best.includes("HQ-Stack") ? "text-yellow-400 font-medium" : "text-gray-300"}>
                        {row.best}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-200">{row.acc.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-right font-mono">
                    <span className={row.gainVal > 0 ? 'text-green-400' : row.gainVal === 0 ? 'text-gray-500' : 'text-red-400'}>
                      {row.gain}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="col-span-1 bg-gray-900/40 relative">
          {isSimulating && <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm z-10" />}
          <h3 className="text-md font-semibold text-gray-200 mb-4 flex items-center">
            <Database className="w-4 h-4 mr-2 text-blue-400" /> 
            Dataset Explorer: {disease}
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Total Samples (N)</span>
              <span className="text-gray-200 font-mono">{currentProfile.samples}</span>
            </li>
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Raw Features</span>
              <span className="text-gray-200 font-mono">{currentProfile.features}</span>
            </li>
            <li className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Class Imbalance</span>
              <span className="text-gray-200 font-mono">{currentProfile.imbalanceRatio}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">PCA Variance ({pca}D)</span>
              <span className={`font-mono ${currentProfile.pcaVarianceMap[pca] < 80 ? 'text-red-400' : 'text-green-400'}`}>
                {currentProfile.pcaVarianceMap[pca]?.toFixed(1)}%
              </span>
            </li>
          </ul>
        </GlassCard>

        <GlassCard className="col-span-2 bg-gradient-to-br from-blue-900/10 to-transparent border-blue-900/20">
          <h3 className="text-lg font-semibold text-blue-400 mb-2 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" /> 
            Architectural Insights
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            The HQ-Stack Hybrid Ensemble demonstrates strong performance on datasets with lower intrinsic dimensionality (e.g., Breast Cancer, Nephritis). The {pca}-qubit Quantum Kernel SVM (QK-SVM) suggests potential separability benefits that the classical meta-learner leverages to boost accuracy.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            However, on highly scattered datasets (e.g., Thyroid Disease, Parkinson's), reducing the feature space down to {pca} dimensions discards critical variance. Classical baselines (like Random Forest) typically outperform the HQ-Stack here unless PCA dimensions are increased or noise is strictly mitigated.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

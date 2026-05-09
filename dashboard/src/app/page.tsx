"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { Database, ShieldCheck, Cpu, Zap, Beaker, Network, Atom, ActivitySquare, Server, Target, FlaskConical, CheckCircle2, Activity } from "lucide-react";
import { useSimulation } from "@/components/SimulationContext";
import { simulateAccuracy, DiseaseName } from "@/lib/simulation";

const allDiseases: DiseaseName[] = [
  "Breast Cancer", "Acute Nephritis", "Parkinson's", "Hepatitis C", 
  "Heart Disease", "Thyroid Disease", "Heart Failure"
];

export default function OverviewDashboard() {
  const { pca, noise, disease } = useSimulation();

  // Generate dynamic data for the bar chart
  const data = allDiseases.map(d => {
    const acc = simulateAccuracy(d, pca, noise);
    return {
      name: d,
      SVM: acc.SVM,
      LR: acc.LR,
      RF: acc.RF,
      QK: acc.QK,
      Hybrid: acc.Hybrid
    };
  });

  const metrics = simulateAccuracy(disease, pca, noise);

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-100">Executive Overview</h1>
          <p className="text-gray-400 mt-1">Hybrid Classical-Quantum Machine Learning Framework</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-blue-900/20 border border-blue-900/50 px-4 py-2 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-sm font-medium text-blue-400">HQ-Stack Active</span>
        </div>
      </motion.div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Peak Accuracy</p>
              <h3 className="text-3xl font-bold text-gray-100">{metrics.Hybrid.toFixed(1)}%</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-blue-400 font-medium">HQ-Stack Ensemble</p>
        </GlassCard>

        <GlassCard className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Target Datasets</p>
              <h3 className="text-3xl font-bold text-gray-100">7</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Multi-Disease Benchmark</p>
        </GlassCard>

        <GlassCard className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Quantum Simulator</p>
              <h3 className="text-xl font-bold text-gray-100 mt-1">AerSimulator</h3>
            </div>
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Server className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <p className="text-xs text-pink-400 font-medium">Statevector (Noisy)</p>
        </GlassCard>

        <GlassCard className="p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Active Feature Space</p>
              <h3 className="text-3xl font-bold text-gray-100">{pca}D</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Network className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-emerald-400 font-medium">PCA Retained: {metrics.varianceRetained.toFixed(1)}%</p>
        </GlassCard>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 flex flex-col h-[500px]">
          <h2 className="text-lg font-semibold text-gray-200 mb-6 flex items-center">
            Cross-Disease Model Performance Benchmarks
            <span className="ml-3 px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 font-mono">
              Live Simulation: p={noise.toFixed(2)}
            </span>
          </h2>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  domain={[40, 100]} 
                  stroke="#9CA3AF" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  cursor={{ fill: '#1F2937', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6' }}
                  itemStyle={{ fontSize: 13, fontWeight: 500 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="SVM" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="LR" name="Logistic Regression" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="RF" name="Random Forest" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="QK" name="QK-SVM (Simulated)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Hybrid" name="HQ-Stack" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Hybrid > 90 ? '#ef4444' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Project Abstract & Architecture */}
        <div className="space-y-6">
          <GlassCard className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
            <h2 className="text-lg font-semibold text-gray-200 mb-4 relative">Proposed Architecture</h2>
            
            <div className="p-4 bg-gray-900/80 border border-red-500/30 rounded-xl relative shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Model Framework</span>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-md font-bold border border-red-500/30">
                  NISQ COMPATIBLE
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-100 text-gradient from-red-400 to-pink-500 mb-1">
                HQ-Stack Ensemble
              </h3>
              <p className="text-sm text-gray-400">Classical + Quantum Fusion</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">Meta-Learner</span>
                  <span className="text-sm text-gray-200 font-medium">Logistic Reg.</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">Base Estimators</span>
                  <span className="text-sm text-gray-200 font-medium">RF, SVC, LR, QK</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className="text-sm text-green-400 font-medium">Demonstrated Robustness</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="bg-gradient-to-b from-gray-900/80 to-gray-900/40">
            <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center">
              <FlaskConical className="w-4 h-4 mr-2 text-blue-400" />
              Project Abstract
            </h3>
            <div className="prose prose-invert text-gray-300 text-xs leading-relaxed space-y-2 text-justify">
              <p>
                This project investigates the feasibility of near-term Quantum Machine Learning (QML) in clinical diagnostics. Current NISQ devices suffer from high decoherence rates and limited qubit counts, making standalone quantum models highly unstable.
              </p>
              <p>
                To solve this, we propose the <strong>HQ-Stack Hybrid Ensemble</strong> architecture. By compressing classical medical data using PCA and encoding it into a quantum state via a <code>ZZFeatureMap</code>, we extract orthogonal, non-linear feature representations. These quantum outputs are then fed into a classical Logistic Regression meta-learner.
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex flex-wrap gap-2">
                {['Qiskit', 'Scikit-Learn', 'Next.js', 'React', 'TailwindCSS'].map(tech => (
                  <span key={tech} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

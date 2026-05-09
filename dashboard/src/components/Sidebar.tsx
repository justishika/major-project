"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSimulation } from './SimulationContext';
import { 
  LayoutDashboard, 
  FlaskConical, 
  ActivitySquare, 
  Network, 
  BookOpenCheck,
  Atom,
  Clock
} from 'lucide-react';

const routes = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Model Comparison', path: '/model-comparison', icon: FlaskConical },
  { name: 'Quantum Noise Lab', path: '/noise-analysis', icon: ActivitySquare },
  { name: 'Cross-Disease Benchmark', path: '/cross-disease', icon: Network },
  { name: 'Research Insights', path: '/insights', icon: BookOpenCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSimulating } = useSimulation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-background border-r border-gray-800/60 p-4 flex flex-col z-50">
      <div className="flex items-center space-x-3 mb-10 px-2 py-4">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Atom className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="font-bold text-gray-100 leading-tight">HQ-Stack</h1>
          <p className="text-xs text-gray-500">Research Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {routes.map((route) => {
          const isActive = pathname === route.path;
          return (
            <Link key={route.path} href={route.path} className="block relative">
              {isActive && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200",
                isActive ? "text-blue-400" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
              )}>
                <route.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{route.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 border-t border-gray-800/60 space-y-3">
        <div className="px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
          <p className="text-xs text-gray-400 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Backend Status</p>
          <div className="flex items-center space-x-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isSimulating ? "bg-yellow-500 animate-ping" : "bg-green-500 animate-pulse"
            )}></span>
            <span className="text-sm font-medium text-gray-300">
              {isSimulating ? "Computing..." : "Simulator Idle"}
            </span>
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
           <p className="text-xs text-gray-400 mb-1">Experiment ID</p>
           <p className="text-sm font-mono text-gray-500">HQ-94X-22</p>
        </div>
      </div>
    </aside>
  );
}


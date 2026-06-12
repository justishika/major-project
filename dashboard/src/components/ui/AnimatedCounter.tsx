"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({ 
  value, 
  duration = 1.5, 
  prefix = "", 
  suffix = "",
  decimals = 0
}: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const controls = animate(count, value, { duration, ease: "easeOut" });
    return controls.stop;
  }, [value, duration, count]);

  if (!mounted) return <span>{prefix}{value.toFixed(decimals)}{suffix}</span>;

  return <motion.span>{rounded}</motion.span>;
}


import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  label?: string;
}

export function ScoreGauge({ score, label = "Credibility Score" }: ScoreGaugeProps) {
  // Determine color based on score
  let color = "var(--primary)";
  let statusText = "Unverified";
  
  if (score >= 80) {
    color = "hsl(var(--success))";
    statusText = "Highly Credible";
  } else if (score >= 60) {
    color = "hsl(var(--primary))";
    statusText = "Mostly Credible";
  } else if (score >= 40) {
    color = "hsl(var(--warning))";
    statusText = "Mixed Accuracy";
  } else {
    color = "hsl(var(--destructive))";
    statusText = "Low Reliability";
  }

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 glass-panel rounded-2xl">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-muted/20"
          />
          {/* Animated Foreground Circle */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="96"
            cy="96"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-display font-bold text-white tracking-tighter"
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            / 100
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-lg font-medium text-white mb-1">{label}</h3>
        <span 
          className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10"
          style={{ color: color, borderColor: color }}
        >
          {statusText}
        </span>
      </div>
    </div>
  );
}
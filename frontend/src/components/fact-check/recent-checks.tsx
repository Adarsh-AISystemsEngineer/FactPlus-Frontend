/*Hard coded facts not real time 
change when needed 
 */



import { motion } from "framer-motion";
import { Clock, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

const RECENT_CHECKS = [
  {
    id: 1,
    claim: "New study claims coffee consumption increases longevity by 15%",
    verdict: "Mostly True",
    score: 78,
    time: "2 mins ago",
    category: "Health"
  },
  {
    id: 2,
    claim: "Viral video shows robot playing badminton with professional athlete",
    verdict: "Fabricated",
    score: 12,
    time: "15 mins ago",
    category: "Tech"
  },
  {
    id: 3,
    claim: "Global temperatures reached record high in July 2024",
    verdict: "Verified",
    score: 96,
    time: "1 hour ago",
    category: "Climate"
  }
];

export function RecentChecks() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-12 mb-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-medium flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="w-4 h-4" /> Global Verification Stream
        </h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {RECENT_CHECKS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className="group relative glass-panel p-5 rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            {/* Status Indicator Line */}
            <div 
              className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" 
              style={{ 
                backgroundColor: item.score > 80 ? 'hsl(var(--success))' : item.score > 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' 
              }} 
            />

            <div className="pl-3 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-muted-foreground border border-white/10 px-2 py-0.5 rounded-full">
                  {item.category}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.time}
                </span>
              </div>
              
              <p className="font-medium text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {item.claim}
              </p>

              <div className="flex items-center gap-2 pt-2">
                {item.score > 80 ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : item.score < 40 ? (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-warning" />
                )}
                <span 
                  className="text-sm font-bold"
                  style={{ 
                    color: item.score > 80 ? 'hsl(var(--success))' : item.score > 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' 
                  }} 
                >
                  {item.verdict}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Score: {item.score}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
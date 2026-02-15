//This is the thing that is displayed in the chatpage not node graph 
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface NodeData {
  nodeId: string;
  label: string;
  credibilityScore: number;
  verdict?: string;
  color?: string;
  size?: number;
}

interface NodeVisualizerProps {
  nodes?: NodeData[];
}

// A visualization of analysis nodes and their relationships
export function NodeVisualizer({ nodes: providedNodes }: NodeVisualizerProps) {
  const [nodes, setNodes] = useState<{id: string, x: number, y: number, label: string, score: number, color: string, size: number}[]>([]);

  useEffect(() => {
    if (providedNodes && providedNodes.length > 0) {
      // Use provided nodes
      const newNodes = providedNodes.map((node, i) => ({
        id: node.nodeId,
        x: 20 + ((i % 3) * 30) + Math.random() * 10,
        y: 20 + (Math.floor(i / 3) * 40) + Math.random() * 10,
        label: node.label,
        score: node.credibilityScore,
        color: node.color || "#3b82f6",
        size: node.size || 100
      }));
      setNodes(newNodes);
    } else {
      // Generate random nodes for demo
      const newNodes = Array.from({ length: 5 }).map((_, i) => ({
        id: `node-${i}`,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        label: `Analysis Node ${i + 1}`,
        score: Math.random() * 100,
        color: "#3b82f6",
        size: 100
      }));
      setNodes(newNodes);
    }
  }, [providedNodes]);

  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="w-full h-64 glass-panel rounded-2xl relative overflow-hidden p-4">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Analysis Graph</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary">{nodes.length} nodes analyzed</span>
        </div>
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {nodes.map((node, i) => {
          const connectedIndices = new Set<number>();
          for (let j = 0; j < nodes.length; j++) {
            if (i !== j && Math.random() > 0.5) {
              connectedIndices.add(j);
            }
          }
          
          return Array.from(connectedIndices).map(j => {
            const target = nodes[j];
            return (
              <motion.line
                key={`${i}-${j}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ 
                  duration: 3 + Math.random() * 2, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            );
          });
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute group"
          style={{ 
            left: `${node.x}%`, 
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)"
          }}
        >
          {/* Node Circle */}
          <motion.div
            className="relative w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer"
            style={{ 
              borderColor: node.color,
              backgroundColor: `${node.color}20`
            }}
            animate={{
              scale: [1, 1.15, 1],
              boxShadow: [
                `0 0 0px ${node.color}`,
                `0 0 12px ${node.color}`,
                `0 0 0px ${node.color}`
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
            whileHover={{ scale: 1.3 }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: node.color }}
            />
          </motion.div>

          {/* Tooltip */}
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-background border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ fontSize: "10px" }}
          >
            <p className="text-muted-foreground">{node.label}</p>
            <p className="text-primary font-semibold">{Math.round(node.score)}%</p>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
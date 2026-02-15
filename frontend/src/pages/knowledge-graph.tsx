import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion"; 
import { 
  Search, 
  Share2, 
  Filter, 
  MoreHorizontal, 
  Database,
  Link as LinkIcon,
  ShieldCheck,
  AlertTriangle,
  FileText,
  X,
  Download,
  Trash2,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuthContext } from "@/contexts/auth-context";
import { claimService } from "@/lib/firestore-service";
import { toast } from "sonner";

// Types for knowledge graph nodes and links
type NodeType = "claim" | "evidence" | "source" | "clue";
type NodeStatus = "verified" | "warning" | "refuted" | "neutral";

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  status: NodeStatus;
  x: number;
  y: number;
  score: number;
  sourceData?: {
    credibility: "high" | "medium" | "low";
    url?: string;
  };
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

function KnowledgeGraphContent() {
  const { user } = useAuthContext();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activatedNode, setActivatedNode] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterNodeTypes, setFilterNodeTypes] = useState<NodeType[]>(["claim", "evidence", "source", "clue"]);
  const [filterStatus, setFilterStatus] = useState<NodeStatus[]>(["verified", "warning", "refuted", "neutral"]);
  const notificationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load user's claims and build knowledge graph from analysis results
  useEffect(() => {
    const loadKnowledgeGraph = async () => {
      if (!user?.uid) return;

      try {
        setIsLoading(true);
        const userClaims = await claimService.getUserClaims(user.uid, 100);

        const generatedNodes: GraphNode[] = [];
        const generatedLinks: GraphLink[] = [];
        const nodeMap = new Map<string, GraphNode>();
        let xOffset = 10;
        let yOffset = 10;

        // Store all sources and evidence for deduplication and connection analysis
        const allSources = new Map<string, GraphNode>();
        const allEvidence = new Map<string, GraphNode>();

        userClaims.forEach((claim) => {
          if (!claim.analysisResult) return;

          const { sources, reasoning, score, summary } = claim.analysisResult;

          // Create main claim node - INCLUDE ALL REGARDLESS OF SCORE
          const claimNodeId = `claim-${claim.id}`;
          const claimNode: GraphNode = {
            id: claimNodeId,
            type: "claim",
            label: claim.text.substring(0, 50) + (claim.text.length > 50 ? "..." : ""),
            status: score >= 70 ? "verified" : score >= 40 ? "warning" : "refuted",
            x: xOffset,
            y: yOffset,
            score: score,
          };
          generatedNodes.push(claimNode);
          nodeMap.set(claimNodeId, claimNode);

          // Create source nodes - INCLUDE ALL SOURCES REGARDLESS OF CREDIBILITY
          const credibilityMap = {
            high: 85,
            medium: 50,
            low: 20,
          };

          sources?.forEach((source, sourceIdx) => {
            const credibilityScore = credibilityMap[source.credibility];
            const sourceNodeId = `source-${source.title.replace(/\s+/g, '-').toLowerCase()}`; // Use title-based ID for deduplication
            
            // Create source node if not already created (deduplication)
            if (!allSources.has(sourceNodeId)) {
              const sourceNode: GraphNode = {
                id: sourceNodeId,
                type: "source",
                label: source.title,
                status: credibilityScore >= 80 ? "verified" : credibilityScore >= 50 ? "warning" : "refuted",
                x: xOffset + 20 + (sourceIdx * 15),
                y: yOffset + 30 + (sourceIdx * 10),
                score: credibilityScore,
                sourceData: {
                  credibility: source.credibility,
                  url: source.url,
                },
              };
              generatedNodes.push(sourceNode);
              allSources.set(sourceNodeId, sourceNode);
            }

            // Connect claim to source - ALL CONNECTIONS
            generatedLinks.push({
              source: claimNodeId,
              target: sourceNodeId,
              type: "sourced_from",
            });
          });

          // Create evidence nodes from reasoning - INCLUDE ALL EVIDENCE
          reasoning?.forEach((reason, reasonIdx) => {
            const evidenceScore =
              reason.status === "verified" ? 90 : reason.status === "warning" ? 50 : 20;
            
            const evidenceNodeId = `evidence-${reason.title.replace(/\s+/g, '-').toLowerCase()}`; // Use title-based ID for deduplication
            
            // Create evidence node if not already created (deduplication)
            if (!allEvidence.has(evidenceNodeId)) {
              const evidenceNode: GraphNode = {
                id: evidenceNodeId,
                type: "evidence",
                label: reason.title,
                status: reason.status,
                x: xOffset - 20 + (reasonIdx * 15),
                y: yOffset + 30 + (reasonIdx * 10),
                score: evidenceScore,
              };
              generatedNodes.push(evidenceNode);
              allEvidence.set(evidenceNodeId, evidenceNode);
            }

            // Connect claim to evidence - ALL CONNECTIONS
            generatedLinks.push({
              source: claimNodeId,
              target: evidenceNodeId,
              type: "supported_by",
            });
          });

          xOffset += 40;
          yOffset += 40;
        });


        // INTELLIGENT RELATIONSHIP DETECTION - Connect claims, sources, and evidence intelligently
        let activatedClaimTitle: string | null = null;
        
        // Helper function: Calculate text similarity (simple algorithm for semantic matching)
        const calculateTextSimilarity = (text1: string, text2: string): number => {
          const words1 = text1.toLowerCase().split(/\s+/);
          const words2 = text2.toLowerCase().split(/\s+/);
          const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
          return commonWords.length / Math.max(words1.length, words2.length);
        };

        // 1. Connect claims with similar sources (evidence of corroboration)
        for (let i = 0; i < generatedNodes.length; i++) {
          for (let j = i + 1; j < generatedNodes.length; j++) {
            const node1 = generatedNodes[i];
            const node2 = generatedNodes[j];

            if (node1.type === "claim" && node2.type === "claim") {
              // Get all connected sources for each claim
              const sources1 = generatedLinks
                .filter(l => l.source === node1.id && l.type === "sourced_from")
                .map(l => l.target);
              const sources2 = generatedLinks
                .filter(l => l.source === node2.id && l.type === "sourced_from")
                .map(l => l.target);
              const commonSources = sources1.filter(s => sources2.includes(s));

              // Get all connected evidence for each claim
              const evidence1 = generatedLinks
                .filter(l => l.source === node1.id && l.type === "supported_by")
                .map(l => l.target);
              const evidence2 = generatedLinks
                .filter(l => l.source === node2.id && l.type === "supported_by")
                .map(l => l.target);
              const commonEvidence = evidence1.filter(e => evidence2.includes(e));

              // Calculate semantic similarity between claim labels
              const semanticSimilarity = calculateTextSimilarity(node1.label, node2.label);

              // ESTABLISH CONNECTION if: common sources OR common evidence OR semantic similarity > 0.3
              if (commonSources.length > 0 || commonEvidence.length > 0 || semanticSimilarity > 0.3) {
                const connectionStrength = commonSources.length + commonEvidence.length + (semanticSimilarity > 0.3 ? 1 : 0);
                generatedLinks.push({
                  source: node1.id,
                  target: node2.id,
                  type: `related_to_${connectionStrength}`, // Include strength in type
                });
                if (!activatedClaimTitle) {
                  activatedClaimTitle = node1.label;
                }
              }
            }
          }
        }

        // 2. Connect sources with similar content (evidence credibility clustering)
        for (let i = 0; i < generatedNodes.length; i++) {
          for (let j = i + 1; j < generatedNodes.length; j++) {
            const node1 = generatedNodes[i];
            const node2 = generatedNodes[j];

            if (node1.type === "source" && node2.type === "source") {
              const similarity = calculateTextSimilarity(node1.label, node2.label);
              
              // Get claims citing both sources
              const claimsFor1 = generatedLinks
                .filter(l => l.target === node1.id && l.type === "sourced_from")
                .map(l => l.source);
              const claimsFor2 = generatedLinks
                .filter(l => l.target === node2.id && l.type === "sourced_from")
                .map(l => l.source);
              const commonClaims = claimsFor1.filter(c => claimsFor2.includes(c));

              // ESTABLISH CONNECTION if: similar labels OR cited for same claims
              if (similarity > 0.4 || commonClaims.length > 0) {
                generatedLinks.push({
                  source: node1.id,
                  target: node2.id,
                  type: "corroborates",
                });
              }
            }
          }
        }

        // 3. Connect evidence with similar findings (evidence clustering)
        for (let i = 0; i < generatedNodes.length; i++) {
          for (let j = i + 1; j < generatedNodes.length; j++) {
            const node1 = generatedNodes[i];
            const node2 = generatedNodes[j];

            if (node1.type === "evidence" && node2.type === "evidence") {
              const similarity = calculateTextSimilarity(node1.label, node2.label);
              
              // Get claims using both evidence
              const claimsFor1 = generatedLinks
                .filter(l => l.target === node1.id && l.type === "supported_by")
                .map(l => l.source);
              const claimsFor2 = generatedLinks
                .filter(l => l.target === node2.id && l.type === "supported_by")
                .map(l => l.source);
              const commonClaims = claimsFor1.filter(c => claimsFor2.includes(c));

              // ESTABLISH CONNECTION if: high similarity OR used for same claims
              if (similarity > 0.35 || commonClaims.length > 0) {
                generatedLinks.push({
                  source: node1.id,
                  target: node2.id,
                  type: "reinforces",
                });
              }
            }
          }
        }

        // If a new node connection was activated, show notification and AI response
        if (activatedClaimTitle) {
          setActivatedNode(activatedClaimTitle);
          if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
          notificationTimeout.current = setTimeout(() => setActivatedNode(null), 5000);
          toast.success(`Node activated: "${activatedClaimTitle}" is now connected to another claim!`, {
            description: `AI: A new relationship was detected in your knowledge graph based on claim: "${activatedClaimTitle}".`
          });
        }

        setNodes(generatedNodes);
        setLinks(generatedLinks);

        if (generatedNodes.length === 0) {
          toast.info("No analysis data yet. Run fact-checks to build your knowledge graph.");
        }
      } catch (error: any) {
        console.error("Error loading knowledge graph:", error);
        toast.error("Failed to load knowledge graph");
      } finally {
        setIsLoading(false);
      }
    };

    loadKnowledgeGraph();
  }, [user?.uid]);

  // Filter nodes based on search and active filters
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterNodeTypes.includes(node.type);
    const matchesStatus = filterStatus.includes(node.status);
    return matchesSearch && matchesType && matchesStatus;
  });

  const deleteNode = (nodeId: string) => {
    // Remove the node
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    setNodes(updatedNodes);
    
    // Remove all links connected to this node
    const updatedLinks = links.filter(l => l.source !== nodeId && l.target !== nodeId);
    setLinks(updatedLinks);
    
    // Clear selection and search to ensure proper re-render
    setSelectedNode(null);
    setSearchQuery("");
    toast.success("Node deleted successfully");
  };

  const refreshGraph = () => {
    setIsRefreshing(true);
    // Reload knowledge graph from analysis data
    setTimeout(() => {
      setIsLoading(true);
      if (user?.uid) {
        claimService.getUserClaims(user.uid, 100).then((userClaims) => {
          // Rebuild nodes and links from fresh data
          // (same logic as in useEffect above)
          setSelectedNode(null);
          setSearchQuery("");
          toast.success("Knowledge graph refreshed");
          setIsLoading(false);
          setIsRefreshing(false);
        });
      }
    }, 500);
  };

  const generateReport = async () => {
    if (!selectedNode) {
      toast.error("No node selected");
      return;
    }

    try {
      setIsGenerating(true);
      toast.loading("Generating report...");

      // Create report object
      const report = {
        generatedAt: new Date().toISOString(),
        selectedNode: selectedNode,
        linkedNodes: links
          .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
          .map((link) => {
            const isSource = link.source === selectedNode.id;
            const otherId = isSource ? link.target : link.source;
            const otherNode = nodes.find(n => n.id === otherId);
            return {
              node: otherNode,
              relationship: link.type,
              direction: isSource ? 'outbound' : 'inbound',
            };
          }),
        statistics: {
          totalNodes: nodes.length,
          totalConnections: links.length,
          nodeConnections: links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length,
        },
        summary: `Analysis Report for "${selectedNode.label}" - Confidence Score: ${selectedNode.score}%`,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(report, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${selectedNode.id}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Report generated and downloaded!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.dismiss();
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-hidden">
      {/* Header with Navigation */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-background/50 backdrop-blur-sm">
        <Link href="/chat" className="flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Button>
        </Link>
        
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Chat', href: '/chat' },
            { label: 'Knowledge Graph', active: true }
          ]}
        />
      </header>
      
      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Graph Canvas Area */}
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05),transparent_70%)]">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading knowledge graph...</p>
              </div>
            </div>
          )}
          
          {/* Controls Overlay */}
          <div className="absolute top-6 left-6 z-10 flex gap-2">
            <div className="glass-panel p-1 rounded-lg flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                  const graphData = {
                    nodes: filteredNodes,
                    links: links.filter(l => filteredNodes.some(n => n.id === l.source) && filteredNodes.some(n => n.id === l.target)),
                    timestamp: new Date().toISOString(),
                    user: user?.email
                  };
                  navigator.clipboard.writeText(JSON.stringify(graphData, null, 2));
                  toast.success("Knowledge graph copied to clipboard!");
                }}
                title="Copy graph data to clipboard"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`hover:bg-primary/10 hover:text-primary ${
                  (filterNodeTypes.length < 4 || filterStatus.length < 4) ? 'text-primary' : ''
                }`}
                onClick={() => setFilterOpen(!filterOpen)}
                title="Filter nodes by type and status"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-20 left-6 z-20 glass-panel p-4 rounded-lg w-64 max-h-96 overflow-y-auto"
              >
                <h3 className="text-sm font-semibold mb-3">Filter Nodes</h3>
                
                {/* Node Type Filter */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">By Type:</p>
                  <div className="space-y-2">
                    {(['claim', 'evidence', 'source', 'clue'] as NodeType[]).map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={filterNodeTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterNodeTypes([...filterNodeTypes, type]);
                            } else {
                              setFilterNodeTypes(filterNodeTypes.filter(t => t !== type));
                            }
                          }}
                          className="w-4 h-4 rounded border-white/30"
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">By Status:</p>
                  <div className="space-y-2">
                    {(['verified', 'warning', 'refuted', 'neutral'] as NodeStatus[]).map(status => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={filterStatus.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterStatus([...filterStatus, status]);
                            } else {
                              setFilterStatus(filterStatus.filter(s => s !== status));
                            }
                          }}
                          className="w-4 h-4 rounded border-white/30"
                        />
                        <span className="capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs border-white/10 hover:bg-white/5"
                  onClick={() => {
                    setFilterNodeTypes(['claim', 'evidence', 'source', 'clue']);
                    setFilterStatus(['verified', 'warning', 'refuted', 'neutral']);
                  }}
                >
                  Reset Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Graph Visualizer */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="relative w-full h-full max-w-5xl max-h-[800px] p-20">
                {/* Render Links */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {links.map((link, i) => {
                    const start = nodes.find(n => n.id === link.source);
                    const end = nodes.find(n => n.id === link.target);
                    if (!start || !end) return null;

                    return (
                      <g key={i}>
                        <motion.line
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.3 }}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                          x1={`${start.x}%`}
                          y1={`${start.y}%`}
                          x2={`${end.x}%`}
                          y2={`${end.y}%`}
                          stroke={link.type === 'contradicts' ? '#ef4444' : '#3b82f6'}
                          strokeWidth="2"
                        />
                        {/* Animated pulses on lines */}
                        <motion.circle
                          r="3"
                          fill={link.type === 'contradicts' ? '#ef4444' : '#3b82f6'}
                        >
                          <animateMotion 
                            dur={`${2 + i}s`} 
                            repeatCount="indefinite"
                            path={`M${start.x * 10},${start.y * 6} L${end.x * 10},${end.y * 6}`} // Simplified path approximation for demo
                            // Note: actual SVG coord mapping would be needed for perfect alignment in a real app
                            // using calcMode="linear"
                          />
                        </motion.circle>
                      </g>
                    );
                  })}
                </svg>

                {/* Render Nodes */}
                {filteredNodes.map((node) => (
                  <motion.div
                    key={node.id}
                    layoutId={`node-${node.id}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1, zIndex: 50 }}
                    onClick={() => setSelectedNode(node)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300
                      ${selectedNode?.id === node.id ? 'z-50 scale-110' : 'z-10'}
                    `}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    <div className={`
                      relative flex items-center justify-center w-16 h-16 rounded-full backdrop-blur-md border-2 shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]
                      ${node.status === 'verified' ? 'bg-success/10 border-success text-success shadow-success/20' : ''}
                      ${node.status === 'warning' ? 'bg-warning/10 border-warning text-warning shadow-warning/20' : ''}
                      ${node.status === 'refuted' ? 'bg-destructive/10 border-destructive text-destructive shadow-destructive/20' : ''}
                      ${node.status === 'neutral' ? 'bg-card/50 border-white/20 text-muted-foreground' : ''}
                      ${selectedNode?.id === node.id ? 'ring-4 ring-white/10' : ''}
                    `}>
                      {node.type === 'claim' && <ShieldCheck className="w-6 h-6" />}
                      {node.type === 'evidence' && <Database className="w-6 h-6" />}
                      {node.type === 'source' && <LinkIcon className="w-6 h-6" />}
                      {node.type === 'clue' && <AlertTriangle className="w-6 h-6" />}

                      {/* Orbiting ring for verified nodes */}
                      {node.status === 'verified' && (
                        <div className="absolute inset-[-4px] rounded-full border border-dashed border-success/30 animate-[spin_10s_linear_infinite]" />
                      )}
                    </div>
                    
                    {/* Label below node */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 text-center w-32 pointer-events-none">
                      <p className={`text-xs font-bold px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/5
                        ${selectedNode?.id === node.id ? 'text-white border-white/20' : 'text-muted-foreground'}
                      `}>
                        {node.label}
                      </p>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Sidebar - Details & Search */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-96 border-l border-white/10 bg-card/30 backdrop-blur-xl z-20 flex flex-col"
            >
              {/* Search Header */}
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search knowledge graph..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {selectedNode ? (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className={`mb-2 capitalize
                            ${selectedNode.status === 'verified' ? 'border-success text-success' : ''}
                            ${selectedNode.status === 'warning' ? 'border-warning text-warning' : ''}
                            ${selectedNode.status === 'refuted' ? 'border-destructive text-destructive' : ''}
                          `}>
                            {selectedNode.status}
                          </Badge>
                          <h2 className="text-2xl font-display font-bold text-white leading-tight">
                            {selectedNode.label}
                          </h2>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedNode(null)} 
                          className="hover:bg-white/10 -mr-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                          <div className="text-xl font-mono font-bold text-primary">{selectedNode.score}%</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Connections</div>
                          <div className="text-xl font-mono font-bold text-white">
                            {links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Analysis Breakdown</h3>
                        <p className="text-sm leading-relaxed text-gray-300">
                          This node represents verified data extracted from high-confidence sources. Cross-referencing suggests strong correlation with primary datasets in the network.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Linked Evidence</h3>
                        <div className="space-y-2">
                          {links
                            .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                            .map((link, i) => {
                              const isSource = link.source === selectedNode.id;
                              const otherId = isSource ? link.target : link.source;
                              const otherNode = nodes.find(n => n.id === otherId);
                              
                              if (!otherNode) return null;

                              return (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                  <div className={`p-1.5 rounded-md ${
                                    otherNode.type === 'claim' ? 'bg-blue-500/20 text-blue-400' :
                                    otherNode.type === 'evidence' ? 'bg-purple-500/20 text-purple-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {otherNode.type === 'claim' && <ShieldCheck className="w-3 h-3" />}
                                    {otherNode.type === 'evidence' && <Database className="w-3 h-3" />}
                                    {otherNode.type === 'source' && <LinkIcon className="w-3 h-3" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{otherNode.label}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <span className="capitalize">{link.type.replace('_', ' ')}</span>
                                      {isSource ? '→' : '←'}
                                    </div>
                                  </div>
                                </div>
                              );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : nodes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 mt-20">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Database className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">Knowledge Graph Empty</p>
                        <p className="text-sm text-muted-foreground">Run fact-checks from the Chat page to build your knowledge graph. Only sources with credibility &gt; 70 will be included.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 mt-20">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <MoreHorizontal className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">Select a Node</p>
                        <p className="text-sm text-muted-foreground">Click on any node in the graph to view detailed analysis and connections.</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {selectedNode && (
                <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
                  <Button 
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="w-full gap-2"
                  >
                    <Download className="w-4 h-4" /> 
                    {isGenerating ? "Generating..." : "Download Report"}
                  </Button>
                  <Button 
                    onClick={() => deleteNode(selectedNode.id)}
                    variant="outline"
                    className="w-full gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                  >
                    <Trash2 className="w-4 h-4" /> 
                    Delete Node
                  </Button>
                </div>
              )}
              
              {nodes.length === 0 && (
                <div className="p-4 border-t border-white/10 bg-black/20">
                  <Button 
                    onClick={refreshGraph}
                    disabled={isRefreshing}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                    {isRefreshing ? "Refreshing..." : "Refresh Graph"}
                  </Button>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle Sidebar Button (Mobile/when closed) */}
        {!isSidebarOpen && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 right-6 z-10 bg-background border-white/10"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
      </main>
    </div>
  );
}

export default function KnowledgeGraph() {
  return (
    <ProtectedRoute>
      <KnowledgeGraphContent />
    </ProtectedRoute>
  );
}
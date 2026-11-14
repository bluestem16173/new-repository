"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getAgentById } from "@/domain/agents/registry";
import type { WorkflowDefinition } from "@/domain/workflow-studio/types";
import {
  AgentFlowNode,
  type AgentFlowNodeType,
} from "@/components/workflow-studio/agent-flow-node";

const nodeTypes = {
  agent: AgentFlowNode,
} satisfies NodeTypes;

function useIsCompactViewport() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return compact;
}

function buildFlowGraph(
  workflow: WorkflowDefinition,
  layout: "horizontal" | "vertical",
): { nodes: AgentFlowNodeType[]; edges: Edge[] } {
  const nodes: AgentFlowNodeType[] = workflow.nodes.map((node) => {
    const agent = getAgentById(node.agentId);
    const position =
      layout === "horizontal" ? node.position : node.mobilePosition;

    return {
      id: node.id,
      type: "agent",
      position,
      data: {
        agentName: agent?.name ?? node.agentId,
        agentIcon: agent?.icon ?? "/agents/literature-scout.png",
        task: node.task,
        status: node.status,
        inputSummary: node.inputSummary,
        outputSummary: node.outputSummary,
        validation: node.validation,
        layout,
      },
    };
  });

  const edges: Edge[] = workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: false,
    style: { stroke: "#94A3B8" },
    labelStyle: { fill: "#64748B", fontSize: 10 },
  }));

  return { nodes, edges };
}

interface WorkflowCanvasInnerProps {
  workflow: WorkflowDefinition;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

function WorkflowCanvasInner({
  workflow,
  selectedNodeId,
  onSelectNode,
}: WorkflowCanvasInnerProps) {
  const compact = useIsCompactViewport();
  const layout = compact ? "vertical" : "horizontal";
  const graph = useMemo(
    () => buildFlowGraph(workflow, layout),
    [workflow, layout],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    );
  }, [selectedNodeId, setNodes]);

  return (
    <div
      className="h-[520px] w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] lg:h-[560px]"
      role="application"
      aria-label={`${workflow.title} pathway canvas`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.35}
        maxZoom={1.4}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} color="#E2E8F0" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          className="!bg-white"
          maskColor="rgb(15 23 42 / 8%)"
        />
      </ReactFlow>
    </div>
  );
}

interface WorkflowCanvasProps {
  workflow: WorkflowDefinition;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

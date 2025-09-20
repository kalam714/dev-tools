import React, { useState, useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  MiniMap,
  Controls,
  Background,
} from "react-flow-renderer";
import { JsonTree } from "react-editable-json-tree";

export default function ApiFlowSimulator() {
  // Initial state with proper structure
  const initialNodes = [
    {
      id: "1",
      type: "input",
      data: {
        label: "GET /users",
        request: {},
        response: { users: [{ id: 1, name: "Alice" }] },
      },
      position: { x: 250, y: 0 },
    },
    {
      id: "2",
      type: "default",
      data: {
        label: "POST /orders",
        request: { userId: 1 },
        response: { orderId: 5001 },
      },
      position: { x: 100, y: 200 },
    },
  ];

  const initialEdges = [
    { id: "e1-2", source: "1", target: "2", animated: true },
  ];

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulationData, setSimulationData] = useState({});

  // Generate unique IDs
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  };

  // Safe Node Update Helper - preserves position and type
  const updateNodeData = useCallback((nodeId, newData) => {
    console.debug("Updating node data:", nodeId, newData);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: { ...n.data, ...newData },
              position: n.position, // Explicitly preserve position
              type: n.type, // Explicitly preserve type
            }
          : n
      )
    );
  }, []);

  // Safe nodes change handler
  const onNodesChange = useCallback((changes) => {
    setNodes((prev) =>
      prev.map((n) => {
        const change = changes.find((c) => c.id === n.id);
        if (change) {
          // Merge changes while preserving essential properties
          return {
            ...n,
            ...change,
            position: change.position || n.position, // Preserve position if not in change
            data: change.data ? { ...n.data, ...change.data } : n.data, // Merge data safely
          };
        }
        return n;
      })
    );
  }, []);

  // Safe edges change handler
  const onEdgesChange = useCallback((changes) => {
    setEdges((prev) =>
      prev.map((e) => {
        const change = changes.find((c) => c.id === e.id);
        return change ? { ...e, ...change } : e;
      })
    );
  }, []);

  // Add Node (API node)
  const addNode = useCallback(() => {
    const newId = generateId();
    const newNode = {
      id: newId,
      type: "default",
      data: {
        label: `API ${nodes.length + 1}`,
        request: {},
        response: {},
      },
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
      },
    };
    console.debug("Adding node:", newNode);
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length]);

  // Add Note (Note node)
  const addNote = useCallback(() => {
    const newId = generateId();
    const newNode = {
      id: newId,
      type: "default",
      data: {
        label: `Note ${nodes.filter((n) => n.data.isNote).length + 1}`,
        request: {},
        response: {},
        isNote: true,
      },
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
      },
    };
    console.debug("Adding note:", newNode);
    setNodes((nds) => [...nds, newNode]);
  }, [nodes]);

  // Delete selected node
  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    console.debug("Deleting node:", selectedNode.id);
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  }, [selectedNode]);

  // Connect nodes safely with validation
  const onConnect = useCallback(
    (params) => {
      const sourceExists = nodes.find((n) => n.id === params.source);
      const targetExists = nodes.find((n) => n.id === params.target);
      if (!sourceExists || !targetExists) {
        console.debug("Connection rejected: source or target not found");
        return;
      }

      const newEdge = {
        id: `e${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        animated: true,
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes]
  );

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Run simulation with safe data handling
  const runSimulation = useCallback(() => {
    console.debug("Running simulation...");
    const dataFlow = {};

    nodes.forEach((node) => {
      if (!node?.data) {
        console.debug("Skipping node with no data:", node?.id);
        return;
      }

      // Find incoming edges
      const incomingEdges = edges.filter((e) => e.target === node.id);
      let mergedData = {};

      // Merge data from source nodes
      incomingEdges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode?.data?.response) {
          mergedData = { ...mergedData, ...sourceNode.data.response };
        }
      });

      // Handle note nodes differently
      if (node.data.isNote) {
        dataFlow[node.id] = { note: node.data.label || "Untitled Note" };
      } else {
        dataFlow[node.id] = {
          request: node.data.request || {},
          response: { ...mergedData, ...(node.data.response || {}) },
        };
      }
    });

    console.debug("Simulation result:", dataFlow);
    setSimulationData(dataFlow);
  }, [nodes, edges]);

  // Ensure every node has a valid position before rendering
  const safeNodes = nodes.map((n) => ({
    ...n,
    position: n.position || {
      x: Math.random() * 300,
      y: Math.random() * 200,
    },
  }));

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">API Flow Simulator</h2>

      {/* Action buttons */}
      <div className="flex gap-2 mb-2">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={addNode}
        >
          Add Node
        </button>
        <button
          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          onClick={addNote}
        >
          Add Note
        </button>
        <button
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={deleteNode}
          disabled={!selectedNode}
        >
          Delete Selected
        </button>
        <button
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={runSimulation}
        >
          Run Simulation
        </button>
      </div>

      <div className="flex gap-4">
        {/* Flow Area */}
        <div className="w-2/3 h-[60vh] border rounded">
          <ReactFlowProvider>
            <ReactFlow
              nodes={safeNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
              nodesDraggable
              nodesConnectable
              elementsSelectable
            >
              <MiniMap />
              <Controls />
              <Background color="#aaa" gap={16} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Simulation Data Panel */}
        <div className="w-1/3 h-[60vh] overflow-auto border rounded p-2">
          <h3 className="font-semibold mb-2">Simulation Data</h3>
          {Object.keys(simulationData).length === 0 ? (
            <p className="text-gray-500">
              Click "Run Simulation" to see data flow
            </p>
          ) : (
            <JsonTree data={simulationData} editable={false} rootName={false} />
          )}
        </div>
      </div>

      {/* Selected Node JSON Editor */}
      {selectedNode && (
        <div className="mt-2 border p-2 rounded">
          <h3 className="font-semibold mb-2">
            Selected Node: {selectedNode.data?.label || "Unnamed Node"}
          </h3>
          <div className="flex gap-4">
            <div className="w-1/2">
              <h4 className="font-semibold mb-1">Request</h4>
              <div className="border rounded p-2 max-h-48 overflow-auto">
                <JsonTree
                  data={selectedNode.data?.request || {}}
                  editable={true}
                  onUpdate={(updatedData) => {
                    updateNodeData(selectedNode.id, { request: updatedData });
                  }}
                  rootName={false}
                />
              </div>
            </div>
            <div className="w-1/2">
              <h4 className="font-semibold mb-1">Response</h4>
              <div className="border rounded p-2 max-h-48 overflow-auto">
                <JsonTree
                  data={selectedNode.data?.response || {}}
                  editable={true}
                  onUpdate={(updatedData) => {
                    updateNodeData(selectedNode.id, { response: updatedData });
                  }}
                  rootName={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react'
import ReactFlow, { 
  Node as FlowNode, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls, 
  MiniMap 
} from 'reactflow'
import 'reactflow/dist/style.css'
import { fetchNodes, updateNodeTitle, deleteNode, createNode } from '../../api/Nodes/Nodes'

interface Node {
  id: number
  title: string
  parentId?: number | null
  parent?: { id: number }
}

const Nodes = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode[]>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [nodeTitle, setNodeTitle] = useState<string>('')
  const [nodeParentId, setNodeParentId] = useState<number | string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const positionNodes = (nodes: Node[], parentId: number | null = null, x: number = 0, y: number = 0): FlowNode[] => {
    return nodes
      .filter((node) => node.parentId === parentId)
      .map((node, index) => {
        const newX = x + index * 300
        const newY = y + 200
        const children = positionNodes(nodes, node.id, newX, newY)

        return [
          {
            id: node.id.toString(),
            data: { label: node.title },
            position: { x: newX, y: newY }
          },
          ...children
        ]
      })
      .flat()
  }

  const getNodes = async () => {
    try {
      const data: Node[] = await fetchNodes()
      const nodesWithParentId: Node[] = data.map((node) => ({
        ...node,
        parentId: node.parent ? node.parent.id : null
      }))
      const flowNodes: FlowNode[] = positionNodes(nodesWithParentId).map(node => ({
        ...node,
        style: {
          border: '1px solid black',
          borderRadius: '5px',
          minHeight: 40,
          width: 200,
          wordWrap: 'break-word'
        }
      }))
      const flowEdges: Edge[] = nodesWithParentId
        .filter((node) => node.parentId !== null)
        .map((node) => ({
          id: `${node.parentId}-${node.id}`,
          source: node.parentId!.toString(),
          target: node.id.toString(),
          animated: true
        }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getNodes()
  }, [])

  const handleNodeContextMenu = async (event: React.MouseEvent, node: FlowNode) => {
    const newTitle = prompt('Enter new title:', node.data.label)
    if (newTitle !== null) {
      try {
        await updateNodeTitle(Number(node.id), newTitle)
        setNodes((nds) =>
          nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label: newTitle } } : n))
        )
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleNodeDoubleClick = async (event: React.MouseEvent, node: FlowNode) => {
    try {
      await deleteNode(Number(node.id));
      getNodes()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddNode = async () => {
    setLoading(true);
    try {
      const newNode = await createNode({
        title: nodeTitle,
        parentId: nodeParentId === '' ? null : Number(nodeParentId)
      })

      const newFlowNode: FlowNode = {
        id: newNode.id.toString(),
        data: { label: newNode.title },
        position: { x: newNode.id * 100, y: newNode.parentId ? newNode.parentId * 100 : 0 }
      }

      const newFlowEdge: Edge | null = newNode.parentId !== null && typeof newNode.parentId !== 'undefined' ? {
        id: `${newNode.parentId}-${newNode.id}`,
        source: newNode.parentId!.toString(),
        target: newNode.id.toString(),
        animated: true
      } : null

      setNodes((prevNodes) => [...prevNodes, newFlowNode])

      if (newFlowEdge) {
        setEdges((prevEdges) => [...prevEdges, newFlowEdge])
      }

      setNodeTitle('')
      setNodeParentId('')
      setError(null)
    } catch (error) {
      console.error(error)
      setError('Error adding node')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nodes">
      <div className="nodes__addField">
        <form 
         className="nodes__addField--form"
         onSubmit={(e) => {handleAddNode()}}
        >
          <input
            className="nodes__addField--form--text"
            type="text"
            value={nodeTitle}
            placeholder="Title"
            onChange={(e) => setNodeTitle(e.target.value)}
            required
          />
          <input
            className="nodes__addField--form--number"
            type="number"
            value={nodeParentId}
            placeholder="Parent ID"
            onChange={(e) => setNodeParentId(e.target.value)}
          />
          <button 
            className="nodes__addField--form--button" 
            type="submit"  
            disabled={loading}
          >
            {loading ? '...' : '+'}
          </button>
          {error && <p>{error}</p>}
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeDoubleClick={handleNodeDoubleClick}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export default Nodes
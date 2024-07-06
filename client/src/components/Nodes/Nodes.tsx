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

  const NODE_WIDTH = 300
  const NODE_HEIGHT = 40
  const NODE_SPACING_X = 0
  const NODE_SPACING_Y = 100

  interface PositionedNode extends Node {
    width: number
  }

  const calculateSubtreeWidth = (nodes: PositionedNode[], parentId: number | null = null): number => {
    const childNodes = nodes.filter((node) => node.parentId === parentId)
    if (childNodes.length === 0) {
      return NODE_WIDTH + NODE_SPACING_X
    }
    let totalWidth = 0
    childNodes.forEach((child) => {
      totalWidth += calculateSubtreeWidth(nodes, child.id)
    })
    return totalWidth
  }

  const positionNodes = (nodes: Node[]): FlowNode[] => {
    const positionedNodes: PositionedNode[] = nodes.map((node) => ({ ...node, width: 0 }))
    positionedNodes.forEach((node) => {
      node.width = calculateSubtreeWidth(positionedNodes, node.id)
    })

    const placeNodes = (parentId: number | null = null, x: number = 0, y: number = 0): FlowNode[] => {
      const childNodes = positionedNodes.filter((node) => node.parentId === parentId)
      const nodeCount = childNodes.length
      let currentX = x - childNodes.reduce((sum, node) => sum + node.width, 0) / 2

      return childNodes.flatMap((node) => {
        const subtreeWidth = calculateSubtreeWidth(positionedNodes, node.id)
        currentX += subtreeWidth / 2

        const newPosition = {
          id: node.id.toString(),
          data: { label: node.title },
          position: { x: currentX, y: y + NODE_HEIGHT + NODE_SPACING_Y }
        }

        const placedNodes = [
          newPosition,
          ...placeNodes(node.id, currentX, y + NODE_HEIGHT + NODE_SPACING_Y)
        ]

        currentX += subtreeWidth / 2 + NODE_SPACING_X

        return placedNodes
      })
    }

    return placeNodes()
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
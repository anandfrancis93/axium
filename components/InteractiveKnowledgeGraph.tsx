/**
 * Interactive Knowledge Graph Component
 *
 * Visualizes prerequisite relationships between topics using force-directed graph
 *
 * Features:
 * - Interactive zoom, pan, drag
 * - Click nodes to navigate to topic pages
 * - Highlight prerequisite paths
 * - Animated path traversal
 * - Color-coded by learning depth
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Polyfill for AFRAME (required by react-force-graph VR/AR deps, but we only use 2D)
if (typeof window !== 'undefined' && !(window as any).AFRAME) {
  (window as any).AFRAME = {
    registerComponent: () => {},
    registerSystem: () => {},
    registerGeometry: () => {},
    registerPrimitive: () => {},
    registerShader: () => {},
    components: {},
    systems: {},
    geometries: {},
    primitives: {},
    shaders: {}
  }
}

// Polyfill for THREE.js (required by react-force-graph VR/AR deps, but we only use 2D)
if (typeof window !== 'undefined' && !(window as any).THREE) {
  // Comprehensive THREE.js stub to satisfy VR/AR dependencies
  const emptyConstructor = function(this: any) { return this }
  emptyConstructor.prototype = {}

  ;(window as any).THREE = {
    // Core Math
    Vector2: emptyConstructor,
    Vector3: emptyConstructor,
    Vector4: emptyConstructor,
    Matrix3: emptyConstructor,
    Matrix4: emptyConstructor,
    Quaternion: emptyConstructor,
    Euler: emptyConstructor,
    Color: emptyConstructor,
    Box2: emptyConstructor,
    Box3: emptyConstructor,
    Sphere: emptyConstructor,
    Plane: emptyConstructor,
    Ray: emptyConstructor,

    // Core Objects
    Object3D: emptyConstructor,
    Scene: emptyConstructor,
    Group: emptyConstructor,

    // Geometries
    BufferGeometry: emptyConstructor,
    SphereGeometry: emptyConstructor,
    BoxGeometry: emptyConstructor,
    CylinderGeometry: emptyConstructor,
    PlaneGeometry: emptyConstructor,
    CircleGeometry: emptyConstructor,
    ConeGeometry: emptyConstructor,
    TorusGeometry: emptyConstructor,

    // Materials
    Material: emptyConstructor,
    MeshBasicMaterial: emptyConstructor,
    MeshStandardMaterial: emptyConstructor,
    MeshPhongMaterial: emptyConstructor,
    LineBasicMaterial: emptyConstructor,
    LineDashedMaterial: emptyConstructor,
    PointsMaterial: emptyConstructor,
    SpriteMaterial: emptyConstructor,
    ShaderMaterial: emptyConstructor,

    // Objects
    Mesh: emptyConstructor,
    Line: emptyConstructor,
    LineSegments: emptyConstructor,
    Points: emptyConstructor,
    Sprite: emptyConstructor,

    // Lights
    Light: emptyConstructor,
    AmbientLight: emptyConstructor,
    DirectionalLight: emptyConstructor,
    PointLight: emptyConstructor,
    SpotLight: emptyConstructor,

    // Cameras
    Camera: emptyConstructor,
    PerspectiveCamera: emptyConstructor,
    OrthographicCamera: emptyConstructor,

    // Textures
    Texture: emptyConstructor,
    TextureLoader: emptyConstructor,
    CanvasTexture: emptyConstructor,

    // Helpers
    AxesHelper: emptyConstructor,
    GridHelper: emptyConstructor,

    // Misc
    Raycaster: emptyConstructor,
    Clock: emptyConstructor,
    EventDispatcher: emptyConstructor
  }
}

// Dynamically import ForceGraph2D (client-side only)
const ForceGraph2D = dynamic(() => import('react-force-graph').then(mod => mod.ForceGraph2D), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] neuro-inset rounded-lg">
      <Loader2 className="animate-spin text-blue-400" size={40} />
    </div>
  )
})

interface GraphNode {
  id: string
  name: string
  type: string
  difficulty_score?: number
  learning_depth?: number
  full_path: string
  val: number
  color: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: string
  confidence?: number
  reasoning?: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  stats: {
    nodeCount: number
    linkCount: number
    scope: string
    focusNodeId: string | null
  }
}

interface InteractiveKnowledgeGraphProps {
  scope?: string  // Filter by scope (e.g., "CompTIA Security+")
  focusNodeId?: string  // Highlight specific node
  highlightPath?: string[]  // Array of node IDs to highlight as path
  animatePath?: boolean  // Enable path traversal animation
  animationSpeed?: number  // Animation speed in ms per step (default: 1000)
  onNodeClick?: (nodeId: string, nodeName: string) => void
  height?: number
  width?: number
}

export function InteractiveKnowledgeGraph({
  scope,
  focusNodeId,
  highlightPath = [],
  animatePath = false,
  animationSpeed = 1000,
  onNodeClick,
  height = 600,
  width
}: InteractiveKnowledgeGraphProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [animationStep, setAnimationStep] = useState<number>(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const graphRef = useRef<any>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch graph data
  useEffect(() => {
    async function fetchGraph() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (scope) params.set('scope', scope)
        if (focusNodeId) params.set('focusNodeId', focusNodeId)

        const response = await fetch(`/api/semantic/graph?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch graph data')
        }

        const data = await response.json()
        setGraphData(data)
      } catch (err) {
        console.error('Error fetching graph:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchGraph()
  }, [scope, focusNodeId])

  // Center graph on focus node when it changes
  useEffect(() => {
    if (graphRef.current && focusNodeId && graphData) {
      const node = graphData.nodes.find(n => n.id === focusNodeId)
      if (node) {
        graphRef.current.centerAt(node.x, node.y, 1000)
        graphRef.current.zoom(3, 1000)
      }
    }
  }, [focusNodeId, graphData])

  // Path traversal animation
  useEffect(() => {
    // Clear any existing animation
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current)
      animationTimerRef.current = null
    }

    // Start animation if enabled and path exists
    if (animatePath && highlightPath.length > 0) {
      setIsAnimating(true)
      setAnimationStep(0)

      animationTimerRef.current = setInterval(() => {
        setAnimationStep(step => {
          const nextStep = step + 1
          if (nextStep >= highlightPath.length) {
            // Animation complete
            if (animationTimerRef.current) {
              clearInterval(animationTimerRef.current)
              animationTimerRef.current = null
            }
            setIsAnimating(false)
            return highlightPath.length - 1  // Stay on last step
          }

          // Center on current node
          if (graphRef.current && graphData) {
            const currentNodeId = highlightPath[nextStep]
            const node = graphData.nodes.find(n => n.id === currentNodeId)
            if (node) {
              graphRef.current.centerAt(node.x, node.y, animationSpeed / 2)
            }
          }

          return nextStep
        })
      }, animationSpeed)
    } else {
      setIsAnimating(false)
      setAnimationStep(0)
    }

    // Cleanup on unmount
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current)
        animationTimerRef.current = null
      }
    }
  }, [animatePath, highlightPath, animationSpeed, graphData])

  // Determine if a node is in the highlight path
  const isInHighlightPath = useCallback((nodeId: string) => {
    if (!highlightPath.includes(nodeId)) return false

    // If animating, only highlight nodes up to current step
    if (isAnimating) {
      const nodeIndex = highlightPath.indexOf(nodeId)
      return nodeIndex <= animationStep
    }

    return true
  }, [highlightPath, isAnimating, animationStep])

  // Determine if a link is in the highlight path
  const isLinkInHighlightPath = useCallback((link: GraphLink) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id

    const sourceIndex = highlightPath.indexOf(sourceId)
    const targetIndex = highlightPath.indexOf(targetId)

    // Link is in path if both nodes are in path and consecutive
    if (sourceIndex === -1 || targetIndex === -1 || Math.abs(sourceIndex - targetIndex) !== 1) {
      return false
    }

    // If animating, only highlight links up to current step
    if (isAnimating) {
      const maxIndex = Math.max(sourceIndex, targetIndex)
      return maxIndex <= animationStep
    }

    return true
  }, [highlightPath, isAnimating, animationStep])

  // Node paint function
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name
    const fontSize = 12 / globalScale
    const isHighlighted = isInHighlightPath(node.id)
    const isHovered = hoveredNode?.id === node.id
    const isFocus = focusNodeId === node.id

    // Node circle
    ctx.beginPath()
    ctx.arc(node.x || 0, node.y || 0, node.val, 0, 2 * Math.PI)

    // Fill color
    if (isFocus) {
      ctx.fillStyle = '#3b82f6'  // Blue for focus
    } else if (isHighlighted) {
      ctx.fillStyle = '#f59e0b'  // Yellow for path
    } else {
      ctx.fillStyle = node.color
    }
    ctx.fill()

    // Border for highlighted/hovered
    if (isHighlighted || isHovered || isFocus) {
      ctx.strokeStyle = isHovered ? '#ffffff' : '#fbbf24'
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()
    }

    // Label
    if (globalScale > 1.5 || isHovered || isHighlighted || isFocus) {
      ctx.font = `${fontSize}px Sans-Serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, node.x || 0, (node.y || 0) + node.val + fontSize)
    }
  }, [focusNodeId, hoveredNode, isInHighlightPath])

  // Link paint function
  const paintLink = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const source = typeof link.source === 'object' ? link.source : null
    const target = typeof link.target === 'object' ? link.target : null

    if (!source || !target || !source.x || !source.y || !target.x || !target.y) return

    const isHighlighted = isLinkInHighlightPath(link)

    // Draw arrow
    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)

    if (isHighlighted) {
      ctx.strokeStyle = '#fbbf24'  // Yellow for path
      ctx.lineWidth = 3 / globalScale
    } else {
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)'  // Gray
      ctx.lineWidth = 1 / globalScale
    }
    ctx.stroke()

    // Arrow head
    const arrowLength = 10 / globalScale
    const arrowWidth = 6 / globalScale
    const angle = Math.atan2(target.y - source.y, target.x - source.x)

    const arrowX = target.x - Math.cos(angle) * target.val
    const arrowY = target.y - Math.sin(angle) * target.val

    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
      arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
      arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fillStyle = isHighlighted ? '#fbbf24' : 'rgba(156, 163, 175, 0.5)'
    ctx.fill()
  }, [isLinkInHighlightPath])

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    if (onNodeClick) {
      onNodeClick(node.id, node.name)
    }
  }, [onNodeClick])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] neuro-inset rounded-lg">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-400 mx-auto mb-4" size={40} />
          <div className="text-gray-400">Loading knowledge graph...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="neuro-inset p-6 rounded-lg text-center">
        <div className="text-red-400 font-semibold mb-2">Error loading graph</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    )
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="neuro-inset p-6 rounded-lg text-center">
        <div className="text-gray-400 font-semibold mb-2">No graph data available</div>
        <div className="text-sm text-gray-500">
          {scope ? `No nodes found for scope: ${scope}` : 'No nodes in knowledge graph'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="neuro-inset p-4 rounded-lg">
          <div className="text-sm text-blue-400 font-medium mb-1">Nodes</div>
          <div className="text-2xl font-bold text-gray-200">{graphData.stats.nodeCount}</div>
        </div>
        <div className="neuro-inset p-4 rounded-lg">
          <div className="text-sm text-cyan-400 font-medium mb-1">Relationships</div>
          <div className="text-2xl font-bold text-gray-200">{graphData.stats.linkCount}</div>
        </div>
        <div className="neuro-inset p-4 rounded-lg">
          <div className="text-sm text-purple-400 font-medium mb-1">Scope</div>
          <div className="text-lg font-semibold text-gray-200 truncate">
            {graphData.stats.scope}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="neuro-inset rounded-lg overflow-hidden">
        <ForceGraph2D
          ref={graphRef as any}
          graphData={graphData}
          height={height}
          width={width}
          backgroundColor="#0a0a0a"
          nodeCanvasObject={paintNode as any}
          linkCanvasObject={paintLink as any}
          onNodeClick={handleNodeClick as any}
          onNodeHover={setHoveredNode as any}
          nodeLabel={((node: any) => `${node.name} (L${node.learning_depth || 0})`) as any}
          linkDirectionalArrowLength={0}  // Custom arrows
          linkCurvature={0.2}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTime={3000}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>

      {/* Legend */}
      <div className="neuro-card p-4">
        <div className="text-sm font-semibold text-gray-300 mb-3">Learning Depth Legend</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6b7280' }}></div>
            <span className="text-xs text-gray-400">L0 - Foundation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-xs text-gray-400">L1 - Basic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#06b6d4' }}></div>
            <span className="text-xs text-gray-400">L2 - Intermediate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="text-xs text-gray-400">L3 - Advanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
            <span className="text-xs text-gray-400">L4 - Expert</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-xs text-gray-400">L5+ - Mastery</span>
          </div>
        </div>
      </div>

      {/* Animation progress indicator */}
      {isAnimating && highlightPath.length > 0 && (
        <div className="neuro-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-yellow-400">
              Animating Prerequisite Path
            </div>
            <div className="text-xs text-gray-500">
              Step {animationStep + 1} of {highlightPath.length}
            </div>
          </div>

          {/* Progress bar */}
          <div className="neuro-inset rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${((animationStep + 1) / highlightPath.length) * 100}%` }}
            />
          </div>

          {/* Current node */}
          {graphData && (
            <div className="mt-3 text-xs text-gray-400">
              <span className="text-gray-500">Current:</span>{' '}
              <span className="text-gray-200 font-medium">
                {graphData.nodes.find(n => n.id === highlightPath[animationStep])?.name || 'Unknown'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hovered node info */}
      {hoveredNode && !isAnimating && (
        <div className="neuro-card p-4">
          <div className="text-sm font-semibold text-gray-300 mb-2">
            {hoveredNode.name}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Type: {hoveredNode.type}</div>
            <div>Learning Depth: L{hoveredNode.learning_depth || 0}</div>
            <div>Difficulty: {hoveredNode.difficulty_score || 'N/A'}/10</div>
            <div className="truncate" title={hoveredNode.full_path}>
              Path: {hoveredNode.full_path}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

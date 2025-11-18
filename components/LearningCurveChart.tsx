'use client'

import { useMemo } from 'react'

interface DataPoint {
    attempt: number
    score: number // Calibration score (-1.5 to 1.5)
    isCorrect: boolean
}

interface LearningCurveChartProps {
    data: DataPoint[]
    slope: number | null
    intercept: number | null // We might need to calculate this if not provided
    stddev: number | null
    height?: number
    className?: string
    sparkline?: boolean
}

export default function LearningCurveChart({
    data,
    slope,
    intercept: providedIntercept,
    stddev,
    height = 300,
    className = '',
    sparkline = false
}: LearningCurveChartProps) {
    // Constants for chart dimensions and scaling
    const PADDING = sparkline
        ? { top: 5, right: 5, bottom: 5, left: 5 }
        : { top: 20, right: 20, bottom: 30, left: 40 }
    const Y_MIN = -2.0 // Slightly wider than -1.5 to 1.5 range
    const Y_MAX = 2.0

    // Memoize calculations
    const { points, regressionLine, confidenceArea, width } = useMemo(() => {
        if (!data.length) return { points: [], regressionLine: null, confidenceArea: null, width: 0 }

        // Sort data by attempt number just in case
        const sortedData = [...data].sort((a, b) => a.attempt - b.attempt)

        // Determine X axis range (attempts)
        // Always show at least 5 attempts on X axis, or max attempts + 1
        const maxAttempt = Math.max(5, ...sortedData.map(d => d.attempt))
        const minAttempt = 1

        // We'll use a relative width of 100% but need coordinate system
        // Let's assume a coordinate system of 1000 units wide for internal SVG math
        const VIEWBOX_WIDTH = 1000
        const VIEWBOX_HEIGHT = height

        // Scaling functions
        const xScale = (attempt: number) => {
            return PADDING.left + ((attempt - minAttempt) / (maxAttempt - minAttempt)) * (VIEWBOX_WIDTH - PADDING.left - PADDING.right)
        }

        const yScale = (score: number) => {
            // Clamp score to visible range
            const clamped = Math.max(Y_MIN, Math.min(Y_MAX, score))
            // Invert Y because SVG 0 is top
            return VIEWBOX_HEIGHT - PADDING.bottom - ((clamped - Y_MIN) / (Y_MAX - Y_MIN)) * (VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom)
        }

        // Calculate points for scatter plot
        const points = sortedData.map(d => ({
            x: xScale(d.attempt),
            y: yScale(d.score),
            ...d
        }))

        // Calculate Regression Line
        // If we don't have a provided intercept, we can estimate it from the centroid
        let finalIntercept = providedIntercept
        if (slope !== null && finalIntercept === null && sortedData.length > 0) {
            const meanX = sortedData.reduce((sum, d) => sum + d.attempt, 0) / sortedData.length
            const meanY = sortedData.reduce((sum, d) => sum + d.score, 0) / sortedData.length
            finalIntercept = meanY - (slope * meanX)
        }

        let regressionLine = null
        let confidenceArea = null

        if (slope !== null && finalIntercept !== null) {
            const startX = minAttempt
            const endX = maxAttempt

            const startY = (slope * startX) + finalIntercept
            const endY = (slope * endX) + finalIntercept

            regressionLine = {
                x1: xScale(startX),
                y1: yScale(startY),
                x2: xScale(endX),
                y2: yScale(endY)
            }

            // Confidence Interval Area (±1 stddev)
            if (stddev !== null) {
                const upperStartY = startY + stddev
                const upperEndY = endY + stddev
                const lowerStartY = startY - stddev
                const lowerEndY = endY - stddev

                // Create polygon points: Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left
                confidenceArea = [
                    `${xScale(startX)},${yScale(upperStartY)}`,
                    `${xScale(endX)},${yScale(upperEndY)}`,
                    `${xScale(endX)},${yScale(lowerEndY)}`,
                    `${xScale(startX)},${yScale(lowerStartY)}`
                ].join(' ')
            }
        }

        return { points, regressionLine, confidenceArea, width: VIEWBOX_WIDTH }
    }, [data, slope, providedIntercept, stddev, height])

    if (!data.length) {
        return (
            <div className={`flex items-center justify-center text-gray-500 ${className}`} style={{ height }}>
                Not enough data to display learning curve
            </div>
        )
    }

    return (
        <div className={`w-full ${className}`}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
            >
                {/* Grid Lines & Axis Labels - Hide in sparkline mode */}
                {!sparkline && (
                    <g className="text-xs text-gray-600">
                        {/* Zero Line (Neutral Performance) */}
                        <line
                            x1={PADDING.left}
                            y1={height / 2}
                            x2={width - PADDING.right}
                            y2={height / 2}
                            stroke="#374151"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                        <text x={0} y={height / 2} dy="4" fill="currentColor">0.0</text>

                        {/* Top Line (+1.5) */}
                        <line
                            x1={PADDING.left}
                            y1={PADDING.top}
                            x2={width - PADDING.right}
                            y2={PADDING.top}
                            stroke="#1f2937"
                            strokeWidth="1"
                        />
                        <text x={0} y={PADDING.top + 10} dy="4" fill="currentColor">+2.0</text>

                        {/* Bottom Line (-1.5) */}
                        <line
                            x1={PADDING.left}
                            y1={height - PADDING.bottom}
                            x2={width - PADDING.right}
                            y2={height - PADDING.bottom}
                            stroke="#1f2937"
                            strokeWidth="1"
                        />
                        <text x={0} y={height - PADDING.bottom} dy="-4" fill="currentColor">-2.0</text>
                    </g>
                )}

                {/* Zero Line for Sparkline (Subtle) */}
                {sparkline && (
                    <line
                        x1={PADDING.left}
                        y1={height / 2}
                        x2={width - PADDING.right}
                        y2={height / 2}
                        stroke="#374151"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                    />
                )}

                {/* Confidence Interval Area */}
                {confidenceArea && (
                    <polygon
                        points={confidenceArea}
                        fill="rgba(59, 130, 246, 0.1)" // Blue with low opacity
                        stroke="none"
                    />
                )}

                {/* Regression Line */}
                {regressionLine && (
                    <line
                        x1={regressionLine.x1}
                        y1={regressionLine.y1}
                        x2={regressionLine.x2}
                        y2={regressionLine.y2}
                        stroke="#3b82f6" // Blue-500
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )}

                {/* Data Points - Smaller in sparkline */}
                {points.map((point, i) => (
                    <g key={i} className="group">
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={sparkline ? 2 : 4}
                            className={`${point.isCorrect ? 'fill-green-400' : 'fill-red-400'} transition-all duration-200 ${!sparkline && 'group-hover:r-6'}`}
                            stroke="#0a0a0a"
                            strokeWidth="1"
                        />
                        {/* Tooltip (simple SVG title for now) */}
                        {!sparkline && (
                            <title>{`Attempt ${point.attempt}: ${point.isCorrect ? 'Correct' : 'Incorrect'} (Score: ${point.score.toFixed(2)})`}</title>
                        )}
                    </g>
                ))}

                {/* X-Axis Label - Hide in sparkline */}
                {!sparkline && (
                    <text
                        x={width / 2}
                        y={height - 5}
                        textAnchor="middle"
                        className="text-xs fill-gray-500"
                    >
                        Practice Attempts →
                    </text>
                )}
            </svg>
        </div>
    )
}

/**
 * Calibration Scatter Plot Component
 *
 * Displays individual responses as scatter points with regression line
 * Shows distribution and pattern of calibration over time
 */

'use client'

import { normalizeCalibration } from '@/lib/utils/calibration'

interface ScatterPoint {
  attempt: number
  calibration: number
  isCorrect: boolean
  confidence: number
  recognitionMethod: string
}

interface CalibrationScatterPlotProps {
  points: ScatterPoint[]
  slope: number
  intercept: number
  rSquared: number
  stddev: number
}

export function CalibrationScatterPlot({
  points,
  slope,
  intercept,
  rSquared,
  stddev
}: CalibrationScatterPlotProps) {
  if (points.length === 0) {
    return (
      <div className="neuro-inset rounded-lg p-8 text-center text-gray-500">
        No data points available
      </div>
    )
  }

  const width = 800
  const height = 500
  const padding = 60

  // Calculate bounds
  const minX = 1
  const maxX = Math.max(...points.map(p => p.attempt))
  const minY = 0
  const maxY = 1

  // Normalize calibration values for plotting
  const normalizedPoints = points.map(p => ({
    ...p,
    calibration: normalizeCalibration(p.calibration)
  }))

  // Scale functions
  const scaleX = (x: number) => {
    return padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding)
  }

  const scaleY = (y: number) => {
    return height - padding - ((y - minY) / (maxY - minY)) * (height - 2 * padding)
  }

  // Normalize trend line parameters (raw values are in -1.5 to +1.5 range)
  const normalizedSlope = slope / 3
  const normalizedIntercept = (intercept + 1.5) / 3
  const normalizedStddev = stddev / 3

  // Trend line points (using normalized values)
  const trendLineStart = { x: minX, y: normalizedSlope * minX + normalizedIntercept }
  const trendLineEnd = { x: maxX, y: normalizedSlope * maxX + normalizedIntercept }

  // Confidence bands (±1 stddev)
  const upperBand = (x: number) => normalizedSlope * x + normalizedIntercept + normalizedStddev
  const lowerBand = (x: number) => normalizedSlope * x + normalizedIntercept - normalizedStddev

  // Generate confidence band path
  const confidenceBandPath = `
    M ${scaleX(minX)} ${scaleY(lowerBand(minX))}
    L ${scaleX(maxX)} ${scaleY(lowerBand(maxX))}
    L ${scaleX(maxX)} ${scaleY(upperBand(maxX))}
    L ${scaleX(minX)} ${scaleY(upperBand(minX))}
    Z
  `

  // Group points by recognition method for color coding
  const methodColors = {
    memory: 'text-purple-400',
    recognition: 'text-blue-400',
    educated_guess: 'text-yellow-400',
    random_guess: 'text-red-400'
  }

  return (
    <div className="neuro-inset rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">
          Calibration Distribution & Trend
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Points: {points.length}</span>
          <span>R² = {rSquared.toFixed(3)}</span>
          <span>StdDev = ±{stddev.toFixed(2)}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '500px' }}
      >
        {/* Grid lines */}
        <g className="opacity-10">
          {/* Horizontal grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(y => (
            <line
              key={`h-${y}`}
              x1={padding}
              y1={scaleY(y)}
              x2={width - padding}
              y2={scaleY(y)}
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-600"
            />
          ))}
          {/* Vertical grid */}
          {Array.from({ length: 10 }, (_, i) => minX + (i * (maxX - minX) / 9)).map(x => (
            <line
              key={`v-${x}`}
              x1={scaleX(x)}
              y1={padding}
              x2={scaleX(x)}
              y2={height - padding}
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-600"
            />
          ))}
        </g>

        {/* Zero line */}
        <line
          x1={padding}
          y1={scaleY(0)}
          x2={width - padding}
          y2={scaleY(0)}
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-500"
          strokeDasharray="4 4"
        />

        {/* Confidence band (±1 stddev) */}
        <path
          d={confidenceBandPath}
          fill="currentColor"
          className="text-cyan-400"
          opacity="0.1"
        />

        {/* Trend line */}
        <line
          x1={scaleX(trendLineStart.x)}
          y1={scaleY(trendLineStart.y)}
          x2={scaleX(trendLineEnd.x)}
          y2={scaleY(trendLineEnd.y)}
          stroke="currentColor"
          strokeWidth="3"
          className="text-cyan-400"
          strokeDasharray="8 4"
        />

        {/* Y-axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-600"
        />

        {/* X-axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-600"
        />

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(y => (
          <text
            key={`label-y-${y}`}
            x={padding - 10}
            y={scaleY(y)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-gray-400 text-xs"
            fill="currentColor"
          >
            {y.toFixed(2)}
          </text>
        ))}

        {/* X-axis labels */}
        {Array.from({ length: 6 }, (_, i) => Math.round(minX + (i * (maxX - minX) / 5))).map(x => (
          <text
            key={`label-x-${x}`}
            x={scaleX(x)}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-gray-400 text-xs"
            fill="currentColor"
          >
            {x}
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="text-gray-400 text-sm font-semibold"
          fill="currentColor"
        >
          Attempt Number
        </text>
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          className="text-gray-400 text-sm font-semibold"
          fill="currentColor"
          transform={`rotate(-90 20 ${height / 2})`}
        >
          Calibration Score
        </text>

        {/* Scatter points */}
        {normalizedPoints.map((point, index) => {
          const cx = scaleX(point.attempt)
          const cy = scaleY(point.calibration)
          const methodClass = methodColors[point.recognitionMethod as keyof typeof methodColors] || 'text-gray-400'

          return (
            <g key={index}>
              {/* Point */}
              <circle
                cx={cx}
                cy={cy}
                r="6"
                fill="currentColor"
                className={methodClass}
                opacity="0.7"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              {/* Hover area */}
              <circle
                cx={cx}
                cy={cy}
                r="12"
                fill="transparent"
                className="cursor-pointer hover:fill-blue-400 hover:fill-opacity-20"
              >
                <title>
                  Attempt #{point.attempt}
                  Calibration: {point.calibration.toFixed(2)}
                  Result: {point.isCorrect ? 'Correct' : 'Incorrect'}
                  Confidence: {point.confidence}/3
                  Method: {point.recognitionMethod.replace('_', ' ')}
                </title>
              </circle>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Recognition Methods */}
        <div className="neuro-inset rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-400 mb-2">Recognition Method</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-400"></div>
              <span className="text-gray-500">Memory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className="text-gray-500">Recognition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-gray-500">Educated Guess</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-gray-500">Random Guess</span>
            </div>
          </div>
        </div>

        {/* Statistical Info */}
        <div className="neuro-inset rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-400 mb-2">Distribution</div>
          <div className="space-y-1 text-xs text-gray-500">
            <div>
              <span className="text-cyan-400">Trend line:</span> Shows learning trajectory
            </div>
            <div>
              <span className="text-cyan-400 opacity-30">Shaded area:</span> ±1 standard deviation
            </div>
            <div>
              Points within band: {Math.round((points.filter(p => Math.abs(p.calibration - (slope * p.attempt + intercept)) <= stddev).length / points.length) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="mt-4 neuro-inset rounded-lg p-3 text-xs text-gray-500">
        <strong>Pattern Analysis:</strong>{' '}
        {stddev < 0.3 ? (
          <span className="text-green-400">Very consistent performance — calibration is stable and predictable.</span>
        ) : stddev < 0.6 ? (
          <span className="text-yellow-400">Moderate consistency — some variance in calibration, which is normal during learning.</span>
        ) : (
          <span className="text-red-400">High variance — calibration is inconsistent. Focus on honest self-assessment.</span>
        )}
      </div>
    </div>
  )
}

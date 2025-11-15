/**
 * Calibration Line Chart Component
 *
 * Displays calibration scores over time with linear regression trend line
 */

'use client'

interface DataPoint {
  x: number  // Question number / attempt
  y: number  // Calibration score
  date?: string
}

interface CalibrationLineChartProps {
  data: DataPoint[]
  slope: number
  intercept?: number
  rSquared: number
  title?: string
}

export function CalibrationLineChart({
  data,
  slope,
  intercept = 0,
  rSquared,
  title = 'Calibration Over Time'
}: CalibrationLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="neuro-inset rounded-lg p-8 text-center text-gray-500">
        No data available for visualization
      </div>
    )
  }

  const width = 800
  const height = 400
  const padding = 60

  // Calculate bounds
  const minX = Math.min(...data.map(d => d.x))
  const maxX = Math.max(...data.map(d => d.x))
  const minY = -1.5
  const maxY = 1.5

  // Scale functions
  const scaleX = (x: number) => {
    return padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding)
  }

  const scaleY = (y: number) => {
    return height - padding - ((y - minY) / (maxY - minY)) * (height - 2 * padding)
  }

  // Generate trend line points
  const trendLineStart = { x: minX, y: slope * minX + intercept }
  const trendLineEnd = { x: maxX, y: slope * maxX + intercept }

  // Generate path for data points
  const dataPath = data.map((point, index) => {
    const x = scaleX(point.x)
    const y = scaleY(point.y)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <div className="neuro-inset rounded-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        <div className="text-sm text-gray-500">
          R² = {rSquared.toFixed(3)} | Slope = {slope > 0 ? '+' : ''}{slope.toFixed(4)}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        {/* Grid lines */}
        <g className="opacity-20">
          {/* Horizontal grid lines */}
          {[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map(y => (
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
          {/* Vertical grid lines */}
          {Array.from({ length: 5 }, (_, i) => minX + (i * (maxX - minX) / 4)).map(x => (
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

        {/* Zero line (highlighted) */}
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

        {/* Y-axis labels */}
        {[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map(y => (
          <text
            key={`label-y-${y}`}
            x={padding - 10}
            y={scaleY(y)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-gray-500 text-xs"
            fill="currentColor"
          >
            {y.toFixed(1)}
          </text>
        ))}

        {/* X-axis labels */}
        {Array.from({ length: 5 }, (_, i) => Math.round(minX + (i * (maxX - minX) / 4))).map(x => (
          <text
            key={`label-x-${x}`}
            x={scaleX(x)}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-gray-500 text-xs"
            fill="currentColor"
          >
            {x}
          </text>
        ))}

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="text-gray-400 text-sm font-semibold"
          fill="currentColor"
        >
          Question Number
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

        {/* Trend line */}
        <line
          x1={scaleX(trendLineStart.x)}
          y1={scaleY(trendLineStart.y)}
          x2={scaleX(trendLineEnd.x)}
          y2={scaleY(trendLineEnd.y)}
          stroke="currentColor"
          strokeWidth="3"
          className={slope > 0 ? 'text-cyan-400' : 'text-red-400'}
          strokeDasharray="8 4"
          opacity="0.7"
        />

        {/* Data line */}
        <path
          d={dataPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-400"
        />

        {/* Data points */}
        {data.map((point, index) => (
          <g key={index}>
            <circle
              cx={scaleX(point.x)}
              cy={scaleY(point.y)}
              r="5"
              fill="currentColor"
              className={point.y > 0 ? 'text-green-400' : 'text-red-400'}
            />
            {/* Tooltip trigger */}
            <circle
              cx={scaleX(point.x)}
              cy={scaleY(point.y)}
              r="10"
              fill="transparent"
              className="cursor-pointer hover:fill-blue-400 hover:fill-opacity-20"
            >
              <title>
                Question {point.x}: {point.y > 0 ? '+' : ''}{point.y.toFixed(2)}
                {point.date && `\n${point.date}`}
              </title>
            </circle>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-400 rounded"></div>
          <span>Actual Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-1 ${slope > 0 ? 'bg-cyan-400' : 'bg-red-400'} rounded`} style={{ backgroundImage: 'repeating-linear-gradient(to right, currentColor 0, currentColor 8px, transparent 8px, transparent 12px)' }}></div>
          <span>Trend Line ({slope > 0 ? 'Improving' : 'Declining'})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-400"></div>
          <span>Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-400"></div>
          <span>Negative</span>
        </div>
      </div>

      {/* R² Interpretation */}
      <div className="mt-4 neuro-inset rounded-lg p-3 text-xs text-gray-500">
        <strong>Trend Reliability (R²):</strong>{' '}
        {rSquared > 0.7 ? (
          <span className="text-green-400">Strong ({(rSquared * 100).toFixed(0)}% of variance explained)</span>
        ) : rSquared > 0.4 ? (
          <span className="text-yellow-400">Moderate ({(rSquared * 100).toFixed(0)}% of variance explained)</span>
        ) : (
          <span className="text-red-400">Weak ({(rSquared * 100).toFixed(0)}% of variance explained)</span>
        )}
        {' — '}
        {slope > 0 ? (
          <span className="text-cyan-400">You are improving at +{slope.toFixed(4)} per question!</span>
        ) : slope < 0 ? (
          <span className="text-red-400">Calibration is declining at {slope.toFixed(4)} per question.</span>
        ) : (
          <span className="text-gray-400">Calibration is stable (no trend).</span>
        )}
      </div>
    </div>
  )
}

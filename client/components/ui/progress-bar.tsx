// Progress bar component for XP and stats

interface ProgressBarProps {
  value: number
  max: number
  color?: string
  height?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

const heightClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
}

export function ProgressBar({
  value,
  max,
  color = 'bg-blue-600',
  height = 'md',
  showValue = false
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-700 rounded-full ${heightClasses[height]}`}>
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}
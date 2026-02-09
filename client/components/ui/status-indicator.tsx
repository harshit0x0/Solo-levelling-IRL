// Status indicator component for task logs

interface StatusIndicatorProps {
  status: 'pending' | 'success' | 'failed' | 'missed'
  size?: 'sm' | 'md'
}

const statusConfig = {
  pending: { color: 'bg-yellow-500', icon: '⏳', label: 'Pending' },
  success: { color: 'bg-green-500', icon: '✅', label: 'Success' },
  failed: { color: 'bg-red-500', icon: '❌', label: 'Failed' },
  missed: { color: 'bg-gray-500', icon: '⏰', label: 'Missed' }
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm'
}

export function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const config = statusConfig[status]

  return (
    <div className={`
      inline-flex items-center space-x-1 rounded-full font-medium
      ${config.color} text-white ${sizeClasses[size]}
    `}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  )
}
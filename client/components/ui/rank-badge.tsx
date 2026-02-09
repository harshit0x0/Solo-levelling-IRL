// Rank badge component for player ranks

interface RankBadgeProps {
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS'
  size?: 'sm' | 'md' | 'lg'
}

const rankColors = {
  E: 'bg-gray-600 text-gray-200',
  D: 'bg-gray-500 text-white',
  C: 'bg-green-600 text-white',
  B: 'bg-blue-600 text-white',
  A: 'bg-purple-600 text-white',
  S: 'bg-yellow-500 text-black',
  SS: 'bg-red-600 text-white'
}

const sizeClasses = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-1.5 text-base',
  lg: 'px-4 py-2 text-lg'
}

export function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  return (
    <div className={`
      inline-flex items-center justify-center font-bold rounded-md border border-gray-500
      ${rankColors[rank]} ${sizeClasses[size]}
    `}>
      {rank}
    </div>
  )
}
// Difficulty badge component for quests

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard'
  size?: 'sm' | 'md'
}

const difficultyColors = {
  easy: 'bg-green-600 text-white',
  medium: 'bg-yellow-600 text-black',
  hard: 'bg-red-600 text-white'
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm'
}

export function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${difficultyColors[difficulty]} ${sizeClasses[size]}
    `}>
      {difficulty.toUpperCase()}
    </span>
  )
}
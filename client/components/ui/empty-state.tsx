// Empty state components

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
}

export function EmptyState({ title, description, icon = '📭' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 text-sm">{description}</p>
      )}
    </div>
  )
}

export function NoActiveQuest() {
  return (
    <EmptyState
      title="No Active Quest"
      description="Check back later for your next daily challenge."
      icon="⚔️"
    />
  )
}

export function NoTaskHistory() {
  return (
    <EmptyState
      title="No Task History"
      description="Complete your first quest to see your history here."
      icon="📜"
    />
  )
}
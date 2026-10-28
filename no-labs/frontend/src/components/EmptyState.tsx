import type { ReactNode } from 'react';

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center text-sub mb-3">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-sm text-sub mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

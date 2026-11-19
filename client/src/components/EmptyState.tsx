import { Activity } from 'lucide-react';

export function EmptyState({ title = 'Nothing to show yet', message = 'Your readings will appear here once you add them.' }: { title?: string; message?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Activity size={23} /></span>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

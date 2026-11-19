import { HeartPulse } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup">
      <span className="brand-mark"><HeartPulse size={20} strokeWidth={2.4} /></span>
      {!compact && <span className="brand-name">sweety<span>.</span></span>}
    </div>
  );
}

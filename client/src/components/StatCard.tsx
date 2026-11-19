import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label, value, suffix = '', icon: Icon, tone = 'purple', hint,
}: {
  label: string; value: string | number; suffix?: string; icon: LucideIcon;
  tone?: 'purple' | 'pink' | 'blue' | 'green'; hint?: string;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}<small>{suffix}</small></div>
      {hint && <div className="stat-hint">{hint}</div>}
    </article>
  );
}

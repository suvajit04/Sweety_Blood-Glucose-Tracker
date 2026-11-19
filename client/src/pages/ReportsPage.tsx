import { useEffect, useState } from 'react';
import { Activity, CalendarDays, TrendingDown, TrendingUp } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { GlucoseTrendChart } from '../components/GlucoseTrendChart';
import { StatCard } from '../components/StatCard';
import { api, getErrorMessage } from '../services/api';
import type { ChartPoint, DailyReport, PeriodReport } from '../types';
import { slotLabel } from '../types';
import { formatDate, formatRange, localDateString } from '../utils/date';

type ReportTab = 'daily' | 'month-to-date' | 'monthly';

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('daily');
  const [selectedDate, setSelectedDate] = useState(localDateString());
  const [report, setReport] = useState<DailyReport | PeriodReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(''); setReport(null);
      try {
        const endpoint = tab === 'daily' ? '/reports/daily' : tab === 'month-to-date' ? '/reports/month-to-date' : '/reports/monthly';
        const response = await api.get(endpoint, { params: { date: selectedDate } });
        if (active) setReport(response.data.data as DailyReport | PeriodReport);
      } catch (err) { if (active) setError(getErrorMessage(err)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [tab, selectedDate]);

  useEffect(() => {
    let active = true;
    api.get('/reports/monthly-chart', { params: { date: selectedDate } })
      .then((response) => { if (active) setChartData(response.data.data.data as ChartPoint[]); })
      .catch(() => { if (active) setChartData([]); });
    return () => { active = false; };
  }, [selectedDate]);

  const range = report ? formatRange(report.dateRange.start, report.dateRange.end) : '—';
  const value = (number: number | null) => number === null ? '—' : number.toFixed(number % 1 ? 1 : 0);
  const daily = report?.type === 'daily' ? report as DailyReport : null;

  return (
    <div className="page-stack">
      <section className="page-title-row"><div><span className="eyebrow">YOUR PROGRESS, OVER TIME</span><h1>Reports</h1><p>Review the readings you’ve logged across different periods.</p></div></section>
      <section className="surface-card report-controls">
        <div className="report-tabs" role="tablist" aria-label="Report period">
          <button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'selected' : ''} onClick={() => setTab('daily')}>Daily</button>
          <button role="tab" aria-selected={tab === 'month-to-date'} className={tab === 'month-to-date' ? 'selected' : ''} onClick={() => setTab('month-to-date')}>Month to date</button>
          <button role="tab" aria-selected={tab === 'monthly'} className={tab === 'monthly' ? 'selected' : ''} onClick={() => setTab('monthly')}>Previous month</button>
        </div>
        <label className="report-date-label"><CalendarDays size={16} /><span>Reference date</span><input type="date" max={localDateString()} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value || localDateString())} /></label>
      </section>
      <section className="report-intro"><div><span className="eyebrow">{tab === 'daily' ? 'DAILY OVERVIEW' : tab === 'month-to-date' ? 'MONTH-TO-DATE OVERVIEW' : 'MONTHLY OVERVIEW'}</span><h2>{range}</h2></div><div className="report-period-tag">{tab === 'daily' ? 'One day' : tab === 'month-to-date' ? '1st of month → selected date' : 'Full previous month'}</div></section>
      {error && <div className="form-error page-error" role="alert">{error}</div>}
      {loading ? <div className="loading-card surface-card">Preparing your report…</div> : report && (
        <>
          <div className="stats-grid report-stats">
            <StatCard label="Highest reading" value={value(report.highest)} suffix={report.highest === null ? '' : 'mg/dL'} icon={TrendingUp} tone="pink" />
            <StatCard label="Lowest reading" value={value(report.lowest)} suffix={report.lowest === null ? '' : 'mg/dL'} icon={TrendingDown} tone="blue" />
            <StatCard label="Average reading" value={value(report.average)} suffix={report.average === null ? '' : 'mg/dL'} icon={Activity} tone="purple" />
            <StatCard label="Total readings" value={report.count} icon={CalendarDays} tone="green" />
          </div>
          {tab === 'daily' && <section className="surface-card daily-report-card"><div className="section-heading"><div><span className="eyebrow">READING BREAKDOWN</span><h2>Daily entries</h2></div><span className="section-note">{formatDate(selectedDate)}</span></div>
            {daily && daily.readings.length > 0 ? <div className="daily-slots">{daily.readings.map((reading) => <div className="daily-slot-row" key={reading.id}><span className="daily-slot-indicator" /><span className="daily-slot-name">{slotLabel(reading.timeSlot)}</span><strong>{reading.value} <small>mg/dL</small></strong></div>)}</div> : <EmptyState title="No readings for this day" message="There are no glucose readings recorded for the selected date." />}
          </section>}
          {report.count === 0 && tab !== 'daily' && <section className="surface-card"><EmptyState title="No readings in this period" message="Once you start logging readings, your summary will appear here." /></section>}
        </>
      )}
      <div className="disclaimer"><PlusIcon /> Report statistics are calculated from your saved entries and are not a substitute for clinical advice.</div>
      <section className="surface-card trend-panel">
        <div className="section-heading"><div><span className="eyebrow">MONTHLY TREND</span><h2>Glucose averages</h2></div><span className="section-note">{selectedDate.slice(0, 7)}</span></div>
        <GlucoseTrendChart data={chartData} />
      </section>
    </div>
  );
}

function PlusIcon() { return <span className="disclaimer-plus">✦</span>; }

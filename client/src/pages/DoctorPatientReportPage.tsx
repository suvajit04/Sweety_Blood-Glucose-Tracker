import { useEffect, useState } from 'react';
import { Activity, ArrowLeft, CalendarDays, TrendingDown, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { GlucoseTrendChart } from '../components/GlucoseTrendChart';
import { EmptyState } from '../components/EmptyState';
import { StatCard } from '../components/StatCard';
import { api, getErrorMessage } from '../services/api';
import { slotLabel, type ChartPoint, type DailyReport, type PeriodReport } from '../types';
import { formatDate, formatRange, localDateString } from '../utils/date';

type Tab = 'daily' | 'month-to-date' | 'monthly';
interface Patient { id: string; name: string; email: string; }

export function DoctorPatientReportPage() {
  const { patientId = '' } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tab, setTab] = useState<Tab>('daily');
  const [date, setDate] = useState(localDateString());
  const [report, setReport] = useState<DailyReport | PeriodReport | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const patientsResponse = await api.get('/doctor/patients');
        const matched = (patientsResponse.data.data as Patient[]).find((item) => item.id === patientId) ?? null;
        if (!matched) throw new Error('This patient is not assigned to your account.');
        const endpoint = tab === 'daily' ? 'daily' : tab === 'month-to-date' ? 'month-to-date' : 'monthly';
        const [reportResponse, chartResponse] = await Promise.all([
          api.get(`/doctor/patients/${patientId}/reports/${endpoint}`, { params: { date } }),
          api.get(`/doctor/patients/${patientId}/reports/monthly-chart`, { params: { date } }),
        ]);
        if (active) { setPatient(matched); setReport(reportResponse.data.data as DailyReport | PeriodReport); setChart(chartResponse.data.data.data as ChartPoint[]); }
      } catch (err) { if (active) setError(getErrorMessage(err)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [patientId, tab, date]);

  const daily = report?.type === 'daily' ? report as DailyReport : null;
  const number = (value: number | null) => value === null ? '—' : value.toFixed(value % 1 ? 1 : 0);
  return (
    <div className="page-stack">
      <section className="page-title-row"><div><Link className="text-link" to="/doctor/patients"><ArrowLeft size={14} /> All patients</Link><span className="eyebrow">PATIENT REPORT</span><h1>{patient?.name ?? 'Patient'}</h1><p>{patient?.email ?? 'Assigned patient report'}</p></div><label className="report-date-label"><CalendarDays size={16} /><span>Reference date</span><input type="date" max={localDateString()} value={date} onChange={(event) => setDate(event.target.value)} /></label></section>
      <section className="surface-card report-controls"><div className="report-tabs" role="tablist" aria-label="Patient report period"><button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'selected' : ''} onClick={() => setTab('daily')}>Daily</button><button role="tab" aria-selected={tab === 'month-to-date'} className={tab === 'month-to-date' ? 'selected' : ''} onClick={() => setTab('month-to-date')}>Month to date</button><button role="tab" aria-selected={tab === 'monthly'} className={tab === 'monthly' ? 'selected' : ''} onClick={() => setTab('monthly')}>Previous month</button></div></section>
      {error && <div className="form-error page-error" role="alert">{error}</div>}
      {loading ? <div className="loading-card surface-card">Loading patient report…</div> : report && <>
        <section className="report-intro"><div><span className="eyebrow">REPORT DATE RANGE</span><h2>{formatRange(report.dateRange.start, report.dateRange.end)}</h2></div></section>
        <div className="stats-grid report-stats"><StatCard label="Highest reading" value={number(report.highest)} suffix={report.highest === null ? '' : 'mg/dL'} icon={TrendingUp} tone="pink" /><StatCard label="Lowest reading" value={number(report.lowest)} suffix={report.lowest === null ? '' : 'mg/dL'} icon={TrendingDown} tone="blue" /><StatCard label="Average reading" value={number(report.average)} suffix={report.average === null ? '' : 'mg/dL'} icon={Activity} tone="purple" /><StatCard label="Total readings" value={report.count} icon={CalendarDays} tone="green" /></div>
        {daily && <section className="surface-card daily-report-card"><div className="section-heading"><div><span className="eyebrow">DAILY BREAKDOWN</span><h2>{formatDate(date)}</h2></div></div>{daily.readings.length ? <div className="daily-slots">{daily.readings.map((item) => <div className="daily-slot-row" key={item.id}><span className="daily-slot-indicator"/><span className="daily-slot-name">{slotLabel(item.timeSlot)}</span><strong>{item.value} <small>mg/dL</small></strong></div>)}</div> : <EmptyState title="No readings for this day" message="The patient has not logged readings on this date."/>}</section>}
        <section className="surface-card trend-panel"><div className="section-heading"><div><span className="eyebrow">MONTHLY TREND</span><h2>Daily averages</h2></div><span className="section-note">{date.slice(0, 7)}</span></div><GlucoseTrendChart data={chart}/></section>
      </>}
      <p className="disclaimer">This information is supplied by the patient and is intended for tracking. It is not a medical diagnosis.</p>
    </div>
  );
}

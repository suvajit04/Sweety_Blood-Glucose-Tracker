import { useEffect, useState } from 'react';
import { Activity, ArrowRight, BellRing, Droplets, HeartPulse, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { api, getErrorMessage } from '../services/api';
import type { DailyReport, Reading } from '../types';
import { slotLabel } from '../types';
import { formatDate, localDateString } from '../utils/date';

type TodayReminderStatus = {
  date: string;
  readingCount: number;
  remainingReadings: number;
  shouldShowReminder: boolean;
};

export function DashboardPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [recent, setRecent] = useState<Reading[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reminder, setReminder] = useState<TodayReminderStatus | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const [dailyResponse, readingsResponse] = await Promise.all([
          api.get('/reports/daily', { params: { date: localDateString() } }),
          api.get('/readings', { params: { page: 1, limit: 5 } }),
        ]);
        if (active) {
          setReport(dailyResponse.data.data as DailyReport);
          setRecent(readingsResponse.data.data as Reading[]);
        }
      } catch (err) { if (active) setError(getErrorMessage(err)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);


  useEffect(() => {
    let active = true;

    async function loadReminder() {
      try {
        const response = await api.get('/readings/today-summary');

        if (active) {
          setReminder(response.data.data as TodayReminderStatus);
        }
      } catch {
        if (active) setReminder(null);
      }
    }

    void loadReminder();

    const intervalId = window.setInterval(() => {
      void loadReminder();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const value = (number: number | null | undefined) => number === null || number === undefined ? '—' : number.toFixed(number % 1 ? 1 : 0);

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">YOUR HEALTH, ONE DAY AT A TIME</span>
          <h1>{greeting}, {user?.name?.split(' ')[0] ?? 'there'} <span className="wave">✦</span></h1>
          <p>Here’s a little look at how you’re doing today.</p>
        </div>
        <div className="today-pill"><span className="today-dot" /> {formatDate(localDateString())}</div>
      </section>

      {error && <div className="form-error page-error" role="alert">{error}</div>}

      {reminder?.shouldShowReminder && (
        <section className="daily-reminder" aria-live="polite">
          <div className="daily-reminder-icon">
            <BellRing size={21} />
          </div>
          <div className="daily-reminder-copy">
            <strong>Keep up with your daily glucose check-in</strong>
            <p>
              You have {reminder.remainingReadings} more {reminder.remainingReadings === 1 ? 'reading' : 'readings'} to complete today's log.
            </p>
            <span>{reminder.readingCount} of 4 readings recorded today</span>
          </div>
          <Link to="/readings?new=1" className="daily-reminder-link">
            Add reading <ArrowRight size={15} />
          </Link>
        </section>
      )}
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="hero-kicker"><HeartPulse size={14} /> YOUR DAILY CHECK-IN</span>
          <h2>Small steps.<br /><em>Meaningful progress.</em></h2>
          <p>Consistency matters more than perfection. Keep logging your readings to understand your patterns over time.</p>
          <Link to="/readings?new=1" className="hero-link">Add today’s reading <ArrowRight size={16} /></Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-heart"><HeartPulse size={59} strokeWidth={1.35} /></div>
          <span className="art-spark spark-one">✦</span>
          <span className="art-spark spark-two">✧</span>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><span className="eyebrow">AT A GLANCE</span><h2>Today’s summary</h2></div>
          <span className="section-note">Values in mg/dL</span>
        </div>
        <div className="stats-grid">
          <StatCard label="Readings today" value={loading ? '…' : report?.count ?? 0} icon={Droplets} tone="purple" hint="Out of 4 daily slots" />
          <StatCard label="Highest reading" value={loading ? '…' : value(report?.highest)} suffix={report?.highest === null || report?.highest === undefined ? '' : 'mg/dL'} icon={TrendingUp} tone="pink" />
          <StatCard label="Lowest reading" value={loading ? '…' : value(report?.lowest)} suffix={report?.lowest === null || report?.lowest === undefined ? '' : 'mg/dL'} icon={TrendingDown} tone="blue" />
          <StatCard label="Daily average" value={loading ? '…' : value(report?.average)} suffix={report?.average === null || report?.average === undefined ? '' : 'mg/dL'} icon={Activity} tone="green" />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><span className="eyebrow">YOUR JOURNAL</span><h2>Recent readings</h2></div>
          <Link className="text-link" to="/readings">View all <ArrowRight size={15} /></Link>
        </div>
        {loading ? <div className="loading-card">Loading your readings…</div> : recent.length === 0 ? <div className="surface-card"><EmptyState title="Your story starts here" message="No readings recorded yet. Add your first glucose reading to get started." /></div> : (
          <div className="surface-card table-card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time slot</th>
                    <th>Glucose value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((reading) => (
                    <tr key={reading.id}>
                      <td>{formatDate(reading.date)}</td>
                      <td>{slotLabel(reading.timeSlot)}</td>
                      <td><strong className="reading-number">{reading.value} <small>mg/dL</small></strong></td>
                      <td><span className="logged-tag"><span /> Logged</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      <div className="disclaimer"><Plus size={15} /> Sweety is a tracking tool, not a medical device. Discuss your readings and targets with your healthcare professional.</div>
    </div>
  );
}



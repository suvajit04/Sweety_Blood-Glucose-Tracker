import { useCallback, useEffect, useState } from 'react';
import { Activity, CalendarDays, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ReadingForm } from '../components/ReadingForm';
import { api, getErrorMessage } from '../services/api';
import type { Reading, TimeSlot } from '../types';
import { slotLabel } from '../types';
import { formatDate } from '../utils/date';

export function ReadingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterSlot, setFilterSlot] = useState<TimeSlot | ''>('');
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<Reading | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadReadings = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/readings', { params: { page: 1, limit: 100, ...(filterDate ? { date: filterDate } : {}), ...(filterSlot ? { timeSlot: filterSlot } : {}) } });
      setReadings(response.data.data as Reading[]);
      setTotal(response.data.meta.total as number);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filterDate, filterSlot]);

  useEffect(() => { void loadReadings(); }, [loadReadings]);
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  function closeForm() { setFormOpen(false); setEditing(null); }

  async function saveReading(input: { date: string; timeSlot: TimeSlot; value: number }) {
    try {
      if (editing) await api.put(`/readings/${editing.id}`, input);
      else await api.post('/readings', input);
      await loadReadings();
    } catch (err) { throw new Error(getErrorMessage(err)); }
  }

  async function deleteReading(reading: Reading) {
    const accepted = window.confirm(`Delete the ${slotLabel(reading.timeSlot).toLowerCase()} reading of ${reading.value} mg/dL? This cannot be undone.`);
    if (!accepted) return;
    setError('');
    try { await api.delete(`/readings/${reading.id}`); await loadReadings(); }
    catch (err) { setError(getErrorMessage(err)); }
  }

  return (
    <div className="page-stack">
      <section className="page-title-row"><div><span className="eyebrow">YOUR PERSONAL LOG</span><h1>My readings</h1><p>Every entry helps you build a clearer picture over time.</p></div><button className="button button-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={17} /> Add reading</button></section>
      <section className="surface-card readings-panel">
        <div className="filter-row"><div className="filter-title"><Activity size={18} /><strong>All readings</strong><span className="count-chip">{total}</span></div><div className="filter-controls"><label className="filter-input"><CalendarDays size={15} /><input aria-label="Filter by date" type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} /></label><label className="filter-select"><Search size={15} /><select aria-label="Filter by time slot" value={filterSlot} onChange={(event) => setFilterSlot(event.target.value as TimeSlot | '')}><option value="">All time slots</option><option value="MORNING_FASTING">Morning (fasting)</option><option value="AFTER_BREAKFAST">After breakfast</option><option value="AFTER_LUNCH">After lunch</option><option value="AFTER_DINNER">After dinner</option></select></label><button className="clear-filter" onClick={() => { setFilterDate(''); setFilterSlot(''); }}>Clear</button></div></div>
        {error && <div className="form-error inline-error" role="alert">{error}</div>}
        {loading ? <div className="loading-card">Loading readings…</div> : readings.length === 0 ? <EmptyState title="No readings found" message={filterDate || filterSlot ? 'Try changing your filters, or add a new reading.' : 'Start your journal by adding your first blood glucose reading.'} /> : (
          <div className="table-scroll"><table><thead><tr><th>Date</th><th>Time slot</th><th>Glucose value</th><th>Actions</th></tr></thead><tbody>
            {readings.map((reading) => <tr key={reading.id}><td>{formatDate(reading.date)}</td><td><span className="slot-label"><span className="slot-dot" />{slotLabel(reading.timeSlot)}</span></td><td><strong className="reading-number">{reading.value} <small>mg/dL</small></strong></td><td><div className="table-actions"><button className="icon-button action-edit" aria-label="Edit reading" title="Edit" onClick={() => { setEditing(reading); setFormOpen(true); }}><Pencil size={16} /></button><button className="icon-button action-delete" aria-label="Delete reading" title="Delete" onClick={() => void deleteReading(reading)}><Trash2 size={16} /></button></div></td></tr>)}
          </tbody></table></div>
        )}
        <div className="table-footer">Showing {readings.length} of {total} readings <span>Maximum 4 readings per day</span></div>
      </section>
      <div className="disclaimer"><Plus size={15} /> Sweety stores the values you enter. It does not interpret results or provide medical advice.</div>
      {formOpen && <ReadingForm initial={editing} onClose={closeForm} onSave={saveReading} />}
    </div>
  );
}

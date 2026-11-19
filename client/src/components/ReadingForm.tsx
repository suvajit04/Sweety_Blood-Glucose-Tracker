import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { TIME_SLOTS, type Reading, type TimeSlot } from '../types';
import { localDateString } from '../utils/date';

export function ReadingForm({
  initial, onClose, onSave,
}: {
  initial?: Reading | null;
  onClose: () => void;
  onSave: (input: { date: string; timeSlot: TimeSlot; value: number }) => Promise<void>;
}) {
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? localDateString());
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(initial?.timeSlot ?? 'MORNING_FASTING');
  const [value, setValue] = useState(initial ? String(initial.value) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!value.trim()) { setError('Please enter a glucose value.'); return; }
    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue < 40 || parsedValue > 600) {
      setError('Value must be between 40 and 600 mg/dl.'); return;
    }
    if (date > localDateString()) { setError('Date cannot be in the future.'); return; }
    setSaving(true);
    try {
      await onSave({ date, timeSlot, value: parsedValue });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this reading.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reading-form-title">
        <div className="modal-heading">
          <div><span className="eyebrow">DAILY LOG</span><h2 id="reading-form-title">{initial ? 'Edit reading' : 'Add a reading'}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form onSubmit={submit} className="form-stack">
          <label className="field-label">Date
            <input type="date" value={date} max={localDateString()} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label className="field-label">Time slot
            <select value={timeSlot} onChange={(event) => setTimeSlot(event.target.value as TimeSlot)}>
              {TIME_SLOTS.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
            </select>
          </label>
          <label className="field-label">Blood glucose value <span className="unit-note">mg/dL</span>
            <input type="number" inputMode="numeric" min="40" max="600" step="1" placeholder="e.g. 112" value={value} onChange={(event) => setValue(event.target.value)} required />
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Save reading'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

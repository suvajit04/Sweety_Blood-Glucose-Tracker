import { useEffect, useState, type FormEvent } from 'react';
import { Activity, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { api, getErrorMessage } from '../services/api';

interface Patient { id: string; name: string; email: string; assignedAt: string; }

export function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadPatients() {
    setLoading(true);
    try { const response = await api.get('/doctor/patients'); setPatients(response.data.data as Patient[]); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadPatients(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage(''); setSaving(true);
    try { await api.post('/doctor/patients', { email }); setEmail(''); setMessage('Patient assigned successfully.'); await loadPatients(); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function removePatient(patient: Patient) {
    if (!window.confirm(`Remove ${patient.name} from your assigned patients?`)) return;
    try { await api.delete(`/doctor/patients/${patient.id}`); await loadPatients(); }
    catch (err) { setError(getErrorMessage(err)); }
  }

  return (
    <div className="page-stack">
      <section className="page-title-row"><div><span className="eyebrow">DOCTOR WORKSPACE</span><h1>My patients</h1><p>View reports only for patients assigned to your account.</p></div><span className="count-chip">{patients.length} assigned</span></section>
      <section className="surface-card doctor-assign-panel">
        <div><span className="eyebrow">ADD A PATIENT</span><h2>Assign by registered email</h2><p className="doctor-help">Patients must create their own Sweety account first. You cannot create or access an unassigned patient account.</p></div>
        <form onSubmit={submit} className="doctor-assign-form"><label className="field-label">Patient email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="patient@example.com" /></label><button className="button button-primary" disabled={saving}><UserPlus size={16} />{saving ? 'Adding…' : 'Assign patient'}</button></form>
        {error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}
      </section>
      <section className="surface-card doctor-patients-panel"><div className="section-heading"><div><span className="eyebrow">YOUR CASE LIST</span><h2>Assigned patients</h2></div><Users size={20} /></div>
        {loading ? <div className="loading-card">Loading patients…</div> : patients.length === 0 ? <EmptyState title="No patients assigned yet" message="Enter the email address of an existing patient account to add your first patient." /> : <div className="doctor-patient-list">{patients.map((patient) => <div className="doctor-patient-row" key={patient.id}><div className="patient-avatar">{patient.name.charAt(0).toUpperCase()}</div><div className="patient-details"><strong>{patient.name}</strong><span>{patient.email}</span></div><Link className="button button-secondary" to={`/doctor/patients/${patient.id}`}><Activity size={15} /> View reports</Link><button className="clear-filter" onClick={() => void removePatient(patient)}>Remove</button></div>)}</div>}
      </section>
      <p className="disclaimer">Patient reports are for review and tracking only. Sweety does not provide diagnosis or treatment recommendations.</p>
    </div>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  CalendarDays,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { api, getErrorMessage } from '../services/api';

interface Patient {
  id: string;
  name: string;
  email: string;
  assignedAt: string;
}

function formatAssignedDate(value: string): string {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadPatients(showLoader = true) {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await api.get('/doctor/patients');
      setPatients(response.data.data as Patient[]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return patients;

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query)
    );
  }, [patients, search]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setSaving(true);

    try {
      await api.post('/doctor/patients', { email: normalizedEmail });
      setEmail('');
      setMessage('Patient successfully added to your care list.');
      await loadPatients(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removePatient(patient: Patient) {
    const confirmed = window.confirm(
      `Remove ${patient.name} from your assigned patients?`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');
    setRemovingId(patient.id);

    try {
      await api.delete(`/doctor/patients/${patient.id}`);
      setPatients((current) =>
        current.filter((item) => item.id !== patient.id)
      );
      setMessage(`${patient.name} has been removed from your care list.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingId('');
    }
  }

  return (
    <div className="page-stack doctor-workspace">
      <section className="doctor-welcome">
        <div>
          <span className="eyebrow">DOCTOR WORKSPACE</span>
          <h1>Patient overview</h1>
          <p>Manage your assigned patients and review their glucose reports.</p>
        </div>

        <div className="doctor-secure-tag">
          <ShieldCheck size={16} />
          <span>Secure patient access</span>
        </div>
      </section>

      <section className="doctor-overview-grid" aria-label="Patient overview">
        <article className="doctor-overview-card">
          <div className="doctor-overview-icon purple">
            <Users size={19} />
          </div>
          <div>
            <span className="doctor-overview-label">Assigned patients</span>
            <strong>{loading ? '—' : patients.length}</strong>
            <small>Patients linked to your account</small>
          </div>
        </article>

        <article className="doctor-overview-card">
          <div className="doctor-overview-icon blue">
            <Search size={19} />
          </div>
          <div>
            <span className="doctor-overview-label">Search results</span>
            <strong>{loading ? '—' : filteredPatients.length}</strong>
            <small>Matching patients in your list</small>
          </div>
        </article>

        <article className="doctor-overview-card">
          <div className="doctor-overview-icon green">
            <Activity size={19} />
          </div>
          <div>
            <span className="doctor-overview-label">Access permission</span>
            <strong className="doctor-access-value">Assigned only</strong>
            <small>Reports are restricted to your patients</small>
          </div>
        </article>
      </section>

      <section className="surface-card doctor-assign-panel">
        <div className="doctor-panel-heading">
          <div className="doctor-panel-icon">
            <UserPlus size={19} />
          </div>
          <div>
            <span className="eyebrow">PATIENT MANAGEMENT</span>
            <h2>Add a patient</h2>
            <p className="doctor-help">
              Enter the registered email address of a Sweety patient.
              The patient must already have an account.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="doctor-assign-form">
          <label className="field-label">
            Patient email address
            <span className="doctor-input-wrap">
              <Mail size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="patient@example.com"
                autoComplete="email"
              />
            </span>
          </label>

          <button
            type="submit"
            className="button button-primary doctor-assign-button"
            disabled={saving || !email.trim()}
          >
            <UserPlus size={16} />
            {saving ? 'Adding patient...' : 'Assign patient'}
          </button>
        </form>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="form-success" role="status">
            {message}
          </div>
        )}
      </section>

      <section className="surface-card doctor-patients-panel">
        <div className="doctor-directory-heading">
          <div>
            <span className="eyebrow">YOUR CARE LIST</span>
            <h2>Assigned patients</h2>
            <p className="doctor-help">
              Open a patient profile to review daily and monthly glucose reports.
            </p>
          </div>

          <button
            type="button"
            className="button button-secondary doctor-refresh-button"
            onClick={() => void loadPatients()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'doctor-spinning' : ''} />
            Refresh
          </button>
        </div>

        <div className="doctor-directory-toolbar">
          <label className="doctor-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by patient name or email..."
              aria-label="Search assigned patients"
            />
          </label>

          <span className="doctor-result-count">
            {loading ? 'Loading...' : `${filteredPatients.length} of ${patients.length} patients`}
          </span>
        </div>

        {loading ? (
          <div className="doctor-loading">
            <span className="doctor-loader" />
            <p>Loading your patient list...</p>
          </div>
        ) : error && patients.length === 0 ? (
          <EmptyState
            title="Unable to load patients"
            message="Please check your connection and try refreshing the list."
          />
        ) : patients.length === 0 ? (
          <EmptyState
            title="No patients assigned yet"
            message="Add an existing Sweety patient using their registered email address."
          />
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            title="No matching patients"
            message="Try another name or email address."
          />
        ) : (
          <div className="doctor-patient-list">
            {filteredPatients.map((patient) => (
              <article className="doctor-patient-row" key={patient.id}>
                <div className="patient-avatar">
                  {patient.name.charAt(0).toUpperCase()}
                </div>

                <div className="patient-details">
                  <strong>{patient.name}</strong>
                  <span>{patient.email}</span>
                  <small>
                    <CalendarDays size={12} />
                    Assigned {formatAssignedDate(patient.assignedAt)}
                  </small>
                </div>

                <div className="doctor-patient-actions">
                  <Link
                    className="button button-primary doctor-report-button"
                    to={`/doctor/patients/${patient.id}`}
                  >
                    <Activity size={15} />
                    View reports
                  </Link>

                  <button
                    type="button"
                    className="doctor-remove-button"
                    onClick={() => void removePatient(patient)}
                    disabled={removingId === patient.id}
                    aria-label={`Remove ${patient.name}`}
                    title="Remove patient"
                  >
                    <Trash2 size={16} />
                    {removingId === patient.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="disclaimer">
        <ShieldCheck size={14} />
        Patient information is accessible only through assigned doctor accounts.
        Sweety is a tracking tool and does not provide medical diagnosis.
      </p>
    </div>
  );
}

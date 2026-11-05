import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { REPORT_REASONS } from '../../shared/constants.js';
import Alert from './Alert.jsx';
import Button from './Button.jsx';
import Modal from './Modal.jsx';

// Unauffälliger "Melden"-Button für einen Inhalt (contentId) oder einen Erfahrungsbericht (ratingId).
// Nicht angemeldete Nutzer landen auf /login und kommen danach hierher zurück.
export default function ReportButton({ contentId, ratingId }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function handleOpen() {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setError('');
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!reason) {
      setError('Bitte wähle einen Grund für die Meldung aus.');
      return;
    }
    setSending(true);
    setError('');
    try {
      // Der Server erwartet entweder contentId oder ratingId
      await api.post('/reports', contentId ? { contentId, reason } : { ratingId, reason });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  // Nach dem Melden zeigt der Button nur noch "Gemeldet"
  if (sent && !open) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Gemeldet
      </Button>
    );
  }

  return (
    <>
      {/* Solange noch geprüft wird, ob jemand angemeldet ist, wäre ein Klick eine Weiterleitung auf /login */}
      <Button variant="ghost" size="sm" onClick={handleOpen} disabled={loading}>
        Melden
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title={contentId ? 'Inhalt melden' : 'Erfahrungsbericht melden'}
        footer={
          sent ? (
            <Button onClick={handleClose}>Schließen</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} loading={sending}>
                Melden
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <Alert type="success">Danke für deine Meldung. Ein Admin prüft den Eintrag.</Alert>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && <Alert type="error">{error}</Alert>}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm text-muted">Warum möchtest du das melden?</legend>
              {REPORT_REASONS.map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="reason"
                    value={option}
                    checked={reason === option}
                    onChange={() => setReason(option)}
                    className="size-4 accent-ink"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
          </form>
        )}
      </Modal>
    </>
  );
}

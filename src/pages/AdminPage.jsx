import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api.js';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FormField, { inputClass } from '../components/FormField.jsx';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';

// Ein Eintrag ist entweder ein gemeldeter Inhalt (contentId) oder ein Erfahrungsbericht (ratingId).
// Daraus entsteht ein eindeutiger Schlüssel für die Liste.
function entryKey(report) {
  return report.contentId ? `content-${report.contentId}` : `rating-${report.ratingId}`;
}

// Die Datenbank liefert "2026-11-04 13:54:48" (UTC), das wird zu einem deutschen Datum
function formatDate(value) {
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('de-DE');
}

export default function AdminPage() {
  // reports === null heißt: lädt noch
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');
  // Eintrag, dessen Löschen gerade im Bestätigungsfenster steht
  const [toDelete, setToDelete] = useState(null);
  const [busyKey, setBusyKey] = useState('');

  // Gemini-Bereich: aiEnabled ist null (lädt), true, false oder 'error'
  const [aiEnabled, setAiEnabled] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/reports')
      .then((res) => {
        if (!cancelled) setReports(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setReports([]);
        }
      });
    api
      .get('/ai/status')
      .then((res) => {
        if (!cancelled) setAiEnabled(Boolean(res.data.enabled));
      })
      .catch(() => {
        if (!cancelled) setAiEnabled('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function removeEntry(report) {
    setReports((current) => current.filter((item) => entryKey(item) !== entryKey(report)));
  }

  async function handleDismiss(report) {
    setBusyKey(entryKey(report));
    setError('');
    try {
      await api.delete('/admin/reports', {
        params: report.contentId ? { contentId: report.contentId } : { ratingId: report.ratingId }
      });
      removeEntry(report);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyKey('');
    }
  }

  async function handleDelete() {
    const report = toDelete;
    setBusyKey(entryKey(report));
    setError('');
    try {
      // Beim Löschen verschwinden die Meldungen dazu per ON DELETE CASCADE von selbst
      await api.delete(report.contentId ? `/contents/${report.contentId}` : `/ratings/${report.ratingId}`);
      removeEntry(report);
      setToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setBusyKey('');
    }
  }

  async function handleSaveKey(event) {
    event.preventDefault();
    if (!apiKey.trim()) {
      setKeyMessage({ type: 'error', text: 'Bitte gib einen Key ein.' });
      return;
    }
    setSavingKey(true);
    setKeyMessage(null);
    try {
      await api.put('/admin/ai-key', { key: apiKey.trim() });
      setAiEnabled(true);
      setKeyMessage({ type: 'success', text: 'Der Key ist gespeichert und gilt bis zum Neustart des Servers.' });
    } catch (err) {
      setKeyMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      // Der Key wird nie wieder angezeigt, auch nicht im Eingabefeld
      setApiKey('');
      setSavingKey(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="reports-heading" className="flex flex-col gap-4">
        <h1 id="reports-heading" className="text-2xl font-bold">
          Offene Meldungen
        </h1>

        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {reports === null && (
          <div className="flex justify-center py-8 text-ink">
            <Spinner size="lg" />
          </div>
        )}

        {reports?.length === 0 && (
          <EmptyState title="Keine offenen Meldungen" text="Sobald jemand einen Inhalt oder Erfahrungsbericht meldet, erscheint er hier." />
        )}

        {reports?.length > 0 && (
          <ul className="flex flex-col gap-3">
            {reports.map((report) => {
              const key = entryKey(report);
              const isContent = Boolean(report.contentId);
              const busy = busyKey === key;
              return (
                <li key={key} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        {isContent ? 'Inhalt' : 'Erfahrungsbericht'}
                        {report.courseName && ` · ${report.courseName}`}
                      </p>
                      {/* React maskiert den Text, es wird kein HTML ausgeführt */}
                      <p className="mt-1 break-words font-semibold">
                        {report.label}
                        {!isContent && report.label.length >= 120 && ' …'}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-muted">
                      {report.count} {report.count === 1 ? 'Meldung' : 'Meldungen'} · zuletzt {formatDate(report.latestAt)}
                    </p>
                  </div>

                  <ul className="flex flex-wrap gap-2 text-sm">
                    {report.reasons.map((item) => (
                      <li key={item.reason} className="rounded-md bg-ink-soft px-2 py-1 text-fg">
                        {item.reason} ({item.count})
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" to={isContent ? `/inhalte/${report.contentId}` : `/kurse/${report.courseId}`}>
                      Ansehen
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDismiss(report)} disabled={busy}>
                      Meldung verwerfen
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setToDelete(report)} disabled={busy}>
                      Löschen
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="ai-heading" className="flex flex-col gap-4">
        <h2 id="ai-heading" className="text-xl font-bold">
          Quiz (Gemini)
        </h2>

        {aiEnabled === null && <Spinner label="Status wird geladen …" />}
        {aiEnabled === 'error' && <Alert type="error">Der Status des Quiz konnte nicht geladen werden.</Alert>}
        {aiEnabled === true && <Alert type="success">Das Quiz ist eingerichtet.</Alert>}
        {aiEnabled === false && <Alert type="info">Das Quiz ist nicht eingerichtet. Trage unten einen Gemini-Key ein.</Alert>}

        <form onSubmit={handleSaveKey} className="flex max-w-md flex-col gap-3" autoComplete="off">
          <FormField id="gemini-key" label="Gemini-Key" hint="Der Key wird nur im Arbeitsspeicher des Servers gehalten und nach dem Speichern nicht mehr angezeigt.">
            <input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className={inputClass(false)}
            />
          </FormField>
          {keyMessage && <Alert type={keyMessage.type}>{keyMessage.text}</Alert>}
          <div>
            <Button type="submit" loading={savingKey}>
              Key speichern
            </Button>
          </div>
        </form>
      </section>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title={toDelete?.contentId ? 'Inhalt löschen?' : 'Erfahrungsbericht löschen?'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Abbrechen
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={Boolean(toDelete) && busyKey === entryKey(toDelete)}>
              Endgültig löschen
            </Button>
          </>
        }
      >
        <p>
          „{toDelete?.label}“ wird dauerhaft gelöscht, mit allen Daumen, Favoriten und Meldungen
          {toDelete?.contentId ? ' und der PDF-Datei' : ''}. Das lässt sich nicht rückgängig machen.
        </p>
      </Modal>
    </div>
  );
}

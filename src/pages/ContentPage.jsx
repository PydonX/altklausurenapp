import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import TypeBadge from '../components/TypeBadge.jsx';
import UpvoteButton from '../components/UpvoteButton.jsx';
import FavoriteButton from '../components/FavoriteButton.jsx';
import ReportButton from '../components/ReportButton.jsx';
import PdfViewer from '../components/PdfViewer.jsx';
import MarkdownView from '../components/MarkdownView.jsx';

// Datum aus der Datenbank (UTC) in deutscher Schreibweise
function formatDate(value) {
  const date = new Date(String(value).replace(' ', 'T') + 'Z');
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('de-DE');
}

export default function ContentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Inhalt laden. Wartet auf den Login-Status, weil Daumen und Merken davon abhängen.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError('');
    api
      .get(`/contents/${id}`)
      .then((res) => {
        if (!cancelled) setContent(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        // 400 (ungültige ID) und 404 sind für die Nutzer dasselbe: den Inhalt gibt es nicht
        if ([400, 404].includes(err?.response?.status)) setNotFound(true);
        else setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/contents/${content.id}`);
      // Danach zurück zur Kursseite
      navigate(`/kurse/${content.courseId}`, { replace: true });
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          title="Inhalt nicht gefunden"
          text="Diesen Inhalt gibt es nicht (mehr). Vielleicht wurde er gelöscht."
          action={<Button to="/kurse">Zu den Kursen</Button>}
        />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Alert type="error">{error || 'Der Inhalt konnte nicht geladen werden. Bitte lade die Seite neu.'}</Alert>
      </div>
    );
  }

  // Löschen dürfen nur Ersteller und Admins. Den echten Schutz übernimmt der Server.
  const canDelete = Boolean(user) && (user.id === content.userId || user.role === 'admin');

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <TypeBadge type={content.type} />
          {content.type === 'altklausur' && content.examYear && (
            <span className="text-sm text-muted">Klausur {content.examYear}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="text-sm text-muted">
          <Link to={`/kurse/${content.courseId}`} className="font-bold text-ink underline">
            {content.courseName}
          </Link>
          {' · '}
          {formatDate(content.createdAt)}
          {content.source && <> · Quelle: {content.source}</>}
        </p>
        {content.topics.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Themenfelder">
            {content.topics.map((topic) => (
              <li key={topic.id} className="rounded-full bg-ink-soft px-3 py-0.5 text-xs font-bold text-ink">
                {topic.name}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <UpvoteButton contentId={content.id} count={content.upvotes} active={content.hasUpvoted} />
        <FavoriteButton kind="content" id={content.id} initial={content.isFavorite} />
        <ReportButton contentId={content.id} />
        {canDelete && (
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
            Löschen
          </Button>
        )}
      </div>

      {content.format === 'pdf' ? (
        <PdfViewer
          src={`/api/contents/${content.id}/file`}
          title={content.title}
          fileName={content.originalName}
          fileSize={content.fileSize}
        />
      ) : (
        <article className="rounded-lg border border-line bg-surface p-5">
          <MarkdownView text={content.bodyText} />
        </article>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="Inhalt löschen?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Abbrechen
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Endgültig löschen
            </Button>
          </>
        }
      >
        <p>
          „{content.title}“ wird dauerhaft gelöscht, bei einer PDF auch die Datei. Das lässt sich nicht rückgängig machen.
        </p>
        {deleteError && (
          <div className="mt-3">
            <Alert type="error">{deleteError}</Alert>
          </div>
        )}
      </Modal>
    </div>
  );
}

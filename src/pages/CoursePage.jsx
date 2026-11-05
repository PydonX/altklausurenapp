import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CONTENT_TYPES } from '../../shared/constants.js';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import TypeBadge from '../components/TypeBadge.jsx';
import FavoriteButton from '../components/FavoriteButton.jsx';
import Quiz from '../components/Quiz.jsx';
import RatingSummary from '../components/RatingSummary.jsx';
import RatingForm from '../components/RatingForm.jsx';
import ExperienceList from '../components/ExperienceList.jsx';

// Reiter für die Inhaltstypen: "Alle" plus ein Reiter pro Typ (Mehrzahl für die Beschriftung)
const TABS = [
  { value: '', label: 'Alle' },
  ...CONTENT_TYPES.map((type) => ({
    value: type,
    label: { altklausur: 'Altklausuren', cheatsheet: 'Cheatsheets', aufschrieb: 'Aufschriebe', zusammenfassung: 'Zusammenfassungen', tipp: 'Tipps' }[type]
  }))
];

export default function CoursePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [ratings, setRatings] = useState({ ratings: [], mine: null });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [ratingOpen, setRatingOpen] = useState(false);

  // Filter der Inhaltsliste
  const [type, setType] = useState('');
  const [topic, setTopic] = useState('');
  const [sort, setSort] = useState('votes');
  const [contents, setContents] = useState([]);
  const [contentsLoading, setContentsLoading] = useState(true);
  const [contentsError, setContentsError] = useState('');

  // Kurs und Bewertungen parallel laden. Wird nach dem Speichern einer Bewertung erneut aufgerufen,
  // damit Durchschnitt und Liste stimmen.
  const loadCourse = useCallback(async () => {
    try {
      const [courseRes, ratingsRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/courses/${id}/ratings`)
      ]);
      setCourse(courseRes.data);
      setRatings(ratingsRes.data);
      setNotFound(false);
      setError('');
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
      else setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    // Beim Wechsel auf einen anderen Kurs die Filter zurücksetzen
    setType('');
    setTopic('');
    setSort('votes');
    loadCourse();
  }, [loadCourse]);

  // Inhalte neu laden, sobald sich Kurs oder ein Filter ändert (ohne die Seite neu zu laden)
  useEffect(() => {
    let cancelled = false;
    setContentsLoading(true);
    api
      .get(`/courses/${id}/contents`, { params: { type, topic, sort } })
      .then((res) => {
        if (cancelled) return;
        setContents(res.data);
        setContentsError('');
      })
      .catch((err) => {
        if (!cancelled) setContentsError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setContentsLoading(false);
      });
    // Veraltete Antworten ignorieren, wenn schon ein neuer Filter gewählt wurde
    return () => {
      cancelled = true;
    };
  }, [id, type, topic, sort]);

  function handleRateClick() {
    if (!user) navigate('/login', { state: { from: { pathname: `/kurse/${id}` } } });
    else setRatingOpen(true);
  }

  async function handleRatingSaved() {
    setRatingOpen(false);
    await loadCourse();
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
          title="Kurs nicht gefunden"
          text="Diesen Kurs gibt es nicht (mehr). Such ihn in der Kursübersicht."
          action={<Button to="/kurse">Zu den Kursen</Button>}
        />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Alert type="error">{error || 'Der Kurs konnte nicht geladen werden. Bitte lade die Seite neu.'}</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Kopf */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{course.semester}. Semester · {course.studiengang}</p>
          <h1 className="text-2xl font-bold">{course.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton kind="course" id={course.id} initial={course.isFavorite} />
          <Button to={`/hochladen?kurs=${course.id}`}>Inhalt hochladen</Button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Inhalte */}
        <section aria-labelledby="contents-heading" className="min-w-0">
          <h2 id="contents-heading" className="mb-3 text-lg font-bold">Inhalte</h2>

          <div role="tablist" aria-label="Inhaltstyp" className="mb-4 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={type === tab.value}
                onClick={() => setType(tab.value)}
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-bold transition-colors ${
                  type === tab.value
                    ? 'border-ink bg-ink text-on-ink'
                    : 'border-line-strong bg-surface text-fg hover:border-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              Themenfeld
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="rounded-md border border-line-strong bg-surface px-2 py-1.5"
              >
                <option value="">Alle</option>
                {course.topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              Sortierung
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-md border border-line-strong bg-surface px-2 py-1.5"
              >
                <option value="votes">Meiste Daumen hoch</option>
                <option value="new">Neueste zuerst</option>
              </select>
            </label>
          </div>

          {contentsError && <Alert type="error">{contentsError}</Alert>}

          {contentsLoading ? (
            <div className="flex justify-center py-8 text-ink"><Spinner /></div>
          ) : contents.length === 0 ? (
            <EmptyState
              title="Noch keine Inhalte"
              text="Für diese Auswahl gibt es noch nichts. Teile als Erste oder Erster etwas mit den anderen."
              action={<Button to={`/hochladen?kurs=${course.id}`}>Inhalt hochladen</Button>}
            />
          ) : (
            // Einfache Liste, bis Person 3 die ContentCard liefert
            <ul className="space-y-3">
              {contents.map((content) => (
                <li key={content.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4">
                  <div className="min-w-0">
                    <TypeBadge type={content.type} />
                    <Link to={`/inhalte/${content.id}`} className="mt-1 block truncate font-bold text-ink hover:underline">
                      {content.title}
                    </Link>
                  </div>
                  <span className="shrink-0 text-sm text-muted">👍 {content.upvotes}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bewertung: Seitenspalte ab lg, auf dem Handy darunter */}
        <aside aria-labelledby="rating-heading" className="space-y-5">
          <h2 id="rating-heading" className="text-lg font-bold">Bewertung</h2>
          <RatingSummary avg={course.avg} count={course.ratingCount} />
          <Button variant="secondary" onClick={handleRateClick}>
            {ratings.mine ? 'Meine Bewertung ändern' : 'Kurs bewerten'}
          </Button>

          <h3 className="pt-2 text-base font-bold">Erfahrungsberichte</h3>
          <ExperienceList ratings={ratings.ratings} />
        </aside>
      </div>

      {/* Quiz */}
      <section aria-labelledby="quiz-heading" className="mt-10">
        <h2 id="quiz-heading" className="mb-3 text-lg font-bold">Quiz</h2>
        <Quiz courseId={course.id} topics={course.topics} />
      </section>

      <Modal open={ratingOpen} onClose={() => setRatingOpen(false)} title={`${course.name} bewerten`}>
        <RatingForm
          courseId={course.id}
          initial={ratings.mine}
          onSaved={handleRatingSaved}
          onCancel={() => setRatingOpen(false)}
        />
      </Modal>
    </div>
  );
}

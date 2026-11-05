import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LIMITS } from '../../shared/constants.js';
import { validateRating } from '../../shared/validation.js';
import StarRating from './StarRating.jsx';
import DifficultySlider from './DifficultySlider.jsx';
import FormField, { inputClass } from './FormField.jsx';
import Button from './Button.jsx';
import Alert from './Alert.jsx';

// Formular für die eigene Kursbewertung. initial ist die bisherige Bewertung oder null.
export default function RatingForm({ courseId, initial, onSaved, onCancel }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    vorlesung: initial?.vorlesung ?? 0,
    uebungen: initial?.uebungen ?? 0,
    schwierigkeit: initial?.schwierigkeit ?? 3,
    aufwand: initial?.aufwand ?? 3,
    comment: initial?.comment ?? ''
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(name, value) {
    const next = { ...values, [name]: value };
    setValues(next);
    // Nach dem ersten Absenden bei jeder Änderung neu prüfen
    if (submitted) setErrors(validateRating(next));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Ohne Anmeldung kann man nicht bewerten
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitted(true);
    setFormError('');
    const found = validateRating(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await api.put(`/courses/${courseId}/ratings/me`, values);
      onSaved();
    } catch (error) {
      const fields = error?.response?.data?.fields;
      if (fields) setErrors(fields);
      else setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert type="error">{formError}</Alert>}

      <div>
        <StarRating label="Vorlesung" value={values.vorlesung} onChange={(v) => update('vorlesung', v)} />
        {errors.vorlesung && <p className="mt-1 text-sm text-danger">{errors.vorlesung}</p>}
      </div>

      <div>
        <StarRating label="Übungen" value={values.uebungen} onChange={(v) => update('uebungen', v)} />
        {errors.uebungen && <p className="mt-1 text-sm text-danger">{errors.uebungen}</p>}
      </div>

      <DifficultySlider
        label="Klausurschwierigkeit"
        minLabel="leicht"
        maxLabel="schwer"
        value={values.schwierigkeit}
        onChange={(v) => update('schwierigkeit', v)}
      />

      <DifficultySlider
        label="Aufwand"
        minLabel="gering"
        maxLabel="hoch"
        value={values.aufwand}
        onChange={(v) => update('aufwand', v)}
      />

      <FormField
        id="rating-comment"
        label="Erfahrungsbericht (optional)"
        error={errors.comment}
        hint={`${values.comment.length} / ${LIMITS.commentMax.toLocaleString('de-DE')} Zeichen. Bitte keine Namen nennen.`}
      >
        <textarea
          rows={5}
          value={values.comment}
          onChange={(event) => update('comment', event.target.value)}
          className={inputClass(errors.comment)}
        />
      </FormField>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" loading={loading}>
          Bewertung speichern
        </Button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api.js';
import { validateLogin } from '../../shared/validation.js';
import FormField, { inputClass } from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Kontrollierte Eingaben: React hält den Wert, jede Eingabe löst onChange aus
  const [values, setValues] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Nach dem Login zurück zur ursprünglichen Seite (von ProtectedRoute in state.from gemerkt)
  const target = location.state?.from?.pathname
    ? location.state.from.pathname + (location.state.from.search || '')
    : '/';

  // Wer schon angemeldet ist, braucht diese Seite nicht
  if (user && !loading) return <Navigate to={target} replace />;

  function handleChange(event) {
    const next = { ...values, [event.target.name]: event.target.value };
    setValues(next);
    // Nach dem ersten Absenden bei jeder Eingabe neu prüfen, damit Fehler verschwinden
    if (submitted) setErrors(validateLogin(next));
  }

  async function handleSubmit(event) {
    // Verhindert, dass der Browser das Formular abschickt und die Seite neu lädt
    event.preventDefault();
    setSubmitted(true);
    setFormError('');

    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await login(values.username.trim(), values.password);
      navigate(target, { replace: true });
    } catch (error) {
      // Fehler vom Server genauso anzeigen: erst die Felder, sonst die allgemeine Meldung
      const fields = error?.response?.data?.fields;
      if (fields) setErrors(fields);
      else setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Anmelden</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert type="error">{formError}</Alert>}

        <FormField id="username" label="Benutzername" error={errors.username} required>
          <input
            name="username"
            type="text"
            autoComplete="username"
            value={values.username}
            onChange={handleChange}
            className={inputClass(errors.username)}
          />
        </FormField>

        <FormField id="password" label="Passwort" error={errors.password} required>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            className={inputClass(errors.password)}
          />
        </FormField>

        <Button type="submit" loading={loading}>
          Anmelden
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Noch kein Konto?{' '}
        <Link to="/registrieren" state={location.state} className="font-bold text-ink underline">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}

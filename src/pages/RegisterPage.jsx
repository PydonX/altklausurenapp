import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api.js';
import { validateRegister } from '../../shared/validation.js';
import FormField, { inputClass } from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({
    username: '',
    password: '',
    passwordRepeat: '',
    acceptedRules: false
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Nach der Registrierung zurück zur ursprünglichen Seite oder zur Startseite
  const target = location.state?.from?.pathname
    ? location.state.from.pathname + (location.state.from.search || '')
    : '/';

  if (user && !loading) return <Navigate to={target} replace />;

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    // Checkboxen liefern checked, alle anderen Felder value
    const next = { ...values, [name]: type === 'checkbox' ? checked : value };
    setValues(next);
    // Nach dem ersten Absenden bei jeder Eingabe neu prüfen
    if (submitted) setErrors(validateRegister(next));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setFormError('');

    const found = validateRegister(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await register({ ...values, username: values.username.trim() });
      navigate(target, { replace: true });
    } catch (error) {
      const fields = error?.response?.data?.fields;
      if (fields) setErrors(fields);
      else setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Registrieren</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert type="error">{formError}</Alert>}

        <FormField
          id="username"
          label="Benutzername"
          error={errors.username}
          hint="3 bis 20 Zeichen: a-z, 0-9, Punkt, Unterstrich, Bindestrich. Wähle ein Pseudonym, keinen Klarnamen."
          required
        >
          <input
            name="username"
            type="text"
            autoComplete="username"
            value={values.username}
            onChange={handleChange}
            className={inputClass(errors.username)}
          />
        </FormField>

        <FormField
          id="password"
          label="Passwort"
          error={errors.password}
          hint="Mindestens 8 Zeichen."
          required
        >
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            className={inputClass(errors.password)}
          />
        </FormField>

        <FormField id="passwordRepeat" label="Passwort wiederholen" error={errors.passwordRepeat} required>
          <input
            name="passwordRepeat"
            type="password"
            autoComplete="new-password"
            value={values.passwordRepeat}
            onChange={handleChange}
            className={inputClass(errors.passwordRepeat)}
          />
        </FormField>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <input
              id="acceptedRules"
              name="acceptedRules"
              type="checkbox"
              checked={values.acceptedRules}
              onChange={handleChange}
              aria-invalid={errors.acceptedRules ? 'true' : undefined}
              aria-describedby={errors.acceptedRules ? 'acceptedRules-message' : undefined}
              className="mt-1 size-4 accent-ink"
            />
            <label htmlFor="acceptedRules" className="text-sm text-fg">
              Ich habe die{' '}
              <Link to="/regeln" target="_blank" className="font-bold text-ink underline">
                Regeln
              </Link>{' '}
              gelesen und halte mich daran.
            </label>
          </div>
          {errors.acceptedRules && (
            <p id="acceptedRules-message" className="text-sm text-danger">
              {errors.acceptedRules}
            </p>
          )}
        </div>

        <Button type="submit" loading={loading}>
          Konto anlegen
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Schon ein Konto?{' '}
        <Link to="/login" state={location.state} className="font-bold text-ink underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}

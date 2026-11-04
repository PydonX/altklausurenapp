import { Link } from 'react-router-dom';
import Spinner from './Spinner.jsx';

const BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border font-bold leading-tight ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS = {
  primary: 'border-ink bg-ink text-on-ink hover:border-ink-strong hover:bg-ink-strong',
  secondary: 'border-line-strong bg-surface text-fg hover:border-ink hover:text-ink',
  danger: 'border-danger bg-danger text-on-ink hover:opacity-90',
  ghost: 'border-transparent bg-transparent text-ink hover:bg-ink-soft'
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-[0.95rem]'
};

// Einheitlicher Button für die ganze App.
// Mit "to" wird ein Link von react-router daraus (Seitenwechsel ohne Neuladen).
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  to,
  children
}) {
  const className = `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;

  if (to && !disabled) {
    return (
      <Link to={to} onClick={onClick} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={className}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

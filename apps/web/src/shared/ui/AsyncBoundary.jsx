import './AsyncBoundary.css';

/**
 * Phase 3 exit criterion: every screen has real loading / error / empty states.
 * One component so they look the same everywhere and no screen forgets one.
 */

export const LoadingState = ({ label = 'Loading…' }) => (
  <div className="async-state async-loading" role="status" aria-live="polite">
    <div className="async-spinner" aria-hidden="true" />
    <p>{label}</p>
  </div>
);

export const ErrorState = ({ error, onRetry, label = 'Something went wrong' }) => (
  <div className="async-state async-error" role="alert">
    <p className="async-title">{label}</p>
    {error?.message && <p className="async-detail">{error.message}</p>}
    {onRetry && (
      <button type="button" className="async-retry" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

export const EmptyState = ({ title = 'Nothing here yet', detail, action }) => (
  <div className="async-state async-empty">
    <p className="async-title">{title}</p>
    {detail && <p className="async-detail">{detail}</p>}
    {action}
  </div>
);

/**
 * Wraps a TanStack Query result: renders loading, then error with retry, then
 * empty, then the children.
 */
const AsyncBoundary = ({ query, children, loadingLabel, errorLabel, empty, isEmpty }) => {
  if (query.isPending) return <LoadingState label={loadingLabel} />;
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} label={errorLabel} />;
  }
  if (empty && isEmpty?.(query.data)) return empty;
  return children(query.data);
};

export default AsyncBoundary;

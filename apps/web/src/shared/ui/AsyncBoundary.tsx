import type { ReactNode } from 'react';
import './AsyncBoundary.css';

/**
 * Phase 3 exit criterion: every screen has real loading / error / empty states.
 * One component so they look the same everywhere and no screen forgets one.
 */

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="async-state async-loading" role="status" aria-live="polite">
    <div className="async-spinner" aria-hidden="true" />
    <p>{label}</p>
  </div>
);

interface ErrorStateProps {
  error?: { message?: string } | null;
  onRetry?: (() => void) | undefined;
  label?: string;
}

export const ErrorState = ({ error, onRetry, label = 'Something went wrong' }: ErrorStateProps) => (
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

interface EmptyStateProps {
  title?: string;
  detail?: string;
  action?: ReactNode;
}

export const EmptyState = ({ title = 'Nothing here yet', detail, action }: EmptyStateProps) => (
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
interface QueryLike<T> {
  isPending: boolean;
  isError: boolean;
  error: { message?: string } | null;
  data: T;
  refetch: () => unknown;
}

interface AsyncBoundaryProps<T> {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  loadingLabel?: string;
  errorLabel?: string;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
}

const AsyncBoundary = <T,>({
  query,
  children,
  loadingLabel,
  errorLabel,
  empty,
  isEmpty,
}: AsyncBoundaryProps<T>) => {
  if (query.isPending) return <LoadingState label={loadingLabel} />;
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} label={errorLabel} />;
  }
  if (empty && isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
};

export default AsyncBoundary;

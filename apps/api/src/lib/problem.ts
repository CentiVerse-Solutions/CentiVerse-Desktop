import type { Problem } from '@centiverse/contracts';

/**
 * §6.3: "Errors are RFC 9457 problem+json: { type, title, status, detail,
 * instance, errors? }. One shape, always."
 *
 * One shape means one place that builds it. Routes throw `ApiError`; the handler
 * registered by `installProblemHandler` is the only code that writes an error
 * body, so a route cannot invent a different envelope.
 */

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** Stable, documented `type` URIs. The client switches on these, not on prose. */
export const ProblemType = {
  VALIDATION: 'https://centiverse.app/problems/validation',
  UNAUTHENTICATED: 'https://centiverse.app/problems/unauthenticated',
  FORBIDDEN: 'https://centiverse.app/problems/forbidden',
  NOT_FOUND: 'https://centiverse.app/problems/not-found',
  CONFLICT: 'https://centiverse.app/problems/conflict',
  VERSION_CONFLICT: 'https://centiverse.app/problems/version-conflict',
  RATE_LIMITED: 'https://centiverse.app/problems/rate-limited',
  INTERNAL: 'https://centiverse.app/problems/internal',
} as const;

export type ProblemTypeUri = (typeof ProblemType)[keyof typeof ProblemType];

export interface ApiErrorOptions {
  detail?: string;
  errors?: Record<string, string[]>;
  /** Extra members, e.g. the current server state on a 409 (§6.3). */
  extensions?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly type: ProblemTypeUri;
  readonly title: string;
  readonly detail: string | undefined;
  readonly errors: Record<string, string[]> | undefined;
  readonly extensions: Record<string, unknown> | undefined;

  constructor(status: number, type: ProblemTypeUri, title: string, options: ApiErrorOptions = {}) {
    super(options.detail ?? title);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.title = title;
    this.detail = options.detail;
    this.errors = options.errors;
    this.extensions = options.extensions;
  }

  /**
   * §6.5: "A non-member gets 404, not 403. 403 confirms the resource exists."
   * `notFound` is therefore the correct response to an authorization failure on
   * a group-scoped resource, and `forbidden` is reserved for the cases where the
   * caller is already known to be a member but lacks the role.
   */
  static notFound(detail?: string) {
    return new ApiError(404, ProblemType.NOT_FOUND, 'Not found', detail === undefined ? {} : { detail });
  }

  static unauthenticated(detail?: string) {
    return new ApiError(401, ProblemType.UNAUTHENTICATED, 'Authentication required', detail === undefined ? {} : { detail });
  }

  static forbidden(detail?: string) {
    return new ApiError(403, ProblemType.FORBIDDEN, 'Forbidden', detail === undefined ? {} : { detail });
  }

  static validation(errors: Record<string, string[]>, detail?: string) {
    return new ApiError(422, ProblemType.VALIDATION, 'Validation failed', {
      errors,
      ...(detail === undefined ? {} : { detail }),
    });
  }

  static conflict(detail?: string) {
    return new ApiError(409, ProblemType.CONFLICT, 'Conflict', detail === undefined ? {} : { detail });
  }

  /**
   * §6.3: "Every update sends the entity's version; a mismatch returns 409 with
   * the current server state so the client can present a real conflict UI."
   */
  static versionConflict(current: unknown, detail?: string) {
    return new ApiError(409, ProblemType.VERSION_CONFLICT, 'Version conflict', {
      extensions: { current },
      ...(detail === undefined ? {} : { detail }),
    });
  }
}

export const toProblem = (error: ApiError, instance: string): Problem & Record<string, unknown> => ({
  type: error.type,
  title: error.title,
  status: error.status,
  ...(error.detail === undefined ? {} : { detail: error.detail }),
  instance,
  ...(error.errors === undefined ? {} : { errors: error.errors }),
  ...(error.extensions ?? {}),
});

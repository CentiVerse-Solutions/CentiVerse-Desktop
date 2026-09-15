import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { ApiError, PROBLEM_CONTENT_TYPE, ProblemType, toProblem } from './problem';

/** Turn a ZodError into the `errors` map of RFC 9457: field path -> messages. */
export const zodToFieldErrors = (error: ZodError): Record<string, string[]> => {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
};

/**
 * The single place that writes an error body. Every other layer throws.
 *
 * Fastify's own failures (unparseable JSON, unknown route, rate limit) arrive
 * here too, so they come out in the same envelope as our own — a client only
 * ever has to understand one error shape.
 */
export const installProblemHandler = (app: FastifyInstance): void => {
  app.setNotFoundHandler((request, reply) => {
    const problem = toProblem(ApiError.notFound(`No route for ${request.method} ${request.url}`), request.url);
    reply.status(404).type(PROBLEM_CONTENT_TYPE).send(problem);
  });

  app.setErrorHandler((fastifyError: FastifyError, request, reply) => {
    // Narrow through a widened alias: `instanceof` on the parameter itself would
    // narrow its declared FastifyError type away, taking `statusCode` with it.
    const error: unknown = fastifyError;

    if (error instanceof ApiError) {
      // 5xx is our bug; log it with the stack. 4xx is the caller's, and logging
      // every one of those at error level makes the log useless.
      if (error.status >= 500) request.log.error({ err: error }, 'request failed');
      reply.status(error.status).type(PROBLEM_CONTENT_TYPE).send(toProblem(error, request.url));
      return;
    }

    if (error instanceof ZodError) {
      const api = ApiError.validation(zodToFieldErrors(error));
      reply.status(api.status).type(PROBLEM_CONTENT_TYPE).send(toProblem(api, request.url));
      return;
    }

    const status = typeof fastifyError.statusCode === 'number' ? fastifyError.statusCode : 500;

    if (status < 500) {
      const api = new ApiError(
        status,
        status === 429 ? ProblemType.RATE_LIMITED : ProblemType.VALIDATION,
        status === 429 ? 'Too many requests' : 'Bad request',
        { detail: fastifyError.message },
      );
      reply.status(status).type(PROBLEM_CONTENT_TYPE).send(toProblem(api, request.url));
      return;
    }

    // Unexpected. Log everything, tell the caller nothing: an internal message
    // can leak a query, a path or a hostname.
    request.log.error({ err: fastifyError }, 'unhandled error');
    const api = new ApiError(500, ProblemType.INTERNAL, 'Internal server error');
    reply.status(500).type(PROBLEM_CONTENT_TYPE).send(toProblem(api, request.url));
  });
};

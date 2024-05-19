export const ERRORS = {
  VALID: 0,
  NOT_FOUND: 1,
  INVALID_TO_SAVE: 2,
  NOT_EDITABLE: 3,
} as const;

export const NOT_FOUND = 'Not found';

export const DEFAULT_ERRORS = {
  notFound: { status: 404, body: { error: 'Not found' } },
} as const;

export function resolveErrorStatus(error) {
  if (typeof error?.status === 'number') return error.status;
  if (typeof error?.statusCode === 'number') return error.statusCode;
  if (typeof error?.cause?.status === 'number') return error.cause.status;
  if (typeof error?.cause?.statusCode === 'number') return error.cause.statusCode;
  return 500;
}

export function resolveErrorMessage(error) {
  return error?.message || error?.cause?.message || 'Unknown error';
}
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function toPositiveInteger(value, fallback = 1) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return fallback;
  return Math.floor(numberValue);
}

function createParamReader(params = {}) {
  return {
    requiredString(name, message) {
      const value = toTrimmedString(params[name]);
      if (!value) {
        throw new ValidationError(message);
      }
      return value;
    },

    optionalString(name) {
      return toTrimmedString(params[name]);
    },

    positiveInteger(name, fallback = 1) {
      return toPositiveInteger(params[name], fallback);
    },

    nonNegativeInteger(name, message) {
      const numberValue = Number(params[name]);
      if (!Number.isFinite(numberValue) || numberValue < 0) {
        throw new ValidationError(message);
      }
      return Math.floor(numberValue);
    },

    ensure(condition, message) {
      if (!condition) {
        throw new ValidationError(message);
      }
    }
  };
}

export function createValidatedUsecase(handler) {
  return async (params = {}) => {
    try {
      return await handler(createParamReader(params), params);
    } catch (error) {
      if (error instanceof ValidationError) {
        return { error: error.message };
      }
      throw error;
    }
  };
}
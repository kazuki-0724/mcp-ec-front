export class AppError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = "AppError";
        this.code = options.code || "APP_ERROR";
        this.status = options.status || 500;
        this.details = options.details;
    }
}

export function toAppError(error, fallbackMessage = "Unexpected error") {
    if (error instanceof AppError) return error;

    return new AppError(error?.message || fallbackMessage, {
        code: error?.code || "UNEXPECTED_ERROR",
        status: typeof error?.status === "number" ? error.status : 500,
        details: error
    });
}

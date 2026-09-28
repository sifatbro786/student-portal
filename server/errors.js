import "server-only";

/** Expected, user-safe business error. Anything else is logged and shown generically (SEC-09). */
export class ServiceError extends Error {
    /** @param {string} code @param {string} message @param {string} [field] */
    constructor(code, message, field) {
        super(message);
        this.name = "ServiceError";
        this.code = code;
        this.field = field;
    }
}

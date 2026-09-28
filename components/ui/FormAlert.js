import { Alert } from "./Alert.js";

/** Shows the top-level result of a Server Action (`{ error }` / `{ message }`). */
export function FormAlert({ state, className }) {
    if (state?.error)
        return (
            <Alert tone="error" className={className}>
                {state.error}
            </Alert>
        );
    if (state?.message)
        return (
            <Alert tone="success" className={className}>
                {state.message}
            </Alert>
        );
    return null;
}

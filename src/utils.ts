/**
 * Deep clone value.
 * @param value Value to clone.
 */
export function deepClone<T = any>(value: T): T {
    return structuredClone(value);
}

/**
 * Checks if value is null or undefined.
 * @param value Value to check.
 * @returns True if value is null or undefined, false otherwise.
 */
export function isNil(value: any) {
    return value === null || value === undefined;
}

/**
 * Checks if value is object like.
 * @param value Value to check.
 * @returns True if value is object like, false otherwise.
 */
export function isObjectLike(value: any): value is object {
    return value !== null && typeof value === "object";
}

/**
 * Checks if path is a direct property of object.
 * @param object Object to check.
 * @param path Path to check.
 */
export function has<T>(object: T, path: string | string[]): boolean {
    const newPath = Array.isArray(path) ? path : path.split(".");
    let current: any = object;

    for (const key of newPath) {
        if (!isObjectLike(current)) {
            return false;
        }

        if (!(key in current)) {
            return false;
        }

        current = (current as any)[key];
    }

    return true;
}

/**
 * Retrieves the value at the given path from the object.
 * Returns defaultValue if the path does not exist.
 * @param object Object to get value from.
 * @param path Property path as a dot-separated string or array of keys.
 * @param defaultValue Value to return if the path does not exist.
 * @returns Value at the given path or defaultValue.
 */
export function get<T>(
    object: T,
    path: string | string[],
    defaultValue?: any,
): any {
    const newPath = Array.isArray(path) ? path : path.split(".");
    let current: any = object;

    for (const key of newPath) {
        if (!isObjectLike(current)) {
            return defaultValue;
        }

        if (!(key in current)) {
            return defaultValue;
        }

        current = (current as any)[key];
    }

    return current === undefined ? defaultValue : current;
}

/**
 * Update object value on path.
 * @param object Object to update.
 * @param path Path to the value.
 * @param value New value to set.
 */
export function set(object: any, path: string | string[], value: any) {
    let current = object;

    const newPath = Array.isArray(path) ? path : path.split(".");

    for (let i = 0; i < newPath.length; ++i) {
        if (i === newPath.length - 1) {
            current[newPath[i]] = value;
        } else {
            current = current[newPath[i]];
        }
    }
}

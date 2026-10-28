export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`nolabs:${key}`);
    if (raw == null) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function loadValue(key: string): string | null {
  try {
    return localStorage.getItem(`nolabs:${key}`);
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(`nolabs:${key}`, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

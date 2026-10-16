/**
 * Wraps a server-side data load so the component can render outside a
 * try/catch. React does not render JSX synchronously, so constructing JSX
 * inside try/catch cannot actually catch render errors (and the
 * `react-hooks/error-boundaries` lint rule forbids it). Here the try/catch
 * only ever wraps the awaited fetch.
 */

export type Loaded<T> =
  | { ok: true; data: T }
  | { ok: false; error: unknown };

export async function load<T>(fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error };
  }
}

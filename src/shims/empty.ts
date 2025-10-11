// Minimal no-op module used to satisfy optional dependencies
// that are not needed in the browser bundle (e.g., RN AsyncStorage, pino-pretty).

export default function noop() {
  return undefined as unknown as any;
}

// CommonJS interop safety for libraries expecting module.exports = function
// (Webpack will handle default import, but this helps edge cases.)
// @ts-ignore
module.exports = noop;


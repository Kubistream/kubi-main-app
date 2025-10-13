// Minimal no-op module used to satisfy optional dependencies
// that are not needed in the browser bundle (e.g., RN AsyncStorage, pino-pretty).

export default function noop(): undefined {
  return undefined;
}

const globalModule = (globalThis as typeof globalThis & {
  module?: { exports: unknown };
}).module;

if (globalModule) {
  globalModule.exports = noop;
}

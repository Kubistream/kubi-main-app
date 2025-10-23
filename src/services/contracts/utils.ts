export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function uniqueAddresses(addrs: string[]): string[] {
  const set = new Set(addrs.map((a) => a.toLowerCase()));
  return Array.from(set);
}


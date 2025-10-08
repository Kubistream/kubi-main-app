export type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

function toArray(value: ClassValue): string[] {
  if (!value) return [];

  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => toArray(item));
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, condition]) => Boolean(condition))
      .map(([className]) => className);
  }

  return [];
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.flatMap((value) => toArray(value)).join(" ").trim();
}

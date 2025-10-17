import { formatUnits } from "ethers";

type FormatTokenAmountOptions = {
  trimTrailingZeros?: boolean;
  maxFractionDigits?: number;
  minFractionDigits?: number;
  useGrouping?: boolean;
};

const DEFAULT_MAX_FRACTION_DIGITS = 8;

export function formatTokenAmount(
  value: string | null | undefined,
  decimals: number,
  options: FormatTokenAmountOptions = {},
): string {
  if (!value) return "0";

  const {
    trimTrailingZeros = true,
    maxFractionDigits = Math.min(decimals, DEFAULT_MAX_FRACTION_DIGITS),
    minFractionDigits = 0,
    useGrouping = true,
  } = options;

  try {
    const normalized = normalizeRawValue(value);
    const formatted = formatUnits(normalized, decimals);
    const [wholePart, fractionPart = ""] = formatted.split(".");

    const groupedWhole = useGrouping ? groupThousands(wholePart) : wholePart;
    const limitedFraction = fractionPart.slice(0, Math.max(maxFractionDigits, minFractionDigits));
    const trimmedFraction = trimTrailingZeros
      ? limitedFraction.replace(/0+$/, "")
      : limitedFraction.padEnd(Math.max(minFractionDigits, limitedFraction.length), "0");

    const finalFraction =
      trimmedFraction.length < minFractionDigits
        ? trimmedFraction.padEnd(minFractionDigits, "0")
        : trimmedFraction;

    return finalFraction ? `${groupedWhole}.${finalFraction}` : groupedWhole;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console -- developer signal for formatting issues
      console.error("[formatTokenAmount] Failed to format value", {
        value,
        decimals,
        error,
      });
    }
    return value;
  }
}

function normalizeRawValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "0";

  const isNegative = trimmed.startsWith("-");
  const unsigned = isNegative ? trimmed.slice(1) : trimmed;

  const expanded = expandScientificNotation(unsigned);
  const withoutTrailingZeroFraction = expanded.includes(".")
    ? expanded.replace(/\.0+$/, "")
    : expanded;

  if (withoutTrailingZeroFraction.includes(".")) {
    const [whole, fraction] = withoutTrailingZeroFraction.split(".");
    if (/^0*$/.test(fraction)) {
      return (isNegative ? "-" : "") + whole;
    }
    // Fractional component detected; remove the decimal point so we can treat it as the integer representation.
    return (isNegative ? "-" : "") + (whole + fraction);
  }

  return (isNegative ? "-" : "") + withoutTrailingZeroFraction;
}

function expandScientificNotation(value: string): string {
  if (!/[eE]/.test(value)) {
    return value;
  }

  const [coefficient, exponentPart] = value.split(/[eE]/);
  const exponent = Number.parseInt(exponentPart ?? "0", 10);
  if (!Number.isFinite(exponent)) return value;

  const isNegativeCoeff = coefficient.startsWith("-");
  const coeff = isNegativeCoeff ? coefficient.slice(1) : coefficient;
  const [intPart, fracPart = ""] = coeff.split(".");
  const digits = intPart + fracPart;
  const decimalIndex = intPart.length;

  if (exponent >= 0) {
    const newIndex = decimalIndex + exponent;
    if (newIndex >= digits.length) {
      const padded = digits.padEnd(newIndex, "0");
      return (isNegativeCoeff ? "-" : "") + padded;
    }
    const whole = digits.slice(0, newIndex);
    const fraction = digits.slice(newIndex);
    return (isNegativeCoeff ? "-" : "") + `${whole}.${fraction}`;
  }

  const shift = Math.abs(exponent);
  const padded = digits.padStart(digits.length + shift, "0");
  const breakpoint = padded.length - shift;
  const whole = breakpoint > 0 ? padded.slice(0, breakpoint) : "0";
  const fraction = padded.slice(breakpoint);
  return (isNegativeCoeff ? "-" : "") + `${whole}.${fraction}`;
}

function groupThousands(value: string) {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const grouped = unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return negative ? `-${grouped}` : grouped;
}

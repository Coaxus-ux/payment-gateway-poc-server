type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const REDACT_KEYS = new Set([
  'authorization',
  'token',
  'acceptance_token',
  'accept_personal_auth',
  'cvc',
  'cvv',
  'cardnumber',
  'card_number',
  'private_key',
  'public_key',
  'payment_private_key',
  'payment_public_key',
  'payment_events_key',
  'payment_integrity_key',
]);

function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 12) return value;
  const prefix = digits.slice(0, 6);
  const suffix = digits.slice(-4);
  return `${prefix}******${suffix}`;
}

export function redactSensitive(input: unknown): JsonValue {
  if (input === null || input === undefined) return null;
  if (typeof input === 'string') {
    return maskCardNumber(input);
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => redactSensitive(item));
  }
  if (typeof input === 'object') {
    const output: Record<string, JsonValue> = {};
    for (const [rawKey, value] of Object.entries(input as object)) {
      const key = rawKey.toLowerCase();
      if (REDACT_KEYS.has(key) || key.endsWith('key')) {
        output[rawKey] = '[REDACTED]';
        continue;
      }
      if (key.includes('card') && typeof value === 'string') {
        output[rawKey] = maskCardNumber(value);
        continue;
      }
      output[rawKey] = redactSensitive(value);
    }
    return output;
  }
  return null;
}

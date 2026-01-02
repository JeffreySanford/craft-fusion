const MAX_STRING_LENGTH = 200;
const MAX_ARRAY_LENGTH = 3;
const MAX_OBJECT_KEYS = 8;
const MAX_DEPTH = 2;

export function summarizeForLog(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length <= MAX_STRING_LENGTH) {
      return value;
    }
    return `${value.slice(0, MAX_STRING_LENGTH)}...`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    const sample = value.slice(0, MAX_ARRAY_LENGTH).map(item => summarizeForLog(item, depth + 1));
    return {
      type: 'array',
      length: value.length,
      sample,
    };
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (depth >= MAX_DEPTH) {
      return {
        type: 'object',
        keys: keys.slice(0, MAX_OBJECT_KEYS),
      };
    }

    const preview: Record<string, unknown> = {};
    keys.slice(0, MAX_OBJECT_KEYS).forEach(key => {
      preview[key] = summarizeForLog(obj[key], depth + 1);
    });

    return {
      type: 'object',
      keys: keys.slice(0, MAX_OBJECT_KEYS),
      preview,
    };
  }

  return String(value);
}

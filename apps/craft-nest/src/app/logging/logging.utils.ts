/**
 * Utility function to summarize large objects for logging purposes.
 * Truncates long strings or large arrays to keep logs concise.
 */
export function summarizeForLog(data: any, maxLength = 500): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data.length > maxLength ? `${data.substring(0, maxLength)}... [truncated]` : data;
  }

  if (Array.isArray(data)) {
    if (data.length > 5) {
      return [
        ...data.slice(0, 3).map(item => summarizeForLog(item, 100)),
        `... and ${data.length - 3} more items`
      ];
    }
    return data.map(item => summarizeForLog(item, 100));
  }

  if (typeof data === 'object') {
    const result: any = {};
    const keys = Object.keys(data);
    
    // If it's a Buffer or large object, just summarize it
    if (data.type === 'Buffer' || keys.length > 20) {
      return `[Object with ${keys.length} keys]`;
    }

    for (const key of keys.slice(0, 10)) {
      result[key] = summarizeForLog(data[key], 100);
    }
    
    if (keys.length > 10) {
      result['__more_keys__'] = keys.length - 10;
    }
    
    return result;
  }

  return data;
}

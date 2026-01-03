import 'zone.js';                              

if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement: unknown, fromIndex?: number): boolean {
    return this.indexOf(searchElement, fromIndex) !== -1;
  };
}

if (!('localStorage' in window)) {
  const storage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      key: (index: number) => Array.from(storage.keys()).at(index) || null,
      length: storage.size,
    },
    writable: false,
  });
}

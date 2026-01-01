function buildEndLoc(text) {
  const lines = text.split(/\r?\n/);
  const line = lines.length;
  const column = lines[lines.length - 1].length;
  return { line, column };
}

module.exports.parseForESLint = function parseForESLint(text) {
  return {
    ast: {
      type: 'Program',
      body: [],
      sourceType: 'module',
      range: [0, text.length],
      loc: { start: { line: 1, column: 0 }, end: buildEndLoc(text) },
      tokens: [],
      comments: [],
    },
    visitorKeys: {
      Program: [],
    },
    services: {},
    scopeManager: null,
  };
};

const fs = require('fs');

function normalizeBlankLines(text, options) {
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const endsWithNewline = text.endsWith('\n');
  const lines = text.split(/\r?\n/);
  const max = typeof options.max === 'number' ? options.max : 1;
  const maxBOF = typeof options.maxBOF === 'number' ? options.maxBOF : 0;
  const maxEOF = typeof options.maxEOF === 'number' ? options.maxEOF : 0;

  const output = [];
  let blankCount = 0;
  let seenContent = false;

  for (const line of lines) {
    const isBlank = line.trim() === '';
    if (isBlank) {
      if (!seenContent && maxBOF === 0) {
        blankCount += 1;
        continue;
      }
      blankCount += 1;
      if (blankCount <= max) {
        output.push('');
      }
      continue;
    }

    blankCount = 0;
    seenContent = true;
    output.push(line);
  }

  if (maxEOF === 0) {
    while (output.length && output[output.length - 1].trim() === '') {
      output.pop();
    }
  }

  if (maxBOF === 0) {
    while (output.length && output[0].trim() === '') {
      output.shift();
    }
  }

  let normalized = output.join(newline);
  if (endsWithNewline) {
    normalized += newline;
  }
  return normalized;
}

module.exports = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'number' },
          maxBOF: { type: 'number' },
          maxEOF: { type: 'number' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    return {
      Program() {
        const options = context.options[0] || {};
        const filename = context.getFilename();
        const sourceText = fs.readFileSync(filename, 'utf8');
        const normalized = normalizeBlankLines(sourceText, options);

        if (normalized !== sourceText) {
          context.report({
            loc: { line: 1, column: 0 },
            message: 'Multiple consecutive blank lines are not allowed.',
            fix: fixer => fixer.replaceTextRange([0, sourceText.length], normalized),
          });
        }
      },
    };
  },
};

const noNewService = require('./no-new-service');
const noMultipleBlankLines = require('./no-multiple-blank-lines');
module.exports = {
  rules: {
    'no-new-service': noNewService,
    'no-multiple-blank-lines': noMultipleBlankLines,
  }
};

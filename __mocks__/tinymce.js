// Minimal tinymce mock for tests to avoid browser-only APIs at module import time
const Editor = function() {};
const EditorOptions = {};

module.exports = {
  default: {},
  Editor,
  EditorOptions,
};

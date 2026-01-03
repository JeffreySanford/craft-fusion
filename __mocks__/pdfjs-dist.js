// Lightweight pdfjs-dist mock for Jest
module.exports = {
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (data) => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async (n) => ({
        render: () => ({ promise: Promise.resolve() }),
      }),
    }),
  }),
};
// Minimal mock for pdfjs-dist used in unit tests
const pdfjsLib = {
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (src) => ({ promise: Promise.resolve({ numPages: 0 }) }),
};

module.exports = pdfjsLib;

module.exports = {
  source: ["tokens/**/*.json"],
  platforms: {
    scss: {
      transformGroup: "scss",
      buildPath: "apps/craft-web/src/styles/generated/",
      files: [{
        destination: "_tokens.scss",
        format: "scss/variables"
      }]
    },
    css: {
      transformGroup: "css",
      buildPath: "apps/craft-web/src/styles/generated/",
      files: [{
        destination: "tokens.css",
        format: "css/variables"
      }]
    },
    ts: {
      transformGroup: "js",
      buildPath: "apps/craft-web/src/app/core/tokens/",
      files: [{
        destination: "design-tokens.ts",
        format: "javascript/es6"
      }]
    }
  }
};

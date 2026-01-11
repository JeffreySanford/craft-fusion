module.exports = {
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-prettier",
    'stylelint-config-standard',
  ],
  plugins: [
    "stylelint-order",
    "stylelint-scss",
  ],
  rules: {
    // delegate unknown at-rule handling to the scss plugin
    "at-rule-no-unknown": null,
    "order/properties-alphabetical-order": true,
    "scss/at-extend-no-missing-placeholder": true,
    "scss/selector-no-redundant-nesting-selector": true,
    // relax strict variable name enforcement for now to reduce noise
    "scss/dollar-variable-pattern": null,
    "scss/at-rule-no-unknown": [true, {
      ignoreAtRules: ["include", "mixin", "use", "for", "each", "if", "else", "function", "return", "forward"]
    }],
    "scss/no-duplicate-dollar-variables": true,
    // Prefer modern color functions (channel notation with slash) to align with MD3
    "color-function-notation": "modern",
    // Do not enforce alpha notation (numbers vs percentage) globally to avoid
    // false-positives on properties like `opacity` and filter functions.
    "alpha-value-notation": null,
    // allow project mixin names (kebab/lowercase) instead of forcing a specific vendor prefix
    "scss/at-mixin-pattern": "^[a-z0-9-]+$",
    // allow camelCase, kebab-case and underscore (MDC/BEM) class names during triage
    "selector-class-pattern": "^[a-zA-Z0-9_-]+$",
    // Practical relaxations to reduce large-volume stylelint noise during triage
    "selector-pseudo-element-no-unknown": [true, { "ignorePseudoElements": ["ng-deep"] }],
    "no-descending-specificity": null,
    "no-duplicate-selectors": null,
    "max-line-length": 180,
    "keyframes-name-pattern": null
  },
  ignoreFiles: ["node_modules/**", "dist/**"]
};
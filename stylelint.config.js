module.exports = {
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-prettier",
  ],
  plugins: [
    "stylelint-order",
    "stylelint-scss",
  ],
  rules: {
    // delegate unknown at-rule handling to the scss plugin
    "at-rule-no-unknown": null,
    "order/properties-alphabetical-order": null,
    "scss/at-extend-no-missing-placeholder": true,
    "scss/selector-no-redundant-nesting-selector": null,
    // relax strict variable name enforcement for now to reduce noise
    "scss/dollar-variable-pattern": null,
    "scss/at-rule-no-unknown": [true, {
      ignoreAtRules: ["include", "mixin", "use", "for", "each", "if", "else", "function", "return", "forward"]
    }],
    "scss/no-duplicate-dollar-variables": null,
    "scss/dollar-variable-empty-line-before": null,
    // Prefer modern color functions (channel notation with slash) to align with MD3
    "color-function-notation": null,
    // Do not enforce alpha notation (numbers vs percentage) globally to avoid
    // false-positives on properties like `opacity` and filter functions.
    "alpha-value-notation": null,
    "property-no-vendor-prefix": null,
    "value-no-vendor-prefix": null,
    "block-no-empty": null,
    "declaration-empty-line-before": null,
    "rule-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "scss/at-if-closing-brace-newline-after": null,
    "scss/at-if-closing-brace-space-after": null,
    "scss/at-else-empty-line-before": null,
    "selector-id-pattern": null,
    "no-invalid-position-at-import-rule": null,
    "declaration-block-single-line-max-declarations": null,
    "no-empty-source": null,
    "selector-type-no-unknown": null,
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

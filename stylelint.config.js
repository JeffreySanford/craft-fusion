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
    "order/properties-alphabetical-order": true,
    "scss/at-extend-no-missing-placeholder": true,
    "scss/selector-no-redundant-nesting-selector": true,
    "scss/dollar-variable-pattern": "^\\$[a-z0-9-]+",
    "scss/at-rule-no-unknown": [true, {
      ignoreAtRules: ["include", "mixin", "use"]
    }],
    "scss/no-duplicate-dollar-variables": true,
    "scss/at-mixin-pattern": "^mat-"
  },
  ignoreFiles: ["node_modules/**", "dist/**"]
};
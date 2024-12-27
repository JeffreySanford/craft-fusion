module.exports = {
  extends: [
    "stylelint-config-standard-scss", // Base SCSS rules
    "stylelint-config-prettier", // Avoid conflicts with Prettier
  ],
  plugins: [
    "stylelint-order", // For ordering rules
    "stylelint-scss", // SCSS specific linting
  ],
  rules: {
    // Enforce proper order of declarations
    "order/properties-alphabetical-order": true,

    // Angular Material Specific Rules
    "scss/at-extend-no-missing-placeholder": true,
    "scss/selector-no-redundant-nesting-selector": true,

    // Custom SCSS Theming Rules
    "scss/dollar-variable-pattern": "^\\$[a-z0-9-]+", // Enforce lowercase variable names
    "scss/at-rule-no-unknown": [true, {
      ignoreAtRules: ["include", "mixin", "use"]
    }],

    // Material Specific Guidance
    "scss/no-duplicate-dollar-variables": true,
    "scss/at-mixin-pattern": "^mat-" // Ensure all mixins for Material start with 'mat-'
  },
  ignoreFiles: ["node_modules/**", "dist/**"]
};
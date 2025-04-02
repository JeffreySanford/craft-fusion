module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-prettier'
  ],
  plugins: [
    'stylelint-order'
  ],
  rules: {
    'color-hex-case': 'lower',
    'color-hex-length': 'short',
    'max-nesting-depth': 4,
    'selector-max-compound-selectors': 4,
    'selector-class-pattern': null,
    'scss/dollar-variable-pattern': null,
    'order/properties-alphabetical-order': true,
    'no-empty-source': null,
    'selector-type-no-unknown': [
      true,
      {
        ignore: ['custom-elements']
      }
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
          'include',
          'mixin',
          'extend'
        ]
      }
    ]
  }
};
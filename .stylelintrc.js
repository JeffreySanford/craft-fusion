module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-prettier',
  ],
  rules: {
    // Add or override rules here
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]+$',
      {
        message:
          'Selector class names should be camelCase and start with a lowercase letter',
      },
    ],
    'property-no-unknown': [
      true,
      {
        ignoreProperties: [
          // Add any MD3-specific CSS properties here that Stylelint doesn't recognize
        ],
      },
    ],
  },
};

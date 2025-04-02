const StyleDictionary = require('style-dictionary');

/**
 * Function to transform shadow tokens to CSS variables
 */
StyleDictionary.registerTransform({
  name: 'shadow/css',
  type: 'value',
  matcher: (prop) => prop.attributes.category === 'shadow',
  transformer: (prop) => {
    const { x, y, blur, spread, color } = prop.original.value;
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }
});

module.exports = {
  source: ['./tokens/**/*.json'],
  platforms: {
    scss: {
      transformGroup: 'scss',
      buildPath: './apps/craft-web/src/styles/tokens/',
      files: [{
        destination: '_variables.scss',
        format: 'scss/variables'
      }]
    },
    css: {
      transformGroup: 'css',
      transforms: ['shadow/css'],
      buildPath: './apps/craft-web/src/styles/tokens/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
        options: {
          outputReferences: true
        }
      }]
    }
  }
};

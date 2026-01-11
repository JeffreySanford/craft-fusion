const { generateChangelog } = require('../../scripts/changelog-generator');

exports.default = async function(options, context) {
  console.log('Generating changelog...');
  
  try {
    const success = await generateChangelog();
    return { success };
  } catch (e) {
    console.error('Error generating changelog:', e);
    return { success: false };
  }
};

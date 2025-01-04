const path = require('path');

module.exports = {
  extensionTestsPath: path.resolve(__dirname, 'out/test'),
  extensionDevelopmentPath: path.resolve(__dirname),
  launchArgs: [
    '--disable-extensions'
  ]
};


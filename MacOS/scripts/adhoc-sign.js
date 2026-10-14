'use strict';
// electron-builder afterSign hook: ad-hoc sign the .app when no Developer ID identity is available.
// Apple Silicon refuses to launch a completely unsigned binary, so a "-" (ad-hoc) signature is the minimum.
const { execSync } = require('node:child_process');
const path = require('node:path');
module.exports = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execSync(`codesign --force --deep --sign - "${app}"`, { stdio: 'inherit' });
  execSync(`codesign -dv --verbose=2 "${app}"`, { stdio: 'inherit' });
};

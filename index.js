/**
 * Consolidated Backend Entry Point - LabCore ELIS OS
 * 
 * All legacy backend logic from the root has been consolidated into the modern
 * Node.js & Express 5 TypeScript backend located in ./backend.
 * 
 * This root entry point safely delegates to backend/api/src/server.ts or the
 * compiled bundle in backend/dist without initializing dual servers or port conflicts.
 */
const path = require('path');
const fs = require('fs');

const backendDir = path.join(__dirname, 'backend');
const distServer = path.join(backendDir, 'dist', 'api', 'src', 'server.js');
const tsServer = path.join(backendDir, 'api', 'src', 'server.ts');
const backendEnv = path.join(backendDir, '.env');

if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv });
} else {
  require('dotenv').config();
}

if (require.main === module) {
  console.log('=======================================================');
  console.log('🔄 LabCore ELIS OS: Consolidated Backend Initialized');
  console.log('📂 Target: modern Express 5 + TypeScript in ./backend');
  console.log('=======================================================');

  if (fs.existsSync(distServer)) {
    require(distServer);
  } else {
    // When executing directly in development from TypeScript source
    const tsNode = require(path.join(backendDir, 'node_modules', 'ts-node'));
    tsNode.register({
      transpileOnly: true,
      project: path.join(backendDir, 'tsconfig.json')
    });
    require(tsServer);
  }
} else {
  // When imported as a module, delegate to modern app
  const distApp = path.join(backendDir, 'dist', 'api', 'src', 'app.js');
  if (fs.existsSync(distApp)) {
    module.exports = require(distApp).default || require(distApp);
  } else {
    const tsNode = require(path.join(backendDir, 'node_modules', 'ts-node'));
    tsNode.register({
      transpileOnly: true,
      project: path.join(backendDir, 'tsconfig.json')
    });
    const tsApp = path.join(backendDir, 'api', 'src', 'app.ts');
    module.exports = require(tsApp).default || require(tsApp);
  }
}

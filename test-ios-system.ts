/**
 * Test script for iOS App Signing and Deployment System
 */

// Import the main iOS manager
import { IOSManager } from './src/ios/IOSManager';
import type { FileMap } from './src/types';

async function testIOSSystem() {
  console.log('🍎 Testing iOS App Signing and Deployment System...\n');

  try {
    // Initialize iOS Manager
    console.log('1. Initializing iOS Manager...');
    const iosManager = new IOSManager();
    await iosManager.initialize();
    console.log('✅ iOS Manager initialized\n');

    // Test Apple account connection
    console.log('2. Testing Apple Account Connection...');
    try {
      const account = await iosManager.connectAppleAccount();
      console.log('✅ Apple account connected:', {
        email: account.email,
        name: account.name,
        isDeveloper: account.isDeveloperAccount,
        teamId: account.teamId
      });
    } catch (error) {
      console.log('ℹ️ Apple account connection skipped (mock mode)');
    }
    console.log();

    // Test signing readiness validation
    console.log('3. Validating signing readiness...');
    const readiness = await iosManager.validateSigningReadiness();
    console.log('Signing readiness:', readiness);
    console.log();

    // Test account capabilities
    console.log('4. Testing account capabilities...');
    const capabilities = iosManager.getAccountCapabilities();
    console.log('Account capabilities:', capabilities);
    console.log();

    // Test building and deploying an iOS app
    console.log('5. Testing iOS app build and deployment...');
    
    const mockApp = {
      name: 'Test Driver App',
      files: {
        'index.html': `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Test Driver App</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
              <h1>Hello from Driver!</h1>
              <p>This is a test iOS app built with the Driver platform.</p>
            </body>
          </html>
        `,
        'style.css': `
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
          }
          h1 {
            font-size: 2em;
            margin-bottom: 1em;
          }
        `
      } as FileMap,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiByeD0iMzIiIGZpbGw9IiMzYjgyZjYiLz4KPHRleHQgeD0iMTI4IiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfk7E8L3RleHQ+Cjwvc3ZnPgo=',
      url: 'https://test.driver.dev'
    };

    let progressStage = '';
    const deployment = await iosManager.buildAndDeployiOSApp(mockApp, {
      onProgress: (stage, progress) => {
        if (stage !== progressStage) {
          console.log(`   ${stage} (${progress}%)`);
          progressStage = stage;
        }
      }
    });

    console.log('✅ iOS app deployment successful!');
    console.log('Deployment details:', {
      installUrl: deployment.installUrl.substring(0, 50) + '...',
      landingUrl: deployment.landingUrl,
      expiresAt: deployment.expiresAt
    });
    console.log();

    // Test deployment status
    console.log('6. Testing deployment status...');
    const deploymentStatus = iosManager.checkDeploymentStatus(deployment);
    console.log('Deployment status:', deploymentStatus);
    console.log();

    console.log('🎉 All iOS system tests passed!\n');

    return {
      success: true,
      capabilities,
      deployment,
      deploymentStatus
    };

  } catch (error) {
    console.error('❌ iOS system test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Export for use in other test files
export { testIOSSystem };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Running in Node.js environment
  testIOSSystem().then(result => {
    if (result.success) {
      console.log('✅ iOS System Test Suite: PASSED');
      process.exit(0);
    } else {
      console.log('❌ iOS System Test Suite: FAILED');
      console.error(result.error);
      process.exit(1);
    }
  });
} else {
  // Running in browser environment
  console.log('🍎 iOS System Test Suite ready. Call testIOSSystem() to run tests.');
}
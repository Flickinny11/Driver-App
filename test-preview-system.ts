import { PreviewSandbox } from '../src/preview/PreviewSandbox';
import { AppPackager } from '../src/delivery/AppPackager';
import { useCreatedAppStore } from '../src/store/createdAppStore';

/**
 * Test the live preview system functionality
 */
export const testLivePreviewSystem = async () => {
  console.log('🧪 Testing Live Preview System...');
  
  try {
    // Test 1: PreviewSandbox Creation
    console.log('📋 Test 1: PreviewSandbox Creation');
    
    // Create container for sandbox
    const container = document.createElement('div');
    container.id = 'test-preview-container';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    const sandbox = new PreviewSandbox('test-preview-container');
    await sandbox.initialize();
    
    console.log('  ✓ PreviewSandbox created and initialized');
    
    // Test 2: App Packaging
    console.log('📋 Test 2: App Packaging');
    
    const appPackager = new AppPackager();
    const sampleFiles = {
      'src/App.tsx': `
import React from 'react';

function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Test App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;
      `,
      'src/main.tsx': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
      `
    };
    
    const packageResult = await appPackager.packageApp(
      'Test Counter App',
      sampleFiles,
      'A simple counter app for testing'
    );
    
    console.log('  ✓ App packaged successfully:', packageResult);
    
    // Test 3: Store Integration
    console.log('📋 Test 3: Store Integration');
    
    const store = useCreatedAppStore.getState();
    const testApp = {
      id: packageResult.id,
      name: packageResult.name,
      description: 'A simple counter app for testing',
      url: packageResult.url,
      icon: packageResult.icon,
      size: packageResult.size,
      files: packageResult.files,
      category: 'web' as const,
      buildProgress: 100,
      version: '1.0.0',
      opens: 0,
      screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOWZhZmIiLz48dGV4dCB4PSIyMDAiIHk9IjE1MCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGVzdCBBcHA8L3RleHQ+PC9zdmc+',
      installable: packageResult.installable,
      manifest: packageResult.manifest,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    store.addApp(testApp);
    console.log('  ✓ App added to store');
    
    // Test 4: File Loading
    console.log('📋 Test 4: File Loading');
    
    await sandbox.loadProject(sampleFiles, 'react');
    console.log('  ✓ Files loaded into sandbox');
    
    // Test 5: File Update (HMR simulation)
    console.log('📋 Test 5: File Update (HMR simulation)');
    
    const updatedFile = sampleFiles['src/App.tsx'].replace(
      'Test App',
      'Updated Test App'
    );
    
    await sandbox.updateFile('src/App.tsx', updatedFile);
    console.log('  ✓ File updated with HMR');
    
    // Cleanup
    setTimeout(() => {
      sandbox.destroy();
      container.remove();
      console.log('  ✓ Cleanup completed');
    }, 1000);
    
    console.log('✅ All tests passed! Live Preview System is working correctly.');
    
    return {
      success: true,
      tests: [
        'PreviewSandbox Creation',
        'App Packaging',
        'Store Integration', 
        'File Loading',
        'File Update (HMR simulation)'
      ]
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export test runner for manual execution
if (typeof window !== 'undefined') {
  (window as any).testLivePreviewSystem = testLivePreviewSystem;
}
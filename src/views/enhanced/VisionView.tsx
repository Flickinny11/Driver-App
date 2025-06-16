import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Camera,
  Eye,
  Download,
  Copy,
  Play,
  RefreshCw,
  Zap
} from 'lucide-react';

interface ExtractedCode {
  language: string;
  code: string;
  confidence: number;
  suggestions: string[];
}

export const VisionView: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedCode, setExtractedCode] = useState<ExtractedCode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setUploadedImage(imageData);
      setIsProcessing(true);

      try {
        // Simulate vision API processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock extracted code based on file type/context
        const mockCode = generateMockCode(file.name);
        setExtractedCode(mockCode);
        
        // Auto-detect language and offer project creation
        if (mockCode.code.length > 50) {
          showProjectCreationPrompt(mockCode.code, mockCode.language);
        }
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const generateMockCode = (fileName: string): ExtractedCode => {
    const isReactComponent = fileName.toLowerCase().includes('component') || 
                           fileName.toLowerCase().includes('react');
    
    if (isReactComponent) {
      return {
        language: 'tsx',
        code: `import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  title: string;
  onAction: () => void;
}

export const ExtractedComponent: React.FC<ComponentProps> = ({ 
  title, 
  onAction 
}) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Button 
        onClick={() => {
          setIsActive(!isActive);
          onAction();
        }}
        className={isActive ? 'bg-blue-600' : 'bg-gray-600'}
      >
        {isActive ? 'Active' : 'Inactive'}
      </Button>
    </div>
  );
};`,
        confidence: 0.92,
        suggestions: [
          'Add TypeScript interfaces for better type safety',
          'Consider using CSS modules for styling',
          'Add proper error handling',
          'Implement accessibility attributes'
        ]
      };
    } else {
      return {
        language: 'html',
        code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extracted Layout</title>
    <style>
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 60px 20px;
            border-radius: 12px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-top: 40px;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease;
        }
        
        .card:hover {
            transform: translateY(-4px);
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>Welcome to Your App</h1>
            <p>Built with AI Vision</p>
        </header>
        
        <div class="grid">
            <div class="card">
                <h3>Feature 1</h3>
                <p>Description of the first feature</p>
            </div>
            <div class="card">
                <h3>Feature 2</h3>
                <p>Description of the second feature</p>
            </div>
            <div class="card">
                <h3>Feature 3</h3>
                <p>Description of the third feature</p>
            </div>
        </div>
    </div>
</body>
</html>`,
        confidence: 0.87,
        suggestions: [
          'Consider using CSS Grid for better responsive design',
          'Add semantic HTML5 elements',
          'Implement proper meta tags for SEO',
          'Add loading states and animations'
        ]
      };
    }
  };

  const showProjectCreationPrompt = (code: string, language: string) => {
    // This would open a modal to create a new project
    console.log('Offering to create project with:', { code: code.slice(0, 100), language });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageUpload(files[0]);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const copyToClipboard = async () => {
    if (extractedCode) {
      await navigator.clipboard.writeText(extractedCode.code);
    }
  };

  const downloadCode = () => {
    if (extractedCode) {
      const blob = new Blob([extractedCode.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted-code.${extractedCode.language}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const createProject = () => {
    if (extractedCode) {
      showProjectCreationPrompt(extractedCode.code, extractedCode.language);
    }
  };

  return (
    <div className="h-full bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Eye className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Vision</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Extract code from images, screenshots, and designs
          </p>
        </motion.div>

        {!uploadedImage ? (
          /* Upload Zone */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div
              className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer group"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImageUpload(file);
                };
                input.click();
              }}
            >
              <motion.div
                className="text-6xl mb-4 group-hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
              >
                📷
              </motion.div>
              
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload an image or screenshot
              </h3>
              
              <p className="text-gray-400 mb-6">
                Drop your image here or click to browse
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </motion.button>
                
                <motion.button
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </motion.button>
              </div>
              
              <div className="mt-6 text-sm text-gray-500">
                Supports: PNG, JPG, WEBP, SVG (max 10MB)
              </div>
            </div>
          </motion.div>
        ) : (
          /* Image and Code View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Original Image</h3>
                <motion.button
                  onClick={() => {
                    setUploadedImage(null);
                    setExtractedCode(null);
                  }}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.button>
              </div>
              
              <div className="relative">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full rounded-lg shadow-lg"
                />
                
                {extractedCode && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {Math.round(extractedCode.confidence * 100)}% confidence
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Extracted Code */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Extracted Code</h3>
                
                {extractedCode && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {extractedCode.language.toUpperCase()}
                    </span>
                    <motion.button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Copy className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      onClick={downloadCode}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Download className="h-4 w-4" />
                    </motion.button>
                  </div>
                )}
              </div>
              
              <div className="h-96 overflow-hidden rounded-lg">
                {isProcessing ? (
                  <LoadingSpinner message="Extracting code from image..." />
                ) : extractedCode ? (
                  <CodeEditor 
                    value={extractedCode.code}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Upload an image to see extracted code
                  </div>
                )}
              </div>
              
              {extractedCode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex gap-3"
                >
                  <motion.button
                    onClick={createProject}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Zap className="h-4 w-4" />
                    Create Project
                  </motion.button>
                  
                  <motion.button
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="h-4 w-4" />
                    Live Preview
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}

        {/* Suggestions Panel */}
        {extractedCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-gray-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              AI Suggestions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extractedCode.suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{suggestion}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <motion.div
        className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-gray-400 mt-4 text-sm">{message}</p>
    </div>
  );
};

interface CodeEditorProps {
  value: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value }) => {
  return (
    <div className="h-full bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-auto">
      <pre className="text-gray-300 whitespace-pre-wrap">
        {value}
      </pre>
    </div>
  );
};

export default VisionView;
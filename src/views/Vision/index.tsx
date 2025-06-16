import { motion } from 'framer-motion';
import { Eye, Camera, Image, Upload } from 'lucide-react';

/**
 * Vision view - Visual analysis and generation
 */
const VisionView = () => {
  return (
    <div className="h-full bg-background">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Vision</h1>
              <p className="text-muted-foreground">Visual analysis, image generation, and computer vision</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary px-4 py-2 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Camera
            </button>
            <button className="btn-primary px-4 py-2 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Image
            </button>
          </div>
        </div>
      </motion.div>

      <div className="p-6">
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Visual AI capabilities</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Analyze images, generate visuals, extract text from documents, and perform computer vision tasks with AI.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <button className="glass-card p-4 hover:bg-accent/5 transition-colors text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Upload & Analyze</div>
              <div className="text-sm text-muted-foreground">Analyze existing images</div>
            </button>
            <button className="glass-card p-4 hover:bg-accent/5 transition-colors text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Camera Capture</div>
              <div className="text-sm text-muted-foreground">Take photo for analysis</div>
            </button>
            <button className="glass-card p-4 hover:bg-accent/5 transition-colors text-center">
              <Image className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Generate Images</div>
              <div className="text-sm text-muted-foreground">Create images with AI</div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VisionView;
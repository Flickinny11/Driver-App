import { motion } from 'framer-motion';
import { Search, Filter, SearchX } from 'lucide-react';
import { useState } from 'react';

/**
 * Search view - Search across all content
 */
const SearchView = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full bg-background">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Search className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Search</h1>
            <p className="text-muted-foreground">Find content across conversations, projects, and knowledge base</p>
          </div>
        </div>
      </motion.div>

      <div className="p-6">
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Search input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations, projects, files, and more..."
              className="input pl-10 pr-12 w-full text-lg"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-accent transition-colors">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Search results or empty state */}
          {!searchQuery ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Start searching</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter a search term to find relevant content across your conversations, projects, and knowledge base.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <SearchX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No content matches your search for "{searchQuery}". Try different keywords or check your spelling.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SearchView;
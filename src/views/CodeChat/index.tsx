import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Download, Copy } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AppCore } from '@/core/architecture/AppCore';
import { generateId } from '@/lib/utils';
import type { Message } from '@/types';

/**
 * Code Chat view - AI-powered coding assistant
 */
const CodeChatView = () => {
  const { addToast, selectedModel } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: generateId('msg'),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: generateId('msg'),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const core = AppCore.getInstance();
      
      if (!core.openRouter) {
        throw new Error('AI services not initialized. Please check your API key.');
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Stream response
      await core.openRouter.streamCompletion(
        selectedModel,
        [userMessage],
        (token: string) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        },
        () => {
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        (error: Error) => {
          console.error('Streaming error:', error);
          addToast({
            type: 'error',
            title: 'AI Response Error',
            description: error.message
          });
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        abortControllerRef.current.signal
      );

    } catch (error) {
      console.error('Failed to send message:', error);
      addToast({
        type: 'error',
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Remove the empty assistant message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      addToast({
        type: 'success',
        title: 'Copied to clipboard',
        description: 'Message content copied successfully'
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Code Chat</h1>
            <p className="text-muted-foreground">AI-powered coding assistant</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Model: <span className="text-primary font-medium">{selectedModel}</span>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ask me about coding, get help with debugging, or discuss software architecture.
              I'm here to help with all your development needs.
            </p>
          </motion.div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message bubble */}
              <div className={`glass-card p-4 ${
                message.role === 'user' 
                  ? 'bg-primary/10 border-primary/20' 
                  : 'bg-card'
              }`}>
                <div className="prose prose-invert max-w-none">
                  {message.content.includes('```') ? (
                    // Render code blocks
                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                      <code>{message.content}</code>
                    </pre>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                {/* Message actions */}
                {message.content && (
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      title="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {message.content.includes('```') && (
                      <button
                        onClick={() => {/* Download code */}}
                        className="p-1 rounded hover:bg-accent transition-colors"
                        title="Download code"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isStreaming && (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={handleStopGeneration}
              className="btn-secondary px-4 py-2"
            >
              Stop Generation
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div 
        className="p-4 border-t border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about coding..."
              className="input min-h-[60px] resize-none pr-12"
              disabled={isStreaming}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{input.length} characters</span>
        </div>
      </motion.div>
    </div>
  );
};

export default CodeChatView;
/**
 * Handles secure communication between parent and iframe
 */
export class MessageBridge {
  private iframe: HTMLIFrameElement;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Verify origin for security
      if (event.source !== this.iframe.contentWindow) {
        return;
      }

      const { type, ...data } = event.data;
      const handler = this.messageHandlers.get(type);
      if (handler) {
        handler(data);
      }
    });
  }

  send(type: string, data: any): void {
    if (!this.iframe.contentWindow) {
      console.warn('Iframe not ready for messaging');
      return;
    }

    this.iframe.contentWindow.postMessage({
      type,
      ...data
    }, '*');
  }

  on(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  off(type: string): void {
    this.messageHandlers.delete(type);
  }

  destroy(): void {
    this.messageHandlers.clear();
  }
}
import { nanoid } from 'nanoid';
import type { InterjectComment, ElementInfo } from '@/types';

/**
 * Manages the interject system for live feedback on preview elements
 */
export class InterjectSystem {
  private comments: Map<string, InterjectComment[]> = new Map();
  private overlay: InterjectOverlay;

  constructor() {
    this.overlay = new InterjectOverlay();
  }

  async captureInterject(
    windowId: string,
    element: ElementInfo,
    comment: string,
    voiceNote?: Blob
  ): Promise<void> {
    const interject: InterjectComment = {
      id: nanoid(),
      windowId,
      element: {
        selector: element.selector,
        xpath: element.xpath,
        bounds: element.bounds,
        tagName: element.tagName,
        attributes: element.attributes
      },
      comment,
      voiceNote,
      screenshot: await this.captureScreenshot(element),
      timestamp: new Date(),
      status: 'pending'
    };

    // Store comment
    const windowComments = this.comments.get(windowId) || [];
    windowComments.push(interject);
    this.comments.set(windowId, windowComments);

    // Send to agents without interrupting
    this.sendToAgents(interject);

    // Show visual indicator
    this.overlay.addPin(element.bounds, interject);
  }

  private async sendToAgents(interject: InterjectComment): Promise<void> {
    // Find relevant agent based on file/component
    const relevantAgent = await this.findRelevantAgent(interject.element);

    // Send as high-priority task
    const task = {
      type: 'ui-feedback',
      priority: 'high' as const,
      description: `User feedback on ${interject.element.tagName}: ${interject.comment}`,
      context: {
        element: interject.element,
        screenshot: interject.screenshot,
        timestamp: interject.timestamp
      },
      assignedAgent: relevantAgent
    };

    // Simulate sending to agent orchestrator
    console.log('Sending interject to agents:', task);
    
    // In a real implementation, this would integrate with the agent system
    // agentOrchestrator.sendHighPriorityTask(relevantAgent, task);
  }

  private async findRelevantAgent(element: ElementInfo): Promise<string> {
    // Simple heuristic - in a real implementation, this would be more sophisticated
    if (element.tagName.toLowerCase().includes('button') || 
        element.attributes.type === 'button') {
      return 'ui-ux-designer';
    }
    
    if (element.tagName.toLowerCase().includes('form') || 
        element.tagName.toLowerCase().includes('input')) {
      return 'frontend-architect';
    }
    
    return 'frontend-architect'; // Default
  }

  private async captureScreenshot(element: ElementInfo): Promise<string> {
    // Create a simple placeholder screenshot
    // In a real implementation, this would capture the actual element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = Math.max(element.bounds.width, 100);
    canvas.height = Math.max(element.bounds.height, 50);
    
    // Draw a simple placeholder
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(element.tagName, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL();
  }

  getComments(windowId: string): InterjectComment[] {
    return this.comments.get(windowId) || [];
  }

  updateCommentStatus(commentId: string, status: InterjectComment['status']): void {
    for (const [, comments] of this.comments) {
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        comment.status = status;
        this.overlay.updatePin(commentId, status);
        break;
      }
    }
  }

  clearComments(windowId: string): void {
    this.comments.delete(windowId);
    this.overlay.clearPins(windowId);
  }

  destroy(): void {
    this.comments.clear();
    this.overlay.destroy();
  }
}

/**
 * Manages visual overlay pins for interject comments
 */
class InterjectOverlay {
  private pins: Map<string, HTMLElement> = new Map();
  private overlay: HTMLElement;

  constructor() {
    this.overlay = this.createOverlay();
    document.body.appendChild(this.overlay);
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'interject-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    return overlay;
  }

  addPin(bounds: DOMRect, comment: InterjectComment): void {
    const pin = document.createElement('div');
    pin.id = `interject-pin-${comment.id}`;
    pin.style.cssText = `
      position: absolute;
      left: ${bounds.left + bounds.width}px;
      top: ${bounds.top}px;
      width: 24px;
      height: 24px;
      background: #f59e0b;
      border: 2px solid #ffffff;
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      animation: bounce 0.5s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
    `;
    pin.textContent = '!';
    pin.title = comment.comment;

    pin.addEventListener('click', () => {
      this.showCommentPopup(comment);
    });

    this.pins.set(comment.id, pin);
    this.overlay.appendChild(pin);
  }

  updatePin(commentId: string, status: InterjectComment['status']): void {
    const pin = this.pins.get(commentId);
    if (!pin) return;

    const colors = {
      pending: '#f59e0b',
      addressed: '#10b981',
      dismissed: '#6b7280'
    };

    pin.style.background = colors[status];
  }

  clearPins(_windowId: string): void {
    // Simple implementation - remove all pins
    // In a real implementation, we'd track pins by window ID
    for (const [commentId, pin] of this.pins) {
      pin.remove();
      this.pins.delete(commentId);
    }
  }

  private showCommentPopup(comment: InterjectComment): void {
    // Simple popup - in a real implementation, this would be a proper modal
    alert(`Interject Comment:\n\n${comment.comment}\n\nStatus: ${comment.status}`);
  }

  destroy(): void {
    this.overlay.remove();
    this.pins.clear();
  }
}
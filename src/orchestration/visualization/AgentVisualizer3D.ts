import * as THREE from 'three';
import type { SpecializedAgent, AgentType } from '@/types';

/**
 * 3D visualization system for agent orchestration
 * Shows agents as spheres in 3D space with real-time communication visualization
 */
export class AgentVisualizer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private agentMeshes: Map<string, THREE.Mesh> = new Map();
  private connectionLines: THREE.Line[] = [];
  private particles: THREE.Points[] = [];
  private container: HTMLElement;
  private animationId?: number;
  private isRunning = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    
    // Set up camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      container.clientWidth / container.clientHeight,
      0.1, 
      1000
    );

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0.1);
    container.appendChild(this.renderer.domElement);

    this.setupScene();
    this.setupEventListeners();
  }

  /**
   * Initialize the 3D scene
   */
  private setupScene(): void {
    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);

    // Add point light for dramatic effect
    const pointLight = new THREE.PointLight(0x00ff88, 1, 100);
    pointLight.position.set(0, 20, 10);
    this.scene.add(pointLight);

    // Set camera position
    this.camera.position.set(30, 20, 30);
    this.camera.lookAt(0, 0, 0);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(50, 25, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(20);
    this.scene.add(axesHelper);

    // Add background stars
    this.addStarField();
  }

  /**
   * Add a starfield background
   */
  private addStarField(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 200;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }

  /**
   * Set up event listeners for responsiveness
   */
  private setupEventListeners(): void {
    const resizeObserver = new ResizeObserver(() => {
      this.onWindowResize();
    });
    resizeObserver.observe(this.container);

    // Add mouse controls for camera
    this.addMouseControls();
  }

  /**
   * Add simple mouse controls for camera rotation
   */
  private addMouseControls(): void {
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (event) => {
      mouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    canvas.addEventListener('mouseup', () => {
      mouseDown = false;
    });

    canvas.addEventListener('mousemove', (event) => {
      if (!mouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      // Rotate camera around center
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(this.camera.position);
      
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      this.camera.position.setFromSpherical(spherical);
      this.camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    // Add scroll for zoom
    canvas.addEventListener('wheel', (event) => {
      const distance = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
      const zoomSpeed = distance * 0.1;
      
      if (event.deltaY > 0) {
        this.camera.position.multiplyScalar(1 + zoomSpeed * 0.01);
      } else {
        this.camera.position.multiplyScalar(1 - zoomSpeed * 0.01);
      }
      
      // Limit zoom
      const newDistance = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
      if (newDistance < 10) {
        this.camera.position.normalize().multiplyScalar(10);
      } else if (newDistance > 100) {
        this.camera.position.normalize().multiplyScalar(100);
      }
    });
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Start the visualization
   */
  startVisualization(agents: SpecializedAgent[]): void {
    console.log(`🎬 Starting 3D visualization for ${agents.length} agents`);
    
    this.isRunning = true;
    
    // Add all agents to the scene
    agents.forEach(agent => this.addAgent(agent));
    
    // Start animation loop
    this.animate();
  }

  /**
   * Add an agent to the 3D scene
   */
  addAgent(agent: SpecializedAgent): void {
    console.log(`🎭 Adding agent ${agent.name} to 3D scene`);

    // Create agent sphere
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: this.getAgentColor(agent.type),
      emissive: this.getAgentColor(agent.type),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position agent in 3D space based on type and ID
    const position = this.calculateAgentPosition(agent);
    mesh.position.set(position.x, position.y, position.z);

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.getAgentColor(agent.type),
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glowMesh);

    // Add label
    const label = this.createAgentLabel(agent);
    if (label) {
      mesh.add(label);
    }

    this.scene.add(mesh);
    this.agentMeshes.set(agent.id, mesh);

    // Animate entry
    this.animateAgentEntry(mesh);
  }

  /**
   * Get color for agent type
   */
  private getAgentColor(agentType: AgentType): number {
    const colors = {
      'frontend-architect': 0x00ff88,    // Green
      'backend-engineer': 0x0088ff,     // Blue  
      'database-designer': 0xff8800,    // Orange
      'devops-specialist': 0x8800ff,    // Purple
      'security-auditor': 0xff0088,     // Pink
      'performance-optimizer': 0x88ff00, // Lime
      'documentation-writer': 0x00ffff, // Cyan
      'testing-specialist': 0xffff00,   // Yellow
      'ui-ux-designer': 0xff4488,       // Rose
      'api-designer': 0x4488ff          // Light Blue
    };
    return colors[agentType] || 0xffffff;
  }

  /**
   * Calculate position for an agent in 3D space
   */
  private calculateAgentPosition(_agent: SpecializedAgent): THREE.Vector3 {
    // Arrange agents in a spiral pattern
    const agentIndex = Array.from(this.agentMeshes.keys()).length;
    const radius = 15;
    const heightVariation = 5;
    
    const angle = (agentIndex / 5) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.sin(agentIndex * 0.7) * heightVariation) + 2;

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Create a text label for an agent
   */
  private createAgentLabel(agent: SpecializedAgent): THREE.Sprite | null {
    try {
      // Create canvas for text
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;

      canvas.width = 256;
      canvas.height = 64;

      // Draw text
      context.fillStyle = '#ffffff';
      context.font = '16px Arial';
      context.textAlign = 'center';
      context.fillText(agent.name, 128, 32);
      context.fillText(agent.type, 128, 48);

      // Create texture and sprite
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      
      sprite.scale.set(8, 2, 1);
      sprite.position.set(0, 3, 0);

      return sprite;
    } catch (error) {
      console.warn('Failed to create agent label:', error);
      return null;
    }
  }

  /**
   * Animate agent entry
   */
  private animateAgentEntry(mesh: THREE.Mesh): void {
    // Start small and grow
    mesh.scale.set(0.1, 0.1, 0.1);
    
    const startTime = Date.now();
    const duration = 1000;

    const animateScale = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out animation
      const scale = progress * progress * (3 - 2 * progress);
      mesh.scale.set(scale, scale, scale);

      if (progress < 1) {
        requestAnimationFrame(animateScale);
      }
    };

    animateScale();
  }

  /**
   * Show communication between agents
   */
  showCommunication(fromAgentId: string, toAgentId: string, messageType: string): void {
    const fromMesh = this.agentMeshes.get(fromAgentId);
    const toMesh = this.agentMeshes.get(toAgentId);

    if (!fromMesh || !toMesh) return;

    // Create animated particle
    const particle = this.createMessageParticle(messageType);
    particle.position.copy(fromMesh.position);
    this.scene.add(particle);

    // Animate particle from source to destination
    const duration = 2000;
    const startTime = Date.now();

    const animateParticle = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Create curved path
      const start = fromMesh.position;
      const end = toMesh.position;
      const midPoint = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5);
      midPoint.y += 5; // Arc height

      // Quadratic bezier curve
      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
      particle.position.copy(curve.getPoint(progress));

      // Fade out towards end
      if (particle.material instanceof THREE.Material) {
        (particle.material as any).opacity = 1 - progress;
      }

      if (progress < 1) {
        requestAnimationFrame(animateParticle);
      } else {
        this.scene.remove(particle);
        this.pulseAgent(toAgentId);
      }
    };

    animateParticle();
  }

  /**
   * Create a message particle
   */
  private createMessageParticle(messageType: string): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const color = this.getMessageColor(messageType);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8
    });

    const particle = new THREE.Mesh(geometry, material);
    this.particles.push(particle as any); // Type assertion for simplicity
    return particle;
  }

  /**
   * Get color for message type
   */
  private getMessageColor(messageType: string): number {
    const colors = {
      'task-handoff': 0x00ff00,
      'file-update': 0x0088ff,
      'help-request': 0xff8800,
      'progress-update': 0xffff00,
      'error': 0xff0000
    };
    return colors[messageType as keyof typeof colors] || 0xffffff;
  }

  /**
   * Pulse an agent to show activity
   */
  private pulseAgent(agentId: string): void {
    const mesh = this.agentMeshes.get(agentId);
    if (!mesh) return;

    const originalScale = mesh.scale.clone();
    const startTime = Date.now();
    const duration = 500;

    const pulse = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress <= 0.5) {
        // Scale up
        const scale = 1 + (progress * 0.4);
        mesh.scale.copy(originalScale).multiplyScalar(scale);
      } else {
        // Scale down
        const scale = 1 + ((1 - progress) * 0.4);
        mesh.scale.copy(originalScale).multiplyScalar(scale);
      }

      if (progress < 1) {
        requestAnimationFrame(pulse);
      } else {
        mesh.scale.copy(originalScale);
      }
    };

    pulse();
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: {
    status: string;
    progress: number;
    currentTask?: string;
  }): void {
    const mesh = this.agentMeshes.get(agentId);
    if (!mesh) return;

    // Update color based on status
    const material = mesh.material as THREE.MeshPhongMaterial;
    
    switch (status.status) {
      case 'working':
        material.emissiveIntensity = 0.3;
        break;
      case 'idle':
        material.emissiveIntensity = 0.1;
        break;
      case 'error':
        material.color.setHex(0xff0000);
        material.emissiveIntensity = 0.5;
        break;
      default:
        material.emissiveIntensity = 0.2;
    }
  }

  /**
   * Main animation loop
   */
  private animate(): void {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    // Rotate agents slightly
    this.agentMeshes.forEach((mesh) => {
      mesh.rotation.y += 0.005;
      mesh.rotation.x += 0.002;
    });

    // Update camera for slight movement
    const time = Date.now() * 0.0005;
    this.camera.position.x += Math.sin(time) * 0.02;
    this.camera.position.z += Math.cos(time) * 0.02;
    this.camera.lookAt(0, 0, 0);

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Remove an agent from the scene
   */
  removeAgent(agentId: string): void {
    const mesh = this.agentMeshes.get(agentId);
    if (mesh) {
      this.scene.remove(mesh);
      this.agentMeshes.delete(agentId);
    }
  }

  /**
   * Get visualization statistics
   */
  getStats() {
    return {
      activeAgents: this.agentMeshes.size,
      activeParticles: this.particles.length,
      isRunning: this.isRunning,
      sceneObjects: this.scene.children.length
    };
  }

  /**
   * Stop the visualization
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Clean up scene
    this.agentMeshes.clear();
    this.particles.forEach(particle => this.scene.remove(particle));
    this.particles.length = 0;
    this.connectionLines.forEach(line => this.scene.remove(line));
    this.connectionLines.length = 0;

    // Remove renderer from DOM
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }

    console.log('🛑 3D visualization stopped');
  }
}
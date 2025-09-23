/*MIT License

Copyright (c) 2025 Michael Bilstein (https://github.com/Meegul)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

class Particle {
  constructor(x = 0, y = 0, dx = 0, dy = 0, mass = 1, color = "#FFFFFF", density = 1, terminalVelocity = 100000) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.mass = mass;
    this.color = color;
    this.density = density;
    this.terminalVelocity = terminalVelocity;
  }
  //Apply a force to this particle, given a unit vector <x,y> and a force
  applyForce(x, y, force) {
    this.dx += x * force / this.mass;
    this.dy += y * force / this.mass;
    const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    if (speed > this.terminalVelocity) {
      this.dx *= this.terminalVelocity / speed;
      this.dy *= this.terminalVelocity / speed;
    }
  }
  //Update the location of the particle, based on the current velocity vector
  move() {
    this.x += this.dx;
    this.y += this.dy;
  }
}

class Particles {
  //The constructor. Must receive an object with parameters.
  //A canvas object must be supplied either in the object or as a second parameter.
  constructor(paramsObject, domObject) {
    //Make sure we got a domObject
    if (!paramsObject.domObject)
      paramsObject.domObject = domObject;
    if (!paramsObject.domObject) {
      throw new Error("Missing dom object");
    }
    this.domObject = paramsObject.domObject; //The canvas
    this.interactive = paramsObject.interactive || false; //Whether to track mouse interactions
    this.repel = paramsObject.repel || false; //Whether to have the mouse repel particles
    if (this.repel && !this.interactive) {
      console.log("You specified to have particles replled by the mouse without interactivity");
    }
    this.clickToAdd = paramsObject.clickToAdd || false; //Whether clicking should create a new particle
    if (this.clickToAdd && !this.interactive) {
      console.log("You specified to be able to click to add particles, but without interactivity enabled");
    }
    this.gravity = paramsObject.gravity || false; //Whether particles attract one another
    this.falling = paramsObject.falling || false; //Whether particles should fall downards
    this.walled = paramsObject.walled || false; //Whether there are walls
    this.teleportWalls = paramsObject.teleportWalls || false; //Whether walls teleport particles to the opposite side
    if (this.teleportWalls && !this.walled) {
      console.log("You specified to have teleportWalls but without walls; therefore, particles will never teleport");
    }
    this.terminalVelocity = (paramsObject.terminalVelocity) ? paramsObject.terminalVelocity : 10000;
    this.particleColor = (paramsObject.particleColor) ? paramsObject.particleColor : undefined;
    this.particles = (paramsObject.particles) ? paramsObject.particles : [];
    this.connected = paramsObject.connected || false;
    this.latticeDistance = (paramsObject.latticeDistance) ? paramsObject.latticeDistance : 250;
    this.latticeWidth = (paramsObject.latticeWidth) ? paramsObject.latticeWidth : 5;

    this.debug = paramsObject.debug || false; //Debug mode
    this.frameTime = paramsObject.frameTime || false; //Frame-time overlay
    this.linesDrawn = 0; //Number of lines drawn in a single frame, used for frame-time overlay.
    this.clickPos = undefined;
    this.mousePos = {
      x: 0,
      y: 0,
    };
    this.random = paramsObject.random;
    this.clicked = false;
    this.timeClicked = undefined;
    this.webgpuReady = false;

    //Initialize the canvas dimensions, adjusting for dpi
    this.domObject.width = this.domObject.offsetWidth * window.devicePixelRatio;
    this.domObject.height = this.domObject.offsetHeight * window.devicePixelRatio;

    if (paramsObject.backgroundColor)
      this.domObject.style.background = paramsObject.backgroundColor;
    this.domObject.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.domObject.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.domObject.addEventListener("mouseup", this.handleMouseUp.bind(this));
    
    // Initialize WebGPU
    this.initWebGPU().then(() => {
      this.webgpuReady = true;
    //If the user specified to create some random particles
    if (paramsObject.random)
      this.randomize(paramsObject.random);
    }).catch(error => {
      console.error('Failed to initialize WebGPU:', error);
    });
  }

  // Initialize WebGPU
  async initWebGPU() {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported on this browser');
    }

    // Request adapter
    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) {
      throw new Error('Failed to get WebGPU adapter');
    }

    // Request device
    this.device = await this.adapter.requestDevice();
    if (!this.device) {
      throw new Error('Failed to get WebGPU device');
    }

    // Get canvas context
    this.context = this.domObject.getContext('webgpu');
    if (!this.context) {
      throw new Error('Failed to get WebGPU context');
    }

    // Configure canvas
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.canvasFormat,
      alphaMode: 'opaque'
    });

    // Create shaders
    this.createShaders();
    
    // Create render pipelines
    this.createRenderPipelines();
    
    // Create buffers
    this.createBuffers();
    
    // Add resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  // Handle canvas resize
  handleResize() {
    if (!this.device || !this.context) return;
    
    // Update canvas dimensions
    this.domObject.width = this.domObject.offsetWidth * window.devicePixelRatio;
    this.domObject.height = this.domObject.offsetHeight * window.devicePixelRatio;
    
    // Reconfigure WebGPU context
    this.context.configure({
      device: this.device,
      format: this.canvasFormat,
      alphaMode: 'opaque'
    });
  }

  // Create vertex and fragment shaders
  createShaders() {
    // Particle vertex shader
    this.particleVertexShader = this.device.createShaderModule({
      code: `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) color: vec4f,
        }

        struct ParticleData {
          position: vec2f,
          color: vec4f,
          radius: f32,
        }

        @group(0) @binding(0) var<uniform> uniforms: ParticleData;

        @vertex
        fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          var output: VertexOutput;
          
          // Create a fixed-size quad for testing
          let positions = array<vec2f, 4>(
            vec2f(-0.1, -0.1),
            vec2f( 0.1, -0.1),
            vec2f(-0.1,  0.1),
            vec2f( 0.1,  0.1)
          );
          
          let pos = positions[vertexIndex];
          output.position = vec4f(pos + uniforms.position, 0.0, 1.0);
          output.color = uniforms.color;
          
          return output;
        }
      `
    });

    // Particle fragment shader
    this.particleFragmentShader = this.device.createShaderModule({
      code: `
        @fragment
        fn fs_main(@location(0) color: vec4f) -> @location(0) vec4f {
          // Simple solid color - no discarding for now
          return color;
        }
      `
    });

    // Line vertex shader
    this.lineVertexShader = this.device.createShaderModule({
      code: `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(1) color: vec4f,
        }

        @vertex
        fn vs_main(@location(0) position: vec2f, @location(1) color: vec4f) -> VertexOutput {
          var output: VertexOutput;
          output.position = vec4f(position, 0.0, 1.0);
          output.color = color;
          return output;
        }
      `
    });

    // Line fragment shader
    this.lineFragmentShader = this.device.createShaderModule({
      code: `
        @fragment
        fn fs_main(@location(1) color: vec4f) -> @location(0) vec4f {
          // Debug: ensure alpha is being used
          return color;
        }
      `
    });
  }

  // Create render pipelines
  createRenderPipelines() {
    // Particle render pipeline
    this.particlePipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.particleVertexShader,
        entryPoint: 'vs_main'
      },
      fragment: {
        module: this.particleFragmentShader,
        entryPoint: 'fs_main',
        targets: [{
          format: this.canvasFormat,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            }
          }
        }]
      },
      primitive: {
        topology: 'triangle-strip'
      }
    });

    // Line render pipeline
    this.linePipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.lineVertexShader,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 24, // 6 floats * 4 bytes
          attributes: [
            {
              format: 'float32x2',
              offset: 0,
              shaderLocation: 0
            },
            {
              format: 'float32x4',
              offset: 8,
              shaderLocation: 1
            }
          ]
        }]
      },
      fragment: {
        module: this.lineFragmentShader,
        entryPoint: 'fs_main',
        targets: [{
          format: this.canvasFormat,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            }
          }
        }]
      },
      primitive: {
        topology: 'line-list',
        stripIndexFormat: undefined
      }
    });

    // Triangle render pipeline for filled particles
    this.trianglePipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.lineVertexShader, // Reuse line vertex shader
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 24, // 6 floats * 4 bytes
          attributes: [
            {
              format: 'float32x2',
              offset: 0,
              shaderLocation: 0
            },
            {
              format: 'float32x4',
              offset: 8,
              shaderLocation: 1
            }
          ]
        }]
      },
      fragment: {
        module: this.lineFragmentShader, // Reuse line fragment shader
        entryPoint: 'fs_main',
        targets: [{
          format: this.canvasFormat,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            }
          }
        }]
      },
      primitive: {
        topology: 'triangle-list'
      }
    });
  }

  // Create GPU buffers
  createBuffers() {
    // Create uniform buffer for particle data
    this.particleUniformBuffer = this.device.createBuffer({
      size: 48, // vec2f position (8) + vec4f color (16) + f32 radius (4) + padding (20)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Create vertex buffer for lines
    this.lineVertexBuffer = this.device.createBuffer({
      size: 1024 * 1024, // 1MB buffer for line vertices
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    // Create separate vertex buffer for particles
    this.particleVertexBuffer = this.device.createBuffer({
      size: 1024 * 1024, // 1MB buffer for particle vertices
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    // Create bind group for particle uniforms
    this.particleBindGroup = this.device.createBindGroup({
      layout: this.particlePipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: {
          buffer: this.particleUniformBuffer
        }
      }]
    });
  }

  //Handle physics, including gravity interactions
  doPhysics() {
    if (this.gravity) {
      const G = 0.1; //Gravitational Constant
      //Gravity
      for (var indexA = 0; indexA < this.particles.length; indexA++) {
        for (var indexB = indexA + 1; indexB < this.particles.length; indexB++) {
          var particleA = this.particles[indexA];
          var particleB = this.particles[indexB];
          var distance = distanceBetween(particleA, particleB);
          if (distance < 0.5)
            continue;
          var unitABx = (particleB.x - particleA.x) / distance;
          var unitABy = (particleB.y - particleA.y) / distance;
          var force = (G * particleA.mass * particleB.mass) / distance;
          particleA.applyForce(unitABx, unitABy, force);
          particleB.applyForce(unitABx * -1, unitABy * -1, force);
        }
      }
    }
    //Apply falling force
    if (this.falling) {
      let particle;
      for (var index = 0; index < this.particles.length; index++) {
        particle = this.particles[index];
        particle.applyForce(0, 1, particle.mass);
      }
    }
    //Repel, if necessary
    if (this.interactive && this.repel) {
      this.repelParticles();
    }
    //Make the moves
    this.particles.forEach((on) => on.move());
    //Bounce off walls
    if (this.walled) {
      let particle;
      let radius;
      for (var index = 0; index < this.particles.length; index++) {
        particle = this.particles[index];
        //If we should go through the walls to the other side
        if (this.teleportWalls) {
          if (particle.y < 0) {
            particle.y = this.domObject.height;
          }
          if (particle.x < 0) {
            particle.x = this.domObject.width;
          }
          if (particle.y > this.domObject.height) {
            particle.y = 0;
          }
          if (particle.x > this.domObject.width) {
            particle.x = 0;
          }
        } else { //Else just bounce off the walls
          // Use same screen-size-aware scaling as rendering
          const baseReferenceSize = 1080;
          const currentMinSize = Math.min(this.domObject.width, this.domObject.height);
          const scaleFactor = currentMinSize / baseReferenceSize;
          radius = particle.mass * 10 / particle.density * 4 * scaleFactor; // Scale up particle size by 4x with screen scaling
          if (particle.y - radius < 0) {
            particle.y = radius;
            particle.dy = -particle.dy;
          }
          if (particle.x - radius < 0) {
            particle.x = radius;
            particle.dx = -particle.dx;
          }
          if (particle.x + radius > this.domObject.width) {
            particle.x = this.domObject.width - radius;
            particle.dx = -particle.dx;
          }
          if (particle.y + radius > this.domObject.height) {
            particle.y = this.domObject.height - radius;
            particle.dy = -particle.dy;
          }
        }
      }
    }
  }
  repelParticles() {
    if (this.interactive && this.repel) {
      let particle, distance, force, unitX, unitY;
      for (var index = 0; index < this.particles.length; index++) {
        particle = this.particles[index];
        distance = distanceBetween(particle, this.mousePos);
        if (distance < 250) {
          unitX = (particle.x - this.mousePos.x) / distance;
          unitY = (particle.y - this.mousePos.y) / distance;
          force = 100 / distance;
          particle.applyForce(unitX, unitY, force);
        }
      }
    }
  }
  //The primary render logic
  render() {
    // Check if WebGPU is initialized
    if (!this.webgpuReady || !this.context || !this.device) {
      return;
    }

    // Get the current texture from the canvas
    const texture = this.context.getCurrentTexture();
    const encoder = this.device.createCommandEncoder();
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: texture.createView(),
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });

    this.linesDrawn = 0;

    // Draw all particles first
    this.renderParticles(renderPass);

    // Draw lattice lines if specified (after particles)
    if (this.connected) {
      this.renderLattice(renderPass);
    }

    // Draw interactive elements
    if (this.interactive && this.clicked && this.clickToAdd) {
      this.renderInteractiveElements(renderPass);
    }

    // Draw debug cursor
    if (this.debug && this.interactive) {
      this.renderDebugCursor(renderPass);
    }

    renderPass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  // Render lattice connections between particles
  renderLattice(renderPass) {
    const lineVertices = [];
    
    // Calculate line width in normalized device coordinates
    const baseReferenceSize = 1080;
    const currentMinSize = Math.min(this.domObject.width, this.domObject.height);
    const scaleFactor = currentMinSize / baseReferenceSize;
    const lineWidthNDC = (this.latticeWidth * scaleFactor) / baseReferenceSize;
    
    for (let indexA = 0; indexA < this.particles.length; indexA++) {
      const particleA = this.particles[indexA];
      for (let indexB = indexA + 1; indexB < this.particles.length; indexB++) {
        const particleB = this.particles[indexB];
        const distance = distanceBetween(particleA, particleB);
          if (distance < this.latticeDistance) {
            this.linesDrawn++;
          const alpha = 1 - (distance / this.latticeDistance);
          
          // Convert coordinates to normalized device coordinates
          const x1 = (particleA.x / this.domObject.width) * 2 - 1;
          const y1 = 1 - (particleA.y / this.domObject.height) * 2;
          const x2 = (particleB.x / this.domObject.width) * 2 - 1;
          const y2 = 1 - (particleB.y / this.domObject.height) * 2;
          
          // Create thick line using two triangles (quad)
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          if (length > 0) {
            // Calculate perpendicular vector for line width
            const perpX = -dy / length * lineWidthNDC / 2;
            const perpY = dx / length * lineWidthNDC / 2;
            
            // Create quad vertices (two triangles)
            lineVertices.push(
              // First triangle
              x1 + perpX, y1 + perpY, 1.0, 1.0, 1.0, alpha, // top-left
              x1 - perpX, y1 - perpY, 1.0, 1.0, 1.0, alpha, // bottom-left
              x2 + perpX, y2 + perpY, 1.0, 1.0, 1.0, alpha, // top-right
              
              // Second triangle
              x2 + perpX, y2 + perpY, 1.0, 1.0, 1.0, alpha, // top-right
              x1 - perpX, y1 - perpY, 1.0, 1.0, 1.0, alpha, // bottom-left
              x2 - perpX, y2 - perpY, 1.0, 1.0, 1.0, alpha  // bottom-right
            );
          }
        }
      }
    }

    if (lineVertices.length > 0) {
      // Upload line vertices to GPU
      const vertexData = new Float32Array(lineVertices);
      this.device.queue.writeBuffer(this.lineVertexBuffer, 0, vertexData);

      renderPass.setPipeline(this.trianglePipeline); // Use triangle pipeline for thick lines
      renderPass.setVertexBuffer(0, this.lineVertexBuffer);
      renderPass.draw(lineVertices.length / 6, 1, 0, 0);
    }
  }

  // Render all particles as small line segments
  renderParticles(renderPass) {
    if (this.particles.length === 0) return;
    
    // Create line vertices for all particles
    const particleLines = [];
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Convert coordinates to normalized device coordinates
      const x = (particle.x / this.domObject.width) * 2 - 1;
      const y = 1 - (particle.y / this.domObject.height) * 2;
      
      // Convert color to normalized values
      const color = this.parseColor(particle.color);
      
      // Use the particle's actual color
      
      // Calculate radius based on mass and density
      const area = particle.mass / particle.density;
      const radius = Math.sqrt(area / Math.PI) * 4; // Scale up particle size by 4x
      
      // Convert radius to normalized device coordinates, accounting for aspect ratio
      const aspectRatio = this.domObject.width / this.domObject.height;
      // Use a base reference size (1080p height) for consistent particle sizing across different resolutions
      const baseReferenceSize = 1080;
      const currentMinSize = Math.min(this.domObject.width, this.domObject.height);
      const scaleFactor = currentMinSize / baseReferenceSize;
      const radiusNDC = radius / baseReferenceSize * scaleFactor;
      
      // Scale radius components to maintain circular shape
      // For wide screens (aspectRatio > 1), scale Y more
      // For tall screens (aspectRatio < 1), scale X more
      const radiusX = radiusNDC;
      const radiusY = radiusNDC * aspectRatio;
      
      // Create a filled circle using triangles (fan from center)
      const segments = 16; // Number of triangles to approximate circle
      const angleStep = (2 * Math.PI) / segments;
      
      for (let j = 0; j < segments; j++) {
        const angle1 = j * angleStep;
        const angle2 = (j + 1) * angleStep;
        
        const x1 = x + Math.cos(angle1) * radiusX;
        const y1 = y + Math.sin(angle1) * radiusY;
        const x2 = x + Math.cos(angle2) * radiusX;
        const y2 = y + Math.sin(angle2) * radiusY;
        
        // Create triangle: center -> edge1 -> edge2
        particleLines.push(
          // Center vertex
          x, y, color.r, color.g, color.b, color.a,
          // First edge vertex
          x1, y1, color.r, color.g, color.b, color.a,
          // Second edge vertex
          x2, y2, color.r, color.g, color.b, color.a
        );
      }
    }
    
    if (particleLines.length > 0) {
      // Upload particle vertices to GPU using separate buffer
      const vertexData = new Float32Array(particleLines);
      this.device.queue.writeBuffer(this.particleVertexBuffer, 0, vertexData);
      
      renderPass.setPipeline(this.trianglePipeline);
      renderPass.setVertexBuffer(0, this.particleVertexBuffer);
      renderPass.draw(particleLines.length / 6, 1, 0, 0);
      
    }
  }

  // Render interactive elements (click preview)
  renderInteractiveElements(renderPass) {
    if (this.clicked && this.clickToAdd) {
      // Draw line from click to mouse
      const x1 = (this.clickPos.x / this.domObject.width) * 2 - 1;
      const y1 = 1 - (this.clickPos.y / this.domObject.height) * 2;
      const x2 = (this.mousePos.x / this.domObject.width) * 2 - 1;
      const y2 = 1 - (this.mousePos.y / this.domObject.height) * 2;

      const lineVertices = new Float32Array([
        x1, y1, 1.0, 1.0, 1.0, 1.0, // position + white color
        x2, y2, 1.0, 1.0, 1.0, 1.0  // position + white color
      ]);

      this.device.queue.writeBuffer(this.lineVertexBuffer, 0, lineVertices);
      renderPass.setPipeline(this.linePipeline);
      renderPass.setVertexBuffer(0, this.lineVertexBuffer);
      renderPass.draw(2, 1, 0, 0);

      // Draw growing circle at click position
      const radius = (new Date().getTime() - this.timeClicked) / 50 / Math.min(this.domObject.width, this.domObject.height) * 2;
      const particleData = new Float32Array([
        x1, y1,                    // position (8 bytes)
        1.0, 1.0, 1.0, 1.0,      // white color (16 bytes)
        radius, 0, 0, 0, 0, 0     // radius + padding (24 bytes total = 48 bytes)
      ]);
      this.device.queue.writeBuffer(this.particleUniformBuffer, 0, particleData);
      renderPass.setPipeline(this.particlePipeline);
      renderPass.setBindGroup(0, this.particleBindGroup);
      renderPass.draw(4, 1, 0, 0);
    }
  }

  // Render debug cursor
  renderDebugCursor(renderPass) {
    const x = (this.mousePos.x / this.domObject.width) * 2 - 1;
    const y = 1 - (this.mousePos.y / this.domObject.height) * 2;
    const radius = 5 / Math.min(this.domObject.width, this.domObject.height) * 2;

    const particleData = new Float32Array([
      x, y,                       // position (8 bytes)
      0.0, 0.0, 0.0, 1.0,        // black color (16 bytes)
      radius, 0, 0, 0, 0, 0       // radius + padding (24 bytes total = 48 bytes)
    ]);
    this.device.queue.writeBuffer(this.particleUniformBuffer, 0, particleData);
    renderPass.setPipeline(this.particlePipeline);
    renderPass.setBindGroup(0, this.particleBindGroup);
    renderPass.draw(4, 1, 0, 0);
  }

  // Parse color string to normalized RGBA values
  parseColor(colorStr) {
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      return { r, g, b, a: 1.0 };
    } else if (colorStr.startsWith('rgb')) {
      const matches = colorStr.match(/\d+/g);
      if (matches) {
        return {
          r: parseInt(matches[0]) / 255,
          g: parseInt(matches[1]) / 255,
          b: parseInt(matches[2]) / 255,
          a: 1.0
        };
      }
    } else if (colorStr.startsWith('rgba')) {
      const matches = colorStr.match(/[\d.]+/g);
      if (matches) {
        return {
          r: parseFloat(matches[0]) / 255,
          g: parseFloat(matches[1]) / 255,
          b: parseFloat(matches[2]) / 255,
          a: parseFloat(matches[3])
        };
      }
    }
    // Default to white
    return { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
  }
  //The primary loop. Does physics, rendering, and calls itself every frame, all only if running
  run() {
    if (this.running) {
      let physicsStart, physicsEnd, renderEnd;
      if (this.frameTime)
        physicsStart = new Date().getTime();
      this.doPhysics();
      if (this.frameTime)
        physicsEnd = new Date().getTime();
      this.render();
      if (this.frameTime) {
        renderEnd = new Date().getTime();
        // Note: Frame time overlay would need to be implemented with WebGPU text rendering
        // For now, we'll just log to console
        console.log(`Physics:${physicsEnd - physicsStart}ms, Render:${renderEnd - physicsEnd}ms, Particles:${this.particles.length}, Lines Drawn:${this.linesDrawn}`);
      }
      requestAnimationFrame(this.run.bind(this));
    }
  }
  //Start
  start() {
    if (!this.running) {
      this.running = true;
      // Only start the render loop if WebGPU is ready
      if (this.webgpuReady) {
        this.run();
      } else {
        // Wait for WebGPU to be ready
        const checkWebGPU = () => {
          if (this.webgpuReady) {
      this.run();
          } else {
            requestAnimationFrame(checkWebGPU);
          }
        };
        checkWebGPU();
      }
    }
  }
  //Replace the particles with the new ones
  setParticles(newArr) {
    this.particles = newArr;
  }
  //Append the new particles
  addParticles(newParticles) {
    this.particles = this.particles.concat(newParticles);
  }
  //Toggle pause
  togglePause() {
    if (this.running) {
      this.running = false;
    } else {
      this.running = true;
      this.run();
    }
  }
  //Toggle interactivity
  toggleInteractivity() {
    this.interactive = !this.interactive;
  }
  //Stop
  stop() {
    this.running = false;
  }
  //Toggle debug mode
  toggleDebug() {
    this.debug = !this.debug;
  }
  //Toggle the frame time overlay
  toggleFrameTime() {
    this.frameTime = !this.frameTime;
  }
  //Keep track of clicks, if interactive
  handleMouseDown(event) {
    if (this.interactive) {
      this.clickPos = getMousePos(this.domObject, event);
      this.clicked = true;
      this.timeClicked = new Date().getTime();
    }
  }
  //Add a particle after a click, if interactive
  handleMouseUp() {
    if (this.interactive) {
      this.clicked = false;
      if (this.clickToAdd) {
        const mass = (new Date().getTime() - this.timeClicked) / 500;
        const dx = (this.mousePos.x - this.clickPos.x) / 500;
        const dy = (this.mousePos.y - this.clickPos.y) / 500;
        const newParticle = new Particle(this.clickPos.x, this.clickPos.y, dx, dy, mass, this.particleColor, 1, this.terminalVelocity);
        this.addParticles([newParticle]);
      }
    }
  }
  //Keep track of the mouse location on the canvas
  handleMouseMove(event) {
    if (this.interactive) {
      this.mousePos = getMousePos(this.domObject, event);
    }
  }
  //Get rid of all particles
  clear() {
    this.particles = [];
  }
  //Add some new particles, given some options
  randomize(options) {
    if (!options) {
      this.randomize({});
      return;
    }
    //How many new particles to generate. Default 10.
    const number = (options.number) ? options.number : 10;

    //Whether the randomization should clear old particles before adding new ones. Default false.
    const clear = options.clear || false;

    //Minimum mass of a particle. Default 1.
    const minMass = (options.minMass) ? options.minMass : 1;
    //Maximum mass of a particle. Default 5.
    const maxMass = (options.maxMass) ? options.maxMass : 5;

    //Minimum Dx. Default -1.
    const minDx = (options.minDx) ? options.minDx : -1;
    //Maximum Dx. Default 1.
    const maxDx = (options.maxDx) ? options.maxDx : 1;
    //Minimum Dy. Default -1.
    const minDy = (options.minDy) ? options.minDy : -1;
    //Maximum Dy. Default 1.
    const maxDy = (options.maxDy) ? options.maxDy : 1;

    //Color of random particles. Defaults to object's particleColor, and if that's not there, defaults to a random color.
    const newColor = (options.color) ? options.color : this.particleColor;
    const newParticles = [];
    for (var x = 0; x < number; x++) {
      const randx = Math.random() * this.domObject.width;
      const randy = Math.random() * this.domObject.height;
      const randdx = Math.random() * (maxDx - minDx) + minDx;
      const randdy = Math.random() * (maxDy - minDy) + minDy;
      const randMass = Math.random() * (maxMass - minMass) + minMass;
      let color;
      if (!newColor) {
        const r = parseInt(Math.random() * 255);
        const g = parseInt(Math.random() * 255);
        const b = parseInt(Math.random() * 255);
        color = `rgb(${r},${g},${b})`;
      } else {
        color = newColor;
      }
      newParticles[x] = new Particle(randx, randy, randdx, randdy, randMass, color, 1, this.terminalVelocity);
    }
    //Remove all other particles before adding, if specified.
    if (clear) {
      this.clear();
    }
    this.addParticles(newParticles);
  }

  exportConfigs() {
    const outputConfig = {
      walled: this.walled,
      teleportWalls: this.teleportWalls,
      gravity: this.gravity,
      falling: this.falling,
      particleColor: this.particleColor,
      terminalVelocity: this.terminalVelocity,
      connected: this.connected,
      latticeDistance: this.latticeDistance,
      latticeWidth: this.latticeWidth,
      interactive: this.interactive,
      clickToAdd: this.clickToAdd,
      repel: this.repel,
      random: this.random,
      debug: this.debug,
      frameTime: this.frameTime,
    };
    return outputConfig;
  }

  //Some default configs that can be used
  static configs() {
    return {
      snow: {
        walled: true,
        particleColor: "rgba(255,255,255,0.8)",
        terminalVelocity: 5,
        random: {
          number: 100,
          maxMass: 2,
        },
        falling: true,
        teleportWalls: true,
      },
      solarSystem: {
        walled: false,
        gravity: true,
        falling: false,
        teleportWalls: false,
        backgroundColor: "rgba(0,0,0,1)",
        terminalVelocity: 10000,
        particles: [
          new Particle(1250, 700, 0, 0, 1, "#FFFF00", 0.25),
          new Particle(1250, 600, 0.319, 0, 0.0553/332946, "#666666", 1/332946/10),
          new Particle(1250, 550, 0.318, 0, 0.815/332946, "#FF6666", 1/332946),
          new Particle(1250, 500, 0.317, 0, 1/332946, "#00FF00", 1/332946),
          new Particle(1250, 425, 0.316, 0, 0.107/332946, "#FF0000", 1/332946/5),
          new Particle(1250, 300, 0.313, 0, 317.8/332946, "#997711", 1/332946*200),
          new Particle(1250, 100, 0.3125, 0, 95.2/332946, "#AA7711", 1/332946*75)
        ],
      },
      blackHole: {
        walled: false,
        gravity: true,
        falling: false,
        teleportWalls: false,
        interactive: true,
        clickToAdd: true,
        backgroundColor: "rgb(0,0,0)",
        terminalVelocity: 10000,
        particles: [
          new Particle(500, 0, 3, 0),
          new Particle(500, 500, 0, 0, 500, "#333", 500),
        ],
      },
      lattice: {
        walled: true,
        gravity: false,
        falling: false,
        teleportWalls: true,
        interactive: true,
        repel: true,
        latticeDistance: 400,
        latticeWidth: 1,
        clickToAdd: false,
        particleColor: "rgb(255,255,255)",
        connected: true,
        terminalVelocity: 0.5,
        random: {
          number: 75,
          minMass: 0.5,
          maxMass: 0.5,
          minDx: -0.5,
          maxDx: 0.5,
          minDy: -0.5,
          maxDy: 0.5,
        },
      },
    };
  }
}
//Calculate the positon of the mouse, given a canvas and mouse event
function getMousePos(domObject, event) {
  const rect = domObject.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * window.devicePixelRatio,
    y: (event.clientY - rect.top) * window.devicePixelRatio,
  };
}
//Basic distance formula. Math.pow/** is not used due to performance issues
function distanceBetween(a, b) {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

class AnimationMaker {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        // Drawing state
        this.isDrawing = false;
        this.currentTool = 'move';
        this.primaryColor = '#4f46e5';
        this.secondaryColor = '#ffffff';
        this.brushSize = 5;
        this.opacity = 1;
        this.fontSize = 24;
        this.fontFamily = 'Inter';

        // Animation state
        this.frames = [];         // Array of frames, each frame is an array of ImageData (layers)
        this.layerSettings = [];  // Array of frames, each frame is an array of {name, visible, opacity}
        this.currentFrame = 0;
        this.currentLayer = 0;
        this.isPlaying = false;
        this.playbackSpeed = 12;
        this.playInterval = null;

        // History
        this.history = [];
        this.historyStep = -1;
        this.clipboard = null;
        this.canvasBackup = null;

        // Drawing variables
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;

        // Transform state
        this.transformMode = null;
        this.transformStart = null;
        this.transformLayerImage = null;

        // Zoom state
        this.zoom = 1;
        this.zoomMin = 0.2;
        this.zoomMax = 5;
        this.zoomStep = 0.1;

        // Onion skin state
        this.onionSkinEnabled = true; // Show onion skin by default
        this.onionSkinPrev = 1; // Show 1 previous frame
        this.onionSkinNext = 1; // Show 1 next frame
        this.onionSkinAlpha = 0.3; // Opacity for onion skin

        this.selectedLayers = [0]; // Default to the first layer selected

        this.initProject();
        this.setupEventListeners();
        this.saveState();
    }

    // --- Project and Canvas Initialization ---
    initProject() {
        // Start with one frame and one layer
        this.frames = [];
        this.layerSettings = [];
        this.currentFrame = 0;
        this.currentLayer = 0;
        this.addFrame();
        this.updateLayersList();
        this.updateFramesTimeline();
        this.updateFrameDisplay();
        this.redrawCanvas();
        this.overlayCanvas.width = this.canvas.width;
        this.overlayCanvas.height = this.canvas.height;
    }

    initializeCanvas() {
        // No background fill, keep canvas transparent
        this.updateCanvasCursor();
        this.ensureCanvasVisibility();
    }

    ensureCanvasVisibility() {
        this.canvas.style.display = 'block';
        this.canvas.style.visibility = 'visible';
        this.canvas.style.opacity = '1';
        this.canvas.style.zIndex = '10';
        this.canvas.style.position = 'relative';
    }

    // --- Event Listeners ---
    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.tool-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                this.updateCanvasCursor();
            });
        });

        // Menu buttons
        document.getElementById('newBtn').addEventListener('click', () => this.newProject());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadProject());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyFrame());
        document.getElementById('pasteBtn').addEventListener('click', () => this.pasteFrame());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportVideo());
        document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());

        // Color inputs
        document.getElementById('primaryColor').addEventListener('change', (e) => {
            this.primaryColor = e.target.value;
        });
        document.getElementById('secondaryColor').addEventListener('change', (e) => {
            this.secondaryColor = e.target.value;
        });

        // Color presets
        document.querySelectorAll('.preset-color').forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.primaryColor = e.target.dataset.color;
                document.getElementById('primaryColor').value = this.primaryColor;
            });
        });

        // Brush settings
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
        });

        document.getElementById('opacity').addEventListener('input', (e) => {
            this.opacity = parseInt(e.target.value) / 100;
        });

        // Text settings
        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.fontSize = parseInt(e.target.value);
        });

        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.fontFamily = e.target.value;
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });

        // Layer controls
        document.getElementById('addLayerBtn').addEventListener('click', () => this.addLayer());
        document.getElementById('removeLayerBtn').addEventListener('click', () => this.removeLayer());

        // Frame controls
        document.getElementById('addFrameBtn').addEventListener('click', () => this.addFrame());
        document.getElementById('removeFrameBtn').addEventListener('click', () => this.removeFrame());
        document.getElementById('copyFrameBtn').addEventListener('click', () => this.copyFrame());

        // Playback controls
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlayback());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopPlayback());
        document.getElementById('prevFrameBtn').addEventListener('click', () => this.previousFrame());
        document.getElementById('nextFrameBtn').addEventListener('click', () => this.nextFrame());

        document.getElementById('playbackSpeed').addEventListener('input', (e) => {
            this.playbackSpeed = parseInt(e.target.value);
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Modal controls
        document.querySelector('.close-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('aboutModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('aboutModal')) {
                this.closeModal();
            }
        });

        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileLoad(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.currentTool === 'move' && !this.isDrawing) {
                this.updateMoveToolCursor(e);
            }
        });

        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoomResetBtn').addEventListener('click', () => this.resetZoom());

        // Onion skin toggle
        const onionSkinToggle = document.getElementById('onionSkinToggle');
        if (onionSkinToggle) {
            onionSkinToggle.addEventListener('change', (e) => {
                this.onionSkinEnabled = e.target.checked;
                this.redrawCanvas();
            });
        }

        window.addEventListener('resize', () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.overlayCanvas.width = this.canvas.width;
            this.overlayCanvas.height = this.canvas.height;
            this.redrawCanvas();
        });
    }

    // --- Frame and Layer Management ---
    addFrame(isInit = false) {
        // Create a blank layer for the new frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        const blankLayer = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

        // Add new frame with one blank layer and settings
        this.frames.push([blankLayer]);
        this.layerSettings.push([{ name: 'Layer 1', visible: true, opacity: 1 }]);
        this.currentFrame = this.frames.length - 1;
        this.currentLayer = 0;
        this.updateLayersList();
        this.updateFramesTimeline();
        this.updateFrameDisplay();
        this.redrawCanvas();
    }

    addLayer() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        const blankLayer = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

        // Add the new layer to every frame, not just the current one
        for (let f = 0; f < this.frames.length; f++) {
            this.frames[f].push(this.ctx.createImageData(this.canvas.width, this.canvas.height));
            this.layerSettings[f].push({
                name: `Layer ${this.layerSettings[f].length + 1}`,
                visible: true,
                opacity: 1
            });
        }
        this.currentLayer = this.frames[this.currentFrame].length - 1;
        this.updateLayersList();
        this.redrawCanvas();
    }

    removeLayer() {
        if (this.frames[this.currentFrame].length <= 1) {
            alert("You must have at least one layer in a frame.");
            return;
        }
        // Remove the current layer from all frames
        for (let f = 0; f < this.frames.length; f++) {
            this.frames[f].splice(this.currentLayer, 1);
            this.layerSettings[f].splice(this.currentLayer, 1);
        }
        this.currentLayer = Math.max(0, this.currentLayer - 1);
        this.updateLayersList();
        this.redrawCanvas();
    }

    // --- Drawing and UI ---
    redrawCanvas() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height); // <-- Add this line
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);

        // Onion skinning (if enabled)
        if (this.onionSkinEnabled) {
            // Previous frames
            for (let i = 1; i <= this.onionSkinPrev; i++) {
                const prevIndex = this.currentFrame - i;
                if (prevIndex >= 0) {
                    const layers = this.frames[prevIndex];
                    const settings = this.layerSettings[prevIndex];
                    layers.forEach((layerData, idx) => {
                        if (settings[idx].visible) {
                            this.ctx.globalAlpha = this.onionSkinAlpha;
                            this.ctx.putImageData(layerData, 0, 0);
                        }
                    });
                }
            }
            // Next frames
            for (let i = 1; i <= this.onionSkinNext; i++) {
                const nextIndex = this.currentFrame + i;
                if (nextIndex < this.frames.length) {
                    const layers = this.frames[nextIndex];
                    const settings = this.layerSettings[nextIndex];
                    layers.forEach((layerData, idx) => {
                        if (settings[idx].visible) {
                            this.ctx.globalAlpha = this.onionSkinAlpha;
                            this.ctx.putImageData(layerData, 0, 0);
                        }
                    });
                }
            }
        }

        // Draw current frame's layers
        const layers = this.frames[this.currentFrame];
        const settings = this.layerSettings[this.currentFrame];
        layers.forEach((layerData, i) => {
            if (settings[i].visible) {
                this.ctx.globalAlpha = settings[i].opacity;
                this.ctx.putImageData(layerData, 0, 0);
            }
        });
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
        this.drawTransformHandles();
    }

    updateLayersList() {
        const layersList = document.getElementById('layersList');
        layersList.innerHTML = '';
        const settings = this.layerSettings[this.currentFrame];
        const layers = this.frames[this.currentFrame];

        // Draw from top to bottom (reverse order)
        for (let i = layers.length - 1; i >= 0; i--) {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer-item' + (i === this.currentLayer ? ' selected' : '');
            layerDiv.dataset.layer = i;

            // Thumbnail
            const thumb = document.createElement('canvas');
            thumb.width = 48;
            thumb.height = 36;
            const thumbCtx = thumb.getContext('2d');
            thumbCtx.clearRect(0, 0, thumb.width, thumb.height);
            if (layers[i]) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = layers[i].width;
                tempCanvas.height = layers[i].height;
                tempCanvas.getContext('2d').putImageData(layers[i], 0, 0);
                thumbCtx.drawImage(tempCanvas, 0, 0, thumb.width, thumb.height);
            }
            layerDiv.appendChild(thumb);

            // Layer name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = settings[i].name || `Layer ${i + 1}`;
            layerDiv.appendChild(nameSpan);

            // Visibility toggle
            const visBtn = document.createElement('button');
            visBtn.className = 'layer-vis-btn';
            visBtn.innerHTML = settings[i].visible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            visBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settings[i].visible = !settings[i].visible;
                this.redrawCanvas();
                this.updateLayersList();
            });
            layerDiv.appendChild(visBtn);

            // Select layer on click (but not when clicking the visibility button)
            layerDiv.addEventListener('click', (e) => {
                if (e.target !== visBtn) {
                    this.currentLayer = i;
                    this.redrawCanvas();
                    this.updateLayersList();
                }
            });

            layersList.appendChild(layerDiv);
        }
    }

    // Call this after any layer change (add, remove, select, visibility, etc.)
    updateLayersListUI() {
        const layersList = document.getElementById('layersList');
        layersList.innerHTML = '';
        // Draw from top to bottom (reverse order)
        for (let i = this.frames[this.currentFrame].length - 1; i >= 0; i--) {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer-item' + (i === this.currentLayer ? ' selected' : '');
            layerDiv.dataset.layer = i;

            // Thumbnail
            const thumb = document.createElement('canvas');
            thumb.width = 48;
            thumb.height = 36;
            const thumbCtx = thumb.getContext('2d');
            thumbCtx.clearRect(0, 0, thumb.width, thumb.height);
            // Draw layer thumbnail
            if (this.frames[this.currentFrame][i]) {
                thumbCtx.putImageData(
                    this.frames[this.currentFrame][i],
                    0, 0,
                    0, 0,
                    thumb.width, thumb.height
                );
            }
            layerDiv.appendChild(thumb);

            // Layer name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `Layer ${i + 1}`;
            layerDiv.appendChild(nameSpan);

            // Visibility toggle
            const visBtn = document.createElement('button');
            visBtn.className = 'layer-vis-btn';
            visBtn.innerHTML = this.layerSettings[this.currentFrame][i].visible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            visBtn.onclick = (e) => {
                e.stopPropagation();
                this.layerSettings[this.currentFrame][i].visible = !this.layerSettings[this.currentFrame][i].visible;
                this.redrawCanvas();
                this.updateLayersListUI();
            };
            layerDiv.appendChild(visBtn);

            // Select layer on click
            layerDiv.onclick = () => {
                this.currentLayer = i;
                this.redrawCanvas();
                this.updateLayersListUI();
            };

            layersList.appendChild(layerDiv);
        }
    }

    updateFrameDisplay() {
        document.getElementById('currentFrameDisplay').textContent = this.currentFrame + 1;
        document.getElementById('totalFramesDisplay').textContent = this.frames.length;
    }

    updateFramesTimeline() {
        const timeline = document.getElementById('framesTimeline');
        if (!timeline) return;
        timeline.innerHTML = '';
        
        this.frames.forEach((frame, index) => {
            const frameDiv = document.createElement('div');
            frameDiv.className = 'frame-item';
            frameDiv.style.cssText = 'display: flex; flex-direction: column; align-items: center; min-width: 120px; padding: 10px; border-radius: 8px; background: #f8f9fa; border: 2px solid transparent; cursor: pointer; transition: all 0.3s ease;';
            
            if (index === this.currentFrame) {
                frameDiv.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                frameDiv.style.borderColor = '#6f42c1';
                frameDiv.style.color = 'white';
                frameDiv.style.transform = 'scale(1.05)';
            }
            
            const thumbnail = document.createElement('canvas');
            thumbnail.className = 'frame-thumbnail';
            thumbnail.width = 100;
            thumbnail.height = 75;
            thumbnail.style.cssText = 'border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 2px solid rgba(255,255,255,0.8);';
            
            const thumbCtx = thumbnail.getContext('2d');
            thumbCtx.fillStyle = 'white';
            thumbCtx.fillRect(0, 0, 100, 75);
            
            if (frame[0]) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.canvas.width;
                tempCanvas.height = this.canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(frame[0], 0, 0);
                thumbCtx.drawImage(tempCanvas, 0, 0, 100, 75);
            }
            
            thumbnail.addEventListener('click', () => this.loadFrame(index));
            frameDiv.appendChild(thumbnail);
            
            const frameLabel = document.createElement('div');
            frameLabel.textContent = `Frame ${index + 1}`;
            frameLabel.style.cssText = 'font-size: 12px; font-weight: 600; margin-top: 8px; text-align: center; opacity: 0.9;';
            frameDiv.appendChild(frameLabel);
            
            const frameInfo = document.createElement('div');
            frameInfo.textContent = `${frame.length} layers`;
            frameInfo.style.cssText = 'font-size: 10px; opacity: 0.7; margin-top: 2px; text-align: center;';
            frameDiv.appendChild(frameInfo);
            
            // Add hover effects
            frameDiv.addEventListener('mouseenter', () => {
                if (index !== this.currentFrame) {
                    frameDiv.style.background = '#e9ecef';
                    frameDiv.style.transform = 'translateY(-2px)';
                }
            });
            
            frameDiv.addEventListener('mouseleave', () => {
                if (index !== this.currentFrame) {
                    frameDiv.style.background = '#f8f9fa';
                    frameDiv.style.transform = 'translateY(0)';
                }
            });
            
            timeline.appendChild(frameDiv);
        });
    }

    // --- Frame Navigation ---
    loadFrame(frameIndex) {
        this.currentFrame = frameIndex;
        this.currentLayer = 0;
        this.updateLayersList();
        this.updateFramesTimeline();
        this.updateFrameDisplay();
        this.restoreCurrentLayerToCanvas();
    }

    selectLayer(layerIndex) {
        this.currentLayer = layerIndex;
        this.updateLayersList();
        this.restoreCurrentLayerToCanvas();
    }

    removeFrame() {
        // Prevent deleting the last frame
        if (this.frames.length <= 1) {
            alert("You must have at least one frame.");
            return;
        }
        this.frames.splice(this.currentFrame, 1);
        this.layerSettings.splice(this.currentFrame, 1);

        // Adjust currentFrame if needed
        if (this.currentFrame >= this.frames.length) {
            this.currentFrame = this.frames.length - 1;
        }
        this.currentLayer = 0;

        this.loadFrame(this.currentFrame);
    }

    copyFrame() {
        if (this.frames[this.currentFrame]) {
            this.clipboard = this.frames[this.currentFrame].map(layerData => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.canvas.width;
                tempCanvas.height = this.canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(layerData, 0, 0);
                return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            });
        }
    }

    pasteFrame() {
        if (!this.clipboard) return;
        this.frames[this.currentFrame] = this.clipboard.map(layerData => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(layerData, 0, 0);
            return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        });
        this.redrawCanvas();
    }

    // --- Drawing Tools ---
    drawTransformHandles(customBox = null) {
        if (this.currentTool !== 'move') return;
        const layerData = this.frames[this.currentFrame][this.currentLayer];
        if (!layerData) return;

        // Use customBox for preview during move/resize/rotate, otherwise use actual bbox
        const bbox = customBox || this.getLayerBoundingBox(layerData);
        
        // Don't draw handles if the bounding box is too small
        if (bbox.width < 2 || bbox.height < 2) return;

        this.overlayCtx.save();
        this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0);

        // Draw bounding box
        this.overlayCtx.strokeStyle = '#4f46e5';
        this.overlayCtx.lineWidth = 2;
        this.overlayCtx.setLineDash([8, 4]);
        this.overlayCtx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
        this.overlayCtx.setLineDash([]);

        // Handle size
        const size = 8;

        // Corner points for resize handles
        const corners = [
            { x: bbox.x, y: bbox.y, cursor: 'nw-resize' }, // top-left
            { x: bbox.x + bbox.width, y: bbox.y, cursor: 'ne-resize' }, // top-right
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height, cursor: 'se-resize' }, // bottom-right
            { x: bbox.x, y: bbox.y + bbox.height, cursor: 'sw-resize' } // bottom-left
        ];

        // Draw resize handles (corners)
        this.overlayCtx.fillStyle = '#ffffff';
        this.overlayCtx.strokeStyle = '#4f46e5';
        this.overlayCtx.lineWidth = 2;
        corners.forEach(corner => {
            this.overlayCtx.fillRect(corner.x - size/2, corner.y - size/2, size, size);
            this.overlayCtx.strokeRect(corner.x - size/2, corner.y - size/2, size, size);
        });

        // Draw rotate handle (top-center, above box)
        const rotateX = bbox.x + bbox.width / 2;
        const rotateY = bbox.y - 25;
        
        // Line from box to rotate handle
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(bbox.x + bbox.width / 2, bbox.y);
        this.overlayCtx.lineTo(rotateX, rotateY);
        this.overlayCtx.strokeStyle = '#4f46e5';
        this.overlayCtx.lineWidth = 2;
        this.overlayCtx.stroke();
        
        // Rotate handle circle
        this.overlayCtx.beginPath();
        this.overlayCtx.arc(rotateX, rotateY, size/2, 0, 2 * Math.PI);
        this.overlayCtx.fillStyle = '#22c55e';
        this.overlayCtx.fill();
        this.overlayCtx.strokeStyle = '#16a34a';
        this.overlayCtx.lineWidth = 2;
        this.overlayCtx.stroke();

        this.overlayCtx.restore();
    }

    updateMoveToolCursor(e) {
        if (this.currentTool !== 'move') return;
        const layerData = this.frames[this.currentFrame][this.currentLayer];
        if (!layerData) {
            this.canvas.style.cursor = 'default';
            return;
        }
        
        const bbox = this.getLayerBoundingBox(layerData);
        const pos = this.getMousePos(e);
        const size = 12;
        
        // Check rotate handle (top-center)
        const rotateX = bbox.x + bbox.width / 2;
        const rotateY = bbox.y - 25;
        if (Math.abs(pos.x - rotateX) < size && Math.abs(pos.y - rotateY) < size) {
            this.canvas.style.cursor = 'grab';
            return;
        }
        
        // Check corners for resize with specific cursors
        const corners = [
            { x: bbox.x, y: bbox.y, cursor: 'nw-resize' },
            { x: bbox.x + bbox.width, y: bbox.y, cursor: 'ne-resize' },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height, cursor: 'se-resize' },
            { x: bbox.x, y: bbox.y + bbox.height, cursor: 'sw-resize' }
        ];
        
        for (const corner of corners) {
            if (Math.abs(pos.x - corner.x) < size && Math.abs(pos.y - corner.y) < size) {
                this.canvas.style.cursor = corner.cursor;
                return;
            }
        }
        
        // Check if inside the bounding box for move
        if (pos.x >= bbox.x && pos.x <= bbox.x + bbox.width &&
            pos.y >= bbox.y && pos.y <= bbox.y + bbox.height) {
            // Check if clicking on actual content (non-transparent pixel)
            const pixelX = Math.floor(Math.max(0, Math.min(pos.x, layerData.width - 1)));
            const pixelY = Math.floor(Math.max(0, Math.min(pos.y, layerData.height - 1)));
            const idx = (pixelY * layerData.width + pixelX) * 4;
            if (layerData.data[idx + 3] > 0) {
                this.canvas.style.cursor = 'move';
                return;
            }
        }
        
        // Default cursor
        this.canvas.style.cursor = 'default';
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min((e.clientX - rect.left) / this.zoom, this.canvas.width - 1)),
            y: Math.max(0, Math.min((e.clientY - rect.top) / this.zoom, this.canvas.height - 1))
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);

        // Only operate inside canvas bounds
        if (pos.x < 0 || pos.x >= this.canvas.width || pos.y < 0 || pos.y >= this.canvas.height) return;

        if (this.currentTool === 'move') {
            const layerData = this.frames[this.currentFrame][this.currentLayer];
            if (!layerData) return;
            
            const bbox = this.getLayerBoundingBox(layerData);
            const size = 12;

            // Check rotate handle first
            const rotateX = bbox.x + bbox.width / 2;
            const rotateY = bbox.y - 25;
            if (Math.abs(pos.x - rotateX) < size && Math.abs(pos.y - rotateY) < size) {
                this.rotateHandle = true;
                this.initialBBox = { ...bbox };
                this.initialMouse = { x: pos.x, y: pos.y };
                this.isDrawing = true;
                // Clear current layer from canvas and prepare for rotation
                this.clearCurrentLayerFromCanvas();
                this.transformLayerImage = this.extractLayerImage(bbox, layerData);
                // Store initial angle for smooth rotation
                const centerX = bbox.x + bbox.width / 2;
                const centerY = bbox.y + bbox.height / 2;
                this.rotateStartAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
                return;
            }

            // Check corners for resize
            const corners = [
                { name: 'tl', x: bbox.x, y: bbox.y },
                { name: 'tr', x: bbox.x + bbox.width, y: bbox.y },
                { name: 'br', x: bbox.x + bbox.width, y: bbox.y + bbox.height },
                { name: 'bl', x: bbox.x, y: bbox.y + bbox.height }
            ];
            
            for (const corner of corners) {
                if (Math.abs(pos.x - corner.x) < size && Math.abs(pos.y - corner.y) < size) {
                    this.resizeHandle = corner.name;
                    this.initialBBox = { ...bbox };
                    this.initialMouse = { x: pos.x, y: pos.y };
                    this.isDrawing = true;
                    // Clear current layer and prepare for resize
                    this.clearCurrentLayerFromCanvas();
                    this.transformLayerImage = this.extractLayerImage(bbox, layerData);
                    return;
                }
            }
            
            // Check for move (only if clicking on actual content)
            if (pos.x >= bbox.x && pos.x <= bbox.x + bbox.width &&
                pos.y >= bbox.y && pos.y <= bbox.y + bbox.height) {
                const pixelX = Math.floor(Math.max(0, Math.min(pos.x, layerData.width - 1)));
                const pixelY = Math.floor(Math.max(0, Math.min(pos.y, layerData.height - 1)));
                const idx = (pixelY * layerData.width + pixelX) * 4;
                
                if (layerData.data[idx + 3] > 0) {
                    this.transformMode = 'move';
                    this.transformStart = { x: pos.x, y: pos.y, bbox };
                    this.transformOffset = {
                        x: pos.x - bbox.x,
                        y: pos.y - bbox.y
                    };
                    this.isDrawing = true;
                    // Clear current layer and prepare for move
                    this.clearCurrentLayerFromCanvas();
                    this.transformLayerImage = this.extractLayerImage(bbox, layerData);
                    this.transformBBox = bbox;
                    return;
                }
            }
            
            // If we get here, we're not interacting with the current layer
            return;
        }
        // --- Drawing/Shape/Text/Flood Fill ---
        // For drawing tools, prepare the canvas with all layers
        this.redrawCanvas();
        
        // Save the current state for undo
        this.saveCanvasState();

        this.isDrawing = true;
        this.startX = pos.x;
        this.startY = pos.y;
        this.lastX = pos.x;
        this.lastY = pos.y;

        this.canvasBackup = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.globalAlpha = this.opacity;
        this.ctx.strokeStyle = this.primaryColor;
        this.ctx.fillStyle = this.primaryColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.currentTool === 'pencil') {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.brushSize, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        if (!this.isDrawing) return;

        // --- Rotate preview ---
        if (this.currentTool === 'move' && this.rotateHandle) {
            const bbox = this.initialBBox;
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            const currentAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
            const angle = currentAngle - this.rotateStartAngle;

            // Redraw canvas without current layer
            this.redrawCanvas();

            // Clear the overlay and draw rotated preview
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            this.overlayCtx.save();
            this.overlayCtx.translate(centerX, centerY);
            this.overlayCtx.rotate(angle);
            this.overlayCtx.drawImage(
                this.transformLayerImage,
                -bbox.width / 2, -bbox.height / 2,
                bbox.width, bbox.height
            );
            this.overlayCtx.restore();

            // Draw transform handles
            this.drawTransformHandles(bbox);

            // Store the angle for commit
            this.lastRotateAngle = angle;
            return;
        }

        // --- Move tool preview ---
        if (this.currentTool === 'move' && this.transformMode === 'move') {
            const drawX = pos.x - this.transformOffset.x;
            const drawY = pos.y - this.transformOffset.y;
            
            // Redraw canvas without current layer
            this.redrawCanvas();
            
            // Draw preview on overlay
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            this.overlayCtx.drawImage(
                this.transformLayerImage,
                drawX, drawY
            );
            
            // Draw transform handles at new position
            const newBBox = { 
                x: drawX, 
                y: drawY, 
                width: this.transformBBox.width, 
                height: this.transformBBox.height 
            };
            this.drawTransformHandles(newBBox);
            return;
        }

        // --- Resize preview ---
        if (this.currentTool === 'move' && this.resizeHandle) {
            const dx = pos.x - this.initialMouse.x;
            const dy = pos.y - this.initialMouse.y;
            let newBBox = { ...this.initialBBox };
            
            // Calculate new bounding box based on resize handle
            switch (this.resizeHandle) {
                case 'tl': 
                    newBBox.x += dx; 
                    newBBox.y += dy; 
                    newBBox.width -= dx; 
                    newBBox.height -= dy; 
                    break;
                case 'tr': 
                    newBBox.y += dy; 
                    newBBox.width += dx; 
                    newBBox.height -= dy; 
                    break;
                case 'br': 
                    newBBox.width += dx; 
                    newBBox.height += dy; 
                    break;
                case 'bl': 
                    newBBox.x += dx; 
                    newBBox.width -= dx; 
                    newBBox.height += dy; 
                    break;
            }
            
            // Ensure minimum size
            newBBox.width = Math.max(5, newBBox.width);
            newBBox.height = Math.max(5, newBBox.height);
            
            // Redraw canvas without current layer
            this.redrawCanvas();
            
            // Draw resized preview on overlay
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            this.overlayCtx.save();
            this.overlayCtx.imageSmoothingEnabled = false;
            this.overlayCtx.drawImage(
                this.transformLayerImage,
                0, 0, this.initialBBox.width, this.initialBBox.height,
                newBBox.x, newBBox.y, newBBox.width, newBBox.height
            );
            this.overlayCtx.restore();
            
            // Draw transform handles at new size
            this.drawTransformHandles(newBBox);
            return;
        }

        // Pencil tool
        if (this.currentTool === 'pencil') {
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
            this.lastX = pos.x;
            this.lastY = pos.y;
            return;
        }

        // Eraser tool
        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.brushSize, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
            this.lastX = pos.x;
            this.lastY = pos.y;
            return;
        }

        // Shape tools preview
        if (["line", "circle", "semicircle", "square", "triangle", "star", "arrow"].includes(this.currentTool)) {
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            this.drawPreview(pos.x, pos.y);
            return;
        }

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        const pos = this.getMousePos(e);

        // --- Move commit ---
        if (this.currentTool === 'move' && this.transformMode === 'move') {
            const drawX = pos.x - this.transformOffset.x;
            const drawY = pos.y - this.transformOffset.y;
            
            // Create new layer data with moved image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(this.transformLayerImage, drawX, drawY);
            
            // Update the layer data
            this.frames[this.currentFrame][this.currentLayer] = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Clean up
            this.transformMode = null;
            this.transformStart = null;
            this.transformLayerImage = null;
            this.transformBBox = null;
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            
            // Redraw and save
            this.redrawCanvas();
            this.saveState();
            return;
        }

        // --- Resize commit ---
        if (this.currentTool === 'move' && this.resizeHandle) {
            const dx = pos.x - this.initialMouse.x;
            const dy = pos.y - this.initialMouse.y;
            let newBBox = { ...this.initialBBox };
            
            // Calculate final bounding box
            switch (this.resizeHandle) {
                case 'tl': 
                    newBBox.x += dx; 
                    newBBox.y += dy; 
                    newBBox.width -= dx; 
                    newBBox.height -= dy; 
                    break;
                case 'tr': 
                    newBBox.y += dy; 
                    newBBox.width += dx; 
                    newBBox.height -= dy; 
                    break;
                case 'br': 
                    newBBox.width += dx; 
                    newBBox.height += dy; 
                    break;
                case 'bl': 
                    newBBox.x += dx; 
                    newBBox.width -= dx; 
                    newBBox.height += dy; 
                    break;
            }
            
            // Ensure minimum size
            newBBox.width = Math.max(5, newBBox.width);
            newBBox.height = Math.max(5, newBBox.height);
            
            // Create new layer data with resized image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Disable smoothing for pixel-perfect resize
            tempCtx.imageSmoothingEnabled = false;
            tempCtx.drawImage(
                this.transformLayerImage,
                0, 0, this.initialBBox.width, this.initialBBox.height,
                newBBox.x, newBBox.y, newBBox.width, newBBox.height
            );
            
            // Update layer data
            this.frames[this.currentFrame][this.currentLayer] = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Clean up
            this.resizeHandle = null;
            this.initialBBox = null;
            this.initialMouse = null;
            this.transformLayerImage = null;
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            
            // Redraw and save
            this.redrawCanvas();
            this.saveState();
            return;
        }

        // --- Rotate commit ---
        if (this.currentTool === 'move' && this.rotateHandle) {
            const bbox = this.initialBBox;
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            const angle = this.lastRotateAngle || 0;
            
            // Create new layer data with rotated image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Apply rotation
            tempCtx.save();
            tempCtx.translate(centerX, centerY);
            tempCtx.rotate(angle);
            tempCtx.drawImage(
                this.transformLayerImage,
                -bbox.width / 2, -bbox.height / 2,
                bbox.width, bbox.height
            );
            tempCtx.restore();
            
            // Update layer data
            this.frames[this.currentFrame][this.currentLayer] = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Clean up
            this.rotateHandle = false;
            this.initialBBox = null;
            this.initialMouse = null;
            this.rotateStartAngle = null;
            this.lastRotateAngle = null;
            this.transformLayerImage = null;
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            
            // Redraw and save
            this.redrawCanvas();
            this.saveState();
            return;
        }

        // Pencil tool commit
        if (this.currentTool === 'pencil') {
            this.saveState();
            this.updateCurrentFrame();
            return;
        }

        // Eraser tool commit
        if (this.currentTool === 'eraser') {
            this.saveState();
            this.updateCurrentFrame();
            return;
        }

        // Shape tools commit
        if (["line", "circle", "semicircle", "square", "triangle", "star", "arrow"].includes(this.currentTool)) {
            this.drawShape(this.currentTool, this.startX, this.startY, pos.x, pos.y, this.ctx);
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            this.saveState();
            this.updateCurrentFrame();
            return;
        }

        // Text tool
        if (this.currentTool === 'text') {
            this.handleTextInput(pos.x, pos.y);
            this.saveState();
            this.updateCurrentFrame();
            return;
        }

        // Flood fill
        if (this.currentTool === 'flood-fill') {
            this.floodFill(pos.x, pos.y, this.primaryColor);
            this.saveState();
            this.updateCurrentFrame();
            return;
        }

        this.ctx.globalAlpha = 1;
        this.updateCurrentFrame();
        this.redrawCanvas();
        this.updateLayersList();
        this.updateFramesTimeline();
    }

    drawPreview(endX, endY) {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        this.overlayCtx.globalAlpha = this.opacity;
        this.overlayCtx.strokeStyle = this.primaryColor;
        this.overlayCtx.fillStyle = this.primaryColor;
        this.overlayCtx.lineWidth = this.brushSize;
        this.overlayCtx.lineCap = 'round';
        this.overlayCtx.lineJoin = 'round';

        this.drawShape(this.currentTool, this.startX, this.startY, endX, endY, this.overlayCtx);
    }

    drawShape(shape, startX, startY, endX, endY, context = this.ctx) {
        const width = endX - startX;
        const height = endY - startY;
        const radius = Math.sqrt(width * width + height * height) / 2;

        context.beginPath();

        switch (shape) {
            case 'line':
                context.moveTo(startX, startY);
                context.lineTo(endX, endY);
                context.stroke();
                break;

            case 'circle':
                context.arc(startX + width / 2, startY + height / 2, Math.abs(radius), 0, 2 * Math.PI);
                context.stroke();
                break;

            case 'semicircle':
                this.drawSemicircle(context, startX, startY, endX, endY);
                break;

            case 'square':
                context.rect(startX, startY, width, height);
                context.stroke();
                break;

            case 'triangle':
                context.moveTo(startX + width / 2, startY);
                context.lineTo(startX, endY);
                context.lineTo(endX, endY);
                context.closePath();
                context.stroke();
                break;

            case 'star':
                this.drawStar(context, startX + width / 2, startY + height / 2, 5, Math.abs(radius) / 2, Math.abs(radius));
                break;

            case 'arrow':
                this.drawArrow(context, startX, startY, endX, endY);
                break;
        }
    }

    drawSemicircle(context, startX, startY, endX, endY) {
        const width = endX - startX;
        const height = endY - startY;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        const radius = Math.sqrt(width * width + height * height) / 2;
        
        context.beginPath();
        context.arc(centerX, centerY, Math.abs(radius), 0, Math.PI);
        context.stroke();
        
        // Draw the diameter line
        context.beginPath();
        context.moveTo(centerX - Math.abs(radius), centerY);
        context.lineTo(centerX + Math.abs(radius), centerY);
        context.stroke();
    }

    drawStar(context, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        context.beginPath();
        context.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            context.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            context.lineTo(x, y);
            rot += step;
        }

        context.lineTo(cx, cy - outerRadius);
        context.closePath();
        context.stroke();
    }

    drawArrow(context, fromX, fromY, toX, toY) {
        const headLength = 20;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        context.moveTo(toX, toY);
        context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        context.stroke();
    }

    handleTextInput(x, y) {
        const text = prompt('Enter text:');
        if (text) {
            this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            this.ctx.fillStyle = this.primaryColor;
            this.ctx.fillText(text, x, y);
            this.saveState();
        }
    }

    floodFill(startX, startY, fillColor) {
        // Validate input coordinates
        if (startX < 0 || startX >= this.canvas.width || startY < 0 || startY >= this.canvas.height) {
            return;
        }

        // Work on the current layer's ImageData
        const layerData = this.frames[this.currentFrame][this.currentLayer];
        const data = layerData.data;
        const width = layerData.width;
        const height = layerData.height;
        const targetColor = this.getPixelColor(data, Math.floor(startX), Math.floor(startY), width);
        const fillColorRgb = this.hexToRgb(fillColor);

        if (!fillColorRgb || this.colorsMatch(targetColor, fillColorRgb)) {
            return;
        }

        const stack = [{x: Math.floor(startX), y: Math.floor(startY)}];
        const visited = new Set();
        const maxIterations = width * height;
        let iterations = 0;

        while (stack.length > 0 && iterations < maxIterations) {
            const {x, y} = stack.pop();
            iterations++;

            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const currentColor = this.getPixelColor(data, x, y, width);
            if (!this.colorsMatch(currentColor, targetColor)) continue;

            this.setPixelColor(data, x, y, width, fillColorRgb);

            stack.push({x: x + 1, y: y});
            stack.push({x: x - 1, y: y});
            stack.push({x: x, y: y + 1});
            stack.push({x: x, y: y - 1});
        }

        // Save the filled layer back and redraw all layers
        this.frames[this.currentFrame][this.currentLayer] = layerData;
        this.redrawCanvas();
        this.saveState();
    }

    getPixelColor(data, x, y, width) {
        // Ensure coordinates are integers and within bounds
        x = Math.floor(Math.max(0, Math.min(x, width - 1)));
        y = Math.floor(Math.max(0, Math.min(y, (data.length / 4) / width - 1)));
        
        const index = (y * width + x) * 4;
        
        // Check if index is valid
        if (index < 0 || index >= data.length - 3) {
            return { r: 0, g: 0, b: 0, a: 0 };
        }
        
        return {
            r: data[index] || 0,
            g: data[index + 1] || 0,
            b: data[index + 2] || 0,
            a: data[index + 3] || 0
        };
    }

    setPixelColor(data, x, y, width, color) {
        // Ensure coordinates are integers and within bounds
        x = Math.floor(Math.max(0, Math.min(x, width - 1)));
        y = Math.floor(Math.max(0, Math.min(y, (data.length / 4) / width - 1)));
        
        const index = (y * width + x) * 4;
        
        // Check if index is valid
        if (index < 0 || index >= data.length - 3) {
            return;
        }
        
        data[index] = color.r || 0;
        data[index + 1] = color.g || 0;
        data[index + 2] = color.b || 0;
        data[index + 3] = 255;
    }

    hexToRgb(hex) {
        if (!hex) return null;
        
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Handle 3-digit hex codes
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    colorsMatch(color1, color2) {
        if (!color1 || !color2) return false;
        return Math.abs(color1.r - color2.r) <= 1 && 
               Math.abs(color1.g - color2.g) <= 1 && 
               Math.abs(color1.b - color2.b) <= 1;
    }

    // --- Undo/Redo ---
    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        if (this.history.length > 50) {
            this.history.shift();
            this.historyStep--;
        }
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
            this.updateCurrentFrame();
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
            this.updateCurrentFrame();
        }
    }

    // --- Playback ---
    togglePlayback() {
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        this.isPlaying = true;
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i>';
        this.playInterval = setInterval(() => {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.loadFrame(this.currentFrame);
        }, 1000 / this.playbackSpeed);
    }

    stopPlayback() {
        this.isPlaying = false;
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>';
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    previousFrame() {
        this.currentFrame = this.currentFrame > 0 ? this.currentFrame - 1 : this.frames.length - 1;
        this.loadFrame(this.currentFrame);
    }

    nextFrame() {
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        this.loadFrame(this.currentFrame);
    }

    // --- Project Management ---
    newProject() {
        if (confirm('Create new project? This will clear all current work.')) {
            this.initProject();
            this.saveState();
        }
    }

    saveProject() {
        const projectData = {
            frames: this.frames.map(frame =>
                frame.map(layerData => Array.from(layerData.data))
            ),
            layerSettings: this.layerSettings,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height
        };
        const dataStr = JSON.stringify(projectData);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'animation_project.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    loadProject() {
        document.getElementById('fileInput').click();
    }

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                this.loadProjectData(projectData);
            } catch (error) {
                alert('Error loading project file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    loadProjectData(projectData) {
        this.layerSettings = projectData.layerSettings;
        this.currentFrame = 0;
        this.currentLayer = 0;
        this.frames = projectData.frames.map(frame =>
            frame.map(layerData => {
                const imageData = this.ctx.createImageData(projectData.canvasWidth, projectData.canvasHeight);
                imageData.data.set(layerData);
                return imageData;
            })
        );
        this.loadFrame(this.currentFrame);
        this.updateLayersList();
        this.updateFrameDisplay();
    }

    exportVideo() {
        if (this.frames.length === 0) {
            alert('No frames to export!');
            return;
        }
        const zip = new JSZip();
        this.frames.forEach((frame, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = this.canvas.width;
            canvas.height = this.canvas.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const settings = this.layerSettings[index];
            frame.forEach((layerData, layerIndex) => {
                if (settings[layerIndex].visible) {
                    ctx.globalAlpha = settings[layerIndex].opacity;
                    ctx.putImageData(layerData, 0, 0);
                }
            });
            ctx.globalAlpha = 1;
            const dataURL = canvas.toDataURL('image/png');
            const data = dataURL.split(',')[1];
            zip.file(`frame_${index.toString().padStart(3, '0')}.png`, data, { base64: true });
        });
        zip.generateAsync({ type: 'blob' }).then(content => {
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'animation_frames.zip';
            link.click();
            URL.revokeObjectURL(url);
        });
    }

    // --- Zoom ---
    zoomIn() {
        this.zoom = Math.min(this.zoom + this.zoomStep, this.zoomMax);
        this.redrawCanvas();
        document.getElementById('zoomDisplay').textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
    }
    zoomOut() {
        this.zoom = Math.max(this.zoom - this.zoomStep, this.zoomMin);
        this.redrawCanvas();
        document.getElementById('zoomDisplay').textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
    }
    resetZoom() {
        this.zoom = 1;
        this.redrawCanvas();
        document.getElementById('zoomDisplay').textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
    }

    // --- Blink Effect ---
    blinkCanvas() {
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        if (canvasWrapper) {
            canvasWrapper.classList.add('blink');
            setTimeout(() => {
                canvasWrapper.classList.remove('blink');
            }, 200);
        }
    }

    // --- Cursor ---
    updateCanvasCursor() {
        this.canvas.className = '';
        switch (this.currentTool) {
            case 'pencil':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                this.canvas.style.cursor = 'cell';
                break;
            case 'text':
                this.canvas.style.cursor = 'text';
                break;
            case 'move':
                this.canvas.style.cursor = 'move';
                break;
            case 'flood-fill':
                this.canvas.style.cursor = 'pointer';
                break;
            case 'line':
            case 'circle':
            case 'semicircle':
            case 'square':
            case 'triangle':
            case 'star':
            case 'arrow':
                this.canvas.style.cursor = 'crosshair';
                break;
            default:
                this.canvas.style.cursor = 'default';
        }
    }

    // --- About Modal ---
    showAbout() {
        document.getElementById('aboutModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('aboutModal').style.display = 'none';
    }

    // --- Keyboard Shortcuts ---
    handleKeyboard(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 'c':
                    event.preventDefault();
                    this.copyFrame();
                    break;
                case 'v':
                    event.preventDefault();
                    this.pasteFrame();
                    break;
                case 's':
                    event.preventDefault();
                    this.saveProject();
                    break;
                case 'o':
                    event.preventDefault();
                    this.onionSkinEnabled = !this.onionSkinEnabled;
                    this.redrawCanvas();
                    break;
                case 'n':
                    event.preventDefault();
                    this.newProject();
                    break;
            }
        } else {
            switch (event.key) {
                case ' ':
                    event.preventDefault();
                    this.togglePlayback();
                    break;
                case 'arrowleft':
                case 'arrowright':
                case 'arrowup':
                case 'arrowdown':
                    event.preventDefault();
                    this.handleArrowKeys(event.key);
                    break;
                case '+':
                case '=':
                    event.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    event.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    event.preventDefault();
                    this.resetZoom();
                    break;
            }
        }
    }

    handleArrowKeys(direction) {
        const step = 5; // Move 5 pixels per key press
        if (direction === 'arrowleft') {
            this.currentFrame = (this.currentFrame - 1 + this.frames.length) % this.frames.length;
        } else if (direction === 'arrowright') {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        } else if (direction === 'arrowup') {
            this.currentLayer = Math.max(0, this.currentLayer - 1);
        } else if (direction === 'arrowdown') {
            this.currentLayer = Math.min(this.frames[this.currentFrame].length - 1, this.currentLayer + 1);
        }
        this.loadFrame(this.currentFrame);
    }

    updateCurrentFrame() {
        // Save the current canvas state to the current frame/layer
        if (!this.frames[this.currentFrame]) return;
        this.frames[this.currentFrame][this.currentLayer] = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    restoreCurrentLayerToCanvas() {
        // Clear the canvas and put the current layer's image data
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const layerData = this.frames[this.currentFrame][this.currentLayer];
        if (layerData) {
            this.ctx.putImageData(layerData, 0, 0);
        }
    }

    // Add this method inside your AnimationMaker class
    getLayerBoundingBox(layerData) {
        // Find the bounding box of non-transparent pixels in the layer
        const { width, height, data } = layerData;
        let minX = width, minY = height, maxX = -1, maxY = -1;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > 0) { // alpha > 0 means pixel is not transparent
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX === -1 || maxY === -1) {
            // No non-transparent pixels, return a default box
            return { x: 0, y: 0, width: 1, height: 1 };
        }
        return {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }

    // Draw all visible layers except the current one
    compositeOtherLayersToCanvas() {
        const layers = this.frames[this.currentFrame];
        const settings = this.layerSettings[this.currentFrame];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        layers.forEach((layerData, i) => {
            if (i !== this.currentLayer && settings[i].visible) {
                this.ctx.globalAlpha = settings[i].opacity;
                this.ctx.putImageData(layerData, 0, 0);
            }
        });
        this.ctx.globalAlpha = 1;
    }

    // Utility for extracting the selected image area as a canvas
    extractLayerImage(bbox, layerData) {
        const cropped = this.ctx.createImageData(bbox.width, bbox.height);
        for (let y = 0; y < bbox.height; y++) {
            for (let x = 0; x < bbox.width; x++) {
                const srcX = bbox.x + x;
                const srcY = bbox.y + y;
                if (srcX >= 0 && srcX < layerData.width && srcY >= 0 && srcY < layerData.height) {
                    const srcIdx = (srcY * layerData.width + srcX) * 4;
                    const dstIdx = (y * bbox.width + x) * 4;
                    cropped.data[dstIdx] = layerData.data[srcIdx];
                    cropped.data[dstIdx + 1] = layerData.data[srcIdx + 1];
                    cropped.data[dstIdx + 2] = layerData.data[srcIdx + 2];
                    cropped.data[dstIdx + 3] = layerData.data[srcIdx + 3];
                }
            }
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = bbox.width;
        tempCanvas.height = bbox.height;
        tempCanvas.getContext('2d').putImageData(cropped, 0, 0);
        return tempCanvas;
    }

    // Clear the current layer from the canvas (for transform operations)
    clearCurrentLayerFromCanvas() {
        // Clear current layer data
        const layerData = this.frames[this.currentFrame][this.currentLayer];
        if (layerData) {
            // Create blank layer data
            const blankData = this.ctx.createImageData(layerData.width, layerData.height);
            this.frames[this.currentFrame][this.currentLayer] = blankData;
        }
        // Redraw canvas without the current layer
        this.redrawCanvas();
    }

    // Save canvas state for undo functionality
    saveCanvasState() {
        this.canvasBackup = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
}

// --- Simple JSZip mock for demo purposes ---
class JSZip {
    constructor() {
        this.files = {};
    }
    file(name, data, options = {}) {
        this.files[name] = { data, options };
    }
    generateAsync(options = {}) {
        return new Promise((resolve) => {
            const content = Object.keys(this.files).map(name =>
                `${name}: ${this.files[name].data.substring(0, 50)}...`
            ).join('\n');
            const blob = new Blob([content], { type: 'text/plain' });
            resolve(blob);
        });
    }
}

// --- Initialize the application ---
let animationMaker;
document.addEventListener('DOMContentLoaded', function () {
    animationMaker = new AnimationMaker();

    // Update slider display values
    document.getElementById('brushSize').value = animationMaker.brushSize;
    document.getElementById('opacity').value = animationMaker.opacity * 100;
    document.getElementById('fontSize').value = animationMaker.fontSize;
    document.getElementById('playbackSpeed').value = animationMaker.playbackSpeed;

    document.getElementById('zoomDisplay').textContent = `Zoom: ${Math.round(animationMaker.zoom * 100)}%`;
});
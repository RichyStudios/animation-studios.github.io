class AnimationMaker {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        
        this.currentTool = 'move';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentFrame = 0;
        this.currentLayer = 0;
        this.frames = [[]];
        this.layers = [{ name: 'Layer 1', visible: true, data: null }];
        this.history = [];
        this.historyStep = -1;
        this.animationPlaying = false;
        this.animationSpeed = 12;
        this.skinningEnabled = false;
        this.clipboard = null;
        
        this.pencilPath = [];
        this.shapes = [];
        
        this.initializeEvents();
        this.saveState();
    }

    initializeEvents() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Layer events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.layer-item')) {
                this.selectLayer(parseInt(e.target.closest('.layer-item').dataset.layer));
            }
        });

        // Frame events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.frame-thumb')) {
                this.selectFrame(parseInt(e.target.closest('.frame-thumb').dataset.frame));
            }
        });

        // File input events
        document.getElementById('loadInput').addEventListener('change', this.handleFileLoad.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.saveProject();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copy();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.paste();
                        break;
                }
            }
        });
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;

        if (this.currentTool === 'pencil') {
            this.pencilPath = [{ x: this.startX, y: this.startY }];
        }
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        switch (this.currentTool) {
            case 'pencil':
                this.drawPencil(currentX, currentY);
                break;
            case 'line':
                this.drawLine(this.startX, this.startY, currentX, currentY, true);
                break;
            case 'circle':
                this.drawCircle(this.startX, this.startY, currentX, currentY, true);
                break;
            case 'circle-half':
                this.drawCircleHalf(this.startX, this.startY, currentX, currentY, true);
                break;
            case 'square':
                this.drawSquare(this.startX, this.startY, currentX, currentY, true);
                break;
            case 'triangle':
                this.drawTriangle(this.startX, this.startY, currentX, currentY, true);
                break;
            case 'star':
                this.drawStar(this.startX, this.startY, currentX, currentY, true);
                break;
            case 'arrow':
                this.drawArrow(this.startX, this.startY, currentX, currentY, true);
                break;
            case 'eraser':
                this.erase(currentX, currentY);
                break;
        }
    }

    stopDrawing(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Draw to main canvas
        switch (this.currentTool) {
            case 'pencil':
                this.drawPencilPath();
                break;
            case 'line':
                this.drawLine(this.startX, this.startY, currentX, currentY, false);
                break;
            case 'circle':
                this.drawCircle(this.startX, this.startY, currentX, currentY, false);
                break;
            case 'circle-half':
                this.drawCircleHalf(this.startX, this.startY, currentX, currentY, false);
                break;
            case 'square':
                this.drawSquare(this.startX, this.startY, currentX, currentY, false);
                break;
            case 'triangle':
                this.drawTriangle(this.startX, this.startY, currentX, currentY, false);
                break;
            case 'star':
                this.drawStar(this.startX, this.startY, currentX, currentY, false);
                break;
            case 'arrow':
                this.drawArrow(this.startX, this.startY, currentX, currentY, false);
                break;
        }

        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        this.saveState();
    }

    drawPencil(x, y) {
        this.pencilPath.push({ x, y });
        
        const ctx = this.overlayCtx;
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.pencilPath[0].x, this.pencilPath[0].y);
        
        for (let i = 1; i < this.pencilPath.length; i++) {
            ctx.lineTo(this.pencilPath[i].x, this.pencilPath[i].y);
        }
        ctx.stroke();
    }

    drawPencilPath() {
        const ctx = this.ctx;
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.pencilPath[0].x, this.pencilPath[0].y);
        
        for (let i = 1; i < this.pencilPath.length; i++) {
            ctx.lineTo(this.pencilPath[i].x, this.pencilPath[i].y);
        }
        ctx.stroke();
    }

    drawLine(x1, y1, x2, y2, isPreview) {
        const ctx = isPreview ? this.overlayCtx : this.ctx;
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    drawCircle(x1, y1, x2, y2, isPreview) {
        const ctx = isPreview ? this.overlayCtx : this.ctx;
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    drawCircleHalf(x1, y1, x2, y2, isPreview) {
        const ctx = isPreview ? this.overlayCtx : this.ctx;
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x1, y1, radius, 0, Math.PI);
        ctx.stroke();
    }

    drawSquare(x1, y1, x2, y2, isPreview) {
        const ctx = isPreview ? this.overlayCtx : this.ctx;
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    drawTriangle(x1, y1, x2, y2, isPreview) {
        const ctx = isPreview ? this.overlayCtx : this.ctx;
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1 - (x2 - x1), y2);
        ctx.closePath();
        ctx.stroke();
    }

    drawStar(x1, y1, x2, y2, isPreview) {
        const ctx = isPreview ? this.overlayCtx : this.ctx;
        const centerX = x1;
        const centerY = y1;
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    drawArrow(x1, y1, x2, y2, isPreview) {
        const ctx = isPreview ? this.overlayCtx : this.ctx;
        const headlen = 10;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        ctx.strokeStyle = document.getElementById('primaryColor').value;
        ctx.lineWidth = 2;
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    erase(x, y) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
    }

    selectLayer(layerIndex) {
        this.currentLayer = layerIndex;
        document.querySelectorAll('.layer-item').forEach((item, index) => {
            item.classList.toggle('active', index === layerIndex);
        });
    }

    selectFrame(frameIndex) {
        this.currentFrame = frameIndex;
        document.querySelectorAll('.frame-thumb').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === frameIndex);
        });
        this.loadFrame(frameIndex);
    }

    loadFrame(frameIndex) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.frames[frameIndex] && this.frames[frameIndex].length > 0) {
            const imageData = this.frames[frameIndex][0];
            if (imageData) {
                this.ctx.putImageData(imageData, 0, 0);
            }
        }
    }

    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        
        // Save to current frame
        if (!this.frames[this.currentFrame]) {
            this.frames[this.currentFrame] = [];
        }
        this.frames[this.currentFrame][this.currentLayer] = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
        }
    }

    copy() {
        this.clipboard = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        console.log('Canvas copied to clipboard');
    }

    paste() {
        if (this.clipboard) {
            this.ctx.putImageData(this.clipboard, 0, 0);
            this.saveState();
            console.log('Canvas pasted from clipboard');
        }
    }

    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                this.loadProject(projectData);
            } catch (error) {
                console.error('Error loading project:', error);
                alert('Error loading project file');
            }
        };
        reader.readAsText(file);
    }

    loadProject(projectData) {
        if (projectData.frames) {
            this.frames = projectData.frames;
            this.currentFrame = 0;
            this.updateFrameTimeline();
            this.loadFrame(0);
        }
        
        if (projectData.layers) {
            this.layers = projectData.layers;
            this.updateLayersPanel();
        }
        
        console.log('Project loaded successfully');
    }

    updateFrameTimeline() {
        const timeline = document.getElementById('frameTimeline');
        timeline.innerHTML = '';
        
        this.frames.forEach((frame, index) => {
            const thumb = document.createElement('div');
            thumb.className = `frame-thumb ${index === this.currentFrame ? 'active' : ''}`;
            thumb.dataset.frame = index;
            thumb.textContent = index + 1;
            timeline.appendChild(thumb);
        });
    }

    updateLayersPanel() {
        const container = document.getElementById('layersContainer');
        container.innerHTML = '';
        
        this.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item ${index === this.currentLayer ? 'active' : ''}`;
            layerItem.dataset.layer = index;
            layerItem.innerHTML = `
                <span class="layer-name" contenteditable="true">${layer.name}</span>
                <div class="layer-controls">
                    <button onclick="moveLayerUp(${index})"><i class="fas fa-arrow-up"></i></button>
                    <button onclick="moveLayerDown(${index})"><i class="fas fa-arrow-down"></i></button>
                    <button onclick="removeLayer(${index})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            container.appendChild(layerItem);
        });
    }
}

// Global functions for UI interactions
let animationMaker;

document.addEventListener('DOMContentLoaded', () => {
    animationMaker = new AnimationMaker();
});

function showFileMenu() {
    const menu = document.getElementById('fileMenu');
    menu.classList.toggle('show');
    
    // Hide other menus
    document.getElementById('editMenu').classList.remove('show');
}

function showEditMenu() {
    const menu = document.getElementById('editMenu');
    menu.classList.toggle('show');
    
    // Hide other menus
    document.getElementById('fileMenu').classList.remove('show');
}

function showAbout() {
    alert('Animation Maker v.01\nCoded by Richard Noble\n\nA powerful animation tool for creating frame-by-frame animations with layers, drawing tools, and export capabilities.');
}

function saveProject() {
    const projectData = {
        frames: animationMaker.frames,
        layers: animationMaker.layers,
        currentFrame: animationMaker.currentFrame,
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation_project.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Project saved');
}

function saveAsProject() {
    const filename = prompt('Enter filename:', 'my_animation.json');
    if (filename) {
        const projectData = {
            frames: animationMaker.frames,
            layers: animationMaker.layers,
            currentFrame: animationMaker.currentFrame,
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.json') ? filename : filename + '.json';
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('Project saved as', filename);
    }
}

function loadProject() {
    document.getElementById('loadInput').click();
}

function exportVideo() {
    // Simulate video export (in a real application, you'd use a library like WebCodecs or server-side processing)
    alert('Export functionality would convert all frames to .wmv format.\nThis requires additional video encoding libraries in a production environment.');
    
    // Basic implementation - export frames as images
    const zip = [];
    animationMaker.frames.forEach((frame, index) => {
        if (frame && frame[0]) {
            const canvas = document.createElement('canvas');
            canvas.width = animationMaker.canvas.width;
            canvas.height = animationMaker.canvas.height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(frame[0], 0, 0);
            
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `frame_${index + 1}.png`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }
    });
    
    console.log('Frames exported as PNG images');
}

function undo() {
    animationMaker.undo();
}

function redo() {
    animationMaker.redo();
}

function copy() {
    animationMaker.copy();
}

function paste() {
    animationMaker.paste();
}

function addFrame() {
    animationMaker.frames.push([]);
    animationMaker.updateFrameTimeline();
    console.log('Frame added');
}

function removeFrame() {
    if (animationMaker.frames.length > 1) {
        animationMaker.frames.splice(animationMaker.currentFrame, 1);
        if (animationMaker.currentFrame >= animationMaker.frames.length) {
            animationMaker.currentFrame = animationMaker.frames.length - 1;
        }
        animationMaker.updateFrameTimeline();
        animationMaker.loadFrame(animationMaker.currentFrame);
        console.log('Frame removed');
    }
}

function copyFrame() {
    const currentFrameData = animationMaker.frames[animationMaker.currentFrame];
    if (currentFrameData) {
        animationMaker.frames.push([...currentFrameData]);
        animationMaker.updateFrameTimeline();
        console.log('Frame copied');
    }
}

function previousFrame() {
    if (animationMaker.currentFrame > 0) {
        animationMaker.selectFrame(animationMaker.currentFrame - 1);
    }
}

function nextFrame() {
    if (animationMaker.currentFrame < animationMaker.frames.length - 1) {
        animationMaker.selectFrame(animationMaker.currentFrame + 1);
    }
}

function playAnimation() {
    if (animationMaker.animationPlaying) return;
    
    animationMaker.animationPlaying = true;
    const speed = document.getElementById('speedControl').value;
    const frameDelay = 1000 / speed;
    
    const playInterval = setInterval(() => {
        if (!animationMaker.animationPlaying) {
            clearInterval(playInterval);
            return;
        }
        
        animationMaker.currentFrame = (animationMaker.currentFrame + 1) % animationMaker.frames.length;
        animationMaker.loadFrame(animationMaker.currentFrame);
        animationMaker.updateFrameTimeline();
    }, frameDelay);
    
    console.log('Animation playing');
}

function stopAnimation() {
    animationMaker.animationPlaying = false;
    console.log('Animation stopped');
}

function toggleSkinning() {
    animationMaker.skinningEnabled = !animationMaker.skinningEnabled;
    console.log('Skinning', animationMaker.skinningEnabled ? 'enabled' : 'disabled');
}

function addLayer() {
    const layerName = `Layer ${animationMaker.layers.length + 1}`;
    animationMaker.layers.push({ name: layerName, visible: true, data: null });
    animationMaker.updateLayersPanel();
    console.log('Layer added:', layerName);
}

function removeLayer(layerIndex) {
    if (animationMaker.layers.length > 1) {
        animationMaker.layers.splice(layerIndex, 1);
        if (animationMaker.currentLayer >= animationMaker.layers.length) {
            animationMaker.currentLayer = animationMaker.layers.length - 1;
        }
        animationMaker.updateLayersPanel();
        console.log('Layer removed');
    }
}

function moveLayerUp(layerIndex) {
    if (layerIndex > 0) {
        const temp = animationMaker.layers[layerIndex];
        animationMaker.layers[layerIndex] = animationMaker.layers[layerIndex - 1];
        animationMaker.layers[layerIndex - 1] = temp;
        animationMaker.updateLayersPanel();
        console.log('Layer moved up');
    }
}

function moveLayerDown(layerIndex) {
    if (layerIndex < animationMaker.layers.length - 1) {
        const temp = animationMaker.layers[layerIndex];
        animationMaker.layers[layerIndex] = animationMaker.layers[layerIndex + 1];
        animationMaker.layers[layerIndex + 1] = temp;
        animationMaker.updateLayersPanel();
        console.log('Layer moved down');
    }
}

function toggleTransparent() {
    // Toggle transparency mode
    console.log('Transparency toggled');
}

// Hide dropdown menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-group')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Speed control
document.getElementById('speedControl').addEventListener('input', (e) => {
    animationMaker.animationSpeed = parseInt(e.target.value);
    console.log('Animation speed set to:', animationMaker.animationSpeed, 'FPS');
});
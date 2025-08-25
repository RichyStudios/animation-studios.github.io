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

        // Object-based system
        this.frames = [];
        this.currentFrame = 0;
        this.selectedObject = null;
        this.isPlaying = false;
        this.playbackSpeed = 12;
        this.playInterval = null;
        this.objectIdCounter = 0;

        // History
        this.history = [];
        this.historyStep = -1;
        this.clipboard = null;

        // Drawing variables
        this.startX = 0;
        this.startY = 0;
        this.currentPath = null;
        this.lastX = 0;
        this.lastY = 0;

        // Transform state
        this.transformMode = null;
        this.transformStart = null;
        this.transformObject = null;
        this.rotateCenter = null;

        // Zoom state
        this.zoom = 1;
        this.zoomMin = 0.2;
        this.zoomMax = 5;
        this.zoomStep = 0.1;

        // Pan state
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.panOffset = { x: 0, y: 0 };

        // Onion skin state
        this.onionSkinEnabled = true;
        this.onionSkinPrev = 1;
        this.onionSkinNext = 1;
        this.onionSkinAlpha = 0.3;

        // Group selection
        this.selectedObjects = [];
        this.groupIdCounter = 0;
        
        // Background settings
        this.backgroundEnabled = false;
        this.backgroundColor = '#ffffff';

        this.initProject();
        this.setupEventListeners();
    }

    initProject() {
        this.frames = [{ objects: [] }];
        this.currentFrame = 0;
        this.selectedObject = null;
        this.selectedObjects = [];
        this.objectIdCounter = 0;
        this.history = [];
        this.clipboard = null;
        this.frameClipboard = null;
        
        // Set fixed canvas dimensions
        this.canvas.width = 1920;
        this.canvas.height = 1080;
        this.overlayCanvas.width = 1920;
        this.overlayCanvas.height = 1080;
        
        // Check if first time user
        if (!localStorage.getItem('animateStudioWelcomed')) {
            document.getElementById('welcomeModal').style.display = 'block';
        } else {
            document.getElementById('welcomeModal').style.display = 'none';
        }
        
        this.updateObjectsList();
        this.updateFramesTimeline();
        this.updateFrameDisplay();
        this.redrawCanvas();
        this.saveState();
    }

    saveState() {
        this.history.push(JSON.parse(JSON.stringify(this.frames)));
        if (this.history.length > 50) {
            this.history.shift();
        }
    }

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
        document.getElementById('copyBtn').addEventListener('click', () => this.copyObject());
        document.getElementById('pasteBtn').addEventListener('click', () => this.pasteObject());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportVideo());
        document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());
        document.getElementById('importImageBtn').addEventListener('click', () => this.importImage());
        document.getElementById('coffeeBtn').addEventListener('click', () => this.openCoffeeSupport());
        document.getElementById('effectsBtn').addEventListener('click', () => this.showEffects());
        
        // Effects modal handlers
        document.getElementById('fireEffectBtn').addEventListener('click', () => this.showComingSoon('Fire'));
        document.getElementById('rainEffectBtn').addEventListener('click', () => this.showRainSettings());
        document.getElementById('snowEffectBtn').addEventListener('click', () => this.showSnowSettings());
        document.getElementById('lightningEffectBtn').addEventListener('click', () => this.showComingSoon('Lightning'));
        document.getElementById('lightBeamEffectBtn').addEventListener('click', () => this.showComingSoon('Light Beam'));
        document.getElementById('smokeEffectBtn').addEventListener('click', () => this.showComingSoon('Smoke'));
        document.getElementById('fogEffectBtn').addEventListener('click', () => this.showComingSoon('Fog'));

        document.getElementById('applyEffectBtn').addEventListener('click', () => this.applyEffectSettings());
        document.getElementById('cancelEffectBtn').addEventListener('click', () => this.hideEffectSettings());
        
        document.getElementById('effectSpeed').addEventListener('input', (e) => {
            document.getElementById('effectSpeedValue').textContent = e.target.value;
        });
        
        // Fire settings handlers
        document.getElementById('applyFireBtn').addEventListener('click', () => this.applyFireSettings());
        document.getElementById('cancelFireBtn').addEventListener('click', () => this.hideFireSettings());
        document.getElementById('fireSpeed').addEventListener('input', (e) => {
            document.getElementById('fireSpeedValue').textContent = e.target.value;
        });
        
        // Additional fire settings
        const fireFlicker = document.getElementById('fireFlicker');
        if (fireFlicker) {
            fireFlicker.addEventListener('input', (e) => {
                const flickerValue = document.getElementById('fireFlickerValue');
                if (flickerValue) flickerValue.textContent = e.target.value + '%';
            });
        }
        
        const fireSize = document.getElementById('fireSize');
        if (fireSize) {
            fireSize.addEventListener('change', (e) => {
                const sizeValue = document.getElementById('fireSizeValue');
                if (sizeValue) sizeValue.textContent = e.target.options[e.target.selectedIndex].text;
            });
        }
        
        // Rain settings handlers
        document.getElementById('applyRainBtn').addEventListener('click', () => this.applyRainSettings());
        document.getElementById('cancelRainBtn').addEventListener('click', () => this.hideRainSettings());
        document.getElementById('rainSpeed').addEventListener('input', (e) => {
            document.getElementById('rainSpeedValue').textContent = e.target.value;
        });
        document.getElementById('rainSize').addEventListener('change', (e) => {
            document.getElementById('rainSizeValue').textContent = e.target.options[e.target.selectedIndex].text;
        });
        
        // Snow settings handlers
        document.getElementById('applySnowBtn').addEventListener('click', () => this.applySnowSettings());
        document.getElementById('cancelSnowBtn').addEventListener('click', () => this.hideSnowSettings());
        document.getElementById('snowSpeed').addEventListener('input', (e) => {
            document.getElementById('snowSpeedValue').textContent = e.target.value;
        });
        document.getElementById('snowSize').addEventListener('change', (e) => {
            document.getElementById('snowSizeValue').textContent = e.target.options[e.target.selectedIndex].text;
        });
        
        // Welcome modal handlers
        document.getElementById('welcomeCloseBtn').addEventListener('click', () => this.closeWelcome());
        document.getElementById('supportBtn').addEventListener('click', () => this.openCoffeeSupport());
        
        // Coming soon modal handler
        document.getElementById('comingSoonCloseBtn').addEventListener('click', () => {
            document.getElementById('comingSoonModal').style.display = 'none';
        });

        // Color inputs with real-time updates
        document.getElementById('primaryColor').addEventListener('input', (e) => {
            this.primaryColor = e.target.value;
            if (this.selectedObject) {
                this.selectedObject.data.color = this.primaryColor;
                this.redrawCanvas();
            }
        });
        
        document.getElementById('secondaryColor').addEventListener('input', (e) => {
            this.secondaryColor = e.target.value;
            if (this.selectedObject) {
                this.selectedObject.data.fillColor = this.secondaryColor;
                this.redrawCanvas();
            }
        });

        // Color presets with right-click support
        document.querySelectorAll('.preset-color').forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.primaryColor = e.target.dataset.color;
                document.getElementById('primaryColor').value = this.primaryColor;
                if (this.selectedObject) {
                    this.selectedObject.data.color = this.primaryColor;
                    this.redrawCanvas();
                }
            });
            preset.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.secondaryColor = e.target.dataset.color;
                document.getElementById('secondaryColor').value = this.secondaryColor;
                if (this.selectedObject) {
                    this.selectedObject.data.fillColor = this.secondaryColor;
                    this.redrawCanvas();
                }
            });
        });

        // Brush settings
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeValue').textContent = this.brushSize;
            if (this.selectedObject && ['pencil', 'eraser', 'line', 'circle', 'square', 'triangle'].includes(this.selectedObject.type)) {
                this.selectedObject.data.lineWidth = this.brushSize;
                this.redrawCanvas();
            }
        });

        document.getElementById('opacity').addEventListener('input', (e) => {
            this.opacity = parseInt(e.target.value) / 100;
            document.getElementById('opacityValue').textContent = e.target.value;
            if (this.selectedObject) {
                this.selectedObject.opacity = this.opacity;
                this.redrawCanvas();
            }
        });

        // Text settings
        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = this.fontSize;
            if (this.selectedObject && this.selectedObject.type === 'text') {
                this.selectedObject.data.fontSize = this.fontSize;
                this.redrawCanvas();
            }
        });

        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.fontFamily = e.target.value;
            if (this.selectedObject && this.selectedObject.type === 'text') {
                this.selectedObject.data.fontFamily = this.fontFamily;
                this.redrawCanvas();
            }
        });

        // Layer controls
        document.getElementById('addLayerBtn').addEventListener('click', () => this.createGroup());
        document.getElementById('moveToFrontBtn').addEventListener('click', () => this.moveToFront());
        document.getElementById('moveUpBtn').addEventListener('click', () => this.moveUp());
        document.getElementById('moveDownBtn').addEventListener('click', () => this.moveDown());
        document.getElementById('moveToBackBtn').addEventListener('click', () => this.moveToBack());
        document.getElementById('removeLayerBtn').addEventListener('click', () => this.deleteSelectedObject());

        // Frame controls
        document.getElementById('addFrameBtn').addEventListener('click', () => this.addFrame());
        document.getElementById('removeFrameBtn').addEventListener('click', () => this.removeFrame());

        // Playback controls
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlayback());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopPlayback());
        document.getElementById('prevFrameBtn').addEventListener('click', () => this.previousFrame());
        document.getElementById('nextFrameBtn').addEventListener('click', () => this.nextFrame());
        document.getElementById('playbackSpeed').addEventListener('input', (e) => {
            this.playbackSpeed = parseInt(e.target.value);
            document.getElementById('fpsDisplay').textContent = this.playbackSpeed;
        });

        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoomResetBtn').addEventListener('click', () => this.resetZoom());
        document.getElementById('fitScreenBtn').addEventListener('click', () => this.resetZoomToFit());

        // Onion skin toggle
        const onionSkinToggle = document.getElementById('onionSkinToggle');
        if (onionSkinToggle) {
            onionSkinToggle.addEventListener('change', (e) => {
                this.onionSkinEnabled = e.target.checked;
                this.redrawCanvas();
            });
        }
        
        // Background controls
        document.getElementById('backgroundToggle').addEventListener('change', (e) => {
            this.backgroundEnabled = e.target.checked;
            this.redrawCanvas();
        });
        
        document.getElementById('backgroundColor').addEventListener('input', (e) => {
            this.backgroundColor = e.target.value;
            if (document.getElementById('allFramesToggle').checked) {
                this.frames.forEach(frame => {
                    frame.backgroundColor = this.backgroundColor;
                });
            } else {
                this.frames[this.currentFrame].backgroundColor = this.backgroundColor;
            }
            this.redrawCanvas();
        });
        
        document.getElementById('allFramesToggle').addEventListener('change', (e) => {
            if (e.target.checked && this.backgroundEnabled) {
                this.frames.forEach(frame => {
                    frame.backgroundColor = this.backgroundColor;
                });
                this.redrawCanvas();
            }
        });
        
        // Context menu background controls
        document.getElementById('contextBackgroundToggle').addEventListener('change', (e) => {
            this.backgroundEnabled = e.target.checked;
            document.getElementById('backgroundToggle').checked = e.target.checked;
            this.redrawCanvas();
        });
        
        document.getElementById('contextBackgroundColor').addEventListener('input', (e) => {
            this.backgroundColor = e.target.value;
            document.getElementById('backgroundColor').value = e.target.value;
            if (document.getElementById('contextAllFramesToggle').checked) {
                this.frames.forEach(frame => {
                    frame.backgroundColor = this.backgroundColor;
                });
            } else {
                this.frames[this.currentFrame].backgroundColor = this.backgroundColor;
            }
            this.redrawCanvas();
        });
        
        document.getElementById('contextAllFramesToggle').addEventListener('change', (e) => {
            document.getElementById('allFramesToggle').checked = e.target.checked;
            if (e.target.checked && this.backgroundEnabled) {
                this.frames.forEach(frame => {
                    frame.backgroundColor = this.backgroundColor;
                });
                this.redrawCanvas();
            }
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Prevent context menu on middle click
        this.canvas.addEventListener('auxclick', (e) => {
            if (e.button === 1) e.preventDefault();
        });
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.currentTool === 'flood-fill') {
                this.handleMouseDown(e);
            } else {
                this.showContextMenu(e);
            }
        });
        
        // Hide context menu on click elsewhere
        document.addEventListener('click', () => {
            document.getElementById('contextMenu').style.display = 'none';
        });

        // Modal controls
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        
        document.getElementById('aboutModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('aboutModal')) {
                this.closeModal();
            }
        });
        
        document.getElementById('effectsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('effectsModal')) {
                document.getElementById('effectsModal').style.display = 'none';
            }
        });
        
        document.getElementById('fireSettingsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('fireSettingsModal')) {
                document.getElementById('fireSettingsModal').style.display = 'none';
            }
        });
        
        document.getElementById('rainSettingsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('rainSettingsModal')) {
                document.getElementById('rainSettingsModal').style.display = 'none';
            }
        });
        
        document.getElementById('snowSettingsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('snowSettingsModal')) {
                document.getElementById('snowSettingsModal').style.display = 'none';
            }
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.currentTool === 'move' && !this.isDrawing) {
                this.updateMoveToolCursor(e);
            }
        });
    }

    // Object management
    createObject(type, data) {
        const obj = {
            id: ++this.objectIdCounter,
            type: type,
            data: data,
            x: data.x || 0,
            y: data.y || 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            visible: true
        };
        this.frames[this.currentFrame].objects.push(obj);
        this.selectedObject = obj;
        return obj;
    }

    deleteSelectedObject() {
        if (this.selectedObject) {

            
            const objects = this.frames[this.currentFrame].objects;
            const index = objects.findIndex(obj => obj.id === this.selectedObject.id);
            if (index !== -1) {
                objects.splice(index, 1);
                this.selectedObject = null;
                this.updateObjectsList();
                this.redrawCanvas();
            }
        }
    }

    duplicateSelectedObject() {
        if (this.selectedObject) {
            const newObj = JSON.parse(JSON.stringify(this.selectedObject));
            newObj.id = ++this.objectIdCounter;
            newObj.x += 20;
            newObj.y += 20;
            this.frames[this.currentFrame].objects.push(newObj);
            this.selectedObject = newObj;
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }

    findObjectAtPosition(x, y) {
        const objects = this.frames[this.currentFrame].objects;
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            if (!obj.visible) continue;
            
            if (['circle', 'semicircle', 'star'].includes(obj.type)) {
                const bounds = this.getObjectBounds(obj);
                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    return obj;
                }
            } else if (obj.type === 'group') {
                const bounds = this.getObjectBounds(obj);
                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    return obj;
                }
            } else if (obj.type === 'path' && obj.data?.points) {
                if (this.isPointInPath(x, y, obj.data.points, obj.data.closed)) {
                    return obj;
                }
            } else {
                const bounds = this.getObjectBounds(obj);
                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    return obj;
                }
            }
        }
        return null;
    }

    getObjectBounds(obj) {
        if (obj.type === 'group' && obj.objects) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            obj.objects.forEach(groupObj => {
                const bounds = this.getObjectBounds(groupObj);
                minX = Math.min(minX, bounds.x);
                minY = Math.min(minY, bounds.y);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            });
            return {
                x: minX + obj.x,
                y: minY + obj.y,
                width: maxX - minX,
                height: maxY - minY
            };
        }
        
        if ((obj.type === 'path' || obj.type === 'eraserPath') && obj.data.points) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            obj.data.points.forEach(point => {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            });
            const padding = (obj.data.lineWidth || 5) / 2;
            return {
                x: minX - padding,
                y: minY - padding,
                width: maxX - minX + padding * 2,
                height: maxY - minY + padding * 2
            };
        }
        
        // For lines, calculate bounds from actual coordinates
        if (obj.type === 'line' && obj.data.startX !== undefined) {
            const minX = Math.min(obj.data.startX, obj.data.endX);
            const maxX = Math.max(obj.data.startX, obj.data.endX);
            const minY = Math.min(obj.data.startY, obj.data.endY);
            const maxY = Math.max(obj.data.startY, obj.data.endY);
            const padding = (obj.data.lineWidth || 5) / 2;
            return {
                x: obj.x + minX - padding,
                y: obj.y + minY - padding,
                width: maxX - minX + padding * 2,
                height: maxY - minY + padding * 2
            };
        }
        
        // For circular shapes, use width/height for proper bounds
        if (['circle', 'semicircle', 'star'].includes(obj.type)) {
            const width = obj.data.width || 50;
            const height = obj.data.height || 50;
            return {
                x: obj.x - width/2,
                y: obj.y - height/2,
                width: width,
                height: height
            };
        }
        
        const width = obj.data?.width || 50;
        const height = obj.data?.height || 50;
        return {
            x: obj.x - width/2,
            y: obj.y - height/2,
            width: width,
            height: height
        };
    }

    // Drawing
    redrawCanvas() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // Draw background if enabled
        if (this.backgroundEnabled) {
            const bgColor = this.frames[this.currentFrame].backgroundColor || this.backgroundColor;
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);

        // Onion skinning
        if (this.onionSkinEnabled) {
            for (let i = 1; i <= this.onionSkinPrev; i++) {
                const prevIndex = this.currentFrame - i;
                if (prevIndex >= 0) {
                    this.ctx.globalAlpha = this.onionSkinAlpha;
                    this.drawFrameObjects(this.frames[prevIndex]);
                }
            }
        }

        // Draw current frame objects
        this.ctx.globalAlpha = 1;
        this.drawFrameObjects(this.frames[this.currentFrame]);
        
        this.ctx.restore();

        // Draw transform handles on overlay
        this.drawTransformHandles();
    }

    drawFrameObjects(frame) {
        if (!frame || !frame.objects) return;
        
        frame.objects.forEach(obj => {
            if (!obj.visible) return;
            
            this.ctx.save();
            
            // Apply opacity
            if (obj.opacity !== undefined && obj.opacity < 1) {
                this.ctx.globalAlpha = obj.opacity;
            }
            
            // Apply mask effect
            if (obj.isMask) {
                this.ctx.globalCompositeOperation = 'destination-in';
            }
            
            this.ctx.translate(obj.x, obj.y);
            this.ctx.rotate(obj.rotation);
            this.ctx.scale(obj.scaleX, obj.scaleY);
            
            this.drawObject(obj);
            this.ctx.restore();
        });
    }

    drawObject(obj) {
        this.ctx.strokeStyle = obj.data.color || this.primaryColor;
        this.ctx.fillStyle = obj.data.color || this.primaryColor;
        this.ctx.lineWidth = obj.data.lineWidth || this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        const w = obj.data.width || 50;
        const h = obj.data.height || 50;

        switch (obj.type) {
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(obj.data.startX || -w/2, obj.data.startY || -h/2);
                this.ctx.lineTo(obj.data.endX || w/2, obj.data.endY || h/2);
                this.ctx.stroke();
                break;
            case 'circle':
                this.ctx.beginPath();
                const radiusX = obj.data.radiusX || w/2;
                const radiusY = obj.data.radiusY || h/2;
                this.ctx.save();
                this.ctx.scale(radiusX / Math.max(radiusX, radiusY), radiusY / Math.max(radiusX, radiusY));
                this.ctx.arc(0, 0, Math.max(radiusX, radiusY), 0, 2 * Math.PI);
                this.ctx.restore();
                if (obj.data.fillColor) {
                    this.ctx.fillStyle = obj.data.fillColor;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;
            case 'semicircle':
                this.ctx.beginPath();
                const semiRadiusX = obj.data.radiusX || w/2;
                const semiRadiusY = obj.data.radiusY || h/2;
                this.ctx.save();
                this.ctx.scale(semiRadiusX / Math.max(semiRadiusX, semiRadiusY), semiRadiusY / Math.max(semiRadiusX, semiRadiusY));
                this.ctx.arc(0, 0, Math.max(semiRadiusX, semiRadiusY), 0, Math.PI);
                this.ctx.restore();
                this.ctx.closePath();
                if (obj.data.fillColor) {
                    this.ctx.fillStyle = obj.data.fillColor;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;
            case 'square':
                this.ctx.beginPath();
                this.ctx.rect(-w/2, -h/2, w, h);
                if (obj.data.fillColor) {
                    this.ctx.fillStyle = obj.data.fillColor;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -h/2);
                this.ctx.lineTo(-w/2, h/2);
                this.ctx.lineTo(w/2, h/2);
                this.ctx.closePath();
                if (obj.data.fillColor) {
                    this.ctx.fillStyle = obj.data.fillColor;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;
            case 'star':
                const starRadiusX = obj.data.radiusX || w/2;
                const starRadiusY = obj.data.radiusY || h/2;
                this.ctx.save();
                this.ctx.scale(starRadiusX / Math.max(starRadiusX, starRadiusY), starRadiusY / Math.max(starRadiusX, starRadiusY));
                const maxRadius = Math.max(starRadiusX, starRadiusY);
                this.drawStar(0, 0, 5, maxRadius, maxRadius * 0.4, obj.data.fillColor);
                this.ctx.restore();
                break;
            case 'arrow':
                this.drawArrow(-w/2, 0, w/2, 0, obj.data.fillColor);
                break;
            case 'text':
                this.ctx.font = `${obj.data.fontSize}px ${obj.data.fontFamily}`;
                this.ctx.fillText(obj.data.text, -w/2, 0);
                break;
            case 'path':
                if (obj.data.points && obj.data.points.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(obj.data.points[0].x, obj.data.points[0].y);
                    for (let i = 1; i < obj.data.points.length; i++) {
                        this.ctx.lineTo(obj.data.points[i].x, obj.data.points[i].y);
                    }
                    if (obj.data.closed) {
                        this.ctx.closePath();
                        if (obj.data.fillColor) {
                            this.ctx.fillStyle = obj.data.fillColor;
                            this.ctx.fill();
                        }
                    }
                    this.ctx.stroke();
                }
                break;
            case 'eraserPath':
                if (obj.data.points && obj.data.points.length > 1) {
                    this.ctx.globalCompositeOperation = 'destination-out';
                    this.ctx.beginPath();
                    this.ctx.moveTo(obj.data.points[0].x, obj.data.points[0].y);
                    for (let i = 1; i < obj.data.points.length; i++) {
                        this.ctx.lineTo(obj.data.points[i].x, obj.data.points[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.globalCompositeOperation = 'source-over';
                }
                break;
            case 'pencil':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, obj.data.lineWidth, 0, 2 * Math.PI);
                this.ctx.fill();
                break;
            case 'flood-fill':
                this.ctx.beginPath();
                this.ctx.rect(-w/2, -h/2, w, h);
                if (obj.data.fillColor) {
                    this.ctx.fillStyle = obj.data.fillColor;
                }
                this.ctx.fill();
                break;
            case 'group':
                if (obj.objects) {
                    obj.objects.forEach(groupObj => {
                        if (groupObj.visible) {
                            this.ctx.save();
                            this.ctx.translate(groupObj.x, groupObj.y);
                            this.ctx.rotate(groupObj.rotation);
                            this.ctx.scale(groupObj.scaleX, groupObj.scaleY);
                            this.drawObject(groupObj);
                            this.ctx.restore();
                        }
                    });
                }
                break;
            case 'eraser':
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, obj.data.lineWidth, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.globalCompositeOperation = 'source-over';
                break;

            case 'raindrop':
                this.ctx.beginPath();
                const dropWidth = obj.data.width || 5;
                const dropHeight = obj.data.height || 15;
                
                // Draw realistic teardrop shape with highlight
                this.ctx.moveTo(0, -dropHeight/2);
                this.ctx.quadraticCurveTo(-dropWidth/2, -dropHeight/4, -dropWidth/2, dropHeight/4);
                this.ctx.quadraticCurveTo(-dropWidth/4, dropHeight/2, 0, dropHeight/2);
                this.ctx.quadraticCurveTo(dropWidth/4, dropHeight/2, dropWidth/2, dropHeight/4);
                this.ctx.quadraticCurveTo(dropWidth/2, -dropHeight/4, 0, -dropHeight/2);
                this.ctx.closePath();
                
                // Add gradient for 3D effect
                const dropGradient = this.ctx.createRadialGradient(-dropWidth/4, -dropHeight/4, 0, 0, 0, dropWidth);
                dropGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                dropGradient.addColorStop(0.3, obj.data.fillColor || obj.data.color || '#4a90e2');
                dropGradient.addColorStop(1, 'rgba(0, 0, 139, 0.9)');
                
                this.ctx.fillStyle = dropGradient;
                this.ctx.fill();
                
                // Add subtle outline
                this.ctx.strokeStyle = 'rgba(0, 0, 139, 0.3)';
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
                break;
            case 'snowflake':
                this.ctx.beginPath();
                const flakeSize = obj.data.width || 8;
                
                // Draw detailed snowflake with 6 main arms
                this.ctx.strokeStyle = obj.data.color || '#ffffff';
                this.ctx.lineWidth = 1.5;
                this.ctx.lineCap = 'round';
                
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    
                    // Main arm
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(cos * flakeSize, sin * flakeSize);
                    
                    // Inner branches at 1/3 and 2/3 points
                    for (let j = 0.3; j <= 0.7; j += 0.4) {
                        const branchX = cos * flakeSize * j;
                        const branchY = sin * flakeSize * j;
                        const branchLength = flakeSize * 0.25;
                        
                        // Left branch
                        this.ctx.moveTo(branchX, branchY);
                        this.ctx.lineTo(
                            branchX + Math.cos(angle + Math.PI/4) * branchLength,
                            branchY + Math.sin(angle + Math.PI/4) * branchLength
                        );
                        
                        // Right branch
                        this.ctx.moveTo(branchX, branchY);
                        this.ctx.lineTo(
                            branchX + Math.cos(angle - Math.PI/4) * branchLength,
                            branchY + Math.sin(angle - Math.PI/4) * branchLength
                        );
                    }
                    
                    // Tip decoration
                    const tipX = cos * flakeSize;
                    const tipY = sin * flakeSize;
                    this.ctx.moveTo(tipX, tipY);
                    this.ctx.lineTo(
                        tipX + Math.cos(angle + Math.PI/2) * flakeSize * 0.15,
                        tipY + Math.sin(angle + Math.PI/2) * flakeSize * 0.15
                    );
                    this.ctx.moveTo(tipX, tipY);
                    this.ctx.lineTo(
                        tipX + Math.cos(angle - Math.PI/2) * flakeSize * 0.15,
                        tipY + Math.sin(angle - Math.PI/2) * flakeSize * 0.15
                    );
                }
                
                this.ctx.stroke();
                
                // Add center dot
                this.ctx.beginPath();
                this.ctx.arc(0, 0, flakeSize * 0.1, 0, 2 * Math.PI);
                this.ctx.fillStyle = obj.data.color || '#ffffff';
                this.ctx.fill();
                break;
            case 'flame':
                const flameSize = obj.data.width || 80;
                const time = Date.now() * 0.003;
                
                this.ctx.save();
                
                // Create flame gradient
                const gradient = this.ctx.createLinearGradient(0, flameSize/2, 0, -flameSize/2);
                gradient.addColorStop(0, '#ff4500');
                gradient.addColorStop(0.3, '#ff6500');
                gradient.addColorStop(0.6, '#ffaa00');
                gradient.addColorStop(0.8, '#ffdd00');
                gradient.addColorStop(1, '#fff200');
                
                this.ctx.fillStyle = gradient;
                
                // Draw flame shape with animation
                this.ctx.beginPath();
                const points = 12;
                for (let i = 0; i <= points; i++) {
                    const angle = (i / points) * Math.PI;
                    const baseRadius = flameSize * 0.4;
                    const flicker = Math.sin(time * 4 + i) * 8;
                    const radius = baseRadius + flicker;
                    
                    const x = Math.sin(angle) * radius;
                    const y = -Math.cos(angle) * radius * 1.5;
                    
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.fill();
                
                // Add inner glow
                const innerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, flameSize * 0.3);
                innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.ctx.fillStyle = innerGradient;
                this.ctx.fill();
                
                this.ctx.restore();
                break;
            case 'image':
                if (obj.data.image) {
                    this.ctx.save();
                    
                    // Apply glow effect if enabled
                    if (obj.data.hasGlow) {
                        this.ctx.shadowColor = '#ff6b35';
                        this.ctx.shadowBlur = 20;
                        this.ctx.shadowOffsetX = 0;
                        this.ctx.shadowOffsetY = 0;
                    }
                    
                    if (obj.data.isAnimated && obj.data.src) {
                        // Create fresh image for GIF animation
                        const animImg = new Image();
                        animImg.src = obj.data.src + '?' + Date.now();
                        animImg.onload = () => {
                            this.ctx.drawImage(animImg, -obj.data.width/2, -obj.data.height/2, obj.data.width, obj.data.height);
                        };
                        // Fallback to original
                        this.ctx.drawImage(obj.data.image, -obj.data.width/2, -obj.data.height/2, obj.data.width, obj.data.height);
                    } else {
                        // Static image
                        this.ctx.drawImage(obj.data.image, -obj.data.width/2, -obj.data.height/2, obj.data.width, obj.data.height);
                    }
                    
                    this.ctx.restore();
                }
                break;
        }
    }

    initFireParticles(obj, flameSize) {
        const particles = [];
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: (Math.random() - 0.5) * flameSize * 0.8,
                y: flameSize * 0.3,
                life: Math.random(),
                size: Math.random() * 8 + 4,
                speed: Math.random() * 2 + 1
            });
        }
        obj.particles = particles;
        return particles;
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius, fillColor) {
        const angleStep = (Math.PI * 2) / (spikes * 2);
        let angle = -Math.PI / 2; // Start at top
        
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            angle += angleStep;
        }
        
        this.ctx.closePath();
        
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    drawArrow(fromX, fromY, toX, toY, fillColor) {
        const headLength = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // Draw arrow shaft
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();
        
        // Draw arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    drawTransformHandles() {
        if ((this.currentTool !== 'move' && this.currentTool !== 'bone') || !this.selectedObject) return;
        
        const bounds = this.getObjectBounds(this.selectedObject);
        
        this.overlayCtx.save();
        this.overlayCtx.scale(this.zoom, this.zoom);
        


        const size = 8 / this.zoom;
        
        // Special handling for lines - show endpoint handles
        if (this.selectedObject.type === 'line' && this.selectedObject.data.startX !== undefined) {
            const startX = this.selectedObject.x + this.selectedObject.data.startX;
            const startY = this.selectedObject.y + this.selectedObject.data.startY;
            const endX = this.selectedObject.x + this.selectedObject.data.endX;
            const endY = this.selectedObject.y + this.selectedObject.data.endY;
            
            // Draw line preview
            this.overlayCtx.strokeStyle = '#4f46e5';
            this.overlayCtx.lineWidth = 2 / this.zoom;
            this.overlayCtx.setLineDash([8 / this.zoom, 4 / this.zoom]);
            this.overlayCtx.beginPath();
            this.overlayCtx.moveTo(startX, startY);
            this.overlayCtx.lineTo(endX, endY);
            this.overlayCtx.stroke();
            this.overlayCtx.setLineDash([]);
            
            // Draw endpoint handles
            this.overlayCtx.fillStyle = '#ffffff';
            this.overlayCtx.strokeStyle = '#4f46e5';
            this.overlayCtx.lineWidth = 2 / this.zoom;
            
            // Start point handle
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(startX, startY, size/2, 0, 2 * Math.PI);
            this.overlayCtx.fill();
            this.overlayCtx.stroke();
            
            // End point handle
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(endX, endY, size/2, 0, 2 * Math.PI);
            this.overlayCtx.fill();
            this.overlayCtx.stroke();
        } else {
            // Regular bounding box for other shapes
            this.overlayCtx.strokeStyle = '#4f46e5';
            this.overlayCtx.lineWidth = 2 / this.zoom;
            this.overlayCtx.setLineDash([8 / this.zoom, 4 / this.zoom]);
            this.overlayCtx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            this.overlayCtx.setLineDash([]);

            // Draw corner handles
            const corners = [
                { x: bounds.x, y: bounds.y },
                { x: bounds.x + bounds.width, y: bounds.y },
                { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
                { x: bounds.x, y: bounds.y + bounds.height }
            ];

            this.overlayCtx.fillStyle = '#ffffff';
            this.overlayCtx.strokeStyle = '#4f46e5';
            this.overlayCtx.lineWidth = 2 / this.zoom;
            corners.forEach(corner => {
                this.overlayCtx.fillRect(corner.x - size/2, corner.y - size/2, size, size);
                this.overlayCtx.strokeRect(corner.x - size/2, corner.y - size/2, size, size);
            });

            // Draw rotate handle
            const rotateX = bounds.x + bounds.width / 2;
            const rotateY = bounds.y - 25 / this.zoom;
            
            this.overlayCtx.beginPath();
            this.overlayCtx.moveTo(bounds.x + bounds.width / 2, bounds.y);
            this.overlayCtx.lineTo(rotateX, rotateY);
            this.overlayCtx.stroke();
            
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(rotateX, rotateY, size/2, 0, 2 * Math.PI);
            this.overlayCtx.fillStyle = '#22c55e';
            this.overlayCtx.fill();
            this.overlayCtx.strokeStyle = '#16a34a';
            this.overlayCtx.stroke();
        }

        this.overlayCtx.restore();
    }

    // Mouse handling
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX / this.zoom,
            y: (e.clientY - rect.top) * scaleY / this.zoom
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        
        // Middle mouse button for panning
        if (e.button === 1) {
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }
        
        this.isDrawing = true;
        this.startX = pos.x;
        this.startY = pos.y;

        if (this.currentTool === 'flood-fill') {
            const clickedObject = this.findObjectAtPosition(pos.x, pos.y);
            const fillColor = e.button === 2 ? this.secondaryColor : this.primaryColor;
            
            if (clickedObject) {
                if (e.button === 2) {
                    clickedObject.data.fillColor = fillColor;
                } else {
                    clickedObject.data.color = fillColor;
                }
                this.selectedObject = clickedObject;
                this.updatePropertiesPanel();
                this.updateObjectsList();
                this.redrawCanvas();
                this.saveState();
            }
            return;
        }

        if (this.currentTool === 'zoom-in') {
            this.zoomInAtPoint(pos.x, pos.y);
            return;
        }

        if (this.currentTool === 'zoom-out') {
            this.zoomOutAtPoint(pos.x, pos.y);
            return;
        }

        if (this.currentTool === 'zoom-reset') {
            this.resetZoomToFit();
            return;
        }

        if (this.currentTool === 'move' || this.currentTool === 'bone') {
            if (this.selectedObject) {
                const bounds = this.getObjectBounds(this.selectedObject);
                const rotateX = bounds.x + bounds.width / 2;
                const rotateY = bounds.y - 25;
                
                // Only show transform handles for move tool, not bone tool
                if (this.currentTool === 'move') {
                    // Special handling for lines and bones
                    if (this.selectedObject.type === 'line' && this.selectedObject.data.startX !== undefined) {
                        const startX = this.selectedObject.x + this.selectedObject.data.startX;
                        const startY = this.selectedObject.y + this.selectedObject.data.startY;
                        const endX = this.selectedObject.x + this.selectedObject.data.endX;
                        const endY = this.selectedObject.y + this.selectedObject.data.endY;
                        
                        if (Math.abs(pos.x - startX) < 15 && Math.abs(pos.y - startY) < 15) {
                            this.transformMode = 'lineStart';
                            this.transformStart = { x: pos.x, y: pos.y };
                            return;
                        }
                        
                        if (Math.abs(pos.x - endX) < 15 && Math.abs(pos.y - endY) < 15) {
                            this.transformMode = 'lineEnd';
                            this.transformStart = { x: pos.x, y: pos.y };
                            return;
                        }

                    } else {
                        // Check rotate handle for non-line objects
                        if (Math.abs(pos.x - rotateX) < 15 && Math.abs(pos.y - rotateY) < 15) {
                            this.transformMode = 'rotate';
                            this.transformStart = { x: pos.x, y: pos.y };
                            const centerX = this.selectedObject.type === 'group' ? bounds.x + bounds.width/2 : this.selectedObject.x;
                            const centerY = this.selectedObject.type === 'group' ? bounds.y + bounds.height/2 : this.selectedObject.y;
                            this.rotateStartAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
                            this.rotateCenter = { x: centerX, y: centerY };
                            return;
                        }
                        
                        // Check resize handles for non-line objects
                        const corners = [
                            { x: bounds.x, y: bounds.y, handle: 'tl' },
                            { x: bounds.x + bounds.width, y: bounds.y, handle: 'tr' },
                            { x: bounds.x + bounds.width, y: bounds.y + bounds.height, handle: 'br' },
                            { x: bounds.x, y: bounds.y + bounds.height, handle: 'bl' }
                        ];
                        
                        for (const corner of corners) {
                            if (Math.abs(pos.x - corner.x) < 15 && Math.abs(pos.y - corner.y) < 15) {
                                this.transformMode = 'resize';
                                this.resizeHandle = corner.handle;
                                this.transformStart = { x: pos.x, y: pos.y };
                                this.initialBounds = { ...bounds };
                                return;
                            }
                        }
                    }
                }
            }
            
            const clickedObject = this.findObjectAtPosition(pos.x, pos.y);
            
            // Bone tool only selects drawn objects (paths and eraserPaths)

            
            if (clickedObject) {
                this.selectedObject = clickedObject;
                this.transformMode = 'move';
                this.transformStart = { x: pos.x, y: pos.y };
                this.updatePropertiesPanel();
                this.updateObjectsList();
                this.redrawCanvas();
            } else {
                this.selectedObject = null;
                this.updateObjectsList();
                this.redrawCanvas();
            }
            return;
        }

        // Create new object for drawing tools
        if (['line', 'circle', 'square', 'triangle', 'star', 'arrow'].includes(this.currentTool)) {
            // Will create object on mouse up
        } else if (this.currentTool === 'text') {
            const text = prompt('Enter text:');
            if (text) {
                this.createObject('text', {
                    text: text,
                    fontSize: this.fontSize,
                    fontFamily: this.fontFamily,
                    color: this.primaryColor,
                    x: pos.x,
                    y: pos.y,
                    width: text.length * this.fontSize * 0.6,
                    height: this.fontSize
                });
                this.saveState();
                this.updateObjectsList();
                this.redrawCanvas();
            }
        } else if (this.currentTool === 'pencil') {
            this.currentPath = {
                points: [{ x: pos.x, y: pos.y }],
                color: this.primaryColor,
                lineWidth: this.brushSize,
                opacity: this.opacity
            };
            this.lastX = pos.x;
            this.lastY = pos.y;
        } else if (this.currentTool === 'eraser') {
            this.currentPath = {
                points: [{ x: pos.x, y: pos.y }],
                lineWidth: this.brushSize,
                type: 'eraser'
            };
            this.lastX = pos.x;
            this.lastY = pos.y;
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        
        // Handle panning
        if (this.isPanning) {
            const deltaX = e.clientX - this.panStart.x;
            const deltaY = e.clientY - this.panStart.y;
            
            this.panOffset.x += deltaX;
            this.panOffset.y += deltaY;
            
            this.applyPan();
            
            this.panStart = { x: e.clientX, y: e.clientY };
            return;
        }
        
        if (!this.isDrawing) return;

        if ((this.currentTool === 'move' || this.currentTool === 'bone') && this.selectedObject) {
            if (this.transformMode === 'move') {
                const dx = pos.x - this.transformStart.x;
                const dy = pos.y - this.transformStart.y;
                
                if (this.selectedObject.type === 'group') {
                    this.selectedObject.objects.forEach(groupObj => {
                        groupObj.x += dx;
                        groupObj.y += dy;
                    });
                } else if (this.selectedObject.type === 'path' || this.selectedObject.type === 'eraserPath') {
                    // Move all points in the path
                    this.selectedObject.data.points.forEach(point => {
                        point.x += dx;
                        point.y += dy;
                    });

                } else {
                    this.selectedObject.x += dx;
                    this.selectedObject.y += dy;
                }
                
                this.transformStart = { x: pos.x, y: pos.y };
                this.redrawCanvas();
            } else if (this.transformMode === 'rotate') {
                const currentAngle = Math.atan2(pos.y - this.rotateCenter.y, pos.x - this.rotateCenter.x);
                const deltaAngle = currentAngle - this.rotateStartAngle;
                
                if (this.selectedObject.type === 'group') {
                    this.selectedObject.objects.forEach(groupObj => {
                        // Rotate each object around the group center
                        const dx = groupObj.x - this.rotateCenter.x;
                        const dy = groupObj.y - this.rotateCenter.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx) + deltaAngle;
                        
                        groupObj.x = this.rotateCenter.x + Math.cos(angle) * distance;
                        groupObj.y = this.rotateCenter.y + Math.sin(angle) * distance;
                        groupObj.rotation += deltaAngle;
                    });
                } else {
                    this.selectedObject.rotation += deltaAngle;
                }
                
                this.rotateStartAngle = currentAngle;
                this.redrawCanvas();
            } else if (this.transformMode === 'lineStart') {
                const dx = pos.x - this.transformStart.x;
                const dy = pos.y - this.transformStart.y;
                this.selectedObject.data.startX += dx;
                this.selectedObject.data.startY += dy;
                this.transformStart = { x: pos.x, y: pos.y };
                this.redrawCanvas();
            } else if (this.transformMode === 'lineEnd') {
                const dx = pos.x - this.transformStart.x;
                const dy = pos.y - this.transformStart.y;
                this.selectedObject.data.endX += dx;
                this.selectedObject.data.endY += dy;
                this.transformStart = { x: pos.x, y: pos.y };
                this.redrawCanvas();

            } else if (this.transformMode === 'resize') {
                const dx = pos.x - this.transformStart.x;
                const dy = pos.y - this.transformStart.y;
                const bounds = this.initialBounds;
                
                let newWidth = bounds.width;
                let newHeight = bounds.height;
                
                switch (this.resizeHandle) {
                    case 'br':
                        newWidth = bounds.width + dx;
                        newHeight = bounds.height + dy;
                        break;
                    case 'bl':
                        newWidth = bounds.width - dx;
                        newHeight = bounds.height + dy;
                        break;
                    case 'tr':
                        newWidth = bounds.width + dx;
                        newHeight = bounds.height - dy;
                        break;
                    case 'tl':
                        newWidth = bounds.width - dx;
                        newHeight = bounds.height - dy;
                        break;
                }
                
                newWidth = Math.max(10, newWidth);
                newHeight = Math.max(10, newHeight);
                
                this.selectedObject.data.width = newWidth;
                this.selectedObject.data.height = newHeight;
                
                // Update radius for circular shapes to allow stretching
                if (['circle', 'semicircle', 'star'].includes(this.selectedObject.type)) {
                    this.selectedObject.data.radiusX = newWidth / 2;
                    this.selectedObject.data.radiusY = newHeight / 2;
                }
                
                this.redrawCanvas();
            }
        } else if ((this.currentTool === 'pencil' || this.currentTool === 'eraser') && this.currentPath) {
            this.currentPath.points.push({ x: pos.x, y: pos.y });
            this.drawSmoothLine();
            this.lastX = pos.x;
            this.lastY = pos.y;
        } else if (['line', 'circle', 'semicircle', 'square', 'triangle', 'star', 'arrow'].includes(this.currentTool) && this.isDrawing) {
            this.drawShapePreview(pos.x, pos.y);
        }
    }

    handleMouseUp(e) {
        // Handle pan end
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
            return;
        }
        
        // Clear shape preview
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // Don't clear selection for move tool
        if (this.currentTool === 'move' && this.selectedObject) {
            this.transformMode = null;
            this.isDrawing = false;
            this.redrawCanvas();
            return;
        }
        if (!this.isDrawing) return;
        this.isDrawing = false;

        const pos = this.getMousePos(e);

        if (this.currentTool === 'move') {
            this.transformMode = null;
            this.resizeHandle = null;
            this.initialBounds = null;
            return;
        }

        // Create shape objects
        if (['line', 'circle', 'semicircle', 'square', 'triangle', 'star', 'arrow'].includes(this.currentTool)) {
            const width = Math.abs(pos.x - this.startX);
            const height = Math.abs(pos.y - this.startY);
            const centerX = (this.startX + pos.x) / 2;
            const centerY = (this.startY + pos.y) / 2;
            const distance = Math.sqrt(width * width + height * height);

            if (distance > 10) {
                const shapeData = {
                    width: Math.max(width, 10),
                    height: Math.max(height, 10),
                    color: this.primaryColor,
                    fillColor: this.secondaryColor,
                    lineWidth: this.brushSize,
                    x: centerX,
                    y: centerY
                };
                
                // For lines, store actual coordinates relative to center
                if (this.currentTool === 'line') {
                    shapeData.startX = this.startX - centerX;
                    shapeData.startY = this.startY - centerY;
                    shapeData.endX = pos.x - centerX;
                    shapeData.endY = pos.y - centerY;
                }
                
                // For circular shapes, store the diagonal distance
                if (['circle', 'semicircle', 'star'].includes(this.currentTool)) {
                    shapeData.radius = distance / 2;
                }
                
                this.createObject(this.currentTool, shapeData);
                this.saveState();
                this.updateObjectsList();
                this.redrawCanvas();
            }
        } else if (this.currentTool === 'pencil' && this.currentPath) {
            const points = this.currentPath.points;
            const firstPoint = points[0];
            const lastPoint = points[points.length - 1];
            const distance = Math.sqrt(Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2));
            const isClosed = distance < 20 && points.length > 10;
            
            this.createObject('path', {
                points: this.currentPath.points,
                color: this.currentPath.color,
                lineWidth: this.currentPath.lineWidth,
                opacity: this.currentPath.opacity,
                closed: isClosed,
                x: 0,
                y: 0,
                width: 100,
                height: 100
            });
            this.currentPath = null;
            this.saveState();
            this.updateObjectsList();
            this.redrawCanvas();
        } else if (this.currentTool === 'flood-fill') {
            // Fill tool handled in mousedown
        }
    }

    updateMoveToolCursor(e) {
        if (this.currentTool !== 'move') return;
        
        const pos = this.getMousePos(e);
        
        if (this.selectedObject) {
            const bounds = this.getObjectBounds(this.selectedObject);
            const rotateX = bounds.x + bounds.width / 2;
            const rotateY = bounds.y - 25;
            
            // Check rotate handle
            if (Math.abs(pos.x - rotateX) < 12 && Math.abs(pos.y - rotateY) < 12) {
                this.canvas.style.cursor = 'grab';
                return;
            }
            
            // Check resize handles
            const corners = [
                { x: bounds.x, y: bounds.y, cursor: 'nw-resize' },
                { x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize' },
                { x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'se-resize' },
                { x: bounds.x, y: bounds.y + bounds.height, cursor: 'sw-resize' }
            ];
            
            for (const corner of corners) {
                if (Math.abs(pos.x - corner.x) < 12 && Math.abs(pos.y - corner.y) < 12) {
                    this.canvas.style.cursor = corner.cursor;
                    return;
                }
            }
            
            // Check if over selected object
            if (pos.x >= bounds.x && pos.x <= bounds.x + bounds.width &&
                pos.y >= bounds.y && pos.y <= bounds.y + bounds.height) {
                this.canvas.style.cursor = 'move';
                return;
            }
        }
        
        const obj = this.findObjectAtPosition(pos.x, pos.y);
        this.canvas.style.cursor = obj ? 'pointer' : 'default';
    }

    updateCanvasCursor() {
        switch (this.currentTool) {
            case 'move': this.canvas.style.cursor = 'default'; break;
            case 'bone': this.canvas.style.cursor = 'grab'; break;
            case 'text': this.canvas.style.cursor = 'text'; break;
            case 'zoom-in': this.canvas.style.cursor = 'zoom-in'; break;
            case 'zoom-out': this.canvas.style.cursor = 'zoom-out'; break;
            case 'zoom-reset': this.canvas.style.cursor = 'crosshair'; break;
            default: this.canvas.style.cursor = 'crosshair'; break;
        }
    }

    updatePropertiesPanel() {
        if (!this.selectedObject) return;
        
        const obj = this.selectedObject;
        
        // Update color
        if (obj.data.color) {
            document.getElementById('primaryColor').value = obj.data.color;
            this.primaryColor = obj.data.color;
        }
        
        // Update brush size
        if (obj.data.lineWidth) {
            document.getElementById('brushSize').value = obj.data.lineWidth;
            document.getElementById('brushSizeValue').textContent = obj.data.lineWidth;
            this.brushSize = obj.data.lineWidth;
        }
        
        // Update opacity
        if (obj.opacity !== undefined) {
            const opacityPercent = Math.round(obj.opacity * 100);
            document.getElementById('opacity').value = opacityPercent;
            document.getElementById('opacityValue').textContent = opacityPercent;
            this.opacity = obj.opacity;
        }
        
        // Update text properties
        if (obj.type === 'text') {
            if (obj.data.fontSize) {
                document.getElementById('fontSize').value = obj.data.fontSize;
                document.getElementById('fontSizeValue').textContent = obj.data.fontSize;
                this.fontSize = obj.data.fontSize;
            }
            if (obj.data.fontFamily) {
                document.getElementById('fontFamily').value = obj.data.fontFamily;
                this.fontFamily = obj.data.fontFamily;
            }
        }
    }

    // UI Updates
    updateObjectsList() {
        const layersList = document.getElementById('layersList');
        layersList.innerHTML = '';
        const objects = this.frames[this.currentFrame].objects;

        // Show/hide folder creation button based on selection
        const folderBtn = document.getElementById('createFolderBtn');
        if (folderBtn) {
            if (this.selectedObjects.length >= 2) {
                folderBtn.style.display = 'block';
                folderBtn.onclick = () => this.createGroup();
            } else {
                folderBtn.style.display = 'none';
            }
        }

        objects.forEach((obj, i) => {
            this.renderLayerItem(obj, layersList, 0);
        });
    }
    
    renderLayerItem(obj, container, depth) {
        const objDiv = document.createElement('div');
        const isSelected = this.selectedObjects.some(selected => selected.id === obj.id);
        objDiv.className = 'layer-item' + (isSelected ? ' selected' : '');
        objDiv.style.paddingLeft = (depth * 20 + 10) + 'px';

        // Add expand/collapse button for groups
        if (obj.type === 'group') {
            const expandBtn = document.createElement('button');
            expandBtn.className = 'expand-btn';
            expandBtn.innerHTML = obj.expanded ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-right"></i>';
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                obj.expanded = !obj.expanded;
                this.updateObjectsList();
            });
            objDiv.appendChild(expandBtn);
        }

        const icon = document.createElement('i');
        if (obj.type === 'group' && obj.data && obj.data.effectType) {
            icon.className = this.getEffectIcon(obj.data.effectType);
            const colors = {
                fire: '#ff6b35', rain: '#4a90e2', snow: '#87ceeb',
                lightning: '#ffd700', lightbeam: '#ffff99',
                smoke: '#666', fog: '#b0c4de'
            };
            icon.style.color = colors[obj.data.effectType] || '#666';
        } else {
            icon.className = this.getObjectIcon(obj.type);
        }
        objDiv.appendChild(icon);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'layer-name';
        nameSpan.textContent = obj.name || `${obj.type} ${obj.id}`;
        nameSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.renameLayer(obj);
        });
        objDiv.appendChild(nameSpan);

        // Add indicators
        const indicators = document.createElement('div');
        indicators.className = 'layer-indicators';
        
        if (obj.isMask) {
            const maskIcon = document.createElement('i');
            maskIcon.className = 'fas fa-mask layer-indicator';
            maskIcon.title = 'Mask';
            indicators.appendChild(maskIcon);
        }
        
        if (obj.opacity !== undefined && obj.opacity < 1) {
            const opacityIcon = document.createElement('i');
            opacityIcon.className = 'fas fa-adjust layer-indicator';
            opacityIcon.title = `Opacity: ${Math.round(obj.opacity * 100)}%`;
            indicators.appendChild(opacityIcon);
        }
        
        objDiv.appendChild(indicators);

        const layerControls = document.createElement('div');
        layerControls.className = 'layer-controls';
        
        const visBtn = document.createElement('button');
        visBtn.className = 'layer-control-btn visibility-btn' + (obj.visible ? ' visible' : ' hidden');
        visBtn.innerHTML = obj.visible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        visBtn.title = obj.visible ? 'Hide Layer' : 'Show Layer';
        visBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            obj.visible = !obj.visible;
            this.redrawCanvas();
            this.updateObjectsList();
        });
        layerControls.appendChild(visBtn);
        
        const transparentBtn = document.createElement('button');
        const opacity = obj.opacity || 1;
        const opacityPercent = Math.round(opacity * 100);
        transparentBtn.className = 'layer-control-btn opacity-btn' + (opacity < 1 ? ' active' : '');
        
        let opacityIcon = 'fas fa-circle';
        if (opacity <= 0.25) opacityIcon = 'far fa-circle';
        else if (opacity <= 0.5) opacityIcon = 'fas fa-circle-half-stroke';
        else if (opacity <= 0.75) opacityIcon = 'fas fa-circle-three-quarters';
        
        transparentBtn.innerHTML = `<i class="${opacityIcon}"></i><span class="opacity-text">${opacityPercent}%</span>`;
        transparentBtn.title = `Opacity: ${opacityPercent}% (Click to cycle)`;
        transparentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const levels = [1, 0.75, 0.5, 0.25];
            const currentIndex = levels.indexOf(obj.opacity || 1);
            obj.opacity = levels[(currentIndex + 1) % levels.length];
            this.redrawCanvas();
            this.updateObjectsList();
        });
        layerControls.appendChild(transparentBtn);
        
        objDiv.appendChild(layerControls);

        objDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.layer-control-btn') && !e.target.closest('.expand-btn')) {
                if (e.shiftKey) {
                    this.toggleObjectSelection(obj);
                } else {
                    this.selectedObjects = [obj];
                    this.selectedObject = obj;
                }
                this.updatePropertiesPanel();
                this.redrawCanvas();
                this.updateObjectsList();
            }
        });
        
        // Add drag and drop for layer reordering
        objDiv.draggable = true;
        objDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', obj.id);
            objDiv.style.opacity = '0.5';
        });
        
        objDiv.addEventListener('dragend', (e) => {
            objDiv.style.opacity = '1';
        });
        
        objDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            objDiv.style.borderTop = '2px solid #4f46e5';
        });
        
        objDiv.addEventListener('dragleave', (e) => {
            objDiv.style.borderTop = 'none';
        });
        
        objDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            objDiv.style.borderTop = 'none';
            const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
            if (draggedId !== obj.id) {
                this.moveLayer(draggedId, obj.id);
            }
        });

        container.appendChild(objDiv);
        
        // Render child objects if group is expanded
        if (obj.type === 'group' && obj.expanded && obj.objects) {
            obj.objects.forEach(childObj => {
                this.renderLayerItem(childObj, container, depth + 1);
            });
        }
    }

    getObjectIcon(type) {
        const icons = {
            line: 'fas fa-minus',
            circle: 'fas fa-circle',
            semicircle: 'fas fa-adjust',
            square: 'fas fa-square',
            triangle: 'fas fa-play',
            star: 'fas fa-star',
            arrow: 'fas fa-location-arrow',
            text: 'fas fa-font',
            pencil: 'fas fa-pencil-alt',
            path: 'fas fa-pencil-alt',
            eraser: 'fas fa-eraser',
            'flood-fill': 'fas fa-fill-drip',
            group: 'fas fa-folder',
            raindrop: 'fas fa-tint',
            snowflake: 'fas fa-snowflake',
            flame: 'fas fa-fire'
        };
        return icons[type] || 'fas fa-shapes';
    }

    getEffectIcon(effectType) {
        const icons = {
            fire: 'fas fa-fire',
            rain: 'fas fa-cloud-rain',
            snow: 'fas fa-snowflake',
            lightning: 'fas fa-bolt',
            lightbeam: 'fas fa-sun',
            smoke: 'fas fa-smog',
            fog: 'fas fa-cloud'
        };
        return icons[effectType] || 'fas fa-magic';
    }

    // Frame management
    addFrame() {
        this.frames.push({ 
            objects: [],
            name: `Frame ${this.frames.length + 1}`
        });
        this.currentFrame = this.frames.length - 1;
        this.selectedObject = null;
        this.updateObjectsList();
        this.updateFramesTimeline();
        this.updateFrameDisplay();
        this.redrawCanvas();
    }

    removeFrame() {
        if (this.frames.length <= 1) return;
        this.frames.splice(this.currentFrame, 1);
        if (this.currentFrame >= this.frames.length) {
            this.currentFrame = this.frames.length - 1;
        }
        this.selectedObject = null;
        this.updateObjectsList();
        this.updateFramesTimeline();
        this.updateFrameDisplay();
        this.redrawCanvas();
    }

    updateFrameDisplay() {
        const currentDisplay = document.getElementById('currentFrameDisplay');
        const totalDisplay = document.getElementById('totalFramesDisplay');
        if (currentDisplay) currentDisplay.textContent = this.currentFrame + 1;
        if (totalDisplay) totalDisplay.textContent = this.frames.length;
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
            
            // Draw frame preview
            const thumbCtx = thumbnail.getContext('2d');
            thumbCtx.fillStyle = 'white';
            thumbCtx.fillRect(0, 0, 100, 75);
            
            // Add border
            thumbCtx.strokeStyle = index === this.currentFrame ? '#4f46e5' : '#e9ecef';
            thumbCtx.lineWidth = index === this.currentFrame ? 2 : 1;
            thumbCtx.strokeRect(0, 0, 100, 75);
            
            thumbCtx.save();
            thumbCtx.scale(0.05, 0.05);
            if (frame.objects) {
                frame.objects.forEach(obj => {
                    if (obj.visible) {
                        thumbCtx.save();
                        thumbCtx.translate(obj.x, obj.y);
                        thumbCtx.rotate(obj.rotation);
                        thumbCtx.scale(obj.scaleX, obj.scaleY);
                        this.drawObjectOnContext(obj, thumbCtx);
                        thumbCtx.restore();
                    }
                });
            }
            thumbCtx.restore();
            
            thumbnail.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadFrame(index);
            });
            
            // Add drag and drop
            frameDiv.draggable = true;
            frameDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                frameDiv.style.opacity = '0.5';
            });
            
            frameDiv.addEventListener('dragend', (e) => {
                frameDiv.style.opacity = '1';
            });
            
            frameDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            frameDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                if (draggedIndex !== index) {
                    this.moveFrame(draggedIndex, index);
                }
            });
            
            // Right-click to rename
            frameDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.renameFrame(index);
            });
            
            frameDiv.appendChild(thumbnail);
            
            const frameLabel = document.createElement('div');
            frameLabel.textContent = frame.name || `Frame ${index + 1}`;
            frameLabel.style.cssText = 'font-size: 12px; font-weight: 600; margin-top: 8px; text-align: center; opacity: 0.9;';
            frameLabel.addEventListener('dblclick', () => this.renameFrame(index));
            frameDiv.appendChild(frameLabel);
            
            const frameInfo = document.createElement('div');
            frameInfo.textContent = `${frame.objects ? frame.objects.length : 0} objects`;
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

    drawObjectOnContext(obj, ctx) {
        ctx.strokeStyle = obj.data.color || this.primaryColor;
        ctx.fillStyle = obj.data.fillColor || obj.data.color || this.primaryColor;
        ctx.lineWidth = obj.data.lineWidth || this.brushSize;
        
        const w = obj.data.width || 50;
        const h = obj.data.height || 50;
        
        switch (obj.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, Math.min(w, h)/2, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case 'square':
                ctx.beginPath();
                ctx.rect(-w/2, -h/2, w, h);
                ctx.stroke();
                break;
        }
    }

    loadFrame(frameIndex) {
        if (frameIndex >= 0 && frameIndex < this.frames.length) {
            this.currentFrame = frameIndex;
            this.selectedObject = null;
            this.updateObjectsList();
            this.updateFramesTimeline();
            this.updateFrameDisplay();
            this.redrawCanvas();
        }
    }

    moveFrame(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        const frame = this.frames.splice(fromIndex, 1)[0];
        this.frames.splice(toIndex, 0, frame);
        
        // Update current frame index
        if (this.currentFrame === fromIndex) {
            this.currentFrame = toIndex;
        } else if (fromIndex < this.currentFrame && toIndex >= this.currentFrame) {
            this.currentFrame--;
        } else if (fromIndex > this.currentFrame && toIndex <= this.currentFrame) {
            this.currentFrame++;
        }
        
        this.updateFramesTimeline();
        this.updateFrameDisplay();
    }

    renameFrame(frameIndex) {
        const currentName = this.frames[frameIndex].name || `Frame ${frameIndex + 1}`;
        const newName = prompt('Enter frame name:', currentName);
        if (newName && newName.trim()) {
            this.frames[frameIndex].name = newName.trim();
            this.updateFramesTimeline();
        }
    }

    renameLayer(obj) {
        const currentName = obj.name || `${obj.type} ${obj.id}`;
        const newName = prompt('Enter layer name:', currentName);
        if (newName && newName.trim()) {
            obj.name = newName.trim();
            this.updateObjectsList();
        }
    }

    // Playback
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

    // Project management
    newProject() {
        if (confirm('Create new project? This will clear all current work.')) {
            this.initProject();
        }
    }

    saveProject() {
        const projectData = {
            frames: this.frames,
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

    // Missing toolbar functions
    undo() {
        if (this.history.length > 0) {
            const lastState = this.history.pop();
            this.frames = lastState;
            this.selectedObject = null;
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }

    redo() {
        // Simple redo implementation
        console.log('Redo functionality');
    }

    copyObject() {
        if (this.selectedObject) {
            this.clipboard = JSON.parse(JSON.stringify(this.selectedObject));
        }
    }

    copyFrame() {
        this.frameClipboard = JSON.parse(JSON.stringify(this.frames[this.currentFrame]));
    }

    pasteFrame() {
        if (this.frameClipboard) {
            const newFrame = JSON.parse(JSON.stringify(this.frameClipboard));
            newFrame.objects.forEach(obj => {
                obj.id = ++this.objectIdCounter;
            });
            this.frames.splice(this.currentFrame + 1, 0, newFrame);
            this.currentFrame++;
            this.selectedObject = null;
            this.updateFramesTimeline();
            this.updateFrameDisplay();
            this.updateObjectsList();
            this.redrawCanvas();
            this.saveState();
        }
    }

    pasteObject() {
        if (this.clipboard) {
            const newObj = JSON.parse(JSON.stringify(this.clipboard));
            newObj.id = ++this.objectIdCounter;
            newObj.x += 20;
            newObj.y += 20;
            this.frames[this.currentFrame].objects.push(newObj);
            this.selectedObject = newObj;
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }

    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.frames = data.frames;
                        this.currentFrame = 0;
                        this.selectedObject = null;
                        this.updateObjectsList();
                        this.updateFramesTimeline();
                        this.updateFrameDisplay();
                        this.redrawCanvas();
                    } catch (error) {
                        alert('Error loading project: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    importImage() {
        const input = document.getElementById('imageInput');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const isGif = file.type === 'image/gif';
                        this.createObject('image', {
                            image: img,
                            width: img.width,
                            height: img.height,
                            x: this.canvas.width / 2,
                            y: this.canvas.height / 2,
                            isAnimated: isGif,
                            src: e.target.result
                        });
                        this.saveState();
                        this.updateObjectsList();
                        this.redrawCanvas();
                        
                        if (isGif) {
                            this.startGifAnimation();
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
    
    startGifAnimation() {
        if (this.gifAnimationInterval) {
            clearInterval(this.gifAnimationInterval);
        }
        
        this.gifAnimationInterval = setInterval(() => {
            this.redrawCanvas();
        }, 100); // Redraw every 100ms for GIF animation
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom + this.zoomStep, this.zoomMax);
        this.updateZoomDisplay();
        this.applyZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom - this.zoomStep, this.zoomMin);
        this.updateZoomDisplay();
        this.applyZoom();
    }

    resetZoom() {
        this.zoom = 1;
        this.updateZoomDisplay();
        this.applyZoom();
    }

    applyZoom() {
        const canvasContainer = document.querySelector('.canvas-container-inner');
        if (canvasContainer) {
            canvasContainer.style.transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.zoom})`;
        }
    }
    
    applyPan() {
        this.applyZoom();
    }

    zoomInAtPoint(x, y) {
        this.zoom = Math.min(this.zoom * 1.5, this.zoomMax);
        this.applyZoom();
        this.updateZoomDisplay();
    }

    zoomOutAtPoint(x, y) {
        this.zoom = Math.max(this.zoom / 1.5, this.zoomMin);
        this.applyZoom();
        this.updateZoomDisplay();
    }

    resetZoomToFit() {
        const canvasContainer = document.querySelector('.canvas-container');
        
        if (canvasContainer) {
            const containerRect = canvasContainer.getBoundingClientRect();
            const canvasWidth = 1920;
            const canvasHeight = 1080;
            
            // Calculate scale to fit canvas in container with padding
            const scaleX = (containerRect.width - 80) / canvasWidth;
            const scaleY = (containerRect.height - 80) / canvasHeight;
            this.zoom = Math.min(scaleX, scaleY, 1);
            
            this.applyZoom();
            this.updateZoomDisplay();
        }
    }

    updateZoomDisplay() {
        const zoomPercent = Math.round(this.zoom * 100);
        const zoomDisplays = document.querySelectorAll('#zoomDisplay');
        zoomDisplays.forEach(display => {
            if (display) display.textContent = `Zoom: ${zoomPercent}%`;
        });
    }

    handleWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    async exportVideo() {
        if (this.frames.length === 0) {
            alert('No frames to export!');
            return;
        }

        const format = await this.showExportDialog();
        if (!format) return;

        if (format === 'gif') {
            this.exportGIF();
            return;
        }
        
        if (format === 'jpeg') {
            this.exportJPEG();
            return;
        }

        try {
            const mimeType = this.getSupportedMimeType();
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = this.canvas.width;
            exportCanvas.height = this.canvas.height;
            const exportCtx = exportCanvas.getContext('2d');
            
            const stream = exportCanvas.captureStream(0);
            const recorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 8000000
            });
            
            const chunks = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `animation_${this.frames.length}frames_${this.playbackSpeed}fps.${mimeType.includes('av01') ? 'mp4' : 'webm'}`;
                link.click();
                URL.revokeObjectURL(url);
            };
            
            const progress = this.showExportProgress();
            recorder.start();
            
            const frameDuration = 1000 / this.playbackSpeed;
            
            for (let i = 0; i < this.frames.length; i++) {
                await this.renderFrameToCanvas(this.frames[i], exportCtx, exportCanvas);
                stream.getVideoTracks()[0].requestFrame();
                progress.update(i + 1, this.frames.length);
                
                if (i < this.frames.length - 1) {
                    await this.delay(frameDuration);
                }
            }
            
            await this.delay(frameDuration);
            recorder.stop();
            progress.close();
            
        } catch (error) {
            alert('Video export failed. Check console for details.');
            console.error(error);
        }
    }

    getSupportedMimeType() {
        const types = [
            'video/mp4; codecs="av01.0.08M.08"',
            'video/webm; codecs="av01.0.08M.08"',
            'video/webm; codecs="vp9"',
            'video/webm; codecs="vp8"'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/webm';
    }

    async renderFrameToCanvas(frame, ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        if (this.backgroundEnabled && frame.backgroundColor) {
            ctx.fillStyle = frame.backgroundColor;
        } else {
            ctx.fillStyle = 'white';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (frame.objects) {
            frame.objects.forEach(obj => {
                if (obj.visible) {
                    ctx.save();
                    ctx.translate(obj.x, obj.y);
                    ctx.rotate(obj.rotation);
                    ctx.scale(obj.scaleX, obj.scaleY);
                    this.drawObjectOnCanvas(obj, ctx);
                    ctx.restore();
                }
            });
        }
    }

    showExportProgress(format = 'Video') {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
        
        const content = document.createElement('div');
        content.style.cssText = 'background:white;padding:30px;border-radius:10px;text-align:center;min-width:300px;';
        
        const title = document.createElement('h3');
        title.textContent = format === 'GIF' ? 'Exporting GIF...' : 'Exporting Video...';
        
        const bar = document.createElement('div');
        bar.style.cssText = 'width:100%;height:20px;background:#f0f0f0;border-radius:10px;margin:20px 0;';
        
        const progress = document.createElement('div');
        progress.style.cssText = 'height:100%;background:linear-gradient(45deg,#4f46e5,#7c3aed);width:0%;border-radius:10px;transition:width 0.3s;';
        
        const text = document.createElement('p');
        text.textContent = 'Frame 0 of 0';
        
        const info = document.createElement('p');
        info.style.cssText = 'margin:10px 0;color:#666;font-size:14px;';
        info.textContent = `Exporting at ${this.playbackSpeed} FPS`;
        
        bar.appendChild(progress);
        content.appendChild(title);
        content.appendChild(info);
        content.appendChild(bar);
        content.appendChild(text);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        return {
            update: (current, total) => {
                progress.style.width = (current / total) * 100 + '%';
                text.textContent = `Frame ${current} of ${total} (${Math.round((current/total)*100)}%)`;
            },
            close: () => document.body.removeChild(modal)
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showExportDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
            
            const content = document.createElement('div');
            content.style.cssText = 'background:white;padding:30px;border-radius:15px;text-align:center;min-width:400px;box-shadow:0 10px 30px rgba(0,0,0,0.3);';
            
            const title = document.createElement('h2');
            title.textContent = 'Export Animation';
            title.style.cssText = 'margin:0 0 20px;color:#333;';
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'Choose your export format:';
            subtitle.style.cssText = 'margin:0 0 30px;color:#666;';
            
            const videoBtn = document.createElement('button');
            videoBtn.innerHTML = '<i class="fas fa-video" style="font-size:2em;margin-bottom:10px;color:#4f46e5;"></i><br><strong>Video (MP4/WebM)</strong><br><small>High quality, smaller file size</small>';
            videoBtn.style.cssText = 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:20px;margin:10px;border-radius:10px;cursor:pointer;min-width:150px;transition:transform 0.2s;';
            
            const gifBtn = document.createElement('button');
            gifBtn.innerHTML = '<i class="fas fa-images" style="font-size:2em;margin-bottom:10px;color:#ff6b35;"></i><br><strong>Animated GIF</strong><br><small>Universal compatibility</small>';
            gifBtn.style.cssText = 'background:linear-gradient(135deg,#ff6b35,#f7931e);color:white;border:none;padding:20px;margin:10px;border-radius:10px;cursor:pointer;min-width:150px;transition:transform 0.2s;';
            
            const jpegBtn = document.createElement('button');
            jpegBtn.innerHTML = '<i class="fas fa-file-image" style="font-size:2em;margin-bottom:10px;color:#22c55e;"></i><br><strong>JPEG Sequence</strong><br><small>High quality images</small>';
            jpegBtn.style.cssText = 'background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;padding:20px;margin:10px;border-radius:10px;cursor:pointer;min-width:150px;transition:transform 0.2s;';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.cssText = 'background:#ccc;color:#333;border:none;padding:10px 20px;margin:20px 10px 0;border-radius:5px;cursor:pointer;';
            
            videoBtn.onmouseover = () => videoBtn.style.transform = 'scale(1.05)';
            videoBtn.onmouseout = () => videoBtn.style.transform = 'scale(1)';
            gifBtn.onmouseover = () => gifBtn.style.transform = 'scale(1.05)';
            gifBtn.onmouseout = () => gifBtn.style.transform = 'scale(1)';
            jpegBtn.onmouseover = () => jpegBtn.style.transform = 'scale(1.05)';
            jpegBtn.onmouseout = () => jpegBtn.style.transform = 'scale(1)';
            
            videoBtn.onclick = () => { document.body.removeChild(modal); resolve('video'); };
            gifBtn.onclick = () => { document.body.removeChild(modal); resolve('gif'); };
            jpegBtn.onclick = () => { document.body.removeChild(modal); resolve('jpeg'); };
            cancelBtn.onclick = () => { document.body.removeChild(modal); resolve(null); };
            
            content.appendChild(title);
            content.appendChild(subtitle);
            content.appendChild(videoBtn);
            content.appendChild(gifBtn);
            content.appendChild(jpegBtn);
            content.appendChild(cancelBtn);
            modal.appendChild(content);
            document.body.appendChild(modal);
        });
    }

    exportGIF() {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        const ctx = canvas.getContext('2d');
        
        const frameImages = [];
        const progress = this.showExportProgress('GIF');
        
        this.frames.forEach((frame, index) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (frame.objects) {
                frame.objects.forEach(obj => {
                    if (obj.visible) {
                        ctx.save();
                        ctx.translate(obj.x, obj.y);
                        ctx.rotate(obj.rotation);
                        ctx.scale(obj.scaleX, obj.scaleY);
                        this.drawObjectOnCanvas(obj, ctx);
                        ctx.restore();
                    }
                });
            }
            
            frameImages.push(canvas.toDataURL('image/png'));
            progress.update(index + 1, this.frames.length);
        });
        
        this.createGIFFromFrames(frameImages);
        progress.close();
    }

    createGIFFromFrames(frameImages) {
        const zip = new JSZip();
        frameImages.forEach((imageData, index) => {
            const base64Data = imageData.split(',')[1];
            zip.file(`frame_${String(index + 1).padStart(3, '0')}.png`, base64Data, {base64: true});
        });
        
        zip.generateAsync({type: 'blob'}).then(content => {
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `animation_frames_${this.playbackSpeed}fps.zip`;
            link.click();
            URL.revokeObjectURL(url);
            
            alert(`Exported ${frameImages.length} frames as PNG sequence. Use online GIF makers or image editing software to create animated GIF at ${this.playbackSpeed} FPS.`);
        });
    }

    exportJPEG() {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        const ctx = canvas.getContext('2d');
        
        const frameImages = [];
        const progress = this.showExportProgress('JPEG');
        
        this.frames.forEach((frame, index) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (frame.objects) {
                frame.objects.forEach(obj => {
                    if (obj.visible) {
                        ctx.save();
                        ctx.translate(obj.x, obj.y);
                        ctx.rotate(obj.rotation);
                        ctx.scale(obj.scaleX, obj.scaleY);
                        this.drawObjectOnCanvas(obj, ctx);
                        ctx.restore();
                    }
                });
            }
            
            frameImages.push(canvas.toDataURL('image/jpeg', 0.9));
            progress.update(index + 1, this.frames.length);
        });
        
        this.createJPEGFromFrames(frameImages);
        progress.close();
    }

    createJPEGFromFrames(frameImages) {
        const zip = new JSZip();
        frameImages.forEach((imageData, index) => {
            const base64Data = imageData.split(',')[1];
            zip.file(`frame_${String(index + 1).padStart(3, '0')}.jpg`, base64Data, {base64: true});
        });
        
        zip.generateAsync({type: 'blob'}).then(content => {
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `animation_jpeg_${this.playbackSpeed}fps.zip`;
            link.click();
            URL.revokeObjectURL(url);
            
            alert(`Exported ${frameImages.length} frames as JPEG sequence at ${this.playbackSpeed} FPS. Smaller file sizes with high quality!`);
        });
    }

    createWebMFromFrames(frameImages) {
        const zip = new JSZip();
        frameImages.forEach((imageData, index) => {
            const base64Data = imageData.split(',')[1];
            zip.file(`frame_${String(index + 1).padStart(3, '0')}.png`, base64Data, {base64: true});
        });
        
        zip.generateAsync({type: 'blob'}).then(content => {
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'animation_frames.zip';
            link.click();
            URL.revokeObjectURL(url);
            
            alert(`Exported ${frameImages.length} frames as PNG sequence. Use video editing software to convert to OGG format.`);
        });
    }

    drawObjectOnCanvas(obj, ctx) {
        ctx.strokeStyle = obj.data?.color || '#000000';
        ctx.fillStyle = obj.data?.fillColor || obj.data?.color || '#000000';
        ctx.lineWidth = obj.data?.lineWidth || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (obj.data?.opacity !== undefined && obj.data.opacity < 1) {
            ctx.globalAlpha = obj.data.opacity;
        }
        
        const w = obj.data?.width || 50;
        const h = obj.data?.height || 50;
        
        switch (obj.type) {
            case 'path':
            case 'eraserPath':
                if (obj.data?.points && obj.data.points.length > 1) {
                    if (obj.type === 'eraserPath') {
                        ctx.globalCompositeOperation = 'destination-out';
                    }
                    ctx.beginPath();
                    ctx.moveTo(obj.data.points[0].x, obj.data.points[0].y);
                    for (let i = 1; i < obj.data.points.length; i++) {
                        ctx.lineTo(obj.data.points[i].x, obj.data.points[i].y);
                    }
                    ctx.stroke();
                    if (obj.type === 'eraserPath') {
                        ctx.globalCompositeOperation = 'source-over';
                    }
                }
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, Math.min(w, h)/2, 0, 2 * Math.PI);
                if (obj.data?.fillColor) ctx.fill();
                ctx.stroke();
                break;
            case 'square':
                ctx.beginPath();
                ctx.rect(-w/2, -h/2, w, h);
                if (obj.data?.fillColor) ctx.fill();
                ctx.stroke();
                break;
        }
    }

    showAbout() {
        document.getElementById('aboutModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('aboutModal').style.display = 'none';
    }

    closeWelcome() {
        document.getElementById('welcomeModal').style.display = 'none';
        localStorage.setItem('animateStudioWelcomed', 'true');
    }

    openCoffeeSupport() {
        window.open('https://buymeacoffee.com/richynoble', '_blank');
    }

    showEffects() {
        document.getElementById('effectsModal').style.display = 'block';
    }

    showFireSettings() {
        document.getElementById('fireSettingsModal').style.display = 'block';
    }

    hideFireSettings() {
        document.getElementById('fireSettingsModal').style.display = 'none';
    }

    applyFireSettings() {
        const hasGlow = document.getElementById('fireGlow').checked;
        const enableAnimation = document.getElementById('fireAnimation').checked;
        const addFrames = document.getElementById('fireFrames').checked;
        
        this.createFireEffect(hasGlow, enableAnimation, addFrames);
        this.hideFireSettings();
    }

    createFireEffect(hasGlow = false, enableAnimation = true, addFrames = false) {
        const speed = parseInt(document.getElementById('fireSpeed').value) || 50;
        const intensity = hasGlow ? 'heavy' : 'medium';
        
        // Create code-based fire effect instead of GIF
        this.generateEffectFrames('fire', addFrames ? 12 : 1, intensity, speed);
        
        if (addFrames) {
            // Add multiple frames for animation
            for (let i = 1; i < 8; i++) {
                this.addFrame();
                this.generateEffectFrames('fire', 1, intensity, speed);
            }
            this.currentFrame = 0;
            this.loadFrame(0);
            this.updateFramesTimeline();
        }
        
        document.getElementById('effectsModal').style.display = 'none';
    }



    showEffectSettings(effectType) {
        this.selectedEffectType = effectType;
        document.getElementById('effectSettings').style.display = 'block';
    }

    hideEffectSettings() {
        document.getElementById('effectSettings').style.display = 'none';
        this.selectedEffectType = null;
    }

    applyEffectSettings() {
        const intensity = document.getElementById('intensitySelect').value;
        const speed = parseInt(document.getElementById('effectSpeed').value);
        
        this.generateEffectFrames(this.selectedEffectType, 12, intensity, speed);
        document.getElementById('effectsModal').style.display = 'none';
        this.hideEffectSettings();
    }

    showRainSettings() {
        document.getElementById('rainSettingsModal').style.display = 'block';
    }

    hideRainSettings() {
        document.getElementById('rainSettingsModal').style.display = 'none';
    }

    applyRainSettings() {
        const splash = document.getElementById('rainSplash').checked;
        const speed = parseInt(document.getElementById('rainSpeed').value);
        const size = document.getElementById('rainSize').value;
        const wind = document.querySelector('input[name="windDirection"]:checked').value;
        const color = document.getElementById('rainColor').value;
        const addFrames = document.getElementById('rainFrames').checked;
        
        this.createRainEffect(splash, speed, size, wind, color, addFrames);
        this.hideRainSettings();
    }

    createRainEffect(splash = true, speed = 50, size = 'medium', wind = 'none', color = '#3b82f6', addFrames = false) {
        const intensity = splash ? 'heavy' : 'medium';
        
        // Create rain effect with proper parameters
        this.generateEffectFrames('rain', 1, intensity, speed, size, wind, color, splash);
        
        if (addFrames) {
            // Add multiple frames for animation
            for (let i = 1; i < 8; i++) {
                this.addFrame();
                this.generateEffectFrames('rain', 1, intensity, speed, size, wind, color, splash);
            }
            this.currentFrame = 0;
            this.loadFrame(0);
            this.updateFramesTimeline();
        }
        
        document.getElementById('effectsModal').style.display = 'none';
    }

    showSnowSettings() {
        document.getElementById('snowSettingsModal').style.display = 'block';
    }

    hideSnowSettings() {
        document.getElementById('snowSettingsModal').style.display = 'none';
    }

    applySnowSettings() {
        const speed = parseInt(document.getElementById('snowSpeed').value);
        const size = document.getElementById('snowSize').value;
        const wind = document.querySelector('input[name="snowWindDirection"]:checked').value;
        const color = document.getElementById('snowColor').value;
        const addFrames = document.getElementById('snowFrames').checked;
        
        this.createSnowEffect(speed, size, wind, color, addFrames);
        this.hideSnowSettings();
    }

    createSnowEffect(speed = 50, size = 'medium', wind = 'none', color = '#ffffff', addFrames = false) {
        const intensity = 'medium';
        
        // Create snow effect with proper parameters
        this.generateEffectFrames('snow', 1, intensity, speed, size, wind, color);
        
        if (addFrames) {
            // Add multiple frames for animation
            for (let i = 1; i < 8; i++) {
                this.addFrame();
                this.generateEffectFrames('snow', 1, intensity, speed, size, wind, color);
            }
            this.currentFrame = 0;
            this.loadFrame(0);
            this.updateFramesTimeline();
        }
        
        document.getElementById('effectsModal').style.display = 'none';
    }





    generateEffectFrames(effectType, frameCount, intensity = 'medium', speed = 50, size = 'medium', wind = 'none', color = null, splash = false) {
        const effectGroup = {
            id: ++this.objectIdCounter,
            type: 'group',
            name: `${effectType.charAt(0).toUpperCase() + effectType.slice(1)} Effect`,
            objects: [],
            data: { effectType, intensity, speed, size, wind, color, splash },
            x: 0, y: 0,
            rotation: 0, scaleX: 1, scaleY: 1,
            visible: true, expanded: true
        };
        
        // Generate particles with proper parameters
        const particles = this.generateParticles(effectType, 0, frameCount, intensity, speed, size, wind, color, splash);
        particles.forEach(particle => {
            let objType = 'circle';
            if (particle.type === 'raindrop') objType = 'raindrop';
            if (particle.type === 'snowflake') objType = 'snowflake';
            if (particle.type === 'flame') objType = 'flame';
            
            const flameData = {
                width: particle.size,
                height: particle.size * (particle.type === 'raindrop' ? 3 : particle.type === 'flame' ? 2.5 : 1),
                color: particle.color,
                fillColor: particle.color
            };
            
            // Add glow setting for fire effects
            if (particle.type === 'flame') {
                flameData.hasGlow = effectGroup.data.intensity === 'heavy';
            }
            
            effectGroup.objects.push({
                id: ++this.objectIdCounter,
                type: objType,
                x: particle.x,
                y: particle.y,
                data: flameData,
                rotation: 0, scaleX: 1, scaleY: 1, visible: true
            });
        });
        
        this.frames[this.currentFrame].objects.push(effectGroup);
        this.startEffectAnimation(effectGroup);
        this.updateObjectsList();
        this.redrawCanvas();
        
        console.log(`Created ${effectType} effect with ${effectGroup.objects.length} particles`);
    }

    startEffectAnimation(effectGroup) {
        const { effectType, intensity, speed, size, wind, color, splash } = effectGroup.data;
        let frame = 0;
        
        const animate = () => {
            if (!effectGroup.visible || !this.frames[this.currentFrame].objects.includes(effectGroup)) {
                return;
            }
            
            const particles = this.generateParticles(effectType, frame, 20, intensity, speed, size, wind, color, splash);
            
            effectGroup.objects.forEach((particle, i) => {
                if (particles[i]) {
                    particle.x = particles[i].x;
                    particle.y = particles[i].y;
                    particle.data.color = particles[i].color;
                    particle.data.fillColor = particles[i].color;
                    
                    // Update size for dynamic effects
                    if (particles[i].size) {
                        particle.data.width = particles[i].size;
                        particle.data.height = particles[i].size * (particles[i].type === 'raindrop' ? 3 : 1);
                    }
                }
            });
            
            frame++;
            this.redrawCanvas();
            
            // Continue animation with proper timing
            const animationSpeed = Math.max(50, 150 - speed);
            setTimeout(animate, animationSpeed);
        };
        
        animate();
    }

    generateParticles(effectType, frameIndex, totalFrames, intensity = 'medium', speed = 50, size = 'medium', wind = 'none', color = null, splash = false) {
        const particles = [];
        
        // Particle count based on intensity
        const intensityMultiplier = { light: 0.8, medium: 1.5, heavy: 2.8, custom: 2.0 };
        const baseCount = effectType === 'fire' ? 40 : effectType === 'rain' ? 60 : effectType === 'snow' ? 50 : 30;
        const particleCount = Math.floor(baseCount * (intensityMultiplier[intensity] || 1));
        
        for (let i = 0; i < particleCount; i++) {
            let particle = {};
            
            switch (effectType) {
                case 'fire':
                    const fireBaseX = 400; // Center of 800px canvas
                    const fireBaseY = 550; // Bottom area of 600px canvas
                    const flameSize = size === 'small' ? 80 : size === 'large' ? 150 : 100;
                    
                    particle = {
                        x: fireBaseX,
                        y: fireBaseY,
                        size: flameSize,
                        color: '#ff4500',
                        type: 'flame'
                    };
                    break;
                    
                case 'rain':
                    const rainSpeed = 5 + (speed || 50) / 15;
                    let windOffset = 0;
                    if (wind === 'left') windOffset = -frameIndex * 2;
                    if (wind === 'right') windOffset = frameIndex * 2;
                    
                    const dropSize = size === 'small' ? 3 : size === 'large' ? 8 : 5;
                    
                    particle = {
                        x: Math.random() * 1920 + windOffset + Math.sin(frameIndex * 0.1) * 10,
                        y: (frameIndex * rainSpeed + i * 15) % 1200 - 200,
                        size: dropSize + Math.random() * 2,
                        color: color || '#4a90e2',
                        type: 'raindrop'
                    };
                    break;
                    
                case 'snow':
                    const snowSpeed = 2 + (speed || 50) / 25;
                    let snowDrift = 0;
                    if (wind === 'left') snowDrift = -frameIndex * 1.5;
                    if (wind === 'right') snowDrift = frameIndex * 1.5;
                    
                    const flakeSize = size === 'small' ? 5 : size === 'large' ? 12 : 8;
                    
                    particle = {
                        x: Math.random() * 1920 + snowDrift + Math.sin(frameIndex * 0.05 + i) * 30,
                        y: (frameIndex * snowSpeed + i * 12) % 1200 - 200,
                        size: flakeSize + Math.random() * 3,
                        color: color || '#ffffff',
                        type: 'snowflake'
                    };
                    break;
                    

            }
            
            particles.push(particle);
        }
        
        return particles;
    }

    isPointInPath(x, y, points, closed) {
        if (!closed || points.length < 3) {
            // For open paths, check if point is near the line
            for (let i = 0; i < points.length - 1; i++) {
                const dist = this.distanceToLine(x, y, points[i], points[i + 1]);
                if (dist < 10) return true;
            }
            return false;
        }
        
        // For closed paths, use ray casting algorithm
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            if (((points[i].y > y) !== (points[j].y > y)) &&
                (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }
    
    distanceToLine(px, py, p1, p2) {
        const A = px - p1.x;
        const B = py - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;
        let xx, yy;
        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    drawSmoothLine() {
        this.ctx.save();
        
        if (this.currentPath.type === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.currentPath.lineWidth;
        } else {
            this.ctx.strokeStyle = this.currentPath.color;
            this.ctx.lineWidth = this.currentPath.lineWidth;
            this.ctx.globalAlpha = this.currentPath.opacity;
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        const points = this.currentPath.points;
        if (points.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
            this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    drawShapePreview(currentX, currentY) {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        const x = Math.min(this.startX, currentX);
        const y = Math.min(this.startY, currentY);
        
        this.overlayCtx.save();
        this.overlayCtx.strokeStyle = this.primaryColor;
        this.overlayCtx.fillStyle = this.secondaryColor;
        this.overlayCtx.lineWidth = this.brushSize;
        this.overlayCtx.setLineDash([8, 4]);
        this.overlayCtx.globalAlpha = 0.7;
        this.overlayCtx.lineCap = 'round';
        this.overlayCtx.lineJoin = 'round';
        
        this.overlayCtx.beginPath();
        
        switch (this.currentTool) {
            case 'line':
                this.overlayCtx.moveTo(this.startX, this.startY);
                this.overlayCtx.lineTo(currentX, currentY);
                break;
            case 'circle':
                const centerX = (this.startX + currentX) / 2;
                const centerY = (this.startY + currentY) / 2;
                this.overlayCtx.save();
                this.overlayCtx.translate(centerX, centerY);
                this.overlayCtx.scale(width / Math.max(width, height), height / Math.max(width, height));
                this.overlayCtx.arc(0, 0, Math.max(width, height) / 2, 0, 2 * Math.PI);
                this.overlayCtx.restore();
                break;
            case 'semicircle':
                const semiCenterX = (this.startX + currentX) / 2;
                const semiCenterY = (this.startY + currentY) / 2;
                this.overlayCtx.save();
                this.overlayCtx.translate(semiCenterX, semiCenterY);
                this.overlayCtx.scale(width / Math.max(width, height), height / Math.max(width, height));
                this.overlayCtx.arc(0, 0, Math.max(width, height) / 2, 0, Math.PI);
                this.overlayCtx.restore();
                this.overlayCtx.closePath();
                break;
            case 'square':
                this.overlayCtx.rect(x, y, width, height);
                break;
            case 'triangle':
                const topX = (this.startX + currentX) / 2;
                this.overlayCtx.moveTo(topX, Math.min(this.startY, currentY));
                this.overlayCtx.lineTo(Math.min(this.startX, currentX), Math.max(this.startY, currentY));
                this.overlayCtx.lineTo(Math.max(this.startX, currentX), Math.max(this.startY, currentY));
                this.overlayCtx.closePath();
                break;
            case 'star':
                const starCenterX = (this.startX + currentX) / 2;
                const starCenterY = (this.startY + currentY) / 2;
                this.overlayCtx.save();
                this.overlayCtx.translate(starCenterX, starCenterY);
                this.overlayCtx.scale(width / Math.max(width, height), height / Math.max(width, height));
                this.drawStarPreview(0, 0, Math.max(width, height) / 2);
                this.overlayCtx.restore();
                break;
            case 'arrow':
                this.drawArrowPreview(this.startX, this.startY, currentX, currentY);
                break;
        }
        
        this.overlayCtx.stroke();
        this.overlayCtx.restore();
        
        this.drawTransformHandles();
    }

    drawStarPreview(centerX, centerY, radius) {
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        const angleStep = (Math.PI * 2) / (spikes * 2);
        let angle = -Math.PI / 2; // Start at top
        
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (i === 0) {
                this.overlayCtx.moveTo(x, y);
            } else {
                this.overlayCtx.lineTo(x, y);
            }
            
            angle += angleStep;
        }
        this.overlayCtx.closePath();
    }

    drawArrowPreview(startX, startY, endX, endY) {
        const headLength = 20;
        const angle = Math.atan2(endY - startY, endX - startX);
        
        // Arrow line
        this.overlayCtx.moveTo(startX, startY);
        this.overlayCtx.lineTo(endX, endY);
        
        // Arrow head
        this.overlayCtx.moveTo(endX, endY);
        this.overlayCtx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
        this.overlayCtx.moveTo(endX, endY);
        this.overlayCtx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
    }

    toggleObjectSelection(obj) {
        const index = this.selectedObjects.findIndex(selected => selected.id === obj.id);
        if (index === -1) {
            this.selectedObjects.push(obj);
            this.selectedObject = obj;
        } else {
            this.selectedObjects.splice(index, 1);
            this.selectedObject = this.selectedObjects.length > 0 ? this.selectedObjects[this.selectedObjects.length - 1] : null;
        }
    }

    createGroup() {
        if (this.selectedObjects.length < 2) {
            alert('Select at least 2 objects to create a group (hold Shift and click)');
            return;
        }
        
        const groupName = prompt('Enter group name:', `Group ${++this.groupIdCounter}`);
        if (!groupName) return;
        
        // Create deep copies of selected objects
        const groupObjects = this.selectedObjects.map(obj => JSON.parse(JSON.stringify(obj)));
        
        const group = {
            id: ++this.objectIdCounter,
            type: 'group',
            name: groupName,
            objects: groupObjects,
            data: {},
            x: 0,
            y: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            visible: true,
            expanded: true
        };
        
        // Remove individual objects from frame (in reverse order to maintain indices)
        const objects = this.frames[this.currentFrame].objects;
        for (let i = objects.length - 1; i >= 0; i--) {
            if (this.selectedObjects.some(selected => selected.id === objects[i].id)) {
                objects.splice(i, 1);
            }
        }
        
        // Add group to frame
        objects.push(group);
        this.selectedObjects = [group];
        this.selectedObject = group;
        this.updateObjectsList();
        this.redrawCanvas();
        this.saveState();
    }

    createMask() {
        if (!this.selectedObject) {
            alert('Select an object to create a mask');
            return;
        }
        this.selectedObject.isMask = !this.selectedObject.isMask;
        this.updateObjectsList();
        this.redrawCanvas();
    }

    moveToFront() {
        if (!this.selectedObject) return;
        const objects = this.frames[this.currentFrame].objects;
        const index = objects.findIndex(obj => obj.id === this.selectedObject.id);
        if (index !== -1) {
            objects.splice(index, 1);
            objects.push(this.selectedObject);
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }

    moveUp() {
        if (!this.selectedObject) return;
        const objects = this.frames[this.currentFrame].objects;
        const index = objects.findIndex(obj => obj.id === this.selectedObject.id);
        if (index !== -1 && index < objects.length - 1) {
            [objects[index], objects[index + 1]] = [objects[index + 1], objects[index]];
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }

    moveDown() {
        if (!this.selectedObject) return;
        const objects = this.frames[this.currentFrame].objects;
        const index = objects.findIndex(obj => obj.id === this.selectedObject.id);
        if (index > 0) {
            [objects[index], objects[index - 1]] = [objects[index - 1], objects[index]];
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }

    moveToBack() {
        if (!this.selectedObject) return;
        const objects = this.frames[this.currentFrame].objects;
        const index = objects.findIndex(obj => obj.id === this.selectedObject.id);
        if (index !== -1) {
            objects.splice(index, 1);
            objects.unshift(this.selectedObject);
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }
    
    moveLayer(draggedId, targetId) {
        const objects = this.frames[this.currentFrame].objects;
        const draggedIndex = objects.findIndex(obj => obj.id === draggedId);
        const targetIndex = objects.findIndex(obj => obj.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
            const draggedObj = objects.splice(draggedIndex, 1)[0];
            objects.splice(targetIndex, 0, draggedObj);
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }

    toggleTransparency() {
        if (!this.selectedObject) return;
        const levels = [1, 0.75, 0.5, 0.25];
        const currentIndex = levels.indexOf(this.selectedObject.opacity || 1);
        this.selectedObject.opacity = levels[(currentIndex + 1) % levels.length];
        this.updateObjectsList();
        this.redrawCanvas();
    }

    switchTab(tabName) {
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Remove active class from all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Add active class to clicked tab button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Add active class to corresponding tab content
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }
    }

    createBone(x, y) {
        if (this.lastBone) {
            const bone = {
                id: ++this.objectIdCounter,
                type: 'bone',
                startX: this.lastBone.endX,
                startY: this.lastBone.endY,
                endX: x,
                endY: y,
                parent: this.lastBone,
                children: [],
                data: { color: '#ff6b35', lineWidth: 3 },
                x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true
            };
            this.lastBone.children.push(bone);
            this.frames[this.currentFrame].objects.push(bone);
            this.lastBone = bone;
        } else {
            const bone = {
                id: ++this.objectIdCounter,
                type: 'bone',
                startX: x - 50,
                startY: y,
                endX: x,
                endY: y,
                parent: null,
                children: [],
                data: { color: '#ff6b35', lineWidth: 3 },
                x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true
            };
            this.frames[this.currentFrame].objects.push(bone);
            this.lastBone = bone;
        }
        this.updateObjectsList();
        this.redrawCanvas();
    }

    createBoneForObject(x, y) {
        if (!this.selectedObject) return;
        
        const bounds = this.getObjectBounds(this.selectedObject);
        const bone = {
            id: ++this.objectIdCounter,
            type: 'bone',
            startX: bounds.x + bounds.width * 0.3,
            startY: bounds.y + bounds.height * 0.5,
            endX: bounds.x + bounds.width * 0.7,
            endY: bounds.y + bounds.height * 0.5,
            parent: null,
            children: [],
            targetObject: this.selectedObject,
            influenceRadius: Math.max(bounds.width, bounds.height) * 0.4,
            data: { color: '#22c55e', lineWidth: 6 },
            x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true
        };
        
        // Store original object data for smooth deformation
        bone.originalData = JSON.parse(JSON.stringify(this.selectedObject.data));
        bone.originalPosition = { x: this.selectedObject.x, y: this.selectedObject.y };
        
        // Create or add to bone group
        this.addBoneToGroup(bone);
        
        this.selectedObject.bones = this.selectedObject.bones || [];
        this.selectedObject.bones.push(bone);
        this.frames[this.currentFrame].objects.push(bone);
    }

    addBoneToGroup(bone) {
        const targetObj = bone.targetObject;
        let boneGroup = this.frames[this.currentFrame].objects.find(obj => 
            obj.type === 'group' && obj.name === `${targetObj.name || targetObj.type} Bones`
        );
        
        if (!boneGroup) {
            boneGroup = {
                id: ++this.objectIdCounter,
                type: 'group',
                name: `${targetObj.name || targetObj.type} Bones`,
                objects: [targetObj],
                data: {},
                x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true,
                expanded: true
            };
            
            // Remove original object and add group
            const objIndex = this.frames[this.currentFrame].objects.indexOf(targetObj);
            if (objIndex !== -1) {
                this.frames[this.currentFrame].objects.splice(objIndex, 1);
            }
            this.frames[this.currentFrame].objects.push(boneGroup);
        }
        
        boneGroup.objects.push(bone);
    }

    applyBoneDeformation(bone) {
        if (!bone.targetObject) return;
        
        const target = bone.targetObject;
        const boneAngle = Math.atan2(bone.endY - bone.startY, bone.endX - bone.startX);
        const originalAngle = Math.atan2(
            bone.originalData.endY || 0 - (bone.originalData.startY || 0),
            bone.originalData.endX || 0 - (bone.originalData.startX || 0)
        );
        const angleDiff = boneAngle - originalAngle;
        
        // Smooth position interpolation
        const boneCenterX = (bone.startX + bone.endX) / 2;
        const boneCenterY = (bone.startY + bone.endY) / 2;
        const originalCenterX = bone.originalPosition.x;
        const originalCenterY = bone.originalPosition.y;
        
        const influence = 0.8; // Smooth influence factor
        
        // Apply smooth transformation
        target.x = originalCenterX + (boneCenterX - originalCenterX) * influence;
        target.y = originalCenterY + (boneCenterY - originalCenterY) * influence;
        target.rotation = angleDiff * influence;
        
        // Deform path points if available
        if (target.data.points && bone.originalData.points) {
            target.data.points.forEach((point, i) => {
                if (bone.originalData.points[i]) {
                    const originalPoint = bone.originalData.points[i];
                    const distToBone = this.distanceToLineSegment(
                        originalPoint.x, originalPoint.y,
                        bone.startX - target.x, bone.startY - target.y,
                        bone.endX - target.x, bone.endY - target.y
                    );
                    
                    if (distToBone < bone.influenceRadius) {
                        const localInfluence = Math.max(0, 1 - distToBone / bone.influenceRadius);
                        const deformX = Math.cos(boneAngle) * localInfluence * 3;
                        const deformY = Math.sin(boneAngle) * localInfluence * 3;
                        
                        point.x = originalPoint.x + deformX;
                        point.y = originalPoint.y + deformY;
                    }
                }
            });
        }
    }

    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param));
        
        const xx = x1 + param * C;
        const yy = y1 + param * D;
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    showComingSoon(effectName) {
        document.getElementById('comingSoonModal').style.display = 'block';
    }

    showContextMenu(e) {
        const contextMenu = document.getElementById('contextMenu');
        const rect = this.canvas.getBoundingClientRect();
        
        // Sync context menu with current settings
        document.getElementById('contextBackgroundToggle').checked = this.backgroundEnabled;
        document.getElementById('contextBackgroundColor').value = this.backgroundColor;
        document.getElementById('contextAllFramesToggle').checked = document.getElementById('allFramesToggle').checked;
        
        // Position context menu
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.style.display = 'block';
    }

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
                    this.copyObject();
                    break;
                case 'v':
                    event.preventDefault();
                    this.pasteObject();
                    break;
                case 's':
                    event.preventDefault();
                    this.saveProject();
                    break;
                case 'n':
                    event.preventDefault();
                    this.newProject();
                    break;
            }
        } else {
            switch (event.key) {
                case 'Delete':
                    if (this.selectedObject) {
                        this.deleteSelectedObject();
                    }
                    break;
                case ' ':
                    event.preventDefault();
                    this.togglePlayback();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.previousFrame();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.nextFrame();
                    break;
                case 'Escape':
                    if (this.currentTool === 'bone') {
                        this.lastBone = null;
                    }
                    document.getElementById('contextMenu').style.display = 'none';
                    break;
            }
        }
    }
}

// Initialize the application
let animationMaker;
document.addEventListener('DOMContentLoaded', function () {
    animationMaker = new AnimationMaker();
    
    // Update slider display values
    document.getElementById('brushSizeValue').textContent = animationMaker.brushSize;
    document.getElementById('opacityValue').textContent = Math.round(animationMaker.opacity * 100);
    document.getElementById('fontSizeValue').textContent = animationMaker.fontSize;
});
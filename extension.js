class ThreeJsExtension {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.cube = null;
        this.renderingPaused = false;
        this.isThreeJsInitialized = false;
    }

    getInfo() {
        return {
            id: 'threeJsExtension',
            color1: '#FF5733',
            color2: '#FF5733',
            color3: '#FF5733',
            name: 'Three.js Extension',
            blocks: [
                {
                    opcode: 'create3DScene',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Create 3D Scene',
                },
                {
                    opcode: 'createCube',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Create Cube with Color: [color] Size: [size] Position: [position] Rotation: [rotation]',
                    arguments: {
                        color: {
                            type: Scratch.ArgumentType.COLOR,
                            defaultValue: '#FF0000',
                        },
                        size: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: '{"width": 1, "height": 1, "depth": 1}',
                        },
                        position: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: '{"x": 0, "y": 0, "z": 0}',
                        },
                        rotation: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: '{"x": 0, "y": 0, "z": 0}',
                        },
                    },
                },
                {
                    opcode: 'loadAndRenderObject',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Load and render 3D object from [URL]',
                    arguments: {
                        URL: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'https://lolemo.github.io/3dwarp/models/walthead.json',
                        },
                    },
                },
                {
                    opcode: 'pauseRendering',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'pause 3D scene',
                },
                {
                    opcode: 'resumeRendering',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'resume 3D scene',
                },
            ],
            menus: {},
        };
    }

    create3DScene() {
        if (!this.isThreeJsInitialized) {
            // Three.js is not initialized, load the library dynamically via a script tag
            this.isThreeJsInitialized = true;
            const threeScriptTag = document.createElement('script');
            threeScriptTag.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r155/three.min.js';
            document.head.appendChild(threeScriptTag);
        } else if (!this.renderer) {
            // Three.js is initialized, but the renderer is not created yet
            this.initThreeJsScene();
            this.createThreeJsCanvas(); // Create the Three.js canvas element
            this.renderLoop(); // Start the render loop after initialization
        } else {
            // Three.js is initialized and renderer is available
            this.resumeRendering(); // Resume the render loop if it was paused
        }
    }
        

    renderLoop() {
        // Get the Scratch canvas element
        const scratchCanvas = document.evaluate(
            '//*[@id="app"]/div/div/div/div[3]/div/div[2]/div[1]/div[2]/div/div[1]/div[1]/canvas[2]',
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;

        if (!scratchCanvas) {
            console.error('Scratch canvas not found.');
            return;
        }

        // Get the current width and height of the Scratch canvas
        const scratchCanvasWidth = scratchCanvas.clientWidth;
        const scratchCanvasHeight = scratchCanvas.clientHeight;

        // Update the Three.js canvas size to match the Scratch canvas size
        if (this.threeJsCanvas) {
            this.threeJsCanvas.width = scratchCanvasWidth;
            this.threeJsCanvas.height = scratchCanvasHeight;
            this.renderer.setSize(scratchCanvasWidth, scratchCanvasHeight);
            this.camera.aspect = scratchCanvasWidth / scratchCanvasHeight;
            this.camera.updateProjectionMatrix();
        }

        if (!this.renderingPaused && this.renderer && this.scene && this.camera) {
            if (this.cube) {
                this.cube.rotation.x += 0.01;
                this.cube.rotation.y += 0.01;
            }

            this.renderer.render(this.scene, this.camera);
        }

        // Request the next frame for the render loop
        requestAnimationFrame(() => this.renderLoop());
    }



    pauseRendering() {
        this.renderingPaused = true;
        this.hideThreeJsCanvas(); // Hide the Three.js canvas when paused
    }

    resumeRendering() {
        this.renderingPaused = false;
        this.createThreeJsCanvas(); // Show the Three.js canvas when resumed
    }

    initThreeJsScene() {
        // Check if the Three.js canvas already exists
        if (this.threeJsCanvas) {
            return;
        }

        // Get the Scratch canvas element using the provided XPath
        const scratchCanvas = document.evaluate(
            '//*[@id="app"]/div/div/div/div[3]/div/div[2]/div[1]/div[2]/div/div[1]/div[1]/canvas',
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;

        if (!scratchCanvas) {
            console.error('Scratch canvas not found.');
            return;
        }

        // Create a new canvas element for Three.js rendering
        this.threeJsCanvas = document.createElement('canvas');
        this.threeJsCanvas.width = scratchCanvas.width;
        this.threeJsCanvas.height = scratchCanvas.height;
        this.threeJsCanvas.style.position = 'absolute';
        this.threeJsCanvas.style.top = '0';
        this.threeJsCanvas.style.left = '0';
        this.threeJsCanvas.style.pointerEvents = 'none'; // Prevent interactions with Three.js canvas

        // Append the new canvas element on top of the Scratch canvas
        scratchCanvas.parentNode.insertBefore(this.threeJsCanvas, scratchCanvas);

        // Initialize Three.js renderer and scene
        this.renderer = new window.THREE.WebGLRenderer({ canvas: this.threeJsCanvas });
        this.scene = new window.THREE.Scene();
        this.camera = new window.THREE.PerspectiveCamera(75, this.threeJsCanvas.width / this.threeJsCanvas.height, 0.1, 1000);

        this.camera.position.z = 5;
    }

    createThreeJsCanvas() {
        // Show the Three.js canvas
        this.threeJsCanvas.style.display = 'block';
    }

    hideThreeJsCanvas() {
        // Hide the Three.js canvas
        this.threeJsCanvas.style.display = 'none';
    }

    createCube({ color, size, position, rotation }) {
        // Convert color from Scratch format (#RRGGBB) to Three.js format (0xRRGGBB)
        const threeJsColor = new THREE.Color(color);

        // Create the cube geometry with the provided size
        const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);

        // Create a new material with the provided color
        const material = new THREE.MeshBasicMaterial({ color: threeJsColor });

        // Create the cube mesh
        const cube = new THREE.Mesh(geometry, material);

        // Set the position of the cube based on the provided coordinates
        cube.position.set(position.x, position.y, position.z);

        // Set the rotation of the cube based on the provided rotation angles
        cube.rotation.set(rotation.x, rotation.y, rotation.z);

        // Add the cube to the scene
        this.scene.add(cube);
    }

    loadAndRenderObject(url) {
        const loader = new THREE.ObjectLoader();
        loader.load(url, (object) => {
            // You can manipulate the loaded object here before adding it to the scene
            this.scene.add(object);
        });
    }


    // Add more Three.js related functions here
    // For example, functions to add more 3D objects, manipulate them, etc.
}

Scratch.extensions.register(new ThreeJsExtension());

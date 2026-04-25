import { RenderSystem } from './core/RenderSystem.js';
import * as constants from './data/constants.js';
import {Inputs} from './data/inputs.js';

export class Game {
    canvas: HTMLCanvasElement;
    inputMapping: Map<Inputs, (() => void)[]>;

    renderSystem: RenderSystem;

    constructor() {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

        this.renderSystem = new RenderSystem(this.canvas);
        this.inputMapping = new Map();
        for (const key of Object.keys(Inputs) as (keyof typeof Inputs)[]) {
            const input = Inputs[key];
            this.inputMapping.set(input, []);
        }

        this.setupCanvas();
        this.setupInputs();
        this.setupUI();
    }
    setupCanvas = () => {
        
        this.canvas.width = constants.CANVAS_WIDTH;
        this.canvas.height = constants.CANVAS_HEIGHT;
        
        const onResize = (): void => {
            let w, h;
            const [width, height] = [window.innerWidth, window.innerHeight];
            const aspectRatio = width / height;
            if (aspectRatio > constants.CANVAS_ASPECT_RATIO) {
                [w, h] = [height * constants.CANVAS_ASPECT_RATIO, height];
            } else {
                [w, h] = [width, width / constants.CANVAS_ASPECT_RATIO];
            }
            this.canvas.style.width = `${w}px`;
            this.canvas.style.height = `${h}px`;
    
            this.renderSystem.clear('#008800');
        };
        window.addEventListener('resize', onResize);
        onResize();
    };
    
    setupUI = () => {
        const pauseMenu = document.getElementById("pauseMenu");
        const resumeBtn = document.getElementById("resumeBtn");
    
        const showMenu = (menu: HTMLElement | null, show?: boolean) => {
            switch (show) {
                case undefined:
                    menu?.classList.toggle('active');
                    break;
                case true:
                    menu?.classList.add('active');
                    break;
                case false:
                    menu?.classList.remove('active');
            }
        };
    
        resumeBtn?.addEventListener('click', (ev: PointerEvent) => {
            showMenu(pauseMenu, false);
            ev.stopPropagation();
        });

        this.inputMapping.get(Inputs.PAUSE)?.push(() => {
            console.log("PAUSE HIT!");
            showMenu(pauseMenu);
        });
    };

    triggerInput = (input: Inputs) => {
        this.inputMapping.get(input)?.forEach(cb => cb());
    };

    setupInputs = () => {
        // Keyboard inputs
        window.addEventListener('keydown', (ev: KeyboardEvent) => {
            switch (ev.key.toLowerCase()) {
                case 'escape':
                    this.triggerInput(Inputs.PAUSE);
            }
        });
    };
}
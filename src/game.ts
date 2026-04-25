import { InputSystem } from './core/InputSystem.js';
import { RenderGroup, RenderSystem } from './core/RenderSystem.js';
import { UiSystem } from './core/UiSystem.js';
import * as constants from './data/constants.js';
import {State, Trigger} from './data/inputs.js';
import type { Sprite } from './data/sprites.js';

export class Game {
    canvas: HTMLCanvasElement;

    renderSystem: RenderSystem;
    inputSystem: InputSystem;
    uiSystem: UiSystem;

    paused = false;

    constructor() {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

        this.renderSystem = new RenderSystem(this.canvas);
        this.inputSystem = new InputSystem();
        this.uiSystem = new UiSystem(this);

        this.setupCanvas();

        this.setupTestSprite();
        this.gameLoop();
    }
    setupCanvas = () => {
        
        this.canvas.width = constants.CANVAS_WIDTH;
        this.canvas.height = constants.CANVAS_HEIGHT;
        
        const onResize = (): void => {
            this.renderSystem.onResize();
        };
        window.addEventListener('resize', onResize);
        onResize();
    };

    registerTrigger(input: Trigger, callback: () => void) {
        this.inputSystem.registerTrigger(input, callback);
    }

    x: number = 10;
    y: number = 10;
    setupTestSprite() {
        const sprite: Sprite = {
            image: 'sprite_atlas',
            x0: 0,
            y0: 0,
            width: 16,
            height: 16,
            color: '#ffffff'
        };

        const gameObj = {
            render: (renderSystem: RenderSystem) => {
                renderSystem.drawSprite(sprite, this.x, this.y, 128, 128);
            }
        };

        const renderGroup = new RenderGroup();
        renderGroup.add(gameObj);

        this.renderSystem.registerRenderGroup(renderGroup);

        this.renderSystem.clearColor = '#008800';
    }

    gameLoop() {
        this.update();
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.paused) {
            return;
        }

        if (this.inputSystem.isPressed(State.LEFT)) {
            this.x--;
        }
        if (this.inputSystem.isPressed(State.RIGHT)) {
            this.x++;
        }
        if (this.inputSystem.isPressed(State.UP)) {
            this.y--;
        }
        if (this.inputSystem.isPressed(State.DOWN)) {
            this.y++;
        }
    }

    render() {
        this.renderSystem.render();
    }
}
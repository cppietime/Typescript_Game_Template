import { JoystickModule } from './component/controls/Joystick.js';
import { PlayerModule, type PlayerEntity } from './component/entity/Player.js';
import { RenderModule } from './component/render/RenderComponent.js';
import { InputSystem } from './core/InputSystem.js';
import type { ClickState } from './core/InputSystem.js';
import { RenderGroup, RenderSystem } from './core/RenderSystem.js';
import { UiSystem } from './core/UiSystem.js';
import * as constants from './data/constants.js';
import {State, Trigger} from './data/inputs.js';
import type { Sprite } from './data/sprites.js';
import type { Vec2, OriginRect } from './util/geometry.js';
import { RectModule } from './util/geometry.js';

export class Game {
    canvas: HTMLCanvasElement;

    renderSystem: RenderSystem;
    inputSystem: InputSystem;
    uiSystem: UiSystem;

    paused = false;

    lastTime = 0;
    deltaTime = 0;

    constructor() {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

        this.renderSystem = new RenderSystem(this.canvas);
        this.inputSystem = new InputSystem(this);
        this.uiSystem = new UiSystem(this);

        this.lastTime = Date.now();

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

    player?: PlayerEntity;
    setupTestSprite() {
        const sprite: Sprite = {
            image: 'sprite_atlas',
            x0: 0,
            y0: 0,
            width: 16,
            height: 16,
            color: '#ffffff'
        };

        this.player = PlayerModule.create(this);

        const joystick = JoystickModule.create(this);

        const renderGroup = this.renderSystem.getRenderGroup(0);
        renderGroup.add(RenderModule.bindRender(this.player));
        renderGroup.add(RenderModule.bindRender(joystick));

        this.renderSystem.clearColor = '#008800';

        const centerSquare: OriginRect = {
            origin: {x: 50, y: 630},
            size: {x: 30, y: 30},
        };
        this.inputSystem.touchListeners.add(clickState => {
            if (!(clickState.down && clickState.initial))
                return;
            if (RectModule.rectContains(centerSquare, clickState)) {
                console.log('Center click');
            }
        });
    }

    gameLoop() {
        this.update();
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    pause(paused: boolean) {
        this.paused = paused;
        this.inputSystem.onInterrupt();
    }

    update() {
        this.deltaTime = Date.now() - this.lastTime;
        this.lastTime += this.deltaTime;
        if (this.paused) {
            return;
        }

        this.player?.components.update(this, this.player);
    }

    render() {
        this.renderSystem.render();
    }

    positionOnCanvas(x: number, y: number): Vec2 {
        return this.renderSystem.positionOnCanvas(x, y);
    }
}
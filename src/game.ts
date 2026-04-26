import { createPlayer, type Player } from './component/entity/Player.js';
import { bindRender } from './component/render/RenderComponent.js';
import { InputSystem } from './core/InputSystem.js';
import type { ClickState } from './core/InputSystem.js';
import { RenderGroup, RenderSystem } from './core/RenderSystem.js';
import { UiSystem } from './core/UiSystem.js';
import * as constants from './data/constants.js';
import {State, Trigger} from './data/inputs.js';
import type { Sprite } from './data/sprites.js';
import type { Vec2, OriginRect } from './util/geometry.js';
import { rectContains, tlRectToOrigin } from './util/geometry.js';

export class Game {
    canvas: HTMLCanvasElement;

    renderSystem: RenderSystem;
    inputSystem: InputSystem;
    uiSystem: UiSystem;

    paused = false;

    constructor() {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

        this.renderSystem = new RenderSystem(this.canvas);
        this.inputSystem = new InputSystem(this);
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

    player?: Player;
    setupTestSprite() {
        const sprite: Sprite = {
            image: 'sprite_atlas',
            x0: 0,
            y0: 0,
            width: 16,
            height: 16,
            color: '#ffffff'
        };

        this.player = createPlayer();

        const joystick = {
            render (renderSystem: RenderSystem) {
                renderSystem.drawSprite({
                    image: '',
                    x0: 0,
                    y0: 0,
                    width: 100,
                    height: 100,
                    color: '#000',
                }, 20, 600, 100, 100);
            }
        };

        const renderGroup = new RenderGroup();
        renderGroup.add(bindRender(this.player));
        renderGroup.add(joystick);

        this.renderSystem.registerRenderGroup(renderGroup);

        this.renderSystem.clearColor = '#008800';

        const leftSquare: OriginRect = tlRectToOrigin({
            topLeft: {x: 20, y: 600},
            size: {x: 30, y: 100},
        });
        const rightSquare: OriginRect = tlRectToOrigin({
            topLeft: {x: 90, y: 600},
            size: {x: 30, y: 100},
        });
        const upSquare: OriginRect = tlRectToOrigin({
            topLeft: {x: 20, y: 600},
            size: {x: 100, y: 30},
        });
        const downSquare: OriginRect = tlRectToOrigin({
            topLeft: {x: 20, y: 670},
            size: {x: 100, y: 30},
        });
        this.inputSystem.inputRegions.push({
            predicate: (click: ClickState, states: Set<State>) => {
                if (!click.down) return false;
                if (rectContains(leftSquare, click)) states.add(State.LEFT);
                if (rectContains(rightSquare, click)) states.add(State.RIGHT);
                if (rectContains(upSquare, click)) states.add(State.UP);
                if (rectContains(downSquare, click)) states.add(State.DOWN);
                return false;
            }
        });

        const centerSquare: OriginRect = {
            origin: {x: 50, y: 630},
            size: {x: 30, y: 30},
        };
        this.inputSystem.touchListeners.push(clickState => {
            if (!(clickState.down && clickState.initial))
                return;
            if (rectContains(centerSquare, clickState)) {
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
        if (this.paused) {
            return;
        }

        if (this.player) {
            if (this.inputSystem.isPressed(State.LEFT)) {
                this.player.components.rect.origin.x--;
            }
            if (this.inputSystem.isPressed(State.RIGHT)) {
                this.player.components.rect.origin.x++;
            }
            if (this.inputSystem.isPressed(State.UP)) {
                this.player.components.rect.origin.y--;
            }
            if (this.inputSystem.isPressed(State.DOWN)) {
                this.player.components.rect.origin.y++;
            }
        }
    }

    render() {
        this.renderSystem.render();
    }

    positionOnCanvas(x: number, y: number): Vec2 {
        return this.renderSystem.positionOnCanvas(x, y);
    }
}
import { JoystickModule } from './component/controls/Joystick.js';
import { DecorModule } from './component/entity/Decor.js';
import { PlayerModule, type PlayerEntity } from './component/entity/Player.js';
import { CollisionModule } from './component/physics/Collision.js';
import { RenderModule } from './component/render/RenderComponent.js';
import { InputSystem } from './core/InputSystem.js';
import type { ClickState } from './core/InputSystem.js';
import { PhysicsSystem } from './core/PhysicsSystem.js';
import { RenderGroup, RenderSystem } from './core/RenderSystem.js';
import { UiSystem } from './core/UiSystem.js';
import { UpdateSystem } from './core/UpdateSystem.js';
import * as constants from './data/constants.js';
import {State, Trigger} from './data/inputs.js';
import type { Sprite } from './data/sprites.js';
import type { Vec2, OriginRect } from './util/Geometry.js';
import { RectModule } from './util/Geometry.js';

export class Game {
    canvas: HTMLCanvasElement;

    renderSystem: RenderSystem;
    inputSystem: InputSystem;
    uiSystem: UiSystem;
    physicsSystem: PhysicsSystem;
    updateSystem: UpdateSystem;

    paused = false;

    lastTime = 0;
    deltaTime = 0;

    constructor() {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

        this.renderSystem = new RenderSystem(this.canvas);
        this.inputSystem = new InputSystem(this);
        this.uiSystem = new UiSystem(this);
        this.physicsSystem = new PhysicsSystem();
        this.updateSystem = new UpdateSystem();

        this.lastTime = Date.now() / 1000;

        this.setupCanvas();

        this.setupTestSprite();
        this.gameLoop();
    }
    
    setupCanvas() {
        
        this.canvas.width = constants.CANVAS_WIDTH;
        this.canvas.height = constants.CANVAS_HEIGHT;
        
        const onResize = (): void => {
            this.renderSystem.onResize();
        };
        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.loseFocus();
            } else {
                this.gainFocus();
            }
        });
        onResize();
    };

    loseFocus() {
        this.uiSystem.pause();
    }

    gainFocus() {
        this.lastTime = Date.now() / 1000;
    }

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

        const joystick = JoystickModule.createDpad8(this);

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

        this.physicsSystem.addCollider(this.player.components.uuid.uuid);

        const prop = DecorModule.createDecor(this);
        prop.components.rect.origin = {x: 400.5, y: 144};
        this.physicsSystem.addCollider(prop.components.uuid.uuid);
        renderGroup.add(RenderModule.bindRender(prop));
        prop.components.collision.collisionSets.push(CollisionModule.collisionSetMap.addAndTag({
            entityId: prop.components.uuid.uuid,
            isSolid: true,
            layers: new Set([1]),
            mask: new Set([1]),
            rects: [
                {origin: {x: 0, y: 0}, size: {x: 64, y: 64}}
            ],
            onCollide: () => console.log('Solid Collision')
        }));

        const trigger = DecorModule.createDecor(this, false);
        trigger.components.rect.origin = {x: 220, y: 544};
        this.physicsSystem.addCollider(trigger.components.uuid.uuid);
        renderGroup.add(RenderModule.bindRender(trigger));
        trigger.components.collision.collisionSets.push(CollisionModule.collisionSetMap.addAndTag({
            entityId: trigger.components.uuid.uuid,
            isSolid: false,
            layers: new Set([]),
            mask: new Set([1]),
            rects: [
                {origin: {x: 0, y: 0}, size: {x: 64, y: 64}}
            ],
            onCollide: () => console.log('Nonsolid Collision')
        }));

        const triggered = DecorModule.createDecor(this, false);
        triggered.components.rect.origin = {x: 300, y: 300};
        this.physicsSystem.addCollider(triggered.components.uuid.uuid);
        renderGroup.add(RenderModule.bindRender(triggered));
        triggered.components.collision.collisionSets.push(CollisionModule.collisionSetMap.addAndTag({
            entityId: triggered.components.uuid.uuid,
            isSolid: false,
            layers: new Set([0]),
            mask: new Set([]),
            rects: [
                {origin: {x: 0, y: 0}, size: {x: 64, y: 64}}
            ],
        }));

        this.updateSystem.add(this.player);
        this.updateSystem.add(prop);
        this.updateSystem.add(trigger);
        this.updateSystem.add(triggered);
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

    frames = 0;
    runTime = 0;
    update() {
        this.deltaTime = Date.now() / 1000 - this.lastTime;
        this.lastTime += this.deltaTime;
        this.frames++;
        this.runTime += this.deltaTime;
        if (this.frames % 100 === 0) {
            console.log(this.frames / this.runTime, 'FPS');
        }
        if (this.paused) {
            return;
        }

        // this.player?.components.update(this, this.player);
        this.updateSystem.update(this);

        this.physicsSystem.checkCollisions(this);
    }

    render() {
        this.renderSystem.render();
    }

    positionOnCanvas(x: number, y: number): Vec2 {
        return this.renderSystem.positionOnCanvas(x, y);
    }
}
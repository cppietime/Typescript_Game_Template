import { JoystickModule } from '../game/entities/ui/Joystick.js';
import { DecorModule } from '../game/entities/template/Decor.js';
import { PlayerModule, type PlayerEntity } from '../game/entities/Player.js';
import { CollisionModule, createCollisionSet } from './components/Collision.js';
import { InputSystem } from './systems/InputSystem.js';
import { PhysicsSystem } from './systems/PhysicsSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { UiSystem } from './systems/UiSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';
import * as constants from '../game/data/Constants.js';
import {Trigger} from '../game/data/Inputs.js';
import type { Vec2, OriginRect } from './util/Geometry.js';
import { createOriginRect, createTlRect, createVec2, GeometryModule } from './util/Geometry.js';
import {ScrollModule} from '../game/entities/template/Scroll.js';
import type { EntitySystem } from "./systems/EntitySystem.js";
import type { Entity } from "./entity/Entity.js";
import { UuidPool } from "./entity/Uuid.js";
import { createOriginComponent } from "./components/Physical.js";

enum CommandType {
    CREATE,
    DESTROY,
    ADD,
    REMOVE,
};

type Command = {
    type: CommandType.CREATE,
    entity: Entity<any>,
} | {
    type: CommandType.DESTROY,
    uuid: number,
} | {
    type: CommandType.ADD,
    uuid: number,
    key: string,
    component: any,
} | {
    type: CommandType.REMOVE,
    uuid: number,
    key: string,
};

export class Game {
    canvas: HTMLCanvasElement;

    renderSystem: RenderSystem;
    inputSystem: InputSystem;
    uiSystem: UiSystem;
    physicsSystem: PhysicsSystem;
    updateSystem: UpdateSystem;

    entitySystems: EntitySystem[] = [];

    commandQueue: Command[] = [];
    dirtyEntities = new Set<number>();

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

        this.entitySystems.push(
            this.updateSystem,
            this.physicsSystem,
            this.renderSystem,
        );

        this.lastTime = Date.now() / 1000;

        this.setupCanvas();
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

    createEntity(entity: Entity<any>) {
        this.commandQueue.push({type: CommandType.CREATE, entity});
    }

    destroyEntity(uuid: number) {
        this.commandQueue.push({type: CommandType.DESTROY, uuid});
    }

    addComponent(uuid: number, key: string, component: any) {
        this.commandQueue.push({type: CommandType.ADD, uuid, key, component});
    }

    removeComponent(uuid: number, key: string) {
        this.commandQueue.push({type: CommandType.REMOVE, uuid, key});
    }

    syncEntity(uuid: number) {
        const entity = UuidPool.get(uuid);
        if (entity === undefined) {
            return;
        }
        for (const system of this.entitySystems) {
            const shouldBePresent = system.predicate(entity) && entity.isAlive;
            const isPresent = system.containsEntity(uuid);
            if (shouldBePresent && !isPresent) {
                system.addEntity(entity);
            } else if (isPresent && !shouldBePresent) {
                system.removeEntity(uuid);
            }
        }
        if (!entity.isAlive) {
            UuidPool.release(entity);
        }
    }

    flushCommands() {
        this.dirtyEntities.clear();
        for (const command of this.commandQueue) {
            this.runCommand(command);
        }
        this.commandQueue.length = 0;
        this.dirtyEntities.forEach((entity) => this.syncEntity(entity));
    }

    runCommand(command: Command) {
        switch (command.type) {
            case CommandType.CREATE:
                {
                    const entity = command.entity;
                    UuidPool.assignUuid(entity);
                    this.dirtyEntities.add(entity.uuid);
                    break;
                }
            case CommandType.DESTROY:
                {
                    const entity = UuidPool.get(command.uuid);
                    if (entity === undefined) {
                        break;
                    }
                    entity.isAlive = false;
                    this.dirtyEntities.add(command.uuid);
                    break;
                }
            case CommandType.ADD:
                break;
            case CommandType.REMOVE:
                break;
        }
    }

    start() {
        this.gameLoop();
    }

    gameLoop() {
        this.update();
        this.flushCommands();
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
            //console.log(this.frames / this.runTime, 'FPS');
        }
        if (this.paused) {
            return;
        }

        this.inputSystem.fireTouchEvent();
        this.updateSystem.update(this);
        this.physicsSystem.checkCollisions(this);
    }

    render() {
        this.renderSystem.render();
    }

    positionOnCanvas(x: number, y: number): Vec2 {
        return this.renderSystem.positionOnCanvas({x, y});
    }
}
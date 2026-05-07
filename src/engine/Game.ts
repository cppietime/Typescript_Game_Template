/**
 * Starting point for games. Contains all systems and handles command queue.
 */

import { InputSystem } from './systems/InputSystem.js';
import { PhysicsSystem } from './systems/PhysicsSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { UiSystem } from './systems/UiSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';
import * as constants from '../game/data/Constants.js';
import {Trigger} from '../game/data/Inputs.js';
import type { Vec2 } from './util/Geometry.js';
import type { EntitySystem } from "./systems/EntitySystem.js";
import type { Entity } from "./entity/Entity.js";
import { UuidPool } from "./entity/Uuid.js";
import { LifecycleSystem } from "./systems/LifecycleSystem.js";

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

/**
 * Container of systems and core game logic.
 */
export class Game {
    readonly canvas: HTMLCanvasElement;

    readonly renderSystem: RenderSystem;
    readonly inputSystem: InputSystem;
    readonly uiSystem: UiSystem;
    readonly physicsSystem: PhysicsSystem;
    readonly updateSystem: UpdateSystem;
    readonly lifecycleSystem: LifecycleSystem;

    private readonly entitySystems: EntitySystem[] = [];

    private commandQueue: Command[] = [];
    private dirtyEntities = new Set<number>();

    paused = false;

    lastTime = 0;
    deltaTime = 0;

    preUpdate?: () => void;
    postUpdate?: () => void;

    constructor() {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

        this.renderSystem = new RenderSystem(this.canvas);
        this.inputSystem = new InputSystem(this);
        this.uiSystem = new UiSystem(this);
        this.physicsSystem = new PhysicsSystem();
        this.updateSystem = new UpdateSystem();
        this.lifecycleSystem = new LifecycleSystem();

        this.entitySystems.push(
            this.updateSystem,
            this.physicsSystem,
            this.renderSystem,
            this.lifecycleSystem,
        );

        this.lastTime = Date.now() / 1000;

        this.setupCanvas();
    }
    
    private setupCanvas() {
        
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

    /**
     * The game loses focus. E.g. pause menu.
     */
    loseFocus() {
        this.uiSystem.pause();
    }

    /**
     * The game regains focus. E.g. reset delta time.
     */
    gainFocus() {
        this.lastTime = Date.now() / 1000;
    }

    /**
     * Register something to occur when a trigger is tripped, such as a pause menu.
     * @param input Trigger
     * @param callback Function called on trigger
     */
    registerTrigger(input: Trigger, callback: () => void) {
        this.inputSystem.registerTrigger(input, callback);
    }

    /**
     * Queue creation of an entity
     * @param entity 
     */
    createEntity(entity: Entity<any>) {
        this.commandQueue.push({type: CommandType.CREATE, entity});
    }

    /**
     * Queue destruction of an entity based on its UUID
     * @param uuid
     */
    destroyEntity(uuid: number) {
        this.commandQueue.push({type: CommandType.DESTROY, uuid});
    }

    /**
     * Queue addition of a new component to an entity
     * @param uuid 
     * @param key 
     * @param component 
     */
    addComponent(uuid: number, key: string, component: any) {
        this.commandQueue.push({type: CommandType.ADD, uuid, key, component});
    }

    /**
     * Queue removal of a component from an entity
     * @param uuid
     * @param key 
     */
    removeComponent(uuid: number, key: string) {
        this.commandQueue.push({type: CommandType.REMOVE, uuid, key});
    }

    private syncEntity(uuid: number) {
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

    private flushCommands() {
        this.dirtyEntities.clear();
        while (this.commandQueue.length != 0) {
            const oldQueue = this.commandQueue;
            this.commandQueue = [];
            for (const command of oldQueue) {
                this.runCommand(command);
            }
        }
        this.dirtyEntities.forEach((entity) => this.syncEntity(entity));
    }

    private runCommand(command: Command) {
        switch (command.type) {
            case CommandType.CREATE:
                {
                    const entity = command.entity;
                    UuidPool.assignUuid(entity);
                    console.log('Assigned', entity.uuid);
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

    private gameLoop() {
        this.preUpdate?.();
        this.update();
        this.postUpdate?.();
        this.flushCommands();
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    pause(paused: boolean) {
        this.paused = paused;
        this.inputSystem.onInterrupt();
    }

    private update() {
        this.deltaTime = Date.now() / 1000 - this.lastTime;
        this.lastTime += this.deltaTime;
        if (this.paused) {
            return;
        }

        this.inputSystem.fireTouchEvent();
        this.updateSystem.update(this);
        this.physicsSystem.checkCollisions(this);
    }

    private render() {
        this.renderSystem.render();
    }

    positionOnCanvas(pos: Vec2): Vec2 {
        return this.renderSystem.positionOnCanvas(pos);
    }
}
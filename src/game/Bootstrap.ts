import { CollisionModule, createCollisionSet } from "../engine/components/Collision.js";
import { createOriginComponent } from "../engine/components/Physical.js";
import { createOriginRect, createTlRect, createVec2, GeometryModule, type OriginRect } from "../engine/util/Geometry.js";
import {Game} from '../engine/Game.js';
import { PlayerModule } from "./entities/Player.js";
import { DecorModule } from "./entities/template/Decor.js";
import { ScrollModule } from "./entities/template/Scroll.js";
import { JoystickModule } from "./entities/ui/Joystick.js";
import { State, Trigger } from "./data/Inputs.js";
import { EnemyModule } from "./entities/template/Enemy.js";
import { RenderModule } from "../engine/components/RenderComponent.js";
import type { Animation } from "../engine/data/types/Sprites.js";

const main = (): void => {
    console.log('Main');
    window.addEventListener('load', onLoad);
};

const onLoad = (): void => {
    console.log('onLoad');
    const game = new Game();
    setupGame(game);
    startGame(game);
};

function setupGame(game: Game) {
    const inputSystem = game.inputSystem;
    window.addEventListener('keydown', (ev: KeyboardEvent) => {
        switch (ev.key.toLowerCase()) {
            case 'escape':
                inputSystem.triggerInput(Trigger.PAUSE);
                break;
            
            case 'w':
            case 'arrowup':
                inputSystem.setState(State.UP, true);
                break;
            case 'a':
            case 'arrowleft':
                inputSystem.setState(State.LEFT, true);
                break;
            case 's':
            case 'arrowdown':
                inputSystem.setState(State.DOWN, true);
                break;
            case 'd':
            case 'arrowright':
                inputSystem.setState(State.RIGHT, true);
                break;
        }
    });

    window.addEventListener('keyup', (ev: KeyboardEvent) => {
        switch (ev.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                inputSystem.setState(State.UP, false);
                break;
            case 'a':
            case 'arrowleft':
                inputSystem.setState(State.LEFT, false);
                break;
            case 's':
            case 'arrowdown':
                inputSystem.setState(State.DOWN, false);
                break;
            case 'd':
            case 'arrowright':
                inputSystem.setState(State.RIGHT, false);
                break;
        }
    });

    const player = PlayerModule.create(game);
    game.createEntity(player);

    const joystick = JoystickModule.createDpad8(game);
    game.createEntity(joystick);

    game.renderSystem.clearColor = '#0088ff';

    const centerSquare: OriginRect = createOriginRect({
        origin: createVec2({x: 50, y: 630}),
        size: createVec2({x: 30, y: 30}),
    });
    game.inputSystem.touchListeners.add(clickState => {
        if (!(clickState.down && clickState.initial))
            return;
        if (GeometryModule.rectContains(centerSquare, clickState)) {
            console.log('Center click');
        }
    });

    const makeFollower = () => {
        const prop = DecorModule.createDecor(game);
        prop.components.origin = createOriginComponent({origin: createVec2({x: -20, y: -144})});
        prop.components.collision.collisionSets.push(CollisionModule.collisionSetMap.addAndTag(createCollisionSet({
            entityId: prop.uuid,
            isSolid: true,
            layers: new Set([1]),
            mask: new Set([1]),
            rects: [
                createOriginRect({size: createVec2({x: 64, y: 64})})
            ],
            onCollide: () => {}
        })));
        prop.components.tick = () => {
            const propPos = prop.components.origin.origin;
            const playerPos = player.components.origin.origin;
            const diff = createVec2({x: playerPos.x - propPos.x, y: playerPos.y - propPos.y});
            const mag = Math.hypot(diff.x, diff.y);
            prop.components.velocity = createVec2({x: diff.x / mag * 150, y: diff.y / mag * 150});
        };
        return prop;
    };
    const prop1 = makeFollower();
    game.createEntity(prop1);
    const prop2 = makeFollower();
    prop2.components.origin.origin = createVec2({x: -20, y: -40});
    game.createEntity(prop2);

    const trigger = DecorModule.createDecor(game);
    trigger.components.origin = createOriginComponent({origin: createVec2({x: 220, y: 544})});
    trigger.components.collision.collisionSets.push(CollisionModule.collisionSetMap.addAndTag(createCollisionSet({
        mask: new Set([1]),
        rects: [
            createOriginRect({size: createVec2({x: 64, y: 64})})
        ],
        onCollide: () => {
            console.log('Nonsolid Collision');
            game.destroyEntity(trigger.uuid);
            const r = player?.components.renderable;
            if (r !== undefined) r.visible = false;
        }
    })));
    //game.createEntity(trigger);
    console.log('Trigger id', trigger.uuid);

    const triggered = DecorModule.createDecor(game);
    triggered.components.origin = createOriginComponent({origin: createVec2({x: 300, y: 300}), inWorld: false});
    triggered.components.collision.collisionSets.push(CollisionModule.collisionSetMap.addAndTag(createCollisionSet({
        entityId: triggered.uuid,
        layers: new Set([0]),
        rects: [
            createOriginRect({size: createVec2({x: 64, y: 64})})
        ],
    })));
    //game.createEntity(triggered);

    const bg = ScrollModule.create(game, {
        image: 'background',
        source: createTlRect({
            topLeft: createVec2({}),
            size: createVec2({x: 1280, y: 720})
        }),
        color: '#ff0',
    });
    game.createEntity(bg);

    const enemyAnim: Animation = {
        frames: [
            {
                time: 0.25,
                sprite: {
                    image: 'sprite_atlas',
                    source: createTlRect({topLeft: createVec2({x: 0, y: 16}), size: createVec2({x: 16, y: 16})}),
                    color: '#f00',
                }
            },
            {
                time: 0.25,
                sprite: {
                    image: 'sprite_atlas',
                    source: createTlRect({topLeft: createVec2({x: 16, y: 16}), size: createVec2({x: 16, y: 16})}),
                    color: '#f00',
                }
            },
            {
                time: 0.25,
                sprite: {
                    image: 'sprite_atlas',
                    source: createTlRect({topLeft: createVec2({x: 32, y: 16}), size: createVec2({x: 16, y: 16})}),
                    color: '#f00',
                }
            },
            {
                time: 0.25,
                sprite: {
                    image: 'sprite_atlas',
                    source: createTlRect({topLeft: createVec2({x: 48, y: 16}), size: createVec2({x: 16, y: 16})}),
                    color: '#f00',
                }
            },
            {
                time: 0.25,
                sprite: {
                    image: 'sprite_atlas',
                    source: createTlRect({topLeft: createVec2({x: 32, y: 16}), size: createVec2({x: 16, y: 16})}),
                    color: '#f00',
                }
            },
            {
                time: 0.25,
                sprite: {
                    image: 'sprite_atlas',
                    source: createTlRect({topLeft: createVec2({x: 16, y: 16}), size: createVec2({x: 16, y: 16})}),
                    color: '#f00',
                }
            },
        ],
    };
    const enemy = EnemyModule.create(
        game,
        {collisionSets: [
            EnemyModule.createHitBox([createOriginRect({origin: createVec2({}), size: createVec2({x: 64, y: 64})})], 1),
            EnemyModule.createHurtBox([createOriginRect({origin: createVec2({}), size: createVec2({x: 64, y: 64})})], 2),
        ]},
        createVec2({x: 64, y: 64}),
        RenderModule.animationRenderer(enemyAnim),
        {
            attack: 1,
            health: 100,
            speed: 100,
        },
    );
    enemy.components.origin.origin = createVec2({x: 100, y: 200});
    game.createEntity(enemy);
}

function startGame(game: Game) {
    game.start();
}

main();

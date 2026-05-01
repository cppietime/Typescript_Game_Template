import { CollisionModule, createCollisionSet } from "../engine/components/Collision.js";
import { createOriginComponent } from "../engine/components/Physical.js";
import { createOriginRect, createTlRect, createVec2, GeometryModule, type OriginRect } from "../engine/util/Geometry.js";
import {Game} from '../engine/Game.js';
import { PlayerModule } from "./entities/Player.js";
import { DecorModule } from "./entities/template/Decor.js";
import { ScrollModule } from "./entities/template/Scroll.js";
import { JoystickModule } from "./entities/ui/Joystick.js";
import { State, Trigger } from "./data/Inputs.js";

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

    const prop = DecorModule.createDecor(game);
    prop.components.origin = createOriginComponent({origin: createVec2({x: 400.5, y: 144})});
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
    game.createEntity(prop);

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
    game.createEntity(trigger);
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
    game.createEntity(triggered);

    const bg = ScrollModule.create(game, {
        image: 'background',
        source: createTlRect({
            topLeft: createVec2({}),
            size: createVec2({x: 1280, y: 720})
        }),
        color: '#ff0',
    });
    game.createEntity(bg);
}

function startGame(game: Game) {
    game.start();
}

main();

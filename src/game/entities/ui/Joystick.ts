import { State } from "../../data/Inputs.js";
import type { Game } from "../../../engine/Game.js";
import { type Entity } from "../../../engine/entity/Entity.js";
import { UNASSIGNED, type CleanupFn } from "../../../engine/entity/Uuid.js";
import { RenderModule, type RenderEntity } from "../../../engine/components/RenderComponent.js";
import { type OriginRect, type Vec2, createOriginRect, createTlRect, createVec2, GeometryModule } from "../../../engine/util/Geometry.js";
import type { RenderSystem } from "../../../engine/systems/RenderSystem.js";
import type { Sprite } from "../../../engine/data/types/Sprites.js";
import { createOriginComponent, type OriginEntity } from "../../../engine/components/Physical.js";
import { CollisionModule, createCollisionSet, type CollisionEntity, type TouchEvent } from "../../../engine/components/Collision.js";
import {TouchType} from "../../../engine/data/types/Inputs.js";

export type Joystick = RenderEntity & OriginEntity & CollisionEntity;

export const JoystickModule = {
    createDpad8: (
        game: Game,
        center: Vec2,
        size: number,
        colors: string[] = [
            '#f00',
            '#ff0',
            '#8f0',
            '#f0f',
            '#0f0',
            '#80f',
            '#00f',
            '#0ff',
        ],
    ): Joystick => {
        const originRect: OriginRect = createOriginRect({origin: center, size: createVec2({x: size * 3, y: size * 3})});
        const leftSquare: OriginRect = createOriginRect({origin: createVec2({x: -size, y: 0}), size: createVec2({x: size, y: size * 3})});
        const rightSquare: OriginRect = createOriginRect({origin: createVec2({x: size, y: 0}), size: createVec2({x: size, y: size * 3})});
        const upSquare: OriginRect = createOriginRect({origin: createVec2({x: 0, y: -size}), size: createVec2({x: size * 3, y: size})});
        const downSquare: OriginRect = createOriginRect({origin: createVec2({x: 0, y: size}), size: createVec2({x: size * 3, y: size})});
        const rects = [
            {square: leftSquare, state: State.LEFT},
            {square: rightSquare, state: State.RIGHT},
            {square: upSquare, state: State.UP},
            {square: downSquare, state: State.DOWN},
        ];
        const squares = [
            {x: originRect.origin.x - size, y: originRect.origin.y - size, color: colors[0]},
            {x: originRect.origin.x - 0, y: originRect.origin.y - size, color: colors[1]},
            {x: originRect.origin.x + size, y: originRect.origin.y - size, color: colors[2]},
            {x: originRect.origin.x - size, y: originRect.origin.y - 0, color: colors[3]},
            {x: originRect.origin.x + size, y: originRect.origin.y - 0, color: colors[4]},
            {x: originRect.origin.x - size, y: originRect.origin.y + size, color: colors[5]},
            {x: originRect.origin.x - 0, y: originRect.origin.y + size, color: colors[6]},
            {x: originRect.origin.x + size, y: originRect.origin.y + size, color: colors[7]},
        ];
        const joystick = {
            game: game,
            components: {
                renderable: RenderModule.fromCallback((renderSystem: RenderSystem, data: Entity<any>) => {
                        for (const square of squares) {
                            const sprite: Sprite = {
                                image: '',
                                source: createTlRect({
                                    topLeft: createVec2({}),
                                    size: createVec2({x: size, y: size}),
                                }),
                                color: square.color!,
                            };
                            renderSystem.drawSprite(sprite, square.x - size / 2, square.y - size / 2, size, size)
                        }
                    }, 1000),
                origin: createOriginComponent({origin: originRect.origin, inWorld: false}),
                collision: {
                    collisionSets: [
                        ...rects.map((sq, idx) => CollisionModule.collisionSetMap.addAndTag(createCollisionSet({
                            rects: [sq.square],
                            touchMask: new Set([TouchType.TOUCHING]),
                            onTouch: (ev: TouchEvent) => {
                                game.inputSystem.queueRegion(sq.state);
                                return false;
                            },
                        }))),
                    ]
                }
            },
            uuid: UNASSIGNED,
            isAlive: true,
        } satisfies Joystick;
        joystick.components.collision.collisionSets.push();
        return joystick;
    },
};

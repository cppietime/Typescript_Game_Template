import { State } from "../../data/Inputs.js";
import type { Game } from "../../../engine/Game.js";
import { type Entity } from "../../../engine/entity/Entity.js";
import { UNASSIGNED, type CleanupFn } from "../../../engine/entity/Uuid.js";
import { RenderModule, type RenderEntity } from "../../../engine/components/RenderComponent.js";
import { type OriginRect, createOriginRect, createTlRect, createVec2, GeometryModule } from "../../../engine/util/Geometry.js";
import type { RenderSystem } from "../../../engine/systems/RenderSystem.js";
import type { Sprite } from "../../../engine/data/types/Sprites.js";
import { createOriginComponent, type OriginEntity } from "../../../engine/components/Physical.js";
import { CollisionModule, createCollisionSet, type CollisionEntity } from "../../../engine/components/Collision.js";
import {TouchType} from "../../../engine/data/types/Inputs.js";

export type Joystick = RenderEntity & OriginEntity & CollisionEntity;

export const JoystickModule = {
    createDpad8: (game: Game): Joystick => {
        const originRect = GeometryModule.TlRect.toOrigin({
            topLeft: createVec2({x: 20, y: 600}),
            size: createVec2({x: 100, y: 100})
        });
        const leftSquare: OriginRect = GeometryModule.TlRect.toOrigin({
            topLeft:createVec2( {x: -50, y: -50}),
            size: createVec2({x: 30, y: 100}),
        });
        const rightSquare: OriginRect = GeometryModule.TlRect.toOrigin({
            topLeft: createVec2({x: 20, y: -50}),
            size: createVec2({x: 30, y: 100}),
        });
        const upSquare: OriginRect = GeometryModule.TlRect.toOrigin({
            topLeft: createVec2({x: -50, y: -50}),
            size: createVec2({x: 100, y: 30}),
        });
        const downSquare: OriginRect = GeometryModule.TlRect.toOrigin({
            topLeft: createVec2({x: -50, y: 20}),
            size: createVec2({x: 100, y: 30}),
        });
        const rects = [
            {square: leftSquare, state: State.LEFT},
            {square: rightSquare, state: State.RIGHT},
            {square: upSquare, state: State.UP},
            {square: downSquare, state: State.DOWN},
        ];
        const squares = [
            {x: 20, y: 600, color: '#f00'},
            {x: 55, y: 600, color: '#ff0'},
            {x: 90, y: 600, color: '#8f0'},
            {x: 20, y: 635, color: '#f0f'},
            {x: 90, y: 635, color: '#0f0'},
            {x: 20, y: 670, color: '#80f'},
            {x: 55, y: 670, color: '#00f'},
            {x: 90, y: 670, color: '#0ff'},
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
                                    size: createVec2({x: 30, y: 30}),
                                }),
                                color: square.color,
                            };
                            renderSystem.drawSprite(sprite, square.x, square.y, 30, 30)
                        }
                    }),
                origin: createOriginComponent({origin: originRect.origin, inWorld: false}),
                collision: {
                    collisionSets: [
                        ...rects.map((sq, idx) => CollisionModule.collisionSetMap.addAndTag(createCollisionSet({
                            rects: [sq.square],
                            touchMask: new Set([TouchType.TOUCHING]),
                            onTouch: () => {
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

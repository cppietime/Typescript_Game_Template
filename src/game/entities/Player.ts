import type { RenderSystem } from "../../engine/systems/RenderSystem.js";
import { State } from "../data/Inputs.js";
import type { Sprite } from "../../engine/data/types/Sprites.js";
import type { Game } from "../../Game.js";
import { createOriginRect, createTlRect, createVec2, GeometryModule } from "../../engine/util/Geometry.js";
import { CollisionModule, createCollisionSet, type CollisionEntity, type CollisionEvent, type CollisionSet } from "../../engine/components/Collision.js";
import { createOriginComponent, type SizeEntity, type VelocityEntity } from "../../engine/components/Physical.js";
import type { TickComponent, TickEntity } from "../../engine/components/Tick.js";
import { RenderModule, type RenderEntity } from "../../engine/components/RenderComponent.js";
import type { Entity } from "../../engine/entity/Entity.js";
import { UNASSIGNED, UuidPool, type CleanupFn } from "../../engine/entity/Uuid.js";
import {TouchType} from "../../engine/data/types/Inputs.js";

type PlayerComponent = {
    pulse: number,
    startingTime: number,
};
type WithPlayerComponent = {extra: PlayerComponent}

export type PlayerEntity = RenderEntity & TickEntity & VelocityEntity & CollisionEntity & SizeEntity & Entity<WithPlayerComponent>;

const sprite: Sprite = {
    image: 'sprite_atlas',
    source: createTlRect({
        topLeft: createVec2({}),
        size: createVec2({x: 16, y: 16})
    }),
    color: '#fff',
};

const PLAYER_SPEED = 300;

export const PlayerModule = {

    create: (game: Game): PlayerEntity => {
        const collisionSets: CollisionSet[] = []
        const player: PlayerEntity = {
            game: game,
            components: {
                renderable:
                    RenderModule.fromCallback(PlayerModule.render, 5),
                origin: createOriginComponent({origin: createVec2({x: 32, y: 32})}),
                size: createVec2({x: 64, y: 64}),
                tick: PlayerModule.update as TickComponent,
                extra: {
                    pulse: 1,
                    startingTime: game.lastTime
                } satisfies PlayerComponent,
                velocity: createVec2({x: 0, y: 0}),
                collision: {
                    collisionSets: collisionSets
                }
            },
            cleanup: PlayerModule.cleanup as CleanupFn,
            uuid: UNASSIGNED,
            isAlive: true,
        };
        // Test logic for player collisions. Not for prod
        collisionSets.push(CollisionModule.collisionSetMap.addAndTag(
            createCollisionSet({
                isSolid: true,
                layers: new Set([1]),
                mask: new Set([0]),
                rects: [
                    createOriginRect({size: createVec2({x: 64, y: 64})}),
                ],
                onCollide: (collision: CollisionEvent) => {
                    console.log('Trigger')
                    player.components.renderable.visible = true;
                },
                touchMask: new Set([TouchType.END]),
                onTouch: (touch) => {
                    console.log('Clicked!')
                    return false;
                },
            }
        )));
        return player;
    },

    cleanup: (data: PlayerEntity) => {
        CollisionModule.cleanup(data.game, data);
    },

    render: (renderSystem: RenderSystem, data: PlayerEntity) => {
        const {origin: {origin}, size} = data.components;
        const extra = data.components.extra as PlayerComponent;
        const w = extra.pulse * size.x;
        const h = extra.pulse * size.y;
        const x = origin.x - w / 2;
        const y = origin.y - h / 2;
        renderSystem.drawOutline(GeometryModule.OriginRect.toTl({origin: origin, size: size}), '#fff', true);
        renderSystem.drawSprite(sprite, x, y, w, h, true);
    },

    update: (game: Game, data: PlayerEntity): void => {
        data.components.velocity = {x: 0, y: 0};
        if (game.inputSystem.isPressed(State.LEFT)) {
            data.components.velocity.x -= PLAYER_SPEED;
        }
        if (game.inputSystem.isPressed(State.RIGHT)) {
            data.components.velocity.x += PLAYER_SPEED;
        }
        if (game.inputSystem.isPressed(State.UP)) {
            data.components.velocity.y -= PLAYER_SPEED;
        }
        if (game.inputSystem.isPressed(State.DOWN)) {
            data.components.velocity.y += PLAYER_SPEED;
        }
        const extra = data.components.extra as PlayerComponent;
        extra.startingTime += game.deltaTime;
        extra.pulse = 0.333 * (Math.sin(extra.startingTime) + 3);

        game.renderSystem.offset = data.components.origin.origin;
    },
};

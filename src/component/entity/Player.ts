import type { RenderSystem } from "../../core/RenderSystem.js";
import { State } from "../../data/inputs.js";
import type { Sprite } from "../../data/sprites.js";
import type { Game } from "../../game.js";
import { RectModule } from "../../util/Geometry.js";
import { CollisionModule, type CollisionEntity, type CollisionEvent, type CollisionSet } from "../physics/Collision.js";
import type { OriginEntity, SizeEntity, VelocityEntity } from "../physics/Physical.js";
import type { TickComponent, TickEntity } from "../physics/Tick.js";
import { RenderModule, type RenderEntity } from "../render/RenderComponent.js";
import type { Entity } from "./Entity.js";
import { UNASSIGNED, UuidPool, type CleanupFn } from "./Uuid.js";

type PlayerComponent = {
    pulse: number,
    startingTime: number,
};
type WithPlayerComponent = {extra: PlayerComponent}

export type PlayerEntity = RenderEntity & TickEntity & VelocityEntity & CollisionEntity & SizeEntity & Entity<WithPlayerComponent>;

const sprite: Sprite = {
    image: 'sprite_atlas',
    x0: 0,
    y0: 0,
    width: 16,
    height: 16,
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
                origin: {x: 32, y: 32},
                size: {x: 64, y: 64},
                tick: PlayerModule.update as TickComponent,
                extra: {
                    pulse: 1,
                    startingTime: game.lastTime
                } satisfies PlayerComponent,
                velocity: {x: 0, y: 0},
                collision: {
                    collisionSets: collisionSets
                }
            },
            cleanup: PlayerModule.cleanup as CleanupFn,
            uuid: UNASSIGNED,
            isAlive: true,
        };
        collisionSets.push(CollisionModule.collisionSetMap.addAndTag({
            entityId: player.uuid,
            isSolid: true,
            layers: new Set([1]),
            mask: new Set([0]),
            rects: [{
                origin: {x: 0, y: 0}, size: {x: 64, y: 64}
            }],
            onCollide: (collision: CollisionEvent) => {
                console.log('Trigger')
                player.components.renderable.visible = true;
            },
        }));
        return player;
    },

    cleanup: (data: PlayerEntity) => {
        CollisionModule.cleanup(data.game, data);
    },

    render: (renderSystem: RenderSystem, data: PlayerEntity) => {
        const {origin, size} = data.components;
        const extra = data.components.extra as PlayerComponent;
        const w = extra.pulse * size.x;
        const h = extra.pulse * size.y;
        const x = origin.x - w / 2;
        const y = origin.y - h / 2;
        renderSystem.drawOutline(RectModule.Origin.toTl({origin: origin, size: size}), '#fff', true);
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

        game.renderSystem.offset = data.components.origin;
    },
};

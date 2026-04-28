import type { Renderable, RenderSystem } from "../../core/RenderSystem.js";
import { State } from "../../data/inputs.js";
import type { Sprite } from "../../data/sprites.js";
import type { Game } from "../../game.js";
import { RectModule } from "../../util/Geometry.js";
import { RenderModule, type RenderComponent } from "../render/RenderComponent.js";
import type { Entity, UpdateComponent } from "./Entity.js";
import { UuidPool, type CleanupFn } from "./Uuid.js";

export type PlayerEntity = Entity<"renderable" | "rect" | "update" | "uuid" | "extra">;

type PlayerExtra = {
    pulse: number,
    startingTime: number,
};

const sprite: Sprite = {
    image: 'sprite_atlas',
    x0: 0,
    y0: 0,
    width: 16,
    height: 16,
    color: '#fff',
};

export const PlayerModule = {

    create: (game: Game): PlayerEntity => {
        return UuidPool.withUuid({
            game: game,
            components: {
                renderable:
                    RenderModule.fromCallback(PlayerModule.render),
                rect: {
                    origin: {x: 32, y: 32},
                    size: {x: 64, y: 64},
                },
                update: PlayerModule.update as UpdateComponent<any>,
                extra: {
                    pulse: 1,
                    startingTime: game.lastTime
                } satisfies PlayerExtra,
            }
        }, PlayerModule.cleanup as CleanupFn);
    },

    cleanup: (data: PlayerEntity) => {
        RenderModule.cleanupRenderHandles(data.game.renderSystem, data.components.renderable);
    },

    render: (renderSystem: RenderSystem, data: Entity<"rect" | "extra">) => {
        const rect = data.components.rect;
        const extra = data.components.extra as PlayerExtra;
        const w = extra.pulse * rect.size.x;
        const h = extra.pulse * rect.size.y;
        const x = rect.origin.x - w / 2;
        const y = rect.origin.y - h / 2;
        renderSystem.drawOutline(RectModule.Origin.toTl(rect), '#fff');
        renderSystem.drawSprite(sprite, x, y, w, h);
    },

    update: (game: Game, data: PlayerEntity): void => {
        if (game.inputSystem.isPressed(State.LEFT)) {
            data.components.rect.origin.x--;
        }
        if (game.inputSystem.isPressed(State.RIGHT)) {
            data.components.rect.origin.x++;
        }
        if (game.inputSystem.isPressed(State.UP)) {
            data.components.rect.origin.y--;
        }
        if (game.inputSystem.isPressed(State.DOWN)) {
            data.components.rect.origin.y++;
        }
        const extra = data.components.extra as PlayerExtra;
        extra.startingTime += game.deltaTime;
        extra.pulse = 0.333 * (Math.sin(extra.startingTime / 1000) + 3);
    },
};

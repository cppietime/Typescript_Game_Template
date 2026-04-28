import type { RenderSystem } from "../../core/RenderSystem.js";
import type { Sprite } from "../../data/sprites.js";
import type { Game } from "../../game.js";
import { CollisionModule, type CollisionSet } from "../physics/Collision.js";
import { RenderModule } from "../render/RenderComponent.js";
import type { Entity, UpdateComponent } from "./Entity.js";
import { UuidPool } from "./Uuid.js";

export type Decor = Entity<"uuid" | "renderable" | "rect" | "collision" | "update"| "extra" | "velocity">;

export const DecorModule = {
    createDecor: (game: Game, solid: boolean = true): Decor => {
        const collisionSets: CollisionSet[] = []
        const decor = UuidPool.withUuid({
            game: game,
            components: {
                renderable: RenderModule.staticSpriteRenderer({
                    image: 'sprite_atlas',
                    x0: 16,
                    y0: 0,
                    width: 16,
                    height: 16,
                    color: '#00f',
                }),
                rect: {origin: {x: 0, y: 0}, size: {x: 64, y: 64}},
                collision: {
                    collisionSets: collisionSets
                },
                extra: false,
                update: DecorModule.updateDecorTest as UpdateComponent<any>,
                velocity: {x: 0, y: 0},
            },
        });
        return decor;
    },

    updateDecorTest: (game: Game, data: Decor) => {
        if (data.components.extra) {
            data.components.velocity.x = -1.5;
        } else {
            data.components.velocity.x = 1.5;
        }

        const x = data.components.rect.origin.x;
        if (x > 800) {
            data.components.extra = true;
        } else if (x < 120) {
            data.components.extra = false;
        }
    },
};
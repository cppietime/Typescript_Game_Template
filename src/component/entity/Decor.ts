import type { RenderSystem } from "../../core/RenderSystem.js";
import type { Sprite } from "../../data/sprites.js";
import type { Game } from "../../game.js";
import { CollisionModule, type CollisionSet } from "../physics/Collision.js";
import { RenderModule } from "../render/RenderComponent.js";
import type { Entity } from "./Entity.js";
import { UuidPool } from "./Uuid.js";

export type Decor = Entity<"uuid" | "renderable" | "rect" | "collision">;

export const DecorModule = {
    createSolid: (game: Game): Decor => {
        const collisionSets: CollisionSet[] = []
        const solid = UuidPool.withUuid({
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
            },
        });
        collisionSets.push(CollisionModule.collisionSetMap.addAndTag({
            entityId: solid.components.uuid.uuid,
            isSolid: true,
            layers: new Set([1]),
            mask: new Set([1]),
            rects: [
                {origin: {x: 0, y: 0}, size: {x: 64, y: 64}}
            ],
        }));
        return solid;
    },
};
import type { RenderSystem } from "../../core/RenderSystem.js";
import type { Sprite } from "../../data/sprites.js";
import type { Game } from "../../game.js";
import { CollisionModule, type CollisionEntity, type CollisionSet } from "../physics/Collision.js";
import type { OriginEntity, SizeEntity, VelocityEntity } from "../physics/Physical.js";
import type { TickComponent, TickEntity } from "../physics/Tick.js";
import { RenderModule, type RenderEntity } from "../render/RenderComponent.js";
import type { Entity } from "./Entity.js";
import { UuidPool } from "./Uuid.js";

export type Decor = RenderEntity & TickEntity & CollisionEntity & SizeEntity & VelocityEntity & {
    components: {extra: boolean}
};

const DECOR_SPEED = 400;

export const DecorModule = {
    createDecor: (game: Game, solid: boolean = true): Decor => {
        const collisionSets: CollisionSet[] = []
        const decor: Decor = UuidPool.withUuid({
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
                origin: {x: 0, y: 0},
                size: {x: 64, y: 64},
                collision: {
                    collisionSets: collisionSets
                },
                extra: false,
                tick: DecorModule.updateDecorTest as TickComponent,
                velocity: {x: 0, y: 0},
            },
        });
        return decor;
    },

    updateDecorTest: (game: Game, data: Decor) => {
        if (data.components.extra) {
            data.components.velocity.x = -DECOR_SPEED;
        } else {
            data.components.velocity.x = DECOR_SPEED;
        }

        const x = data.components.origin.x;
        if (x > 800) {
            data.components.extra = true;
        } else if (x < 120) {
            data.components.extra = false;
        }
    },
};
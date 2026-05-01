import type { Game } from "../../../engine/Game.js";
import { createTlRect, createVec2 } from "../../../engine/util/Geometry.js";
import { type CollisionEntity, type CollisionSet } from "../../../engine/components/Collision.js";
import { createOriginComponent, type SizeEntity, type VelocityEntity } from "../../../engine/components/Physical.js";
import type { TickComponent, TickEntity } from "../../../engine/components/Tick.js";
import { RenderModule, type RenderEntity } from "../../../engine/components/RenderComponent.js";
import { UNASSIGNED } from "../../../engine/entity/Uuid.js";

export type Decor = RenderEntity & TickEntity & CollisionEntity & SizeEntity & VelocityEntity & {
    components: {extra: boolean}
};

const DECOR_SPEED = 400;

export const DecorModule = {
    createDecor: (game: Game): Decor => {
        const collisionSets: CollisionSet[] = []
        const decor: Decor = {
            game: game,
            components: {
                renderable: RenderModule.staticSpriteRenderer({
                    image: 'sprite_atlas',
                    source: createTlRect({
                        topLeft: createVec2({x: 16, y: 0}),
                        size: createVec2({x: 16, y: 16})
                    }),
                    color: '#00f',
                }),
                origin: createOriginComponent({origin: createVec2({x: 0, y: 0})}),
                size: {x: 64, y: 64},
                collision: {
                    collisionSets: collisionSets
                },
                extra: false,
                tick: DecorModule.updateDecorTest as TickComponent,
                velocity: createVec2({x: 0, y: 0}),
            },
            uuid: UNASSIGNED,
            isAlive: true,
        };
        return decor;
    },

    // Testing function for update logic. Not actually part of general props.
    updateDecorTest: (game: Game, data: Decor) => {
        if (data.components.extra) {
            data.components.velocity.x = -DECOR_SPEED;
        } else {
            data.components.velocity.x = DECOR_SPEED;
        }

        const x = data.components.origin.origin.x;
        if (x > 800) {
            data.components.extra = true;
        } else if (x < 120) {
            data.components.extra = false;
        }
    },
};
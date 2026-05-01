import { RenderSystem } from '../../../engine/systems/RenderSystem.js';
import { type Sprite } from '../../../engine/data/types/Sprites.js';
import { Game } from '../../../Game.js';
import { modulo } from '../../../engine/util/Algorithm.js';
import { createVec2, type Vec2 } from '../../../engine/util/Geometry.js';
import { createOriginComponent, hasSize, type OriginEntity, type SizeEntity } from '../../../engine/components/Physical.js';
import { type RenderEntity, RenderModule } from '../../../engine/components/RenderComponent.js';
import type { Entity } from '../../../engine/entity/Entity.js';
import { UNASSIGNED } from '../../../engine/entity/Uuid.js';

export type ScrollingBackground = RenderEntity & OriginEntity;

export const ScrollModule = {
    create: (game: Game, sprite: Sprite): ScrollingBackground & SizeEntity => {
        return {
            game: game,
            components: {
                origin: createOriginComponent({origin: createVec2({x: 300, y: 0})}),
                size: createVec2({x: 1280, y: 720}),
                renderable: RenderModule.fromCallback(
                    (renderSystem: RenderSystem, data: Entity<any>) => ScrollModule.render(renderSystem, data as ScrollingBackground, sprite),
                    -1000
                )
            },
            uuid: UNASSIGNED,
            isAlive: true,
        };
    },

    render: (renderSystem: RenderSystem, data: ScrollingBackground, sprite: Sprite) => {
        const origin = data.components.origin.origin;
        let size: Vec2;
        if (hasSize(data)) {
            size = data.components.size;
        } else {
            size = sprite.source.size;
        }
        const {x: width, y: height} = size;
        const diffX = modulo(origin.x - renderSystem.offset.x, width);
        const diffY = modulo(origin.y - renderSystem.offset.y, height);
        const {x: cW, y: cH} = renderSystem.canvasSize();
        for (let x = -width; x + diffX < cW; x += width) {
            for (let y = -height; y + diffY < cH; y += height) {
                renderSystem.drawSprite(sprite, x + diffX, y + diffY, width, height, false);
            }
        }
    }
};

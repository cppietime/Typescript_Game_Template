import { RenderSystem } from '../../core/RenderSystem.js';
import { type Sprite } from '../../data/sprites.js';
import { Game } from '../../game.js';
import { modulo } from '../../util/Algorithm.js';
import { createVec2, type Vec2 } from '../../util/Geometry.js';
import { createOriginComponent, hasSize, type OriginEntity, type SizeEntity } from '../physics/Physical.js';
import { type RenderEntity, RenderModule } from '../render/RenderComponent.js';
import type { Entity } from './Entity.js';
import { UNASSIGNED } from './Uuid.js';

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

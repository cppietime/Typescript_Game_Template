import { RenderSystem } from '../../core/RenderSystem.js';
import { type Sprite } from '../../data/sprites.js';
import { Game } from '../../game.js';
import { modulo } from '../../util/Algorithm.js';
import { type RenderFn, RenderModule } from '../render/RenderComponent.js';
import type { Entity } from './Entity.js';

export type ScrollingBackground = Entity<"renderable" | "rect">;

export const ScrollModule = {
    create: (game: Game, sprite: Sprite): ScrollingBackground => {
        return {
            game: game,
            components: {
                rect: {origin: {x: 300, y: 0}, size: {x: 1280, y: 720}},
                renderable: RenderModule.fromCallback((renderSystem: RenderSystem, data: Entity<any>) => ScrollModule.render(renderSystem, data as ScrollingBackground, sprite))
            },
        };
    },

    render: (renderSystem: RenderSystem, data: ScrollingBackground, sprite: Sprite) => {
        const {origin, size} = data.components.rect;
        const {x: width, y: height} = size;
        const diffX = modulo(origin.x - renderSystem.offset.x, width);
        const diffY = modulo(origin.y - renderSystem.offset.y, height);
        for (let x = -width; x + diffX < renderSystem.canvas.width; x += width) {
            for (let y = -height; y + diffY < renderSystem.canvas.height; y += height) {
                renderSystem.drawSprite(sprite, x + diffX, y + diffY, width, height, false);
            }
        }
    }
};

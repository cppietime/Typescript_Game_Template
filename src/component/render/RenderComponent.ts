import type { Renderable, RenderSystem } from "../../core/RenderSystem.js";
import type { Sprite } from "../../data/sprites.js";
import { originRectToTl } from "../../util/geometry.js";
import type { Entity } from "../entity/Entity.js";

export type RenderComponent<T extends Entity<"renderable">> = {
    renderable: (renderSystem: RenderSystem, data: T) => void;
};

export const staticSpriteRenderComponent = (sprite: Sprite) => {
    return {
        renderable: (renderSystem: RenderSystem, data: Entity<"rect">) => {
            const rect = originRectToTl(data.components.rect);
            renderSystem.drawSprite(sprite, rect.topLeft.x, rect.topLeft.y, rect.size.x, rect.size.y);
        }
    } satisfies RenderComponent<any>;
};

export const bindRender = (entity: Entity<"renderable">) => {
    return {
        render: (renderSystem: RenderSystem) => {
            entity.components.renderable.renderable(renderSystem, entity);
        }
    } satisfies Renderable;
}
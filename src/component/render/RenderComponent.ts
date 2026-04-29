import type { Renderable, RenderGroup, RenderSystem } from "../../core/RenderSystem.js";
import type { Sprite } from "../../data/sprites.js";
import { RectModule } from "../../util/Geometry.js";
import type { Entity } from "../entity/Entity.js";

export type RenderHandle = {
    groupId: number,
    renderId: number,
};

export type RenderFn = (renderSystem: RenderSystem, data: Entity<any>) => void;

// TODO: Replace Renderable with just this type, add z-index
export type RenderComponent = {
    renderable: RenderFn,
    visible: boolean,
    handles: RenderHandle[],
};

export const RenderModule = {

    fromCallback: <T extends Entity<"renderable">>(renderFn: RenderFn): RenderComponent => {
        return {
            renderable: renderFn,
            visible: true,
            handles: [],
        };
    },

    staticSpriteRenderer: (sprite: Sprite): RenderComponent => {
        return RenderModule.fromCallback((renderSystem: RenderSystem, data: Entity<"renderable" | "rect">) => {
                const rect = RectModule.Origin.toTl(data.components.rect);
                renderSystem.drawSprite(sprite, rect.topLeft.x, rect.topLeft.y, rect.size.x, rect.size.y, true);
            });
    },

    sequentialRenderer:  (...renderers: RenderComponent[]): RenderComponent => {
        return RenderModule.fromCallback((renderSystem: RenderSystem, data: Entity<never>) => {
                renderers.forEach(renderer => renderer.renderable(renderSystem, data));
            });
    },

    bindRender:  (entity: Entity<"renderable">): Renderable => {
        return {
            render: (renderSystem: RenderSystem) => {
                entity.components.renderable.renderable(renderSystem, entity);
            }
        };
    },

    addToRenderGroup: (renderGroup: RenderGroup, entity: Entity<"renderable">) => {
        const id = renderGroup.add(RenderModule.bindRender(entity));
        entity.components.renderable.handles.push({groupId: renderGroup.id, renderId: id});
    },

    cleanupRenderHandles: (renderSystem: RenderSystem, renderComponent: RenderComponent) => {
        renderComponent.handles.forEach((handle) => {
            renderSystem.getRenderGroup(handle.groupId).remove(handle.renderId);
        });
    },

};
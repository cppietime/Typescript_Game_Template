import type { RenderGroup, RenderSystem } from "../../core/RenderSystem.js";
import type { Sprite } from "../../data/sprites.js";
import { RectModule } from "../../util/Geometry.js";
import type { Entity, With } from "../entity/Entity.js";
import {hasSize, type OriginEntity} from "../physics/Physical.js";

export type RenderHandle = {
    groupId: number,
    renderId: number,
};

export type RenderFn = (renderSystem: RenderSystem, data: Entity<any>) => void;

// TODO: Replace Renderable with just this type, add z-index
export type RenderComponent = {
    render: RenderFn,
    visible: boolean,
    handles: RenderHandle[],
};

type WithRenderComponent = With<RenderComponent, "renderable">;
export type RenderEntity = Entity<WithRenderComponent>;

export const RenderModule = {

    fromCallback: <T extends RenderEntity>(renderFn: RenderFn): RenderComponent => {
        return {
            render: renderFn,
            visible: true,
            handles: [],
        };
    },

    staticSpriteRenderer: (sprite: Sprite): RenderComponent => {
        return RenderModule.fromCallback((renderSystem: RenderSystem, data: RenderEntity & OriginEntity) => {
                let w: number, h: number;
                if (hasSize(data)) {
                    ({x: w, y: h} = data.components.size);
                } else {
                    ({width: w, height: h} = sprite);
                }
                const rect = RectModule.Origin.toTl({origin: data.components.origin, size: {x: w, y: h}});
                renderSystem.drawSprite(sprite, rect.topLeft.x, rect.topLeft.y, rect.size.x, rect.size.y, true);
            });
    },

    sequentialRenderer:  (...renderers: RenderComponent[]): RenderComponent => {
        return RenderModule.fromCallback((renderSystem: RenderSystem, data: Entity<any>) => {
                renderers.forEach(renderer => renderer.render(renderSystem, data));
            });
    },

    addToRenderGroup: (renderGroup: RenderGroup, entity: RenderEntity) => {
        const id = renderGroup.add(entity);
        entity.components.renderable.handles.push({groupId: renderGroup.id, renderId: id});
    },

    cleanupRenderHandles: (renderSystem: RenderSystem, renderComponent: RenderComponent) => {
        renderComponent.handles.forEach((handle) => {
            renderSystem.getRenderGroup(handle.groupId).remove(handle.renderId);
        });
    },

};
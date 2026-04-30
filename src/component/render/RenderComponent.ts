import type { RenderGroup, RenderSystem } from "../../core/RenderSystem.js";
import type { Sprite } from "../../data/sprites.js";
import { RectModule } from "../../util/Geometry.js";
import { entityHas, type Entity, type With } from "../entity/Entity.js";
import {hasSize, type OriginEntity} from "../physics/Physical.js";

export type RenderFn = (renderSystem: RenderSystem, data: Entity<any>) => void;

// TODO: Replace Renderable with just this type, add z-index
export type RenderComponent = {
    render: RenderFn,
    visible: boolean,
    z: number,
};

type WithRenderComponent = With<RenderComponent, "renderable">;
export type RenderEntity = Entity<WithRenderComponent>;
export const hasRenderable = (entity: Entity<any>): entity is RenderEntity => entityHas<RenderEntity>(entity, ["renderable"]);

export const RenderModule = {

    fromCallback: <T extends RenderEntity>(renderFn: RenderFn, z: number = 0): RenderComponent => {
        return {
            render: renderFn,
            visible: true,
            z: z,
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

};
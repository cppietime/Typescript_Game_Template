import type { RenderSystem } from "../systems/RenderSystem.js";
import type { Animation, Sprite } from "../data/types/Sprites.js";
import { GeometryModule } from "../util/Geometry.js";
import { entityHas, type Entity, type With } from "../entity/Entity.js";
import {hasSize, type OriginEntity} from "./Physical.js";

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
                    ({x: w, y: h} = sprite.source.size);
                }
                const rect = GeometryModule.OriginRect.toTl({origin: data.components.origin.origin, size: {x: w, y: h}});
                renderSystem.drawSprite(sprite, rect.topLeft.x, rect.topLeft.y, rect.size.x, rect.size.y, data.components.origin.inWorld);
            });
    },

    sequentialRenderer:  (...renderers: RenderComponent[]): RenderComponent => {
        return RenderModule.fromCallback((renderSystem: RenderSystem, data: Entity<any>) => {
                renderers.forEach(renderer => renderer.render(renderSystem, data));
            });
    },

    animationRenderer: (animation: Animation): RenderComponent => {
        let time = 0;
        let idx = 0;
        return RenderModule.fromCallback((renderSystem: RenderSystem, data: RenderEntity & OriginEntity) => {
            time += data.game.deltaTime;
            while (time > animation.frames[idx]!.time) {
                time -= animation.frames[idx]!.time;
                idx = (idx + 1) % animation.frames.length;
            }
            const keyFrame = animation.frames[idx]!;
            const sprite = keyFrame.sprite;
            let w: number, h: number;
            if (hasSize(data)) {
                ({x: w, y: h} = data.components.size);
            } else {
                ({x: w, y: h} = sprite.source.size);
            }
            const rect = GeometryModule.OriginRect.toTl({origin: data.components.origin.origin, size: {x: w, y: h}});
            renderSystem.drawSprite(sprite, rect.topLeft.x, rect.topLeft.y, rect.size.x, rect.size.y, data.components.origin.inWorld);
        });
    }

};
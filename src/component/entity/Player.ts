import type { Renderable, RenderSystem } from "../../core/RenderSystem.js";
import { staticSpriteRenderComponent, type RenderComponent } from "../render/RenderComponent.js";
import type { Entity } from "./Entity.js";

export type Player = Entity<"renderable" | "rect">;

export const renderPlayer = (renderSystem: RenderSystem, data: Player) => {};

export const createPlayer = () => {
    return {
        components: {
            renderable: staticSpriteRenderComponent({
                image: 'sprite_atlas',
                x0: 0,
                y0: 0,
                width: 16,
                height: 16,
                color: '#fff',
            }),
            rect: {
                origin: {x: 32, y: 32},
                size: {x: 64, y: 64},
            },
        }
    } satisfies Player;
}

import type { ClickState, InputRegion } from "../../core/InputSystem.js";
import { State } from "../../data/inputs.js";
import type { Game } from "../../game.js";
import { entityHas, type Entity } from "../entity/Entity.js";
import { UNASSIGNED, UuidPool, type CleanupFn } from "../entity/Uuid.js";
import { RenderModule, type RenderEntity } from "../render/RenderComponent.js";
import { type OriginRect, RectModule } from "../../util/Geometry.js";
import type { RenderSystem } from "../../core/RenderSystem.js";
import type { Sprite } from "../../data/sprites.js";
import type { OriginEntity } from "../physics/Physical.js";

export type Joystick = RenderEntity & OriginEntity & {components: {region: number}};

export const JoystickModule = {
    createDpad8: (game: Game): Joystick => {
        const leftSquare: OriginRect = RectModule.TopLeft.toOrigin({
            topLeft: {x: 20, y: 600},
            size: {x: 30, y: 100},
        });
        const rightSquare: OriginRect = RectModule.TopLeft.toOrigin({
            topLeft: {x: 90, y: 600},
            size: {x: 30, y: 100},
        });
        const upSquare: OriginRect = RectModule.TopLeft.toOrigin({
            topLeft: {x: 20, y: 600},
            size: {x: 100, y: 30},
        });
        const downSquare: OriginRect = RectModule.TopLeft.toOrigin({
            topLeft: {x: 20, y: 670},
            size: {x: 100, y: 30},
        });
        const joystickRgn: InputRegion = {
            predicate: (click: ClickState, states: Set<State>) => {
                if (!click.down) return false;
                if (RectModule.rectContains(leftSquare, click)) states.add(State.LEFT);
                if (RectModule.rectContains(rightSquare, click)) states.add(State.RIGHT);
                if (RectModule.rectContains(upSquare, click)) states.add(State.UP);
                if (RectModule.rectContains(downSquare, click)) states.add(State.DOWN);
                return false;
            }
        };
        const rgnId = game.inputSystem.inputRegions.add(joystickRgn);
        const squares = [
            {x: 20, y: 600, color: '#f00'},
            {x: 55, y: 600, color: '#ff0'},
            {x: 90, y: 600, color: '#8f0'},
            {x: 20, y: 635, color: '#f0f'},
            {x: 90, y: 635, color: '#0f0'},
            {x: 20, y: 670, color: '#80f'},
            {x: 55, y: 670, color: '#00f'},
            {x: 90, y: 670, color: '#0ff'},
        ];
        return {
            game: game,
            components: {
                renderable: RenderModule.fromCallback((renderSystem: RenderSystem, data: Entity<any>) => {
                        for (const square of squares) {
                            const sprite: Sprite = {
                                image: '',
                                x0: 0,
                                y0: 0,
                                width: 30,
                                height: 30,
                                color: square.color,
                            };
                            renderSystem.drawSprite(sprite, square.x, square.y, 30, 30)
                        }
                    }),
                region: rgnId,
                ...RectModule.TopLeft.toOrigin({topLeft: {x: 20, y: 600}, size: {x: 100, y: 100}}),
            },
            cleanup: JoystickModule.cleanup as CleanupFn,
            uuid: UNASSIGNED,
            isAlive: true,
        } satisfies Joystick;
    },

    cleanup: (data: Joystick) => {
        const rgnId = data.components.region as number;
        const inputRegions = data.game.inputSystem.inputRegions;
        inputRegions.remove(rgnId);
    },
};

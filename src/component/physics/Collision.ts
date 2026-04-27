import type { PhysicsSystem } from "../../core/PhysicsSystem.js";
import { RectModule, type OriginRect } from "../../util/geometry.js";
import { IdMap } from "../../util/IdMap.js";
import { entityHas, type Entity } from "../entity/Entity.js";

export enum Normal {
    TOP,
    LEFT,
    RIGHT,
    BOTTOM,
};

export type CollisionFn = (self: Entity<"collision">, other: Entity<"collision">, solid: boolean, normal: Normal) => void;

export type ColliderPre = {
    box: OriginRect,
    fluidLayers: Set<number>,
    solidLayers: Set<number>,
    collisionFn: CollisionFn,
};

export type Collider = ColliderPre & {uuid: number};

export type CollisionComponent = {
    colliders: IdMap<Collider>
};

export const CollisionModule = {
    colliderMap: new IdMap<Collider>(),

    create: (collider: ColliderPre): Collider => {
        const nCol: Collider = {...collider, uuid: 0};
        nCol.uuid = CollisionModule.colliderMap.add(nCol);
        return nCol;
    },

    registerTo: (physicsSystem: PhysicsSystem, collider: Collider) => {
        physicsSystem.addCollider(collider);
    },

    updateCollisions: (physicsSystem: PhysicsSystem, data: Entity<"collision" | "rect" | "uuid">) => {
        for (const {box, uuid} of data.components.collision.colliders.values()) {
            const handle = physicsSystem.getHandle(uuid);
            if (handle === undefined) {
                continue;
            }
            const topLeft = RectModule.Origin.topLeft(box);
            const bottomRight = RectModule.Origin.bottomRight(box);
            let [minX, minY] = [topLeft.x, topLeft.y];
            let [maxX, maxY] = [bottomRight.x, bottomRight.y];
            if (entityHas(data, "velocity")) {
                const vel = data.components.velocity;
                minX = Math.min(minX, minX + vel.x);
                maxX = Math.max(maxX, maxX + vel.x);
                minY = Math.min(minY, minY + vel.y);
                maxY = Math.max(maxY, maxY + vel.y);
            }
            handle.left.pos = minX;
            handle.right.pos = maxX;
            handle.top.pos = minY;
            handle.bottom.pos = maxY;
        }
    },
};

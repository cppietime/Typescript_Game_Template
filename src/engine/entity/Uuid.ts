import { IdMap } from "../util/IdMap.js";
import type { Entity } from "../../engine/entity/Entity.js";

export type CleanupFn = (data: Entity<{}>) => void;

export const UNASSIGNED = -1;

export const UuidPool = {
    uuidMap: new IdMap<Entity<{}>>(),

    assignUuid: (entity: Entity<any>) => {
        const uuid = UuidPool.uuidMap.reserve();
        entity.uuid = uuid;
        UuidPool.uuidMap.addReserved(uuid, entity);
        console.log('Add uuid', uuid);
    },

    release: (entity: Entity<{}>): void => {
        entity.isAlive = false;

        entity.cleanup?.(entity);

        if (UuidPool.uuidMap.has(entity.uuid)) {
            UuidPool.uuidMap.remove(entity.uuid);
        }

        console.log('Release uuid', entity.uuid);
    },

    get: (uuid: number): Entity<{}> | undefined => {
        return UuidPool.uuidMap.get(uuid);
    }
};

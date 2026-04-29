import { IdMap } from "../../util/IdMap.js";
import type { Entity } from "./Entity.js";

export type CleanupFn = (data: Entity<{}>) => void;

export type UuidComponent = {
    uuid: number,
    alive: boolean,
    cleanup?: CleanupFn | undefined,
};

export const UNASSIGNED = -1;

export const UuidPool = {
    uuidMap: new IdMap<Entity<{}>>(),

    withUuid: <T extends Entity<any>>(entity: Omit<T, "uuid" | "cleanup" | "isAlive">, cleanup?: CleanupFn): T => {
        const uuid = UuidPool.uuidMap.reserve();
        const withUuid = {
            ...entity,
            uuid: uuid,
            isAlive: true,
            cleanup: cleanup,
            components: {
                ...entity.components,
            },
        };
        UuidPool.uuidMap.addReserved(uuid, withUuid);
        return withUuid as T;
    },

    release: (entity: Entity<{}>): void => {
        entity.isAlive = false;

        entity.cleanup?.(entity);

        if (UuidPool.uuidMap.has(entity.uuid)) {
            UuidPool.uuidMap.remove(entity.uuid);
        }
    },

    get: (uuid: number): Entity<{}> | undefined => {
        return UuidPool.uuidMap.get(uuid);
    }
};

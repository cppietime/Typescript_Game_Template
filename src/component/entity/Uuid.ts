import { IdMap } from "../../util/IdMap.js";
import type { ComponentMap, Entity } from "./Entity.js";

export type CleanupFn = (data: Entity<never>) => void;

export type UuidComponent = {
    uuid: number,
    alive: boolean,
    cleanup?: CleanupFn | undefined,
};

export const UNASSIGNED = -1;

export const UuidPool = {
    uuidMap: new IdMap<Entity<never>>(),

    withUuid: <K extends keyof ComponentMap>(entity: Omit<Entity<K>, "uuid" | "cleanup" | "isAlive">, cleanup?: CleanupFn): Entity<K> => {
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
        return withUuid;
    },

    release: (entity: Entity<never>): void => {
        entity.isAlive = false;

        entity.cleanup?.(entity);

        if (UuidPool.uuidMap.has(entity.uuid)) {
            UuidPool.uuidMap.remove(entity.uuid);
        }
    },

    get: (uuid: number): Entity<never> | undefined => {
        return UuidPool.uuidMap.get(uuid);
    }
};

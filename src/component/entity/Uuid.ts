import { IdMap } from "../../util/IdMap.js";
import type { ComponentMap, Entity } from "./Entity.js";

export type CleanupFn = (data: Entity<"uuid">) => void;

export type UuidComponent = {
    uuid: number,
    alive: boolean,
    cleanup?: CleanupFn | undefined,
};

export const UuidPool = {
    uuidMap: new IdMap<Entity<"uuid">>(),

    withUuid: <K extends keyof ComponentMap>(entity: Entity<K>, cleanup?: CleanupFn): Entity<K | "uuid"> => {
        const uuid = UuidPool.uuidMap.reserve();
        const uuidComponent = {
            uuid: uuid,
            alive: true,
            cleanup: cleanup,
        };
        const withUuid = {
            ...entity,
            components: {
                ...entity.components,
                uuid: uuidComponent,
            },
        } as Entity<K | "uuid">;
        UuidPool.uuidMap.addReserved(uuid, withUuid);
        return withUuid;
    },

    release: (entity: Entity<"uuid">): void => {
        const uuidComponent = entity.components.uuid;
        uuidComponent.alive = false;
        const {uuid, cleanup} = uuidComponent;

        cleanup?.(entity);

        if (UuidPool.uuidMap.has(uuid)) {
            UuidPool.uuidMap.remove(uuid);
        }
    },

    get: (uuid: number): Entity<"uuid"> | undefined => {
        return UuidPool.uuidMap.get(uuid);
    }
};

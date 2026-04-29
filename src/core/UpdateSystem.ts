import { entityHas, type Entity } from "../component/entity/Entity.js";
import { UuidPool } from "../component/entity/Uuid.js";
import type { Game } from "../game.js";

type EUU = Entity<"update">;

export class UpdateSystem {
    updateUuids: Set<number> = new Set();

    reset() {
        this.updateUuids.clear();
    }

    update(game: Game) {
        for (const uuid of this.updateUuids) {
            const entity = UuidPool.get(uuid);
            if (entity === undefined || !entityHas(entity, "update") || !entity.isAlive) {
                this.updateUuids.delete(uuid);
                continue;
            }
            entity.components.update(game, entity);
        }
    }

    add(entity: EUU) {
        this.updateUuids.add(entity.uuid);
    }

    remove(id: number) {
        this.updateUuids.delete(id);
    }
}
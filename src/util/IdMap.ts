export class IdMap<T> {
    readonly map = new Map<number, T>();
    readonly reserved = new Set<number>();
    nextId = 0;

    add(value: T): number {
        const id = this.nextId++;
        this.map.set(id, value);
        return id;
    }

    reserve(): number {
        const id = this.nextId++;
        this.reserved.add(id);
        return id;
    }

    addReserved(id: number, value: T) {
        if (!this.reserved.has(id)) return;
        this.reserved.delete(id);
        this.map.set(id, value);
    }

    get(id: number): T | undefined {
        const value = this.map.get(id);
        return value;
    }

    remove(id: number): T | undefined {
        const value = this.get(id);
        this.map.delete(id);
        return value;
    }

    has(id: number): boolean {
        return this.map.has(id);
    }

    clear() {
        this.map.clear();
    }

    ids() {
        return this.map.keys();
    }

    values() {
        return this.map.values();
    }

    entries() {
        return this.map.entries();
    }

    [Symbol.iterator]() {
        return this.ids();
    }
};
export const createFactory =
    <T, K extends keyof T>(defaults: Pick<T, K>) => (args: Omit<T, K> & Partial<Pick<T, K>>): T => ({
        ...defaults,
        ...args,
    } as T);
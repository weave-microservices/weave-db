export type Adapter = any;

export type DBMixinValidatorOptions = any;

export type DBMixinOptions = {
    adapter?: Adapter;
    loadAllActions?: boolean;
    entityName?: string;
    entityChangedEventType?: 'emit' | 'broadcast';
    eventChangedName?: string;
    validatorOptions?: DBMixinValidatorOptions;
    reconnectOnError?: boolean;
    reconnectTimeout?: number;
    throwErrorIfNotFound?: boolean;
    entitySchema?: Record<string, any>;
    actionVisibility?: 'public' | 'private' | 'protected';
};

export type ActionOptions = {
    name?: string;
}

export type InsertAction = (options?: ActionOptions) => {}
export type InsertManyAction = (options?: ActionOptions) => {}
export type CountAction = (options?: ActionOptions) => {}
export type FindAction = (options?: ActionOptions) => {}
export type FindOneAction = (options?: ActionOptions) => {}
export type FindStreamAction = (options?: ActionOptions) => {}
export type GetAction = (options?: ActionOptions) => {}
export type InsertAction = (options?: ActionOptions) => {}
export type InsertManyAction = (options?: ActionOptions) => {}
export type ListAction = (options?: ActionOptions) => {}
export type RemoveAction = (options?: ActionOptions) => {}
export type UpdateAction = (options?: ActionOptions) => {}

export type DbServiceProviderActions = {
    insert: InsertAction;
    insertMany: InsertManyAction;
    count: CountAction;
    find: FindAction;
    findOne: FindOneAction;
    findStream: FindStreamAction;
    get: GetAction;
    insert: InsertAction;
    insertMany: InsertManyAction;
    list: ListAction;
    remove: RemoveAction;
    update: UpdateAction;
}

export type DbServiceProvider = {
    mixin: any,
    action: DbServiceProviderActions
}
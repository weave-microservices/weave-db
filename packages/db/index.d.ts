export type Broker = any;
export type Service = any;
export type CountResult = number;
export type DbMixinFindAsStreamOptions = any;
export type DbMixinQuery = any;
export type DbMixinStreamResult = any;

export type BaseAdapter = {
    getIdFieldName(): string | never;
    init(broker: Broker, service: Service, test: string): Promise<BaseAdapter>;
    connect(): Promise<BaseAdapter>;
    disconnect(): Promise<void>;
    count(filterParams: any): Promise<CountResult>;
    insert(filterParams: any): Promise<CountResult>;
    insertMany(filterParams: any): Promise<CountResult>;
    findById(filterParams: any): Promise<CountResult>;
    findByIds(filterParams: any): Promise<CountResult>;
    findOne(filterParams: any): Promise<CountResult>;
    updateById(filterParams: any): Promise<CountResult>;
    removeById(filterParams: any): Promise<CountResult>;
    clear(filterParams: any): Promise<CountResult>;
    entityToObject(filterParams: any): Promise<CountResult>;
    findAsStream(query: DbMixinQuery, options: DbMixinFindAsStreamOptions): Promise<DbMixinStreamResult>;
}
# DB Mixin Provider

## Options


Property | Type | Default value | Description
---------|----------|----------|---------
 loadAllActions | boolean| `false` | Load all actions in mixin [See more](/actions.md)
 actionVisibility |string| `public` | Default visibility setting for actions
 adapter | `InMemory` || Database adapter [See more](/adapters.md)
 entityName |string|  | Name of the entity. Represents the collection/table.
 entityChangedEventType |string| `emit` | Type of the event, that gets emitted on entity changed (created, updated, deleted)
 entityChangedEventName |string| `` | Name of the changed event.
 cache |[CacheSettings](/cache.md)| `InMemory` | Cache options [See more](/cache.md)
 validator |[ValidatorOptions](/validator.md)| `InMemory` | Validator options[See more](/validator.md)
 entitySchema |[EntitySchema](/entity-schema.md)| `null` | Specifies the schema of your entity for validation and data enrichment [See more](/adapter.md)
 reconnectOnError |boolean| `true` | Try to reconnect on DB connection errors [See more](/adapters.md)
 reconnectTimeout |number| `2000` | Timeout before trying reconnect to the DB server [See more](/adapters.md)
 throwErrorIfNotFound |boolean| `true` | Throw an error if an entity can't be found by ID [See more](/adapters.md)


 
\# .NET Coding Instructions



Use constructor dependency injection. Store injected dependencies in `private readonly` fields using underscore prefix naming, such as `\_userService`.



Use file scoped namespaces instead of block scoped namespaces.



Use the service repository pattern.



Controllers should call services.



Services should contain business logic and call repositories.



Repositories should handle database access only.



Use interfaces for services and repositories, such as `IUserService` and `IUserRepository`.



Keep controllers thin. Controllers should handle HTTP concerns only.



Use DTOs for request and response models. Do not expose Entity Framework entities directly from API endpoints.



Extract helper classes, reusable methods, extension methods, and mapping logic into separate files. Do not place them in the same file unless they are very small and only used locally.



Follow REST API standards: use clear route names, correct HTTP methods, proper status codes, and safe idempotent behavior where applicable.



Apply authorization at the correct controller or endpoint level. Do not weaken existing authorization rules.



Use async methods for database operations.



For batch processing, use all or nothing behavior. If one item fails, roll back the entire batch using a transaction unless the requirement explicitly says partial success is allowed.



Add logging where necessary, especially for important business actions, failed operations, unexpected errors, and security sensitive events. Do not log passwords, tokens, or sensitive user data.



Follow the existing project structure and naming conventions.




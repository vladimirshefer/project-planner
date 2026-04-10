# AGENTS.md

## Project-specific instructions for coding agents:

- Prefer TypeScript `namespace`s for grouping related code when that structure fits naturally.
- Do not hesitate to use PascalCase file names, especially for files that contain a single namespace or a single component.
- Never extract a props interface for React components. Always type props inline.
- Avoid introducing small utility types unless they provide clear value.
- When adding new functionality, first consider whether it should be expressed behind a meaningful interface, such as a service.
- Use absolute imports when possible.

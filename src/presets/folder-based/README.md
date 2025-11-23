# Folder-Based Preset

This preset enforces that all files in a commit must be from the same folder at a specified depth level.

## Configuration

- `depth`: Number of folder levels to enforce (e.g., depth=3 means `folder/path/to`)
- `ignorePaths`: Array of glob patterns to ignore in validation
- `maxFiles`: Optional maximum number of files allowed per commit

## Example

With `depth: 3`, files must be grouped like:
- `src/presets/folder-based/preset.ts`
- `src/presets/folder-based/types.ts`
- `src/presets/folder-based/index.ts`

All share the same depth-3 path: `src/presets/folder-based`

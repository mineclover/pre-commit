# Commit Message Validation Test Scenarios

## Test Results

### Depth = 1
- Example prefix: `[src]`
- Format description: `[folder]`
- Status: ✅ PASS

### Depth = 2 (default)
- Example prefix: `[src/components]`
- Format description: `[folder/path]`
- Status: ✅ PASS

### Depth = 3
- Example prefix: `[src/components/Button]`
- Format description: `[folder/path/to]`
- Status: ✅ PASS

## Validation Rules
1. ✅ Commit messages must start with `[prefix]`
2. ✅ Description must be at least 3 characters
3. ✅ Merge/Revert/Squash commits are automatically allowed
4. ✅ Error messages show depth-appropriate examples

## Example Valid Messages
- `[src] Add new feature`
- `[src/components] Add Button component`
- `[src/components/Button] Fix styling issue`
- `[root] Update root level file`
- `[config] Update configuration`

/**
 * Help command - displays CLI usage information
 */

export function helpCommand(): void {
  console.log(`
Pre-commit Folder Enforcer CLI

Usage:
  precommit <command> [options]
  precommit --version              Show version

Commands:
  check           Validate current staged files without committing
  status          Show current configuration and staged files status
  init            Initialize .precommitrc.json with defaults
  config          Show current configuration
  validate-config Validate configuration file and check for issues
  cleanup         Clean up log files
  logs            Show log statistics
  stats           Show commit history statistics
  install         Install husky hooks (pre-commit, prepare-commit-msg, commit-msg, post-commit)
  help            Show this help message

Examples:
  precommit check                          # Check if staged files pass validation
  precommit check --files "a.ts,b.ts"      # Dry-run validation with specific files
  precommit status                         # Show detailed status
  precommit init                           # Create default config file
  precommit config                         # Display current config
  precommit validate-config                # Validate config file
  precommit cleanup                        # Clean up old log files
  precommit cleanup --all                  # Clean up all log files
  precommit logs                           # Show log file info
  precommit stats                          # Show commit prefix statistics
  precommit stats --last 50                # Show stats for last 50 commits
  precommit install                        # Install husky hooks
  precommit --version                      # Show version
`);
}

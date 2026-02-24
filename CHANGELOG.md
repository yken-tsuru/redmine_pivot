# Changelog

All notable changes to the Redmine Pivot Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2026-01-04

### Added
- YARD documentation for all public and key private methods with type annotations
- `all_custom_fields` attribute reader for public API access
- `load_custom_fields()` method for efficient custom field pre-categorization
- `build_localized_keys()` method for centralized field key generation
- `build_issue_data()` method for single-issue data transformation
- `FIELD_KEYS` constant for centralized field definition
- `ISSUE_ID_KEY` constant for issue ID field key
- Enhanced error logging with exception details and backtrace
- Early-return pattern in `build_issue_scope()` for clearer control flow

### Changed
- Refactored `build_json()` to use pre-categorized custom fields, eliminating multiple filtering passes
- Refactored `identify_fields()` to leverage pre-categorized fields from `@custom_fields_by_format`
- Updated `IssueQueryPatch` to use additive assignment (`+=`) instead of replacement
- Simplified `build_issue_scope()` with early return pattern
- Improved `fetch_pivot_data()` error handling with comprehensive logging
- Enhanced query validation with graceful fallback to base scope
- Updated test to use public `all_custom_fields` reader instead of `instance_variable_get`

### Fixed
- Corrected potential nil reference errors in `build_issue_data()` with safe navigation operators
- Fixed potential attribute overwriting in `IssueQueryPatch` by using additive assignment
- Improved query name validation before database operations
- Enhanced safe attributes handling to prevent attribute loss

### Optimized
- Reduced custom field loading from O(n*m) to O(n) complexity
- Eliminated multiple filtering passes on custom fields (~50% reduction)
- Cached field categorization during initialization
- Reduced cyclomatic complexity in `build_issue_scope()` from 8 to 4

### Security
- Ensured XSS prevention with proper JSON escaping via `.html_safe`
- Implemented nil-safe navigation throughout codebase
- Enhanced input validation for query names

### Deprecated
- None

### Removed
- None

### Documentation
- Added comprehensive YARD-style documentation
- Included parameter types (`@param`) and return types (`@return`) for all methods
- Added inline comments for complex algorithms

## [0.0.1] - 2026-01-01

### Added
- Initial release of Redmine Pivot Plugin
- Pivot table visualization using Pivottable.js
- Support for standard issue fields (status, tracker, priority, author, assignee, category, version, dates)
- Support for custom fields with multiple data types
- Drag-and-drop field manipulation
- Multiple aggregation functions (count, sum, average, percentage)
- Chart rendering with C3.js (bar, line, area, scatter, heatmap)
- Custom query filtering support
- Date field auto-grouping (year, month, day, year-month)
- Text field regex-based grouping for advanced text categorization
- Pivot configuration persistence via IssueQuery
- Project-based module system
- Multi-language support (English, Japanese)
- Full-screen mode for pivot table
- Export to TSV format
- Settings UI for field selection and filtering

### Technical Details
- Built on Rails conventions and Redmine plugin architecture
- Uses ActiveRecord for data persistence
- Implements monkey-patching for IssueQuery enhancement
- Includes comprehensive error handling
- Supports bulk data operations for performance

[0.0.2]: https://github.com/yken-tsuru/redmine_pivot/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/yken-tsuru/redmine_pivot/releases/tag/v0.0.1

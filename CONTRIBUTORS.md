# Contributors

## Core Development Team
- **Yken tsuru** - Original author and lead developer

## Contributors to v0.0.2
- Code review and optimization guidance
- Testing and validation support
- Documentation improvements

## Acknowledgments

This plugin is built on the excellent work of:
- [Redmine](https://www.redmine.org/) - Issue tracking system
- [Pivottable.js](https://pivottable.js.org/) - Pivot table visualization library
- [C3.js](https://c3js.org/) - D3-based visualization library
- [D3.js](https://d3js.org/) - Data visualization foundation

## How to Contribute

We welcome contributions to the Redmine Pivot Plugin! Here's how you can help:

### Reporting Bugs
1. Check if the bug has already been reported in [Issues](https://github.com/yken-tsuru/redmine_pivot/issues)
2. If not, create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Redmine version, Ruby version, and Rails version
   - Screenshot or error message if applicable

### Suggesting Enhancements
1. Open a [Discussion](https://github.com/yken-tsuru/redmine_pivot/discussions) or create an issue
2. Describe the desired feature
3. Explain the use case and benefits
4. Provide examples if applicable

### Submitting Code Changes
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes:
   - Follow Ruby style guide (use RuboCop if available)
   - Add tests for new functionality
   - Update documentation
   - Write clear commit messages
4. Test thoroughly:
   - Run existing tests: `bundle exec rake test`
   - Verify no regressions
   - Test on multiple Redmine versions if possible
5. Submit a Pull Request with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots or examples if UI changes

### Code Style Guidelines
- Follow Ruby conventions (2-space indentation)
- Use meaningful variable and method names
- Include comments for complex logic
- Add YARD documentation for public methods
- Keep methods focused and single-responsibility
- Add tests for new functionality

### Testing
- Write unit tests for logic changes
- Test with various Redmine configurations
- Verify backward compatibility
- Test on different Ruby versions

### Documentation
- Update README.md if adding features
- Update CHANGELOG.md for all changes
- Add inline comments for complex code
- Include method documentation (YARD format)

### Versioning
This project follows [Semantic Versioning](https://semver.org/):
- MAJOR: Incompatible API changes
- MINOR: New functionality (backward compatible)
- PATCH: Bug fixes

## License
The Redmine Pivot Plugin is licensed under the GPL-2.0 License.

## Recognition
Contributors to this project will be recognized in:
- Release notes for their contributions
- GitHub contributors page
- This CONTRIBUTORS.md file

Thank you for your interest in improving the Redmine Pivot Plugin!

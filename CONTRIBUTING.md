# Contributing to Ohio Beer Path

Thank you for your interest in contributing to Ohio Beer Path! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/abandini/ohiobeerpath/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Browser/device information

### Suggesting Features

1. Check [Issues](https://github.com/abandini/ohiobeerpath/issues) for existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Any implementation ideas

### Updating Brewery Data

To add, update, or correct brewery information:

1. Fork the repository
2. Update `breweries.json` with accurate information
3. Run data quality check: `python qa_brewery_data.py`
4. Submit a pull request with a clear description of changes

### Code Contributions

#### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ohiobeerpath.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Set up your local environment (see [DEVELOPMENT.md](docs/DEVELOPMENT.md))

#### Coding Standards

**PHP:**
- Follow PSR-12 coding standard
- Use meaningful variable and function names
- Add comments for complex logic
- Sanitize all user inputs
- Use prepared statements for database queries

**JavaScript:**
- Use ES6+ syntax
- Use `const` and `let` (avoid `var`)
- Add JSDoc comments for functions
- Handle errors gracefully
- Use meaningful variable names

**CSS:**
- Follow BEM methodology
- Mobile-first approach
- Comment complex selectors
- Group related styles

#### Testing

Before submitting:
- Test all functionality manually
- Run API tests: `./test-api.sh`
- Test on mobile devices
- Check browser console for errors
- Verify no PHP errors: `php -l yourfile.php`

#### Commit Messages

Use conventional commit format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Example:
```
feat(search): add ZIP code search functionality

- Add ZIP code pattern matching
- Update search API to handle ZIP codes
- Add tests for ZIP code search

Closes #123
```

#### Pull Request Process

1. Update documentation if needed
2. Add your changes to the PR description
3. Link related issues
4. Ensure all tests pass
5. Request review from maintainers

### Data Quality

When updating brewery data:

- **Accuracy:** Verify all information is current
- **Completeness:** Include all required fields
- **Consistency:** Follow existing data format
- **Sources:** Cite sources when possible

Required fields:
- `name` - Official brewery name
- `address` - Street address
- `city` - City name
- `state` - "Ohio"
- `zip` - ZIP code
- `lat` - Latitude (decimal degrees)
- `lng` - Longitude (decimal degrees)
- `region` - Ohio region classification

Optional fields:
- `phone` - Phone number
- `website` - Official website URL
- `hours` - Business hours
- `amenities` - Array of amenities

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy toward others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

## Questions?

Feel free to open an issue with the "question" label or contact the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Ohio Beer Path! 🍺

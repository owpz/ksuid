# Contributing to @owpz/ksuid

Thank you for your interest in contributing to the KSUID TypeScript library! This guide will help
you get started.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- TypeScript knowledge
- Optional: Go 1.13+ (for cross-validation)

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/ksuid.git
cd @owpz/ksuid

# Install dependencies
npm install

# Run tests to ensure everything works
npm test

# Build the project
npm run build
```

## 📁 Project Structure

```
@owpz/ksuid/
├── src/                    # Source code
│   ├── ksuid.ts           # Main KSUID class
│   ├── uint128.ts         # 128-bit arithmetic
│   ├── sequence.ts        # Monotonic sequence generator
│   ├── compressed-set.ts  # Compressed KSUID sets
│   ├── sort.ts            # Sorting utilities
│   ├── base62.ts          # Base62 encoding
│   ├── cli.ts             # Command-line interface
│   └── index.ts           # Public API exports
├── test/                   # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration and compatibility tests
│   └── fixtures/          # Test data and fixtures
├── docs/                   # Documentation
│   └── validation/        # Go compatibility tools
├── dist/                   # Built JavaScript (auto-generated)
├── examples/              # Usage examples
└── scripts/               # Build and utility scripts
```

## 🧪 Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/unit/ksuid.test.ts

# Run only unit tests
npm test -- test/unit

# Run only integration tests
npm test -- test/integration

# Run Go compatibility tests
npm test -- test/integration/go-compatibility.test.ts

# Run tests in watch mode
npm run test:watch

# Run performance regression tests
npm run perf:regression
```

### Performance Testing

```bash
# Run comprehensive benchmarks
npm run benchmark

# Run stress tests under load
npm run stress-test

# Run both benchmark and stress tests
npm run perf

# Quick regression test for CI
npm run perf:regression

# Compare with Go implementation
npm run perf:compare
```

**Performance Benchmarking Notes:**

- `npm run benchmark` - Full TypeScript performance benchmarks
- `npm run stress-test` - High-load stress testing
- `npm run perf:compare` - Direct Go vs TypeScript comparison
- Results are documented in [PERFORMANCE_COMPARISON.md](docs/PERFORMANCE_COMPARISON.md)

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Build in watch mode for development
npm run build:watch

# Clean build artifacts
npm run clean
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check TypeScript types
npm run type-check
```

## 🎯 How to Contribute

### 1. Choose What to Work On

- **Bugs**: Check the [Issues](https://github.com/owpz/ksuid/issues) for bug reports
- **Features**: Look for "enhancement" or "feature request" labels
- **Documentation**: Help improve docs, examples, or comments
- **Performance**: Optimize hot paths or memory usage
- **Tests**: Add more test cases or improve coverage

### 2. Development Process

1. **Create a branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Follow our coding standards (see below)
3. **Add tests**: Ensure new code is tested
4. **Run tests**: `npm test` should pass 100%
5. **Update docs**: Update README or docs if needed
6. **Commit**: Use conventional commit messages
7. **Push**: Push your branch to your fork
8. **PR**: Open a Pull Request with clear description

### 3. Coding Standards

#### TypeScript Style

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Follow existing naming conventions (camelCase)
- Add JSDoc comments for public APIs

```typescript
// Good
export class KSUID {
  /**
   * Generate a new random KSUID.
   * @returns A new KSUID with current timestamp and random payload
   */
  static random(): KSUID {
    // Implementation
  }
}

// Avoid
export class KSUID {
  static random(): any {
    // No documentation
  }
}
```

#### Testing Standards

- Test all public APIs
- Include edge cases and error conditions
- Use descriptive test names
- Follow the existing test patterns

```typescript
// Good
test("KSUID.parse() should throw for invalid input", () => {
  assert.throws(() => KSUID.parse("invalid"), /Invalid KSUID/);
});

// Avoid
test("parse test", () => {
  // unclear what is being tested
});
```

#### Go Compatibility

When making changes that affect Go compatibility:

1. **Test against Go**: Use tools in `docs/validation/`
2. **Update test vectors**: If behavior changes, regenerate vectors
3. **Document changes**: Note any compatibility implications
4. **Run cross-validation**: Ensure `npm test` passes 100%

### 4. Commit Message Format

Use [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Examples:

- `feat(ksuid): add support for custom epochs`
- `fix(cli): handle invalid format flags properly`
- `docs(readme): add installation instructions`
- `test(sequence): add edge case for sequence exhaustion`

## 🔧 Common Development Tasks

### Adding a New Feature

1. **Design**: Consider Go compatibility and API consistency
2. **Implement**: Add to appropriate source file
3. **Test**: Add comprehensive tests
4. **Document**: Update README and JSDoc
5. **Validate**: Test against Go implementation if applicable

### Fixing a Bug

1. **Reproduce**: Add a test that demonstrates the bug
2. **Fix**: Implement the fix
3. **Verify**: Ensure the test passes
4. **Regression test**: Make sure existing tests still pass

### Performance Optimization

1. **Benchmark**: Measure current performance
2. **Optimize**: Implement improvement
3. **Verify**: Ensure correctness is maintained
4. **Document**: Note performance characteristics

## 🤝 Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Changes are backwards compatible (or breaking changes are documented)
- [ ] Go compatibility is maintained (if applicable)

### PR Description Template

```markdown
## Summary

Brief description of the changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Other (please describe)

## Testing

- [ ] Added new tests
- [ ] All existing tests pass
- [ ] Tested Go compatibility (if applicable)

## Documentation

- [ ] Updated README
- [ ] Updated JSDoc comments
- [ ] Added usage examples (if applicable)

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No breaking changes (or documented)
```

## 🐛 Reporting Issues

When reporting bugs:

1. **Search first**: Check if the issue already exists
2. **Provide details**: Include version, environment, steps to reproduce
3. **Minimal example**: Provide the smallest code that demonstrates the issue
4. **Expected vs actual**: Clearly state what should happen vs what does happen

### Issue Template

```markdown
**Bug Description** A clear description of the bug

**To Reproduce** Steps to reproduce:

1.
2.
3.

**Expected Behavior** What should happen

**Actual Behavior** What actually happens

**Environment**

- Node.js version:
- @owpz/ksuid version:
- OS:

**Additional Context** Any other relevant information
```

## 📚 Resources

- [Go KSUID Reference](https://github.com/segmentio/ksuid)
- [KSUID Specification](https://segment.com/blog/a-brief-history-of-the-uuid/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing with uvu](https://github.com/lukeed/uvu)

## 🙋‍♀️ Getting Help

- **Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: Check README and docs/ folder
- **Validation**: Use tools in docs/validation/ for Go compatibility

## 🎉 Recognition

Contributors will be:

- Listed in the README contributors section
- Mentioned in release notes
- Given credit in commit messages

Thank you for contributing to make KSUID TypeScript better! 🚀

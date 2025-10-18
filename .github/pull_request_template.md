# Pull Request

## 📋 Summary

Brief description of what this PR does and why it's needed.

## 🔧 Type of Change

- [ ]  Bug fix (non-breaking change that fixes an issue)
- [ ]  New feature (non-breaking change that adds functionality)
- [ ]  Breaking change (fix or feature that would cause existing functionality to change)
- [ ]  Documentation update
- [ ]  Code style/formatting changes
- [ ] ️ Refactoring (no functional changes)
- [ ]  Performance improvement
- [ ]  Test improvements
- [ ]  Build/CI changes

## 🧪 Testing

- [ ] Added new tests for the changes
- [ ] All existing tests pass (`npm test`)
- [ ] Go compatibility tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Cross-validation with Go implementation (if applicable)

**Test Results:**

```
npm test
# Paste test output here if there are failures
```

## 📚 Documentation

- [ ] Updated README.md (if applicable)
- [ ] Updated JSDoc comments
- [ ] Added usage examples (if applicable)
- [ ] Updated CONTRIBUTING.md (if applicable)
- [ ] Updated CHANGELOG.md (if applicable)

## 🎯 Go Compatibility

**Required for changes affecting KSUID behavior:**

- [ ] Validated against Go implementation using `docs/validation/` tools
- [ ] Test vectors updated (if behavior changed)
- [ ] Cross-validation tests pass
- [ ] CLI output matches Go CLI (if applicable)

**Go validation results:**

```bash
# Run and paste results from docs/validation/cross-validate.sh
```

## 🔍 Code Quality

- [ ] Code follows project style guidelines
- [ ] TypeScript strict mode compliance
- [ ] No linting errors (`npm run lint`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Self-review completed
- [ ] No hardcoded values or magic numbers
- [ ] Proper error handling

## 📖 Details

### What changed?

-

### Why was this change needed?

-

### How was it implemented?

-

### Any potential side effects or breaking changes?

-

## 🔗 Related Issues

Closes #(issue number) Relates to #(issue number)

## 📸 Screenshots (if applicable)

<!-- Add screenshots for UI changes or CLI output -->

## ✅ Checklist

- [ ] I have read the [CONTRIBUTING.md](CONTRIBUTING.md) guidelines
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] Any dependent changes have been merged and published

## 🚨 Breaking Changes

**If this is a breaking change, describe:**

1. What breaks?
2. How can users migrate?
3. Is this change unavoidable?

---

**Note for maintainers:** Please ensure Go compatibility is maintained before merging.

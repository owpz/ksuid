# GitHub Actions Integration

This document describes the GitHub Actions workflows that protect the API contract and ensure code
quality.

## Workflows

### 1. Continuous Integration (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**What it does:**

- Tests on multiple Node.js versions (18.x, 20.x)
- Runs type checking
- Runs all unit and integration tests
- Builds the project
- Runs API contract tests
- For main branch: runs comprehensive testing including benchmarks

### 2. API Contract Check (`api-contract.yml`)

**Triggers:**

- Pull requests to `main` or `develop` branches
- Push to `main` or `develop` branches

**What it does:**

- Runs comprehensive API contract tests
- Provides detailed feedback on breaking changes
- Comments on PRs when contract violations are detected
- Creates GitHub step summaries with actionable guidance

## Contract Violations

When the API contract tests fail, the workflows will:

1. **Fail the check** - preventing merge if configured as required
2. **Add a PR comment** explaining the violation and next steps
3. **Create a detailed step summary** with specific guidance
4. **Provide actionable recommendations** for fixing or handling the changes

### Example PR Comment

When breaking changes are detected:

```markdown
## 🚨 API Contract Violation Detected

This PR contains **breaking changes** that will require a **MAJOR version bump**.

### What this means:

- The public API contract has been modified in a backward-incompatible way
- Users upgrading to this version will need to update their code
- This requires a major version release (e.g., 1.x.x → 2.0.0)

### Next steps:

1. **If these breaking changes are intentional:**
   - Review the [API Versioning Policy](docs/api-versioning.md)
   - Plan for a major version release
   - Update the API contract tests to match the new API
   - Document migration steps for users

2. **If these should not be breaking changes:**
   - Modify your changes to maintain backward compatibility
   - Ensure all contract tests pass
```

## Local Development

### Running Contract Tests Locally

Before pushing changes, run contract tests locally:

```bash
# Quick contract test (just run the tests)
npm run test:contract

# Full contract check (build + test + guidance)
npm run check-contract

# Individual test suites
npm test test/api-contract/api-contract.test.ts      # Core API
npm test test/api-contract/cli-contract.test.ts      # CLI interface
npm test test/api-contract/type-contract.test.ts     # TypeScript types
```

### Recommended Workflow

1. **Make your changes**
2. **Run contract tests**: `npm run check-contract`
3. **If tests pass**: Your changes are safe, proceed with PR
4. **If tests fail**:
   - Review the failure details
   - Decide if breaking changes are intentional
   - Either fix compatibility or plan for major version

## Setting Up Required Checks

To make API contract tests required for PRs:

1. Go to repository **Settings** → **Branches**
2. Add a **branch protection rule** for `main`
3. Enable **"Require status checks to pass before merging"**
4. Select **"API Contract Verification"** as required
5. Optionally select **"Restrict pushes that create files"**

### Recommended Required Checks

- ✅ **API Contract Verification** (from `api-contract.yml`)
- ✅ **test (20.x)** (from `ci.yml`)
- ✅ **api-contract** (from `ci.yml`)

## Bypassing Contract Checks

**⚠️ Use with extreme caution**

If you need to merge breaking changes (for a planned major version):

### Option 1: Update Contract Tests First

```bash
# 1. Update the contract tests to match new API
# 2. Push both changes together
# 3. Tests will pass because they match new contract
```

### Option 2: Temporarily Disable (Not Recommended)

```bash
# Only for emergency situations
# Requires admin permissions
# Must immediately follow up with contract test updates
```

### Option 3: Override Required Checks

- Repository admins can override required status checks
- Should only be used for emergency releases
- Must be followed immediately by updating contract tests

## Best Practices

### For Contributors

1. **Always run `npm run check-contract` before pushing**
2. **Understand the difference between breaking and non-breaking changes**
3. **Read the [API Versioning Policy](api-versioning.md) when in doubt**
4. **Ask for guidance if contract tests fail unexpectedly**

### For Maintainers

1. **Never merge PRs with failing contract tests without deliberate consideration**
2. **Plan major version releases when breaking changes accumulate**
3. **Update contract tests immediately after merging breaking changes**
4. **Provide clear migration guidance for breaking changes**
5. **Consider deprecation periods for major changes**

### For Releases

1. **Patch releases (1.0.1)**: Contract tests must pass
2. **Minor releases (1.1.0)**: Contract tests must pass
3. **Major releases (2.0.0)**: Update contract tests to match new API

## Troubleshooting

### Contract Tests Failing Unexpectedly

1. **Check if you introduced breaking changes accidentally**

   ```bash
   npm run check-contract  # Get detailed failure info
   ```

2. **Review the specific test failures**

   ```bash
   npm test test/api-contract/api-contract.test.ts      # Core API issues
   npm test test/api-contract/cli-contract.test.ts      # CLI issues
   npm test test/api-contract/type-contract.test.ts     # Type issues
   ```

3. **Common causes:**
   - Renamed methods or properties
   - Changed method signatures
   - Modified return types
   - Removed public APIs
   - Changed CLI arguments or output formats
   - Modified error codes or types

### False Positives

If contract tests fail but you believe the changes are compatible:

1. **Review the [API Versioning Policy](api-versioning.md)**
2. **Check if the test expectations are correct**
3. **File an issue if you found a test that's too strict**

### GitHub Actions Not Running

1. **Check if workflows are in `.github/workflows/`**
2. **Verify YAML syntax is correct**
3. **Check if branch protection rules are configured**
4. **Ensure workflows have necessary permissions**

## Monitoring

### Success Metrics

- ✅ All PRs have contract test results
- ✅ Breaking changes are caught before merge
- ✅ Major version releases are properly planned
- ✅ Contract tests stay up to date with API

### Warning Signs

- ⚠️ Contract tests frequently disabled or overridden
- ⚠️ Many PRs with contract violations merged
- ⚠️ Contract tests not updated after breaking changes
- ⚠️ Contributors bypassing local contract checks

This integration helps maintain API stability while allowing the library to evolve responsibly.

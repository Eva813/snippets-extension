Please help me create a git commit for the current changes.

# Commit Generation Process

1. **Analyze Changes**: Review git status and git diff to understand what has been modified
2. **Follow Convention**: Use conventional commit format with appropriate type and scope
3. **Write Clear Message**: Create a concise but descriptive commit message that explains the "why" not just the "what"
4. **Add and Commit**: Stage the relevant files and create the commit

# Conventional Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Common Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

## Common Scopes:
- `components`: UI components
- `hooks`: Custom React hooks
- `utils`: Utility functions
- `api`: API related changes
- `auth`: Authentication related
- `ui`: User interface changes
- `config`: Configuration changes
- `deps`: Dependencies updates

# Examples:

```bash
feat(components): add user profile dropdown menu
fix(auth): resolve token refresh issue on page reload
refactor(hooks): optimize useLocalStorage performance
docs(readme): update installation instructions
style(components): fix button spacing and alignment
perf(api): implement request caching for user data
test(utils): add unit tests for validation helpers
chore(deps): update Next.js to version 14.0.0
```

# Instructions:

1. Run `git status` to see what files have been changed
2. Run `git diff` to understand the nature of the changes
3. Stage the appropriate files with `git add`
4. Create a commit with a meaningful message following the conventional commit format
5. Ensure the commit message clearly communicates the purpose and impact of the changes

Please analyze the current changes and create an appropriate commit message.
You are tasked with reviewing a React codebase. Carefully analyze the provided code to identify issues, suggest improvements, and ensure best practices are followed. Focus on component structure, state management, hooks usage, code readability, performance optimizations, and potential bugs or security vulnerabilities. Break down your feedback into clear, actionable points and explain the reasoning behind each suggestion. If relevant, include code snippets to illustrate improvements or corrections clearly.

main focus on: $ARGUMENTS

# Review Focus Areas

Consider:

- Code quality and adherence to modern React best practices
- Correct usage of React hooks and avoidance of common pitfalls
- Performance optimizations, including unnecessary re-renders and stale closures
- Derived State anti-patterns and proper state management
- Lazy initialization of expensive state calculations
- Avoiding over-fragmentation and excessive component nesting
- Readability, naming clarity, and maintainability of the codebase
- Component responsibility (SRP) and reusability
- Proper cleanup in useEffect (timers, subscriptions, etc.)
- Security concerns such as unsafe HTML injection (e.g., XSS via dangerouslySetInnerHTML)
- Correct handling of asynchronous behavior (e.g., fetch, debounce, throttling)
- Accessibility considerations (e.g., alt text, ARIA roles, focus management)
- Proper usage of TypeScript types or PropTypes, if applicable
- Lint and runtime warning checks

# Review Process

1. Review overall project structure and code organization
2. Analyze individual components for clarity, reusability, and hook usage
3. Identify unnecessary re-renders or unstable references (e.g., stale closures, missing deps)
4. Check for improper state usage, derived state, and lifting state unnecessarily
5. Look for potential bugs, missing cleanups, or unhandled edge cases
6. Highlight security or accessibility concerns
7. Summarize recommendations with examples where needed

# Output Format

Provide a detailed review report formatted with clear sections and bullet points. Use code blocks for example snippets. Conclude with a summary of key recommendations.

This review format ensures thorough evaluation of:

- Component quality and responsibilities
- State and side-effect management
- Code maintainability and readability
- Performance and re-render efficiency
- Accessibility and security

Best practices reminders for React reviewers:

- Ensure functions and dependencies in useEffect/useCallback/useMemo are stable and accurate
- Avoid defining functions or objects inline when passed as props to memoized components
- Prefer colocation of state near where it’s used, rather than lifting unnecessarily
- Avoid duplicating logic — follow DRY principles
- Ensure accessibility basics like keyboard navigation and alt attributes
- Don’t mutate state directly
- Prefer controlled components for forms unless intentionally using uncontrolled ones

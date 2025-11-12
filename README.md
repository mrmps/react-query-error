# Minimal Reproduction: useQuery Cancellation Causes Unhandled AbortError Overlay in Next.js

## Problem

When using `@tanstack/react-query` with the Next.js App Router in development (`reactStrictMode: true`), navigating to a page with an active `useQuery` causes an **Uncaught (in promise) AbortError** overlay to appear.

This occurs because React's Strict Mode mounts, unmounts, and re-mounts the component. The unmount triggers TanStack Query to cancel the in-flight query, which throws an `AbortError`. If the `queryFn` itself catches this error and logs it with `console.error`, the Next.js development server treats it as a critical, unhandled error, even if the promise chain is correctly handled.

This repository demonstrates that behavior without any third-party data-fetching libraries.

## Stack

- **next**: 16.0.1 (latest)
- **react**: 19.2.0 (latest)
- **@tanstack/react-query**: 5.62.7 (latest)

Was able to reproduce on Next 14 as well.

## Steps to Reproduce

1. Clone this repository.
2. Run `pnpm install` (or `npm install` or `yarn install`).
3. Run `pnpm dev` (or `npm run dev`).
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
5. Open the browser's developer console.
6. Click the link **"Go to Problem Page"**.
7. **Observe**: The Next.js error overlay appears with `AbortError: signal is aborted without reason`. The console also shows the error logged by our custom `queryFn`.

## Key Files

### `app/problem-page/page.tsx`

This is the core of the reproduction. It contains the `useQuery` hook with a `queryFn` that makes a fetch request:

```typescript
const problematicQueryFn = async ({ signal }: QueryFunctionContext) => {
  const res = await fetch("https://api.github.com/repos/tanstack/query", {
    signal,
  });
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
};
```

**Note:** The issue is more pronounced when the `queryFn` includes error handling that logs the `AbortError`:

```typescript
const problematicQueryFn = async ({ signal }: QueryFunctionContext) => {
  try {
    const res = await fetch("https://api.github.com/repos/tanstack/query", {
      signal,
    });
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    return res.json();
  } catch (error: any) {
    // When libraries catch and log the AbortError, it triggers the Next.js overlay
    if (error.name === "AbortError") {
      console.error("Caught and logged AbortError inside queryFn:", error);
    }
    throw error; // Re-throw for TanStack Query
  }
};
```

## Why This Happens

1. **React Strict Mode** (enabled in `next.config.js`) causes components to mount → unmount → remount in development.
2. When the component unmounts, **TanStack Query cancels** the in-flight query by aborting the signal.
3. If the `queryFn` (or any library wrapping it) catches the `AbortError` and **logs it with `console.error`**, the **Next.js error overlay** intercepts these calls and treats them as unhandled errors, even though the promise chain is properly handled.
4. Even without explicit error logging, unhandled promise rejections from `AbortError` can trigger the overlay in certain configurations.

## Expected vs. Actual Behavior

### Expected
The `AbortError` should be silently handled by TanStack Query since it's part of the normal cancellation flow. No error overlay should appear.

### Actual
The Next.js error overlay appears with:
```
Unhandled Runtime Error
Error: AbortError: signal is aborted without reason
```

## Workarounds Tested

1. **Suppress `console.error` for `AbortError`**: This works but is not ideal.
2. **Disable React Strict Mode**: This prevents the issue but removes valuable development checks.
3. **Use `throwOnError: false`**: Does not prevent the overlay since the error occurs before TanStack Query error boundaries.

## Question for TanStack Query Maintainers

Is there a recommended way to handle `AbortError` in custom `queryFn` implementations that prevents this Next.js overlay issue while still properly propagating cancellation to TanStack Query's internal state management?

In production I'm using oRPC + Tanstack Query, but I think solving this example should solve my production issue.

## Additional Context

This issue affects any library that:
- Uses TanStack Query with Next.js App Router
- Implements a custom `queryFn` that catches and logs errors (including `AbortError`)
- Runs in development mode with React Strict Mode enabled

Examples: `@orpc/react`, `@trpc/react-query`, and other RPC libraries that provide TanStack Query integrations.

# react-query-error

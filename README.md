# Minimal Reproduction: useQuery Cancellation Causes Unhandled AbortError Overlay in Next.js

## Problem

When using `@tanstack/react-query` with the Next.js App Router in development (`reactStrictMode: true`), navigating to a page with an active `useQuery` causes an **Uncaught (in promise) AbortError** overlay to appear.

This occurs because React's Strict Mode mounts, unmounts, and re-mounts the component. The unmount triggers TanStack Query to cancel the in-flight query, which throws an `AbortError`. If the `queryFn` itself catches this error and logs it with `console.error`, the Next.js development server treats it as a critical, unhandled error, even if the promise chain is correctly handled.

This repository demonstrates that behavior without any third-party data-fetching libraries.

## Stack

- **next**: 14.2.3 (or latest stable)
- **react**: 18.3.1 (or latest stable)
- **@tanstack/react-query**: 5.x.x (latest stable)

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

This is the core of the reproduction. It contains the `useQuery` hook with the custom `queryFn` that simulates the problematic behavior:

```typescript
const problematicQueryFn = async ({ signal }: QueryFunctionContext) => {
  try {
    // Simulate a network request that takes 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Pass the signal to a real fetch call
    const res = await fetch("https://api.github.com/repos/tanstack/query", {
      signal,
    });
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    return res.json();
  } catch (error: any) {
    // This is the key part of the reproduction.
    // We catch the AbortError...
    if (error.name === "AbortError") {
      // ...and then log it, which triggers the Next.js overlay.
      console.error(
        "Caught and logged AbortError inside queryFn:",
        error
      );
    }
    // We must re-throw the error for TanStack Query to know it failed.
    throw error;
  }
};
```

## Why This Happens

1. **React Strict Mode** (enabled in `next.config.js`) causes components to mount → unmount → remount in development.
2. When the component unmounts, **TanStack Query cancels** the in-flight query by aborting the signal.
3. The `queryFn` catches the `AbortError` and **logs it with `console.error`**.
4. **Next.js's error overlay** intercepts `console.error` calls in development and treats them as unhandled errors, even though the promise chain is properly handled.

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

Should libraries that wrap `fetch` (like tRPC, oRPC, etc.) avoid logging `AbortError` altogether, or is this a Next.js development server issue that should be addressed upstream?

## Additional Context

This issue affects any library that:
- Uses TanStack Query with Next.js App Router
- Implements a custom `queryFn` that catches and logs errors (including `AbortError`)
- Runs in development mode with React Strict Mode enabled

Examples: `@orpc/react`, `@trpc/react-query`, and other RPC libraries that provide TanStack Query integrations.

# react-query-error

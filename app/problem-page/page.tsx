"use client";

import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import Link from "next/link";

// This query function simulates a library (like oRPC) that catches
// the AbortError and logs it to the console.
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

export default function ProblemPage() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["repoData"],
    queryFn: problematicQueryFn,
  });

  return (
    <main style={{ padding: "2rem" }}>
      <Link href="/" style={{ color: "blue", textDecoration: "underline" }}>
        &larr; Go Back Home
      </Link>
      <h1>Problem Page</h1>
      <div>
        {isPending && <p>Loading...</p>}
        {isError && <p>Error: {error.message}</p>}
        {data && (
          <div>
            <p>Data loaded successfully!</p>
            <p>Repo Name: {data.name}</p>
          </div>
        )}
      </div>
    </main>
  );
}


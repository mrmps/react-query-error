"use client";

import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import Link from "next/link";

const problematicQueryFn = async ({ signal }: QueryFunctionContext) => {
  const res = await fetch("https://api.github.com/repos/tanstack/query", {
    signal,
  });
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
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

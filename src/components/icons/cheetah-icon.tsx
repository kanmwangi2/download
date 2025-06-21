
"use client"; // Required for useState and useEffect

import { useState, useEffect, type SVGProps } from 'react';

export function CheetahIcon(props: SVGProps<SVGSVGElement>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render null on the server and during the initial client render pass
    // to avoid hydration mismatch if extensions modify the static SVG.
    return null;
  }

  // Icon inspired by the "Cheetah Reporter" image's logo: a circle with three curved slashes.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9.8" />
      <path d="M8.5 15.5c2-2.5 4-3 6-1.5" />
      <path d="M7.5 12.5c2-2.5 4-3 6-1.5" />
      <path d="M9.5 9.5c2-2.5 4-3 6-1.5" />
    </svg>
  );
}

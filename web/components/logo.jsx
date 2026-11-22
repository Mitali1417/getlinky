import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, as = "link", size = "md" }) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-5xl sm:text-6xl",
  };
  const content = (
    <span className={cn("font-bold tracking-tight", sizes[size], className)}>
      get
      <span className="text-accent">linky</span>
    </span>
  );

  if (as === "span") return content;
  return (
    <Link href="/" className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      {content}
    </Link>
  );
}

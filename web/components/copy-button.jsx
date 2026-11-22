"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  iconOnly = false,
  variant = "outline",
  size,
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon" : size || "default"}
      onClick={onCopy}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {iconOnly ? null : copied ? copiedLabel : label}
    </Button>
  );
}

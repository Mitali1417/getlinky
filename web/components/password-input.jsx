"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => setVisible((open) => !open)}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}

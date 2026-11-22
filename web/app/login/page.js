"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toastError } from "@/lib/errors";
import { logError } from "@/lib/logger";

export default function LoginPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await api("/user/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      toast.success("Logged in");
      router.push("/");
      router.refresh();
    } catch (error) {
      logError("login", error);
      toastError(error, "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-6 text-3xl font-semibold">Login</h1>
      <form className="flex w-full flex-col gap-3" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            required
            className="h-10 border-white/20 text-white placeholder:text-neutral-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Password"
            required
            className="h-10 border-white/20 text-white placeholder:text-neutral-500"
          />
        </div>
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending ? "Signing in..." : "Submit"}
        </Button>
      </form>
      <div className="mt-6 flex w-full items-center gap-3">
        <Separator className="flex-1 bg-emerald-400/70" />  
        <span className="text-sm font-semibold text-neutral-500">Or</span>
        <Separator className="flex-1 bg-emerald-400/70" />
      </div>
      <p className="mt-4 text-sm font-semibold text-neutral-500">
        Don&apos;t have account?
      </p>
      <Button
        nativeButton={false}
        variant="secondary"
        size="lg"
        className="mt-2 w-full"
        render={<Link href="/signup" />}
      >
        Signup
      </Button>
    </AuthShell>
  );
}

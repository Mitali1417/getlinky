"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
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
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
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
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            required
            className="h-10 border-white/20 text-white placeholder:text-neutral-500"
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button
          type="submit"
          disabled={pending}
          className="mt-2 h-10 w-full rounded-full bg-emerald-400 text-black hover:bg-transparent hover:text-white hover:ring-2 hover:ring-white"
        >
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
      <Link
        href="/signup"
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "mt-2 h-10 w-full rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
        )}
      >
        Signup
      </Link>
    </AuthShell>
  );
}

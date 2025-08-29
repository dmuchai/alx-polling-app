"use client";

import { register } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  return (
    <form
      className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
      action={register}
    >
      <Label htmlFor="email">Email</Label>
      <Input
        className="rounded-md px-4 py-2 bg-inherit border mb-6"
        name="email"
        placeholder="you@example.com"
        required
      />
      <Label htmlFor="password">Password</Label>
      <Input
        className="rounded-md px-4 py-2 bg-inherit border mb-6"
        type="password"
        name="password"
        placeholder="••••••••"
        required
      />
      <Button>Sign Up</Button>
      {message && (
        <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
          {message}
        </p>
      )}
    </form>
  );
}
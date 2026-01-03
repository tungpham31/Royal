"use client";

import { useState } from "react";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
    }

    setLoading(false);
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md bg-success/10 p-4 text-center">
            <p className="text-sm text-foreground">
              Check your email for a password reset link.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll send you a link to reset your password.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * Login form component
 * Handles user authentication with email/password
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setLogLines([]);
    setPendingRedirectUrl(null);

    const log = (msg: string, obj?: unknown) => {
      const payload = obj !== undefined ? ` ${JSON.stringify(obj)}` : "";
      const line = `[Login] ${msg}${payload}`;
      console.log(line);
      setLogLines((prev) => [...prev, line]);
    };

    try {
      log("onSubmit start", { callbackUrl, origin: typeof window !== "undefined" ? window.location.origin : "" });

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      log("signIn result", {
        hasResult: !!result,
        url: result?.url,
        error: result?.error,
        status: result?.status,
        ok: (result as { ok?: boolean })?.ok,
        keys: result ? Object.keys(result) : [],
      });

      if (result?.error) {
        log("signIn error, not redirecting", { error: result.error });
        toast.error(result.error === "CredentialsSignin" ? "Invalid email or password" : String(result.error));
        return;
      }

      const targetUrl = result?.url ?? callbackUrl;
      const absoluteUrl = targetUrl.startsWith("http") ? targetUrl : `${window.location.origin}${targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`}`;
      log("redirect ready", { targetUrl, absoluteUrl });

      setPendingRedirectUrl(absoluteUrl);
    } catch (err) {
      log("onSubmit catch", { err: err instanceof Error ? err.message : String(err) });
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  }

  function goToDashboard() {
    if (pendingRedirectUrl) {
      window.location.replace(pendingRedirectUrl);
    }
  }

  if (pendingRedirectUrl) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="mb-2 text-sm font-medium">Debug log (copy and share)</p>
          <pre className="max-h-64 overflow-auto text-xs whitespace-pre-wrap break-all">
            {logLines.join("\n")}
          </pre>
        </div>
        <Button type="button" onClick={goToDashboard} className="w-full">
          Continue to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    </Form>
  );
}

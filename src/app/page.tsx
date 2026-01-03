import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-2xl font-bold text-primary">Royal</span>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Take Control of Your{" "}
            <span className="text-primary">Finances</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track your spending, monitor your investments, and build your net worth.
            All in one beautiful, easy-to-use app.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start for Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 pt-16 text-left">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Bank Sync</h3>
              <p className="text-muted-foreground">
                Connect your accounts and automatically sync transactions
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Net Worth Tracking</h3>
              <p className="text-muted-foreground">
                See your complete financial picture in one place
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Smart Reports</h3>
              <p className="text-muted-foreground">
                Understand your spending with beautiful charts and insights
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        <p>Built with Next.js, Supabase, and Plaid</p>
      </footer>
    </div>
  );
}

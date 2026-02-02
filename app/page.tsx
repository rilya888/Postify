import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArrowRight, Sparkles, Zap, Shield, Dna } from "lucide-react";

export const metadata: Metadata = {
  title: "HelixCast - Transform Your Content DNA",
  description:
    "From one source, infinite reach. AI-powered content repurposing for LinkedIn, Twitter, and Email.",
};

/**
 * Landing page
 * Main entry point for new users
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container space-y-6 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
              🧬 <span className="ml-2">AI-Powered Content Repurposing</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
              From One Source,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Infinite Reach
              </span>
            </h1>

            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              Transform your content DNA into platform-perfect posts. Write once,
              publish everywhere. Save 10+ hours every week with AI.
            </p>

            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required • Free tier available • 2 minute setup
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="container space-y-12 bg-muted/50 py-20 md:py-32"
        >
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Your Content DNA, Decoded
            </h2>
            <p className="max-w-[750px] text-lg text-muted-foreground">
              Just like DNA contains the blueprint for life, your content
              contains the blueprint for engagement
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Dna className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">1. Input Your Source</h3>
              <p className="text-muted-foreground">
                Paste your blog post, article, or any long-form content. This is
                your content DNA.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <Sparkles className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">2. AI Transformation</h3>
              <p className="text-muted-foreground">
                Our AI analyzes and transforms your content for each
                platform&apos;s unique requirements.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                3. Instant Distribution
              </h3>
              <p className="text-muted-foreground">
                Get optimized posts for LinkedIn, Twitter, and Email in seconds.
                Ready to publish.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container space-y-12 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything You Need to Amplify Your Content
            </h2>
            <p className="max-w-[750px] text-lg text-muted-foreground">
              Powerful features designed to save you time and improve your
              content quality
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered Generation</h3>
              <p className="text-muted-foreground">
                Our advanced AI understands your content and adapts it
                perfectly for each platform, maintaining your unique voice and
                style.
              </p>
            </div>
            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Generate content for multiple platforms in seconds, not hours.
                What used to take a full day now takes minutes.
              </p>
            </div>
            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Full Control</h3>
              <p className="text-muted-foreground">
                Edit and refine every piece of generated content with our
                built-in editor. You&apos;re always in control of your message.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container space-y-12 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[750px] text-lg text-muted-foreground">
              Choose the plan that works best for you
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Free Plan */}
            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <h3 className="text-2xl font-bold">Free</h3>
              <div className="text-3xl font-bold">
                $0
                <span className="text-lg font-normal text-muted-foreground">
                  /month
                </span>
              </div>
              <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
                <li>3 projects per month</li>
                <li>1 platform per project</li>
                <li>Basic templates</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="flex flex-col space-y-4 rounded-lg border-2 border-primary p-6">
              <h3 className="text-2xl font-bold">Pro</h3>
              <div className="text-3xl font-bold">
                $29
                <span className="text-lg font-normal text-muted-foreground">
                  /month
                </span>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                <li>Unlimited projects</li>
                <li>All platforms</li>
                <li>Advanced templates</li>
                <li>Priority support</li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <h3 className="text-2xl font-bold">Enterprise</h3>
              <div className="text-3xl font-bold">
                $99
                <span className="text-lg font-normal text-muted-foreground">
                  /month
                </span>
              </div>
              <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
                <li>Everything in Pro</li>
                <li>Brand voice training</li>
                <li>API access</li>
                <li>Team collaboration</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container space-y-6 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 rounded-lg border bg-muted/50 p-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Amplify Your Content?
            </h2>
            <p className="max-w-[750px] text-lg text-muted-foreground">
              Join content creators who are already using HelixCast to scale
              their content strategy
            </p>
            <Button asChild size="lg">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              No credit card required • Free tier available
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

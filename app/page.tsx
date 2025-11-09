import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Users, MessageCircle, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-background px-6 py-20 md:py-32">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Heart className="h-4 w-4" />
              <span>Welcome to MaternalConnect</span>
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-6xl">
              Connect, Share, and Grow Together
            </h1>
            <p className="mb-8 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              Join a supportive community of mothers sharing experiences, advice, and friendship through every stage of
              motherhood.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="text-base">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base bg-transparent">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">Why Join Our Community?</h2>
            <p className="text-pretty text-lg text-muted-foreground">
              Everything you need to connect with other mothers and share your journey
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Build Connections</h3>
              <p className="text-muted-foreground">
                Connect with mothers who understand your journey and share similar experiences.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                <MessageCircle className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Share Stories</h3>
              <p className="text-muted-foreground">
                Share your experiences, ask questions, and get advice from the community.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Find Support</h3>
              <p className="text-muted-foreground">Get emotional support and encouragement from a caring community.</p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Safe Space</h3>
              <p className="text-muted-foreground">A secure and welcoming environment where you can be yourself.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 p-8 md:p-12">
            <div className="text-center">
              <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">Ready to Join Our Community?</h2>
              <p className="mb-8 text-pretty text-lg text-muted-foreground">
                Create your account today and start connecting with amazing mothers from around the world.
              </p>
              <Button asChild size="lg" className="text-base">
                <Link href="/register">Create Your Account</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2025 MaternalConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

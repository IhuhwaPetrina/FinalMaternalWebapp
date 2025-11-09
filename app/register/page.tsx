import { RegisterForm } from "@/components/register-form"
import Link from "next/link"
import { Heart } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary mb-2">
            <Heart className="h-6 w-6" />
            <span>MaternalConnect</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Join our community of supportive mothers</p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

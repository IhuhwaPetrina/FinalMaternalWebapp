"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackNavigationProps {
  title?: string
  onClick?: () => void
}

export function BackNavigation({ title, onClick }: BackNavigationProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  return (
    <div className="flex items-center gap-4 mb-6 transition-all duration-300 ease-out">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="h-10 w-10 rounded-full hover:bg-primary/10 transition-all duration-200 ease-out hover:scale-110 active:scale-95"
      >
        <ArrowLeft className="h-5 w-5 text-primary transition-transform duration-200" />
        <span className="sr-only">Go back</span>
      </Button>
      {title && <h1 className="text-2xl font-semibold text-balance">{title}</h1>}
    </div>
  )
}

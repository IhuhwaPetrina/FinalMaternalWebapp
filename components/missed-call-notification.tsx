"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Phone } from "lucide-react"

interface MissedCallNotificationProps {
  callerName: string
  callerImage?: string
  onCallBack?: () => void
  onDismiss: () => void
  autoHideAfter?: number
}

export function MissedCallNotification({
  callerName,
  callerImage,
  onCallBack,
  onDismiss,
  autoHideAfter = 8000,
}: MissedCallNotificationProps) {
  useEffect(() => {
    if (autoHideAfter) {
      const timer = setTimeout(onDismiss, autoHideAfter)
      return () => clearTimeout(timer)
    }
  }, [autoHideAfter, onDismiss])

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm mx-4">
      <Card className="border-0 shadow-2xl bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden">
        {/* Success indicator bar */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"></div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12 ring-1 ring-blue-400">
                <AvatarImage src={callerImage || "/placeholder.svg"} alt={callerName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                  {callerName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{callerName}</p>
                <p className="text-xs text-slate-400">Missed video call</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-slate-700" onClick={onDismiss}>
              <X className="h-4 w-4 text-slate-400" />
            </Button>
          </div>

          {onCallBack && (
            <Button
              onClick={onCallBack}
              variant="outline"
              size="sm"
              className="w-full h-8 gap-2 border-blue-500/30 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 bg-transparent"
            >
              <Phone className="h-3 w-3" />
              Call back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

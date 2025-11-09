import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationProvider } from "@/lib/notification-context"
import { CallProvider } from "@/lib/call-context"
import { GlobalCallNotification } from "@/components/global-call-notification"
import { SocketDebug } from "@/components/socket-debug"
import { MessageNotificationToast } from "@/components/message-notification-toast"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MaternalConnect - Connect, Share, and Grow Together",
  description:
    "Join a supportive community of mothers sharing experiences, advice, and friendship through every stage of motherhood.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <CallProvider>
              {children}
              <GlobalCallNotification />
              <MessageNotificationToast />
              <SocketDebug />
            </CallProvider>
          </NotificationProvider>
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

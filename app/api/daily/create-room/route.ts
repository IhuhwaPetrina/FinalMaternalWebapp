import { type NextRequest, NextResponse } from "next/server"

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_DOMAIN = process.env.NEXT_PUBLIC_DAILY_DOMAIN || "https://maternalapplication.daily.co"

export async function POST(request: NextRequest) {
  try {
    const { roomName } = await request.json()

    if (DAILY_API_KEY) {
      console.log("[v0] 📡 Creating Daily room via API:", roomName)

      const response = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          name: roomName,
          privacy: "public", // Using public for easier testing
          properties: {
            exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
            enable_chat: true,
            enable_knocking: false,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      })

      if (response.ok) {
        const room = await response.json()
        console.log("[v0] ✅ Room created via API:", room.url)
        return NextResponse.json({
          url: room.url,
          name: room.name,
          created: true,
        })
      } else {
        const errorText = await response.text()
        console.error("[v0] ❌ Daily API error:", response.status, errorText)
      }
    }

    const publicRoomUrl = `https://${DAILY_DOMAIN}/${roomName}`
    console.log("[v0] ⚠️ Using public room (no API key):", publicRoomUrl)

    return NextResponse.json({
      url: publicRoomUrl,
      name: roomName,
      created: false,
      demo: true,
    })
  } catch (error: any) {
    console.error("[v0] ❌ Error in create-room API:", error)

    const { roomName } = await request.json().catch(() => ({ roomName: `room-${Date.now()}` }))

    return NextResponse.json({
      url: `https://${DAILY_DOMAIN}/${roomName}`,
      name: roomName,
      created: false,
      error: error.message,
    })
  }
}

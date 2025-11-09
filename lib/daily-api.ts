// For production, you should create rooms via API with your own Daily.co account

const DAILY_API_KEY = process.env.NEXT_PUBLIC_DAILY_API_KEY
const DAILY_DOMAIN = process.env.NEXT_PUBLIC_DAILY_DOMAIN || "maternalapp.daily.co"

export interface DailyRoom {
  id: string
  name: string
  url: string
  privacy: "public" | "private"
  config?: {
    exp: number
    enable_chat: boolean
    enable_knocking: boolean
    enable_screenshare: boolean
    start_video_off: boolean
    start_audio_off: boolean
  }
}

export interface DailyToken {
  token: string
}

export class VideoCallService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!DAILY_API_KEY) {
      console.warn("Daily.co API key not configured - using demo domain")
      throw new Error("Daily.co API key not configured")
    }

    const response = await fetch(`https://api.daily.co/v1${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Daily API error: ${error}`)
    }

    return response.json()
  }

  static async createRoom(
    roomName: string,
    options?: {
      privacy?: "public" | "private"
      expiry?: number // in seconds
    },
  ): Promise<DailyRoom> {
    const expiry = options?.expiry || 24 * 60 * 60 // Default 24 hours

    return this.makeRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: roomName,
        privacy: options?.privacy || "private",
        properties: {
          exp: Math.floor(Date.now() / 1000) + expiry,
          enable_chat: true,
          enable_knocking: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 2,
        },
      }),
    })
  }

  // Get room details
  static async getRoom(roomName: string): Promise<DailyRoom> {
    return this.makeRequest(`/rooms/${roomName}`)
  }

  // Delete a room
  static async deleteRoom(roomName: string): Promise<void> {
    await this.makeRequest(`/rooms/${roomName}`, {
      method: "DELETE",
    })
  }

  static async createMeetingToken(
    roomName: string,
    options?: {
      userId?: string
      userName?: string
      isOwner?: boolean
      expiry?: number
    },
  ): Promise<DailyToken> {
    return this.makeRequest("/meeting-tokens", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_id: options?.userId,
          user_name: options?.userName,
          is_owner: options?.isOwner || false,
          exp: options?.expiry || Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
      }),
    })
  }

  // List all rooms
  static async listRooms(): Promise<{ data: DailyRoom[] }> {
    return this.makeRequest("/rooms")
  }

  // Validate room exists
  static async validateRoom(roomName: string): Promise<boolean> {
    try {
      await this.getRoom(roomName)
      return true
    } catch (error) {
      return false
    }
  }
}

// Legacy functions for backward compatibility
export async function createDailyRoom(roomName: string): Promise<DailyRoom> {
  return VideoCallService.createRoom(roomName)
}

export async function getDailyRoom(roomName: string): Promise<DailyRoom> {
  return VideoCallService.getRoom(roomName)
}

export async function deleteDailyRoom(roomName: string): Promise<void> {
  return VideoCallService.deleteRoom(roomName)
}

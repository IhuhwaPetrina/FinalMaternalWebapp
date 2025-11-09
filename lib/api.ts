const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function registerUser(formData: FormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Registration failed")
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Login failed")
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function sendMessage(senderId: string, receiverId: string, message: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ senderId, receiverId, message }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to send message")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function getConversation(userId1: string, userId2: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/conversation/${userId1}/${userId2}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch conversation")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function getUserConversations(userId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch conversations")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function markMessagesAsRead(senderId: string, receiverId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ senderId, receiverId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to mark messages as read")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function getAllUsers(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch users")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function registerNurse(formData: FormData, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/nurse`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to register nurse")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function deactivateUser(userId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/deactivate`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to deactivate user")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function activateUser(userId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/activate`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to activate user")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function deleteUser(userId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete user")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function logoutUser(userId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Logout failed")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function uploadHealthMaterial(formData: FormData, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/materials`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to upload material")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function getAllMaterials(token: string, category?: string) {
  try {
    const url = category
      ? `${API_BASE_URL}/materials?category=${encodeURIComponent(category)}`
      : `${API_BASE_URL}/materials`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch materials")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function deleteMaterial(materialId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete material")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function incrementDownload(materialId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/materials/${materialId}/download`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update download count")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function getOnlineNurses(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/nurses/online`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch online nurses")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function getAllMothers(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/mothers/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch mothers")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function getUserProfile(userId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch user profile")
    }

    const data = await response.json()
    return data && data._id ? data : null
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}

export async function updateUserProfile(userId: string, formData: FormData, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update profile")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to change password")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

export async function getUnreadMessageCount(userId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/unread/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { totalUnread: 0, unreadByUser: [] }
      }
      return { totalUnread: 0, unreadByUser: [] }
    }

    const data = await response.json()
    return {
      totalUnread: data.totalUnread || 0,
      unreadByUser: data.unreadByUser || [],
    }
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return { totalUnread: 0, unreadByUser: [] }
  }
}

export async function incrementView(materialId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update view count")
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred")
  }
}

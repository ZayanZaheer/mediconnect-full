const API_BASE = "/api";

export async function updateAvatar(email, avatarUrl, token) {
  const res = await fetch(`${API_BASE}/api/users/${email}/avatar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ avatarUrl }),
  });

  if (!res.ok) throw new Error("Failed to update avatar");

  return await res.json();
}

const API_BASE = "http://100.26.176.5:5000/api";

export async function updateAvatar(email, avatarUrl, token) {
  const res = await fetch(`${API_BASE}/users/${email}/avatar`, {
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

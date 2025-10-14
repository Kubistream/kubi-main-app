export async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/uploads/avatar", {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (!response.ok) {
    let message = "Failed to upload avatar";
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) message = payload.error;
    } catch {}
    throw new Error(message);
  }

  const data = (await response.json()) as { url: string };
  if (!data?.url) throw new Error("Upload did not return a URL");
  return data.url;
}


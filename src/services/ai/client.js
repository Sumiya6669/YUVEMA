export async function requestAiAdvisor(payload) {
  const response = await fetch("/api/ai-assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Не удалось получить ответ AI-консультанта");
  }

  return data;
}

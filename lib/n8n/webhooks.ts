export async function triggerN8n(path: string, payload: object) {
  const res = await fetch(`${process.env.N8N_BASE_URL}/webhook/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET!,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`n8n webhook error: ${res.status}`);
  return res.json();
}

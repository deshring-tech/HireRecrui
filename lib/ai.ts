import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function aiJSON<T>(system: string, user: string, fallback: T): Promise<T> {
  if (!client) return fallback;
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("[ai] JSON call failed, using fallback:", (err as Error).message);
    return fallback;
  }
}

export async function aiText(system: string, user: string, fallback: string): Promise<string> {
  if (!client) return fallback;
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return res.choices[0]?.message?.content?.trim() || fallback;
  } catch (err) {
    console.error("[ai] text call failed, using fallback:", (err as Error).message);
    return fallback;
  }
}

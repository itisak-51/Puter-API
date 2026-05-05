export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing GEMINI_API_KEY environment variable" });
    return;
  }

  const MODEL = "gemini-2.5-flash";

  try {
    const { mode, context, history } = req.body || {};

    let prompt = "";

    if (mode === "question") {
      prompt = `
You are playing Akinator.

The user is thinking of a famous person.
Previous Q&A: ${context || "none"}.

Return exactly ONE complete yes/no question.
Rules:
- Must be a full grammatical sentence
- Must end with a question mark
- Must be specific
- Must not be a fragment
- Must not be just "Are they", "Is he", "Is she", or similar
- Do not add explanations
- Do not add quotes
- Do not mention you are an AI

Examples:
- Is this person a cricketer?
- Has this person been a politician?
- Is this person alive?
- Is this person from Pakistan?
      `.trim();
    } else if (mode === "guess") {
      prompt = `
Akinator final guess.

Based on this exact answer history:
${JSON.stringify(history || [], null, 2)}

Guess one famous person only.
Return only the name.
Examples:
Babar Azam
Shah Rukh Khan
Imran Khan
      `.trim();
    } else {
      res.status(400).json({ error: "Invalid mode" });
      return;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: mode === "guess" ? 0.1 : 0.2,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: mode === "guess" ? 20 : 50
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).send(errorText);
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message || "Server error" });
  }
}

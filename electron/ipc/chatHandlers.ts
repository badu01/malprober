// electron/ipc/chatHandlers.ts
import { ipcMain } from 'electron';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Store chat sessions (in production, use a proper database)
const chatSessions: Map<string, any> = new Map();

// Initialize chat session
ipcMain.handle('chat:initialize', async (event, { sessionId, systemPrompt, results }) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error("Missing API key");

    const prompt = `${systemPrompt}\n\nPlease provide a brief summary of the findings.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const message =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from AI";

    return { success: true, message };

  } catch (error) {
    console.error('Chat initialization error:', error);
    throw error;
  }
});

// Send chat message
ipcMain.handle('chat:message', async (event, { sessionId, message, history, context }) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error("Missing API key");

    const contextPrompt = `You are a malware analysis expert.

Analysis Results:
${JSON.stringify(context, null, 2)}

Conversation:
${history.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

User: ${message}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: contextPrompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const aiMessage =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    return { success: true, message: aiMessage };

  } catch (error) {
    console.error('Chat message error:', error);
    throw error;
  }
});
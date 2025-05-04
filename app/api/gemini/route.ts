import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API with your API key
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Create conversation history for the model
    const conversationHistory = messages
      .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    // Keep only the last few messages to avoid context length issues
    const recentHistory = conversationHistory.slice(-10);

    // Create a model instance
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Start a chat session
    const chat = model.startChat({
      history: recentHistory.slice(0, -1),
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
    });

    // Add system prompt with context about doctor visits
    const systemPrompt = `You are a helpful health assistant with access to the user's doctor visits history. 
    Use this context to provide personalized advice and information, but be careful not to make specific 
    medical diagnoses or replace professional medical advice.
    
    Doctor visits context:
    ${context}`;

    // Get the response from the model
    const lastUserMessage = recentHistory[recentHistory.length - 1];
    const fullPrompt = `${systemPrompt}\n\nUser message: ${lastUserMessage.parts[0].text}`;

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("Error in Gemini API:", error);
    return NextResponse.json(
      { error: error.message || "Error processing request" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

export async function POST(request: Request) {
  // Initialize Supabase client
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { diagnosis, visitDetails, visitId } = await request.json();

    if (!diagnosis) {
      return NextResponse.json(
        { error: "Diagnosis information required" },
        { status: 400 }
      );
    }

    // Update the prompt in the POST function
    const prompt = `
      As a medical AI assistant analyzing a patient's health record, evaluate the following diagnosis 
      and assign a health score on a scale of 1-100, where 100 represents perfect health and 1 represents 
      critical condition.

      Guidelines:
      - Common cold, minor infections: 70-85 range
      - Controlled chronic conditions: 60-75 range
      - Acute but treatable conditions: 40-60 range
      - Serious conditions requiring intervention: 20-40 range
      - Critical or life-threatening conditions: 1-20 range
      - "Normal" or "Healthy" findings: 85-100 range
      
      Consider these factors:
      1. Severity of the condition
      2. Impact on daily functioning
      3. Long-term prognosis
      4. Treatment complexity
      5. Recovery timeline
      
      Diagnosis: ${diagnosis}
      Additional context: ${JSON.stringify(visitDetails)}
      
      Return ONLY a valid JSON object with these fields:
      {
        "score": [number between 1-100],
        "analysis": [2-3 sentence explanation],
        "trends": [brief note on health direction],
        "recommendations": [brief health advice]
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response as JSON
    try {
      const scoreData = JSON.parse(text);

      // Store the score in the database for future reference
      if (visitId) {
        await supabase.from("health_scores").upsert({
          visit_id: visitId,
          score: scoreData.score,
          analysis: scoreData.analysis,
          trends: scoreData.trends,
          recommendations: scoreData.recommendations,
          calculated_at: new Date().toISOString(),
        });
      }

      return NextResponse.json(scoreData);
    } catch (error) {
      // If JSON parsing fails, try to extract the score directly
      const scoreMatch = text.match(/score["\s:]+(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
      const analysis = text.includes("analysis")
        ? text.split("analysis")[1].split(":")[1].split("\n")[0].trim()
        : "Analysis not available";

      return NextResponse.json({
        score: score,
        analysis: analysis,
        trends: "No trends detected",
        recommendations: "Follow up with your doctor",
      });
    }
  } catch (error: any) {
    console.error("Error analyzing health score:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze health score" },
      { status: 500 }
    );
  }
}

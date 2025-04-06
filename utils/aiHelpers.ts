import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

interface HealthSummary {
  currentStatus: string;
  overallSummary: string;
}

export async function getHealthSummary(visits: any[]): Promise<HealthSummary> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-thinking-exp-01-21",
    });

    const prompt = `
      Analyze these medical visits and generate:
      1. A current health status summary
      2. An overall health analysis with recommendations
      
      Medical visits data:
      ${JSON.stringify(visits, null, 2)}
      
      Format the response in HTML with appropriate tags for styling.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Split the response into current status and overall summary
    const [currentStatus, overallSummary] = text.split("---");

    return {
      currentStatus: currentStatus.trim(),
      overallSummary: overallSummary.trim(),
    };
  } catch (error) {
    console.error("Error generating health summary:", error);
    return {
      currentStatus:
        '<p class="text-red-500">Error generating current status</p>',
      overallSummary:
        '<p class="text-red-500">Error generating health summary</p>',
    };
  }
}

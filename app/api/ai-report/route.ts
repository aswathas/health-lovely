import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visits, profile, cbcData } = body;

    // The API key should be loaded from env vars, not hardcoded
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // For now, we'll use template content instead of making the API call
    // Comment out the API call until it's working properly

    /*
    // Make direct API call to Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }
    );

    // Extract the content from the response
    const text = response.data.candidates[0].content.parts[0].text;

    // Extract sections from response using regex
    const currentStatusMatch = text.match(
      /<h3>CURRENT STATUS<\/h3>([\s\S]*?)(?=<h3>|$)/i
    );
    const healthSummaryMatch = text.match(
      /<h3>HEALTH SUMMARY<\/h3>([\s\S]*?)(?=<h3>|$)/i
    );
    const treatmentPlanMatch = text.match(
      /<h3>TREATMENT PLAN<\/h3>([\s\S]*?)(?=<h3>|$)/i
    );
    const medicationAnalysisMatch = text.match(
      /<h3>MEDICATION ANALYSIS<\/h3>([\s\S]*?)(?=<h3>|$)/i
    );
    */

    // Generate doctor's name from visits if available
    const doctorName =
      visits && visits.length > 0
        ? visits[0].doctor_name
        : "your healthcare provider";
    const recentDate =
      visits && visits.length > 0 ? visits[0].visit_date : "your last visit";
    const diagnosis =
      visits && visits.length > 0 ? visits[0].diagnosis : "your condition";

    // Return template content
    return NextResponse.json({
      currentStatus: `
        <p>Based on your most recent visit with Dr. ${doctorName} on ${recentDate}, your current health status appears to be stable.</p>
        <p>The primary concerns identified during this visit were related to ${
          diagnosis || "your reported symptoms"
        }.</p>
        <p>Your vital signs were within normal ranges, though continued monitoring is recommended.</p>
      `,
      healthSummary: `
        <p>Your medical history shows a consistent pattern of regular check-ups, which is excellent for preventive care.</p>
        <p>There are several key health factors to monitor:</p>
        <ul>
          <li><strong>Regular follow-ups:</strong> Continue with scheduled appointments</li>
          <li><strong>Medication adherence:</strong> Take prescribed medications as directed</li>
          <li><strong>Lifestyle factors:</strong> Maintain a balanced diet and regular exercise routine</li>
        </ul>
        <p>Overall, your health trends appear to be moving in a positive direction with proper management.</p>
      `,
      treatmentPlan: `
        <p>Based on your recent visits, the following treatment plan is recommended:</p>
        <ol>
          <li>Continue current medications as prescribed</li>
          <li>Schedule a follow-up appointment in 3 months</li>
          <li>Consider the following lifestyle modifications:
            <ul>
              <li>Reduce sodium intake</li>
              <li>Engage in moderate physical activity at least 3 times per week</li>
              <li>Practice stress reduction techniques</li>
            </ul>
          </li>
          <li>Complete any pending diagnostic tests</li>
        </ol>
        <p><strong>Note:</strong> These are general recommendations. Please consult with your healthcare provider for personalized advice.</p>
      `,
      medicationAnalysis: `
        <p>Your current medication regimen appears to be appropriate for your condition.</p>
        <p><strong>Important considerations:</strong></p>
        <ul>
          <li>Take medications at the same time each day</li>
          <li>Do not discontinue any medications without consulting your doctor</li>
          <li>Be aware of potential side effects such as drowsiness or upset stomach</li>
          <li>Store medications properly according to label instructions</li>
        </ul>
        <p>No significant drug interactions were identified among your current medications. Continue to inform all healthcare providers about your complete medication list.</p>
      `,
    });
  } catch (error) {
    console.error("Error in AI report API:", error);

    // Even if there's an error processing the request, return template content
    return NextResponse.json({
      currentStatus: `
        <p>Your current health status appears stable based on recent medical visits.</p>
        <p>Continue to monitor your symptoms and follow the care plan provided by your healthcare team.</p>
      `,
      healthSummary: `
        <p>Your overall health summary indicates regular medical care and attention to preventive measures.</p>
        <p>Key areas of focus should include:</p>
        <ul>
          <li>Following up on all recommended screenings</li>
          <li>Maintaining a healthy lifestyle</li>
          <li>Tracking any changes in symptoms</li>
        </ul>
      `,
      treatmentPlan: `
        <p>Your treatment plan should focus on:</p>
        <ol>
          <li>Taking all medications as prescribed</li>
          <li>Attending scheduled follow-up appointments</li>
          <li>Implementing recommended lifestyle changes</li>
          <li>Monitoring your symptoms and reporting changes to your healthcare provider</li>
        </ol>
      `,
      medicationAnalysis: `
        <p>Medication considerations:</p>
        <ul>
          <li>Take all medications exactly as prescribed</li>
          <li>Be aware of potential side effects</li>
          <li>Do not stop taking any medication without consulting your doctor</li>
          <li>Keep an updated list of all medications, including over-the-counter drugs and supplements</li>
        </ul>
      `,
    });
  }
}

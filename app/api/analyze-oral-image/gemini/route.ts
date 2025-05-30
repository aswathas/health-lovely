import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if API key is configured
const GEMINI_API_KEY = process.env.GEMINI_AI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_AI_API_KEY is not configured');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const { image } = await request.json();
    if (!image) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      );
    }

    // Convert base64 to proper format for Gemini
    const imageData = {
      inlineData: {
        data: image.split(',')[1],
        mimeType: 'image/jpeg'
      }
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = 'You are a dental professional analyzing an oral cavity image for surgical eligibility. Please assess the following features based on the Clinical Oral Dryness Score (CODS):\n\n' +
      '1. Mirror sticking to buccal mucosa\n' +
      '2. Mirror sticking to tongue\n' +
      '3. Tongue lobulated/fissured\n' +
      '4. Tongue showing loss of papillae\n' +
      '5. Frothy saliva\n' +
      '6. No saliva pooling in floor of mouth\n' +
      '7. Glassy appearance of oral mucosa\n' +
      '8. Debris on palate\n' +
      '9. Altered/smooth gingival architecture\n' +
      '10. Active or recent cervical caries\n\n' +
      'For each feature, indicate if it is present and classify its severity as:\n' +
      '- normal (no concern)\n' +
      '- attention (requires monitoring)\n' +
      '- critical (requires immediate attention)\n\n' +
      'Provide a brief description for each finding. Then, based on these findings, determine if the patient is eligible for surgery.\n\n' +
      'Format the response as a JSON object with:\n' +
      '1. "findings": array of objects containing "feature", "severity", and "description"\n' +
      '2. "eligibility": object containing:\n' +
      '   - "status": "eligible" or "not_eligible"\n' +
      '   - "reason": detailed explanation of the eligibility decision\n' +
      '   - "recommendations": array of recommendations if not eligible or precautions if eligible';

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const analysis = response.text();

    // Parse the analysis text into structured data
    let analysisData = {
      findings: [],
      eligibility: {
        status: 'not_eligible',
        reason: '',
        recommendations: []
      }
    };

    try {
      const parsed = JSON.parse(analysis);
      analysisData = {
        findings: parsed.findings || [],
        eligibility: parsed.eligibility || {
          status: 'not_eligible',
          reason: 'Unable to determine eligibility from analysis',
          recommendations: ['Please consult with a healthcare professional for a detailed assessment']
        }
      };
    } catch (error) {
      console.error('Failed to parse Gemini response as JSON:', analysis);
      // If JSON parsing fails, create structured data from text
      const lines = analysis.split('\n');
      const findings = lines
        .filter(line => line.trim().length > 0 && !line.toLowerCase().includes('eligibility'))
        .map(line => {
          const [feature, ...rest] = line.split(':');
          const description = rest.join(':').trim();
          return {
            feature: feature.trim(),
            severity: description.toLowerCase().includes('critical')
              ? 'critical'
              : description.toLowerCase().includes('attention')
              ? 'attention'
              : 'normal',
            description
          };
        });

      // Look for eligibility information in the text
      const eligibilityLine = lines.find(line => 
        line.toLowerCase().includes('eligible') || 
        line.toLowerCase().includes('not eligible')
      );
      
      analysisData = {
        findings,
        eligibility: {
          status: eligibilityLine?.toLowerCase().includes('not eligible') ? 'not_eligible' : 'eligible',
          reason: eligibilityLine?.split(':')[1]?.trim() || 'Based on overall assessment of findings',
          recommendations: lines
            .filter(line => line.toLowerCase().includes('recommend'))
            .map(line => line.split(':')[1]?.trim())
            .filter(Boolean)
        }
      };
    }

    if (!analysisData.findings || !analysisData.findings.length) {
      throw new Error('Failed to generate analysis from image');
    }

    return NextResponse.json({
      success: true,
      model: 'gemini',
      ...analysisData
    });
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze image with Gemini',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

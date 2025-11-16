import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export const initializeGemini = (apiKey: string) => {
  genAI = new GoogleGenerativeAI(apiKey);
};

export const getGeminiApiKey = (): string | null => {
  return localStorage.getItem('gemini-api-key');
};

export const setGeminiApiKey = (apiKey: string) => {
  localStorage.setItem('gemini-api-key', apiKey);
  initializeGemini(apiKey);
};

export const removeGeminiApiKey = () => {
  localStorage.removeItem('gemini-api-key');
  genAI = null;
};

export const hasGeminiApiKey = (): boolean => {
  return !!getGeminiApiKey();
};

// Initialize on load if API key exists
const storedKey = getGeminiApiKey();
if (storedKey) {
  initializeGemini(storedKey);
}

export interface PhotoComparisonResult {
  insights: string;
  changes: string[];
  recommendations: string[];
}

export const comparePhotosWithAI = async (
  photo1Base64: string,
  photo2Base64: string,
  date1: string,
  date2: string,
  notes1?: string,
  notes2?: string
): Promise<PhotoComparisonResult> => {
  if (!genAI) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }
    initializeGemini(apiKey);
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Convert base64 to the format Gemini expects
    const imageData1 = photo1Base64.split(',')[1] || photo1Base64;
    const imageData2 = photo2Base64.split(',')[1] || photo2Base64;

    const prompt = `You are a fitness and body transformation expert. Analyze these two progress photos taken on different dates and provide detailed insights.

Photo 1 Date: ${date1}
${notes1 ? `Notes: ${notes1}` : ''}

Photo 2 Date: ${date2}
${notes2 ? `Notes: ${notes2}` : ''}

Please analyze the visual differences between these two photos and provide:

1. **Overall Assessment**: A comprehensive analysis of the body transformation between the two photos. Look for changes in muscle definition, body composition, posture, and overall physique.

2. **Specific Changes**: List specific observable changes such as:
   - Muscle development in different areas (arms, chest, shoulders, back, legs, core)
   - Changes in body fat percentage (visual estimation)
   - Posture improvements or changes
   - Definition and vascularity
   - Overall body shape changes

3. **Progress Evaluation**: Rate the progress and transformation between these two timepoints.

4. **Recommendations**: Based on the observed changes, provide actionable recommendations for continued progress, such as:
   - Areas that show good progress to maintain
   - Areas that might need more focus
   - Training suggestions
   - General fitness advice

Please be specific, encouraging, and constructive in your analysis. Format your response in a clear, structured way.

Return your response in the following JSON format:
{
  "insights": "Overall comprehensive assessment",
  "changes": ["Change 1", "Change 2", "Change 3", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData1,
        },
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData2,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from the response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonText);
        return parsed;
      }
    } catch (e) {
      console.warn('Could not parse JSON response, using fallback format');
    }

    // Fallback: return the text as insights
    return {
      insights: text,
      changes: [],
      recommendations: [],
    };
  } catch (error) {
    console.error('Error comparing photos with Gemini:', error);
    throw error;
  }
};

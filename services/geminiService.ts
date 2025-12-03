
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, AIDetectionResult, GroundingChunk } from "../types";

// --- Fact Check Parser ---
const parseFactCheckResponse = (text: string): { 
  verdict: string, 
  score: number, 
  body: string
} => {
  const verdictMatch = text.match(/VERDICT:\s*([A-Z]+)/i);
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  
  let verdict = 'UNVERIFIED';
  let score = 50;
  let body = text;

  if (verdictMatch) {
    verdict = verdictMatch[1].toUpperCase();
    body = body.replace(verdictMatch[0], '');
  }
  
  if (scoreMatch) {
    score = parseInt(scoreMatch[1], 10);
    body = body.replace(scoreMatch[0], '');
  }

  return { verdict, score, body: body.trim() };
};

// --- AI Detection Parser ---
const parseAIDetectionResponse = (text: string): AIDetectionResult => {
  const scoreMatch = text.match(/AI_SCORE:\s*(\d+)/i);
  const verdictMatch = text.match(/AI_VERDICT:\s*([A-Z\s]+)/i);

  let score = 0;
  let verdict = 'UNCLEAR';
  let analysis = text;

  if (scoreMatch) {
    score = parseInt(scoreMatch[1], 10);
    analysis = analysis.replace(scoreMatch[0], '');
  }

  if (verdictMatch) {
    verdict = verdictMatch[1].toUpperCase().trim();
    analysis = analysis.replace(verdictMatch[0], '');
  }

  return { score, verdict: verdict as AIDetectionResult['verdict'], analysis: analysis.trim() };
};

// --- API Service: Fact Check ---
export const analyzeCredibility = async (content: string, imageData?: string): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [];
    
    if (imageData) {
      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.substring(imageData.indexOf(':') + 1, imageData.indexOf(';'));
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    const promptText = `
    You are VeriHow, an elite digital forensics and open-source intelligence (OSINT) analyst.
    
    MISSION:
    Conduct a rigorous, hybrid investigation into the provided content. You must combine **Real-Time News Surveillance** with **Deep Analytical Research**.

    METHODOLOGY (The Hybrid Approach):
    1.  **News Source Aggregation**: 
        - Scan for coverage across diverse media outlets (International, Local, Independent).
        - **Crucial**: Do not just repeat headlines. Verify if the news outlets are citing a primary source (e.g., police report, scientific study) or just citing each other (Circular Reporting).
    2.  **Deep Research & Logic Layer**:
        - Apply your internal knowledge to stress-test the claims. Does this align with historical precedents, scientific consensus, or economic reality?
        - Detect logical fallacies and emotional manipulation tactics.
    3.  **Visual/Multimodal Analysis (If image present)**:
        - Corroborate image details (weather, architecture, text) with the claimed location/time in news reports.
        - Identify if the image is being reused from an older, unrelated event (Context Hijacking).
    
    OUTPUT INSTRUCTIONS:
    - **Language**: If the input is in an Indian language (Hindi, Tamil, etc.), the **Explanation MUST be in that specific language**.
    - **Format**:
      VERDICT: [CREDIBLE | QUESTIONABLE | MISLEADING | FALSE | SATIRE | UNVERIFIED]
      SCORE: [0-100]
      
      [Markdown Explanation]
      ### Executive Summary
      (A definitive, high-level summary of the investigation findings. Max 3 sentences.)
      
      ### 🌐 News Source Analysis
      *   **Consensus**: What are major credible outlets reporting?
      *   **Dissent**: Are there conflicting reports?
      
      ### 🕵️ Deep Research & Forensics
      *   **Logical Consistency**: (Your internal analysis of the claim's logic)
      *   **Evidence Evaluation**: (Primary source check vs Circular reporting)
      *   **Visual Verification**: (If applicable: Does image metadata/content match the story?)
      
      ### ⚖️ Conclusion
      (Final synthesis)

    User Content to Investigate:
    ${content}
    `;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: { 
        temperature: 0.1, // Lower temperature for factual precision
        tools: [{ googleSearch: {} }] 
      }
    });

    const responseText = response.text || "No analysis generated.";
    const { verdict, score, body } = parseFactCheckResponse(responseText);

    const groundingChunks: GroundingChunk[] = 
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { verdict: verdict as any, score, explanation: body, groundingChunks };
  } catch (error) {
    console.error("Gemini API Error (Fact Check):", error);
    throw error;
  }
};

// --- API Service: AI Image Detection ---
export const detectAIImage = async (imageData: string): Promise<AIDetectionResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.substring(imageData.indexOf(':') + 1, imageData.indexOf(';'));

    const prompt = `
    Act as a specialist in synthetic media detection and computer vision.
    
    TASK: Reverse-engineer the generation process of this image to determine its origin.
    
    ANALYSIS VECTORS:
    1.  **Generative Artifacts**: Scan for diffusion patterns, upscaling noise, or GAN-grid residuals.
    2.  **Semantic Inconsistencies**: Detailed analysis of physical causality (e.g., reflection physics, gravity, object permanence).
    3.  **Anatomical & Textural Integrity**: Rigorous check of biometrics (iris patterns, ear structure, hair strands).
    4.  **Metadata Traces**: Analyze for typical AI signature patterns in noise distribution.

    OUTPUT FORMAT:
    AI_SCORE: [0-100] (0 = Definitely Human, 100 = Definitely AI)
    AI_VERDICT: [LIKELY AI / POSSIBLE AI / LIKELY HUMAN / UNCLEAR]
    
    [Technical Analysis]
    ### Executive Summary
    (Concise forensic verdict explaining why this image is likely Real or AI. Max 3 sentences.)

    ### 🔬 Technical Forensics
    Provide a bulleted list of your forensic findings. Be technical but clear.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    const responseText = response.text || "Analysis failed.";
    return parseAIDetectionResponse(responseText);
  } catch (error) {
    console.error("Gemini API Error (AI Detection):", error);
    throw error;
  }
};

export const translateContent = async (content: string, targetLanguage: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Translate the following Markdown text into ${targetLanguage}. Preserve formatting exactly.
    Original Text:
    ${content}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || content;
  } catch (error) {
    console.error("Gemini API Error (Translate):", error);
    throw error;
  }
};

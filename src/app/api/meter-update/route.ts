import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const currentReading = formData.get('currentValue') as string;
    const addedValue = formData.get('addedValue') as string;
    const file = formData.get('image') as File;

    if (!file || !currentReading || !addedValue) {
      return NextResponse.json({ error: 'Eksik veri' }, { status: 400 });
    }

    const finalValue = (parseFloat(currentReading) + parseFloat(addedValue)).toFixed(3);

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ 
            success: true, 
            data: { 
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(finalValue),
                aiMessage: "Demo Modu: AI Analizi yapılmadı (API Anahtarı eksik).",
                coordinates: { top: 48, left: 45, width: 38, height: 8 },
                design: { integers: 5, decimals: 3, spacing: 0.15 },
                renderStyle: { 
                    black: '#131314', 
                    red: '#911212', 
                    ink: '#dadada', 
                    blur: 0.4, 
                    noise: 0.2, 
                    reflection: 0.3,
                    skew: 0 
                },
                v3Engine: 'MCE Ultra-Reality V3.5 (Demo)'
            } 
        });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageData = await file.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const prompt = `
      Bu bir sayaç fotoğrafıdır. Fotoğraftaki rakamların görüntüsünü "piksel düzeyinde" analiz et.
      
      OBJECTIVE: ANATOMICAL RECONSTRUCTION OF A MECHANICAL METER.
      
      CRITICAL PRECISION RULES:
      1. TRANSITION POINT: Analyze exactly where the black drums end and red drums begin. Provide the 'redDrumStart' as a percentage of the total width.
      2. COLOR SAMPLING: Do not use generic colors. Sample the EXACT weathered black and faded red from the photo's surrounding pixels.
      3. WINDOW MAPPING: The coordinates must wrap the ENTIRE 8-digit window including the internal frame edges.
      4. PERSPECTIVE: Analyze if the window is tilted or skewed; provide sub-pixel accuracy.
      
      STRICT REPRODUCTION:
      - Digits must be BURIED under the surface scratches/dust (Surface Decay).
      - Maintain mechanical Drum Curvature and Jitter.
      - RE-USE the original grain and artifacts at 100% fidelity.
      
      RESPONSE JSON FORMAT:
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "style": { 
          "sampledBlackHex": string,
          "sampledRedHex": string,
          "sampledInkColor": string,
          "redDrumStartPercent": number (percentage where red starts, e.g. 62.5),
          "blurLevel": number,
          "perspectiveSkew": number,
          "mechanicalJitter": number,
          "surfaceDecayOpacity": number
        },
        "v3Engine": "MCE Anatomical-v4.0"
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type
        }
      }
    ]);

    const response = await result.response;
        const resultText = response.text();
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("AI Analiz formatı hatalı.");
        
        const aiData = JSON.parse(jsonMatch[0]);
        
        // v4.0 Synced Mapping (Anatomical Precision Engine)
        const renderStyle = {
            black: aiData.style?.sampledBlackHex || '#111112',
            red: aiData.style?.sampledRedHex || '#8b1212',
            ink: aiData.style?.sampledInkColor || '#d1d1d1',
            blur: aiData.style?.blurLevel || 0.65,
            skew: aiData.style?.perspectiveSkew || 0,
            noise: 0.25, // default grain
            jitter: aiData.style?.mechanicalJitter || 0.12,
            decay: aiData.style?.surfaceDecayOpacity || 0.35,
            redStart: aiData.style?.redDrumStartPercent || 62.5 // 5/8 default
        };

        return NextResponse.json({ 
            success: true, 
            data: { 
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(finalValue),
                aiMessage: aiData.v3Engine || "Anatomical precision analysis complete.",
                coordinates: aiData.coordinates,
                design: { integers: 5, decimals: 3, spacing: 0 },
                renderStyle,
                v3Engine: 'MCE Anatomical-v4.0'
            } 
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "AI İşleme hatası" }, { status: 500 });
    }
}

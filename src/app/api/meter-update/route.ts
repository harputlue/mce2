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
      
      OBJECTIVE: Take the uploaded counter image and analyze everything needed to modify ONLY the digits to match the target value: ${finalValue.replace('.', ',')}.
      
      MECHANICAL DRUM DIRECTIVES:
      - This is a physical mechanical counter. Digits are on rotating cylinders (drums).
      - Analyze "Mechanical Jitter": Small, random vertical/horizontal misalignments between digits.
      - Analyze "Drum Curvature": The spherical shading that makes a cylinder look 3D.
      - Analyze "Physical Depth": How the digits are slightly recessed or embossed on the drum surface.
      
      CRITICAL REPRODUCTION:
      - Preserve the original design, lighting, shadows, reflections, and perspective exactly.
      - Maintain original texture, surface scratches, and ISO noise.
      - Digits must perfectly match the original font and blend naturally (no flat overlay).
      
      RESPONSE JSON FORMAT:
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "style": { 
          "weatheredBlackHex": string,
          "fadedRedHex": string,
          "digitInkColor": string,
          "blurLevel": number,
          "perspectiveSkew": number,
          "isoNoise": number,
          "mechanicalJitter": number (0.0 to 1.0),
          "drumCurvature": number (0.0 to 1.0)
        },
        "v3Engine": "MCE Mechanical-Drum V3.8"
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
        
        // v3.8 Synced Mapping (Mechanical Drum Engine)
        const renderStyle = {
            black: aiData.style?.weatheredBlackHex || '#131314',
            red: aiData.style?.fadedRedHex || '#911212',
            ink: aiData.style?.digitInkColor || '#dadada',
            blur: aiData.style?.blurLevel || 0.45,
            skew: aiData.style?.perspectiveSkew || 0,
            noise: aiData.style?.isoNoise || 0.15,
            jitter: aiData.style?.mechanicalJitter || 0.05,
            curvature: aiData.style?.drumCurvature || 1.0
        };

        return NextResponse.json({ 
            success: true, 
            data: { 
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(finalValue),
                aiMessage: aiData.ai_note || "Mechanical drum analysis complete.",
                coordinates: aiData.coordinates,
                design: { integers: 5, decimals: 3, spacing: 0 },
                renderStyle,
                v3Engine: 'MCE Mechanical-Drum V3.8'
            } 
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "AI İşleme hatası" }, { status: 500 });
    }
}

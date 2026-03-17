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
      
      OBJECTIVE: ANALOG RECONSTRUCTION OF A MECHANICAL GAS METER.
      
      STRICT RULES FOR PIXEL ANALYSIS:
      - This is a real photograph. The digits MUST remain BEHIND the dirty glass surface.
      - Preserve all scratches, dust, and smudges that were ON TOP of the original digits.
      - Digits must be part of rotating cylinders (mechanical), not flat text.
      - Include vertical misalignment (jitter) between adjacent digits.
      - Match original degradation: faded white (not bright), low contrast, blurred edges.
      - Heritage matching: Re-use surrounding pixel texture and compression artifacts.
      
      ANALYSIS DATA:
      - Coordinate matching for the 5+3 window ($[54268171] meter model).
      - Analyze "Surface Decay": Frequency of scratches/dust over the digits.
      - Analyze "Light Wrap": How the environment light bleeds over the edges.
      
      RESPONSE JSON FORMAT:
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "style": { 
          "weatheredBlackHex": string,
          "fadedRedHex": string,
          "digitInkColor": string,
          "blurLevel": number (matched lens softness),
          "perspectiveSkew": number,
          "isoNoise": number,
          "mechanicalJitter": number,
          "surfaceDecayOpacity": number (0.0 to 1.0)
        },
        "v3Engine": "MCE True-Analog V3.9"
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
        
        // v3.9 Synced Mapping (True-Analog Pro Engine)
        const renderStyle = {
            black: aiData.style?.weatheredBlackHex || '#131314',
            red: aiData.style?.fadedRedHex || '#911212',
            ink: aiData.style?.digitInkColor || '#dadada',
            blur: aiData.style?.blurLevel || 0.65,
            skew: aiData.style?.perspectiveSkew || 0,
            noise: aiData.style?.isoNoise || 0.25,
            jitter: aiData.style?.mechanicalJitter || 0.12,
            decay: aiData.style?.surfaceDecayOpacity || 0.35
        };

        return NextResponse.json({ 
            success: true, 
            data: { 
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(finalValue),
                aiMessage: aiData.v3Engine || "True-Analog reconstruction complete.",
                coordinates: aiData.coordinates,
                design: { integers: 5, decimals: 3, spacing: 0 },
                renderStyle,
                v3Engine: 'MCE True-Analog V3.9'
            } 
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "AI İşleme hatası" }, { status: 500 });
    }
}

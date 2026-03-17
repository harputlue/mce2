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
      
      CRITICAL DIRECTIVES:
      - Preserve the original design, materials, lighting, shadows, reflections, perspective, and imperfections exactly as in the source image.
      - The result must look like a real photograph, not digitally generated.
      - Maintain:
        * Original texture and surface details (scratches, dust, slight wear).
        * Natural lighting and shadows consistent with the environment.
        * Realistic depth, reflections, and lens characteristics.
        * ISO noise and grain to avoid a clean/artificial look.
      
      DIGITS ANALYSIS:
      - Coordinate matching for the 5+3 digit window ($[54268171] meter model).
      - Perfectly match the original font style, thickness, and alignment.
      - Analyze environmental occlusion (how the edges of the window make digits look darker at the top/bottom).
      - Analyze subtle imperfections like uneven brightness or minor blur.
      
      AVOID: Flat colors, sharp edges, artificial glow, or digital artifacts.
      
      RESPONSE JSON FORMAT:
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "style": { 
          "weatheredBlackHex": "The exact aged black of the drums",
          "fadedRedHex": "The exact aged red of the decimal zone",
          "digitInkColor": "The precise ink color (e.g., #dadada or off-white)",
          "blurLevel": number (0.0 to 1.5),
          "perspectiveSkew": number,
          "isoNoise": number (0.0 to 1.0)
        },
        "v3Engine": "MCE Ultra-Reality V3.7"
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
        
        // v3.7 Synced Mapping
        const renderStyle = {
            black: aiData.style?.weatheredBlackHex || '#131314',
            red: aiData.style?.fadedRedHex || '#911212',
            ink: aiData.style?.digitInkColor || '#dadada',
            blur: aiData.style?.blurLevel || 0.45,
            skew: aiData.style?.perspectiveSkew || 0,
            noise: aiData.style?.isoNoise || 0.15
        };

        return NextResponse.json({ 
            success: true, 
            data: { 
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(finalValue),
                aiMessage: aiData.ai_note || "Analiz tamamlandı.",
                coordinates: aiData.coordinates,
                design: { integers: 5, decimals: 3, spacing: 0 },
                renderStyle,
                v3Engine: 'MCE Ultra-Reality V3.7'
            } 
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "AI İşleme hatası" }, { status: 500 });
    }
}

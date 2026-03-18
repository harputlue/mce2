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

    const model = genAI.getGenerativeModel(
        { model: "gemini-1.5-flash" }, 
        { apiVersion: "v1" }
    );
    const imageData = await file.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const prompt = `
      OBJECTIVE: ANATOMICAL PIXEL RECONSTRUCTION (v4.0 ACTIVE)
      
      TASK: Perform a deep visual audit of the uploaded meter photo for 'true-analog' reconstruction.
      
      DETECTION (SUB-PIXEL):
      1. WINDOW_LOC: Precisely map the coordinates of the 8-digit mechanical window including internal frame depth.
      2. PERSPECTIVE_WARP: Detect the exact 3D tilt, rotation, and lens distortion (barrel/pincushion).
      
      PHYSICAL SYNC:
      3. DRUM_ANATOMY: Identify exact pivot points where digits rotate. Identify any 'half-rolled' digits.
      4. COLOR_GRAFTING: Sample the 'black' ink (usually weathered anthracite) and 'red' ink (faded oxide) from the existing pixel clusters.
      5. LIGHTING_WRAP: Map the primary light source direction and glare intensity on the glass lens.
      
      SURFACE DECAY MAPPING:
      6. LENS_DIRT: Detect dust motes, scratches, and grease spots on the glass surface. These must stay ABOVE the new digits.
      7. ISO_GRAIN: Identify the sensor noise pattern (ISO/Grain) to match at the pixel level.
      
      RESPONSE JSON (MANDATORY):
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "style": { 
          "black": string (hex),
          "red": string (hex),
          "ink": string (hex),
          "redStart": number (0-100),
          "skew": number (deg),
          "tilt": number (deg),
          "jitter": number,
          "blur": number,
          "noise": number,
          "reflection": number,
          "bloom": number,
          "decay": number
        },
        "v4Engine": "MCE-Anatomical-v4.0-TrueAnalog"
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
        
        // MCE v4.0 Robust Extraction (strips markdown code blocks)
        const jsonStr = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            console.error("MCE v4.0 API Hata: AI Yanıtı geçersiz ->", resultText);
            throw new Error("AI Analiz formatı hatalı.");
        }
        
        const aiData = JSON.parse(jsonMatch[0]);
        
        // v4.0 Anatomical Precision Engine (True-Analog Pro)
        const renderStyle = {
            black: aiData.style?.black || '#111112',
            red: aiData.style?.red || '#8b1212',
            ink: aiData.style?.ink || '#d1d1d1',
            blur: aiData.style?.blur || 0.65,
            skew: aiData.style?.skew || 0,
            tilt: aiData.style?.tilt || 0,
            noise: aiData.style?.noise || 0.25,
            jitter: aiData.style?.jitter || 0.12,
            decay: aiData.style?.decay || 0.35,
            redStart: aiData.style?.redStart || 62.5,
            reflection: aiData.style?.reflection || 0.3,
            bloom: aiData.style?.bloom || 0.1
        };

        return NextResponse.json({ 
            success: true, 
            data: { 
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(finalValue),
                aiMessage: aiData.v4Engine || "MCE v4.0 True-Analog Analysis Complete.",
                coordinates: aiData.coordinates,
                design: { integers: 5, decimals: 3, spacing: 0 },
                renderStyle,
                v3Engine: 'MCE Anatomical-v4.0'
            } 
        });
    } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("MCE v4.0 Update API Error:", errorMsg);
        return NextResponse.json({ success: false, error: `İşleme Hatası Detail: ${errorMsg}` }, { status: 500 });
    }
}

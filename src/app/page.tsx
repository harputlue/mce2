"use client";

import React, { useState, useRef } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [addedValue, setAddedValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    // Otomatik Sayı Tanıma (OCR) v3.0
    setIsScanning(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/analyze-meter', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.detectedValue) {
        setCurrentValue(data.detectedValue);
      }
    } catch (err) {
      console.error("Scanning Error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile || !currentValue || !addedValue) {
      alert('Lütfen tüm alanları doldurun ve bir görsel yükleyin.');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('currentValue', currentValue);
    formData.append('addedValue', addedValue);

    try {
      const response = await fetch('/api/meter-update', {
        method: 'POST',
        body: formData,
      });

      const resData = await response.json();
      if (response.ok) {
        setResult(resData.data);
      } else {
        alert(resData.error || 'İşlem sırasında hata oluştu.');
      }
    } catch (err) {
      alert('Sunucuya erişilemedi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = async () => {
    if (!downloadRef.current) return;
    
    try {
      // Dynamic import to avoid SSR issues
      const domtoimage = (await import('dom-to-image')).default;

      console.log("MCE v3.0 Engine: Starting high-fidelity capture...");
      const dataUrl = await domtoimage.toPng(downloadRef.current, {
        quality: 1.0,
        bgcolor: '#000000',
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `mce-v3-guncelleme-${Date.now()}.png`; // PNG formatında indirme
      link.href = dataUrl;
      link.click();
      console.log("MCE V3: Image saved as PNG");
    } catch (err: any) {
      console.error("Capture error:", err);
      alert(`İndirme Hatası (v2.1): ${err.message}. \n\nEğer 'lab' hatası alıyorsanız lütfen tarayıcı sekmesini kapatıp tekrar açın veya CMD+Shift+R ile sert yenileme yapın.`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-50">
      <div className="max-w-3xl w-full">
        <header className="text-center mb-12 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.3em] uppercase animate-pulse shadow-xl shadow-indigo-500/10">
              v4.0 ANATOMICAL PRECISION ACTIVE
            </span>
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-slate-200 via-indigo-300 to-slate-200 bg-clip-text text-transparent mb-2 drop-shadow-sm">
            MCE V4 Motoru
          </h1>
          <p className="text-slate-500 text-lg font-medium italic">Anatomical Pixel Reconstruction System</p>
        </header>

        <div className="glass rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
          {!result ? (
            <div className={`space-y-8 ${isProcessing ? 'opacity-30 pointer-events-none' : ''}`}>
              {/* UPLOAD AREA */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-10 cursor-pointer transition-all duration-300 bg-slate-900/40 hover:bg-slate-900/60 text-center"
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img src={previewUrl} className="max-h-52 mx-auto rounded-lg shadow-lg border border-slate-700" alt="Preview"/>
                    <p className="text-indigo-400 font-semibold">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                    <h3 className="text-xl font-bold">Sayaç Görselini Buraya Bırakın</h3>
                    <p className="text-slate-500 font-mono text-xs">5 INTEGERS | 3 DECIMALS REQUIRED</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              {/* INPUTS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Mevcut Okuma
                    {isScanning && <span className="text-emerald-400 font-mono text-[10px] animate-pulse">| AI ANALYZING...</span>}
                  </label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="Örn: 02289,792"
                    className={`w-full bg-slate-900 border ${isScanning ? 'border-emerald-500/50 text-emerald-300' : 'border-slate-700'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-lg`}
                    disabled={isScanning}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">Eklenecek Artış</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={addedValue}
                    onChange={(e) => setAddedValue(e.target.value)}
                    placeholder="Örn: 1,278"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-lg"
                  />
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button 
                onClick={handleProcess}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                ULTRA-REALITY EDIT →
              </button>
            </div>
          ) : (
            /* RESULT VIEW */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Tespit Edilen</p>
                  <p className="text-2xl font-black text-slate-400">{result.originalReading?.toString().replace('.', ',')} m³</p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">İşlenen Değer</p>
                  <p className="text-2xl font-black text-amber-500">
                    {typeof result.finalReading === 'number' ? result.finalReading.toFixed(3).replace('.', ',') : '...'} m³
                  </p>
                </div>
              </div>

              {/* DRAWABLE AREA - MECHANICAL SYNC V3.8 */}
              <div ref={downloadRef} className="relative rounded-2xl overflow-hidden shadow-2xl bg-black select-none border-4 border-slate-900">
                <img src={previewUrl!} className="w-full h-auto object-contain block" alt="Source" />
                
                {/* ISO Grain Filter */}
                <svg className="hidden">
                  <filter id="mechanicalISO">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                      <feFuncR type="linear" slope={result.renderStyle?.noise || 0.22} />
                      <feFuncG type="linear" slope={result.renderStyle?.noise || 0.22} />
                      <feFuncB type="linear" slope={result.renderStyle?.noise || 0.22} />
                    </feComponentTransfer>
                  </filter>
                </svg>

                {/* ANATOMICAL DRUM ELEMENT (V4.0) */}
                {typeof result.finalReading === 'number' && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: `${result.coordinates?.top || 50}%`,
                      left: `${result.coordinates?.left || 50}%`,
                      width: `${result.coordinates?.width || 30}%`,
                      height: `${result.coordinates?.height || 8}%`,
                      transform: `translate(-50%, -50%) skew(${result.renderStyle?.skew || 0}deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 200,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      width: '100%',
                      height: '100%',
                      filter: `blur(${result.renderStyle?.blur || 0.6}px) contrast(0.9) saturate(0.85)`, 
                      gap: 0,
                    }}>
                      {(() => {
                        const [intPart, decPart] = result.finalReading.toFixed(3).split('.');
                        const digits = [...intPart.padStart(5, '0').slice(-5).split(''), ',', ...decPart.padEnd(3, '0').slice(0, 3).split('')];
                        const redStartPercent = result.renderStyle?.redStart || 62.5;

                        return digits.map((char: string, idx: number) => {
                          const isComma = char === ',';
                          // Anatomical color split based on redStart percentage
                          const digitPositionPercent = (idx / (digits.length - 1)) * 100;
                          const isRedDomain = digitPositionPercent >= redStartPercent;
                          
                          const jitterAmount = (result.renderStyle?.jitter || 0.12) * 4;
                          const yOffset = isComma ? 0 : (Math.sin(idx * 7) * jitterAmount);
                          const xOffset = isComma ? 0 : (Math.cos(idx * 3) * (jitterAmount / 2));

                          return (
                            <div 
                              key={idx}
                              style={{
                                flex: isComma ? '0.01' : '1', 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                backgroundColor: isComma ? 'transparent' : (isRedDomain ? (result.renderStyle?.red || '#8b1212') : (result.renderStyle?.black || '#111112')),
                                height: '100%',
                                transform: `translate(${xOffset}%, ${yOffset}%)`,
                                overflow: 'hidden',
                                borderRight: isComma ? 'none' : '0.1px solid rgba(0,0,0,0.3)',
                              }}
                            >
                              {!isComma && (
                                <div className="absolute inset-0 z-0">
                                  {/* ENHANCED DRUM CURVATURE */}
                                  <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-black/98 via-black/50 to-transparent z-10" />
                                  <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/98 via-black/50 to-transparent z-10" />
                                  
                                  {/* Grain Sync */}
                                  <div className="absolute inset-0 opacity-[0.25] z-20" style={{ filter: 'url(#analogGrain)', mixBlendMode: 'overlay' }} />
                                </div>
                              )}

                              <span style={{ 
                                fontSize: isComma ? '0' : 'min(3.8vw, 36px)',
                                fontFamily: '"Arial Narrow", sans-serif',
                                fontWeight: '900',
                                color: isComma ? 'transparent' : (result.renderStyle?.ink || '#c8c8c8'),
                                mixBlendMode: 'soft-light', 
                                position: 'relative',
                                zIndex: 40,
                                opacity: 0.8,
                                transform: 'scaleY(1.22) scaleX(0.92)',
                                letterSpacing: '-0.04em',
                                textShadow: isComma ? 'none' : `1.5px 1.5px 3.5px rgba(0,0,0,0.95)`,
                              }}>
                                {char === ',' ? '' : char}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div className="absolute inset-x-[-1.5%] inset-y-[-2.5%] z-[600] shadow-[inset_0_0_30px_rgba(0,0,0,1)] pointer-events-none border border-black/40" />
                    
                    <div 
                        className="absolute inset-0 z-[650] pointer-events-none mix-blend-screen opacity-[0.45]"
                        style={{
                            backgroundImage: `url(${previewUrl})`,
                            backgroundSize: '3333% 1250%',
                            backgroundPosition: `${result.coordinates?.left}% ${result.coordinates?.top}%`,
                            filter: 'contrast(1.6) brightness(0.75) grayscale(1)',
                        }}
                    />
                  </div>
                )}

                {/* Atmospheric Lens Dust Layer */}
                <div className="absolute inset-0 z-[700] pointer-events-none opacity-[0.06] mix-blend-color-dodge" style={{ filter: 'url(#mechanicalISO)' }} />
                
                {/* Global Environmental Light Wrap */}
                <div className="absolute inset-0 z-[800] pointer-events-none bg-gradient-to-tr from-transparent via-white/8 to-transparent opacity-30 mix-blend-overlay" />
                
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 z-[900] text-center">
                   <p className="text-slate-500 text-[8px] uppercase tracking-[1.6em] font-black opacity-30">
                    MCE V4.0 • ANATOMICAL PRECISION ACTIVE
                   </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                 <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-900 shadow-2xl">
                    <p className="text-[11px] font-mono text-indigo-500/80 uppercase tracking-widest mb-3">Precision Logs [V4.0]:</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] text-slate-500 font-mono">
                      <p>DRUM_SPLIT_CALIB: {(result.renderStyle?.redStart || 0).toFixed(1)}%</p>
                      <p>COLOR_SAMPLE: ACTIVE</p>
                      <p>ANATOMY_SYNC: SUCCESS</p>
                      <p>JITTER_Fidelity: HIGH</p>
                      <p>SURFACE_BIND: 100%</p>
                      <p>FUSION: ANATOMICAL</p>
                    </div>
                 </div>
                <button 
                  onClick={downloadImage}
                  className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-2xl transition-all shadow-2xl shadow-emerald-500/40 active:scale-[0.98] border-b-4 border-emerald-800 uppercase"
                >
                  GÖRSELİ PNG OLARAK İNDİR 📥
                </button>
                <button 
                  onClick={() => {setResult(null); setPreviewUrl(null); setSelectedFile(null);}}
                  className="w-full py-2 text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium"
                >
                  ← Yeni İşlem Başlat
                </button>
              </div>
            </div>
          )}

          {/* LOADER */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-md rounded-3xl z-50">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <h3 className="text-2xl font-bold text-white mb-2 italic">MCE Server İşliyor...</h3>
              <p className="text-indigo-400 animate-pulse">Görsel analiz ediliyor ve rakam tamburları düzenleniyor.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

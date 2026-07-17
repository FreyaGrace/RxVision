import { useState } from 'react'
import { GoogleGenAI, Type } from "@google/genai" // 1. Import the SDK

// 2. Initialize with your environment variable
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// `transcription` is the structured prescription object coming back from the
// scan API, shaped roughly like:
// { patient_name, doctor, medications: [{ name, strength, dosage, frequency, duration }] }
// These helpers turn that object into plain text wherever plain text is needed
// (copy/download buttons, prompts sent to Gemini) without changing the shape
// that's stored in state.
function prescriptionToText(prescription) {
  if (!prescription) return ''

  const lines = []

  if (prescription.patient_name) lines.push(`Patient: ${prescription.patient_name}`)
  if (prescription.doctor) lines.push(`Doctor: ${prescription.doctor}`)

  if (Array.isArray(prescription.medications) && prescription.medications.length > 0) {
    lines.push('', 'Medications:')
    prescription.medications.forEach((med, i) => {
      const parts = [med.name, med.strength, med.dosage, med.frequency, med.duration].filter(Boolean)
      lines.push(`${i + 1}. ${parts.join(' — ')}`)
    })
  }

  // Fallback: if the shape doesn't match what we expect, just pretty-print the JSON
  if (lines.length === 0) return JSON.stringify(prescription, null, 2)

  return lines.join('\n')
}

function PrescriptionView({ prescription }) {
  if (!prescription) return null

  return (
    <div className="space-y-4">
      {prescription.patient_name && (
        <div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.85rem' }}>
            Patient
          </h3>
          <p style={{ color: '#1e3a3a', fontSize: '0.9rem' }}>{prescription.patient_name}</p>
        </div>
      )}

      {prescription.doctor && (
        <div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.85rem' }}>
            Doctor
          </h3>
          <p style={{ color: '#1e3a3a', fontSize: '0.9rem' }}>{prescription.doctor}</p>
        </div>
      )}

      {Array.isArray(prescription.medications) && prescription.medications.length > 0 && (
        <div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.85rem' }}>
            Medicines
          </h3>
          <div className="space-y-2 mt-1">
            {prescription.medications.map((med, index) => (
              <div
                key={index}
                className="rounded-lg p-3"
                style={{ background: '#f8fafc', border: '1px solid rgba(13,148,136,0.1)' }}
              >
                <strong style={{ color: '#134e4a' }}>{med.name}</strong>
                {med.strength && <p style={{ fontSize: '0.82rem', color: '#475569' }}>{med.strength}</p>}
                {med.dosage && <p style={{ fontSize: '0.82rem', color: '#475569' }}>{med.dosage}</p>}
                {med.frequency && <p style={{ fontSize: '0.82rem', color: '#475569' }}>{med.frequency}</p>}
                {med.duration && <p style={{ fontSize: '0.82rem', color: '#475569' }}>{med.duration}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Transcription({ scanState, transcription }) {
  const [copied, setCopied] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [pricingEstimate, setPricingEstimate] = useState({ min: 0, max: 0, notes: "" });
  const [mapUrl, setMapUrl] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "assistant", text: "I can answer questions about the medications in your prescription. What would you like to know?" }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    const newUserMsg = { role: "user", text: userMessage };
    setChatHistory(prev => [...prev, newUserMsg]);
    setUserMessage("");
    setIsChatLoading(true);

    try {
      // `transcription` is an object now, so it gets JSON-stringified into the
      // prompt rather than relying on implicit toString() coercion.
      const prompt = `
        Context: The user has this prescription: ${JSON.stringify(transcription)}
        User Question: ${userMessage}
        
        Provide a concise, helpful medical guide response. Stay within the scope of the provided prescription.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      setChatHistory(prev => [...prev, { role: "assistant", text: result.text }]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  function handleCopy() {
    if (!transcription) return
    navigator.clipboard.writeText(prescriptionToText(transcription)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (!transcription) return
    const blob = new Blob([prescriptionToText(transcription)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prescription-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const findNearestPharmacies = () => {
    setLoadingLocation(true)
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    console.log("Accuracy:", accuracy, "meters");

        // 1. Structure a highly explicit prompt for the AI
        const prompt = `
          You are a medical pricing engine specialized in the Philippine drugstore market.
          Analyze this scanned prescription data: ${JSON.stringify(transcription)}
          User coordinates: Latitude ${latitude}, Longitude ${longitude}

          Task:
          1. Identify what every single medicine in the data is for (therapeutic usage).
          2. Calculate the combined absolute minimum cost if the user buys unbranded generics.
          3. Calculate the combined maximum cost if the user buys premium brand-name equivalents.
          4. Write a brief explanation summarizing what the drugs are for, and why brand choice creates a price gap.
        `

        try {
          // 2. Call the free-tier Gemini 2.5 Flash model
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
              // Force the AI to output structural data instead of free-flowing text
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  estimatedMinCost: { type: Type.NUMBER },
                  estimatedMaxCost: { type: Type.NUMBER },
                  aiExplanation: { type: Type.STRING }
                },
                required: ["estimatedMinCost", "estimatedMaxCost", "aiExplanation"],
              }
            }
          })

          // 3. Parse the clean JSON object directly 
          const data = JSON.parse(response.text)

          // 4. Feed the live AI data straight into your UI states
          setPricingEstimate({
            min: data.estimatedMinCost,
            max: data.estimatedMaxCost,
            notes: data.aiExplanation // This now automatically lists what the medicines are for!
          })

          // (Optional mock fallback for pharmacy markers if you don't use a Google Maps Places API)
          setMapUrl(
  `https://www.google.com/maps?q=pharmacy+near+${latitude},${longitude}&output=embed`
);

        } catch (error) {
          console.error("Gemini live execution failed:", error)
          alert("Could not process prescription pricing via Gemini.")
        } finally {
          setLoadingLocation(false)
        }
      },
      () => {
        alert("Unable to retrieve your physical location coordinates")
        setLoadingLocation(false)
      },
       (error) => {
    console.error(error);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
    )
  }

  const isLoading = scanState === 'scanning'

  return (
    <>
      <section
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(13,148,136,0.15)',
          boxShadow: '0 1px 12px rgba(13,148,136,0.07)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(13,148,136,0.1)', background: 'rgba(240,250,248,0.7)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(13,148,136,0.1)' }}
            >
              {isLoading ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              )}
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.95rem' }}>
              Result Transcription
            </span>
            {!isLoading && transcription && (
              <span
                className="text-xs px-2 py-0.5 rounded-full ml-1"
                style={{ background: '#dcfce7', color: '#166534', fontFamily: "'DM Mono', monospace" }}
              >
                ✓ Ready
              </span>
            )}
          </div>

          {/* Action buttons */}
          {!isLoading && transcription && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150"
                style={{
                  background: copied ? '#dcfce7' : 'rgba(13,148,136,0.08)',
                  color: copied ? '#166534' : '#0d9488',
                  border: `1px solid ${copied ? '#bbf7d0' : 'rgba(13,148,136,0.2)'}`,
                }}
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy text
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150"
                style={{
                  background: 'rgba(13,148,136,0.08)',
                  color: '#0d9488',
                  border: '1px solid rgba(13,148,136,0.2)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download .txt
              </button>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[100, 85, 92, 70, 88, 75, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-3.5 rounded-full"
                  style={{
                    width: `${w}%`,
                    background: 'linear-gradient(90deg, rgba(13,148,136,0.08) 25%, rgba(13,148,136,0.15) 50%, rgba(13,148,136,0.08) 75%)',
                    backgroundSize: '200% 100%',
                    animation: `shimmer 1.4s ease-in-out infinite ${i * 0.1}s`,
                  }}
                />
              ))}
              <style>{`
                @keyframes shimmer {
                  0% { background-position: 200% 0; }
                  100% { background-position: -200% 0; }
                }
              `}</style>
            </div>
          ) : (
            <div
              className="rounded-xl p-4"
              style={{
                background: '#f8fafc',
                border: '1px solid rgba(13,148,136,0.1)',
                maxHeight: '420px',
                overflow: 'auto',
              }}
            >
              <PrescriptionView prescription={transcription} />
            </div>
          )}

          {!isLoading && transcription && (
            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(13,148,136,0.08)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ fontSize: '0.73rem', color: '#9ca3af' }}>
                AI transcription may contain errors. Always verify against the original prescription.
              </p>
              <button
                onClick={() => setIsPanelOpen(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150"
                style={{
                  background: 'linear-gradient(135deg, #134e4a, #0d9488)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 1px 4px rgba(13,148,136,0.3)',
                }}
              >
                Find Pharmacy & Prices
              </button>
            </div>
          )}
        </div>
      </section>

      {/* --- SIDE PANEL --- */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(19,78,74,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsPanelOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .animate-slide-in { animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>

            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100" style={{ background: '#f0faf8' }}>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#134e4a', fontSize: '1.1rem' }}>
                  Rx Assistant & Insights
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Fulfillment options & pricing estimates</p>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Box 1: Estimates */}
              <div className="p-4 rounded-xl border border-emerald-100 space-y-2" style={{ background: '#f0faf8' }}>
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <span>💰</span> Cost Estimate (PH Retail Context)
                </div>
                <div>
                  {/* Dynamic Display */}
                  <div className="text-2xl font-bold text-teal-950">
                    {pricingEstimate.min > 0 ? `₱${pricingEstimate.min} - ₱${pricingEstimate.max}` : "Calculating..."}
                  </div>
                  <p className="text-xs text-teal-700/80 mt-1 leading-relaxed">
                    {pricingEstimate.notes || "Based on detected items. Actual totals depend on generic vs. branded selections."}
                  </p>
                </div>
              </div>

              {/* Box 2: Nearby */}
              <div className="space-y-3">
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.9rem' }}>
                  📍 Nearby Pharmacy Fulfillment
                </h4>

           {!mapUrl ? (
  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
    <p className="text-xs text-slate-500 mb-3">
      Find pharmacies near your location.
    </p>

    <button
      onClick={findNearestPharmacies}
      disabled={loadingLocation}
      className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
      style={{ background: "#0d9488" }}
    >
      {loadingLocation ? "Loading..." : "📍 Find Nearby Pharmacies"}
    </button>
  </div>
) : (
  <iframe
    title="Nearby Pharmacies"
    width="100%"
    height="350"
    loading="lazy"
    style={{
      border: 0,
      borderRadius: "12px"
    }}
    src={mapUrl}
  />
)}
</div>

              {/* Box 3: Chat */}
              <div className="space-y-3">
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.9rem' }}>
                  🤖 Medical Guide Assistant
                </h4>
                <div className="border border-slate-150 rounded-xl overflow-hidden text-xs bg-slate-50">
                  <div className="p-3 bg-white border-b border-slate-150 space-y-2.5 h-64 overflow-y-auto">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`p-2.5 rounded-lg ${msg.role === 'user' ? 'bg-slate-100 text-slate-700 max-w-[85%] ml-auto' : 'bg-[#e6f7f4] text-teal-950 max-w-[90%]'}`}>
                        {msg.text}
                      </div>
                    ))}
                    {isChatLoading && <div className="text-[10px] text-slate-400 italic">Thinking...</div>}
                  </div>

                  <div className="p-2 bg-white flex items-center gap-2">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="Ask about side-effects, interactions..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isChatLoading}
                      className="p-1.5 rounded-lg bg-teal-800 text-white font-bold text-xs"
                    >
                      ➔
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
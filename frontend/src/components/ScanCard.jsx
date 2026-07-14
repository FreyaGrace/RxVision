import { useRef, useState, useEffect } from 'react'
import { Camera, UploadCloud, RotateCcw, Check, Scan } from 'lucide-react'

export default function ScanCard({ scanState, imagePreview, setImagePreview, setScanState, setTranscription }) {
  const inputRef = useRef(null)
  const cameraRef = useRef(null)
  const activeFileRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setCameraOpen(true)
    } catch (err) {
      console.error(err)
      alert('Unable to access camera.')
    }
  }

  function capturePhoto() {
    const video = videoRef.current

    const canvas = document.createElement('canvas')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')

    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      const file = new File([blob], 'camera-photo.jpg', {
        type: 'image/jpeg',
      })

      activeFileRef.current = file

      const preview = URL.createObjectURL(file)

      setImagePreview(preview)
      setScanState('preview')

      stopCamera()
    }, 'image/jpeg')
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    setCameraOpen(false)
  }

  function processFile(file) {
    if (!file) return
    activeFileRef.current = file

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result)
      setScanState('preview')
    }
    reader.readAsDataURL(file)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  async function startScan() {
    if (!activeFileRef.current) return

    setScanState('scanning')
    // Clear any previous structured result while the new scan is in flight
    setTranscription(null)

    const formData = new FormData()
    formData.append('file', activeFileRef.current)

    try {
      const response = await fetch('https://rxvision.onrender.com/scan', {
        method: 'POST',
        body: formData,
      })
      console.log('Status:', response.status)

      if (!response.ok) {
        throw new Error(`Scan request failed with status ${response.status}`)
      }

      const data = await response.json()

      console.log(data)

      // `transcription` now holds the structured prescription object returned
      // by the API (patient_name, doctor, medications, etc.), not raw text.
      setTranscription(data.structured)
      setScanState('done')
    } catch (err) {
      console.error(err)
      setScanState('preview')
    }
  }

  function reset() {
    setImagePreview(null)
    setScanState('idle')
    setTranscription(null)
    activeFileRef.current = null
    if (inputRef.current) inputRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const showUpload = scanState === 'idle'
  const showPreview = imagePreview !== null

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(13,148,136,0.15)',
        boxShadow: '0 1px 12px rgba(13,148,136,0.07)',
      }}
    >
      {/* Section header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(13,148,136,0.1)', background: 'rgba(240,250,248,0.7)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(13,148,136,0.1)' }}
          >
            <Camera size={16} color="#0d9488" strokeWidth={2.2} />
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.95rem' }}>
            Scan Prescription
          </span>
        </div>
        {showPreview && (
          <button
            onClick={reset}
            className="text-xs px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
            style={{ color: '#0d9488', border: '1px solid rgba(13,148,136,0.3)', background: 'transparent' }}
          >
            <RotateCcw size={12} />
            Start over
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">

        {/* Step 1 — upload/camera */}
        {showUpload && (
          <>
            <div>
              <StepLabel n={1} label="Take or upload a photo" />
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => inputRef.current?.click()}
                className="relative rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 py-10 px-6 mt-3"
                style={{ border: '2px dashed rgba(13,148,136,0.3)', background: 'rgba(240,250,248,0.5)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(13,148,136,0.6)'
                  e.currentTarget.style.background = 'rgba(240,250,248,0.9)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(13,148,136,0.3)'
                  e.currentTarget.style.background = 'rgba(240,250,248,0.5)'
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(13,148,136,0.1)' }}
                >
                  <UploadCloud size={28} color="#0d9488" strokeWidth={1.8} />
                </div>
                <div className="text-center">
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.95rem' }}>
                    Drop prescription image here
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '3px' }}>
                    or click to browse — JPG, PNG, HEIC accepted
                  </p>
                </div>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <div className="flex items-center gap-3 my-4">
                <div style={{ flex: 1, height: '1px', background: 'rgba(13,148,136,0.12)' }} />
                <span style={{ color: '#9ca3af', fontSize: '0.78rem', fontStyle: 'italic' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(13,148,136,0.12)' }} />
              </div>

              <button
                onClick={openCamera}
                className="w-full flex items-center justify-center gap-3 rounded-xl py-3.5 font-medium transition-all duration-150"
                style={{
                  background: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)',
                  color: 'white',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(13,148,136,0.25)',
                  border: 'none',
                }}
              >
                <Camera size={18} />
                Take Photo with Camera
              </button>

              {cameraOpen && (
                <div className="mt-5 space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-xl border"
                  />

                  <button
                    onClick={capturePhoto}
                    className="w-full bg-teal-600 text-white rounded-xl py-3"
                  >
                    📸 Capture Photo
                  </button>
                </div>
              )}

              <p className="text-center mt-3" style={{ fontSize: '0.73rem', color: '#9ca3af' }}>
                Images are processed locally and not stored on any server
              </p>
            </div>
          </>
        )}

        {/* Step 2 — preview */}
        {showPreview && (
          <div>
            <StepLabel n={2} label="Check the preview" done={scanState !== 'preview'} />
            <div
              className="mt-3 rounded-xl overflow-hidden relative"
              style={{ border: '1px solid rgba(13,148,136,0.18)', background: '#f8fafc' }}
            >
              <img
                src={imagePreview}
                alt="Prescription preview"
                className="w-full object-contain max-h-72"
              />
              {scanState === 'scanning' && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(19,78,74,0.82)', backdropFilter: 'blur(2px)' }}
                >
                  <ScanAnimation />
                  <p style={{ color: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '1rem' }}>
                    Reading prescription…
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                    AI is extracting and transcribing text
                  </p>
                </div>
              )}
              {scanState === 'done' && (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}
                >
                  <Check size={12} strokeWidth={3} />
                  Done
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Read Prescription button */}
        {scanState === 'preview' && (
          <div>
            <StepLabel n={3} label="Read Prescription" />
            <button
              onClick={startScan}
              className="mt-3 w-full flex items-center justify-center gap-3 rounded-xl py-4 font-bold transition-all duration-150"
              style={{
                background: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)',
                color: 'white',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
                border: 'none',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(13,148,136,0.38)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(13,148,136,0.3)' }}
            >
              <Scan size={18} />
              Read Prescription
            </button>
          </div>
        )}

        {/* Step label for done state */}
        {scanState === 'done' && (
          <div className="flex items-center gap-2 pt-1">
            <StepLabel n={3} label="Prescription read successfully" done />
          </div>
        )}

      </div>
    </section>
  )
}

function StepLabel({ n, label, done }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: done ? '#dcfce7' : 'rgba(13,148,136,0.12)',
          color: done ? '#166534' : '#0d9488',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {done ? <Check size={12} strokeWidth={3} /> : n}
      </div>

      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: '#134e4a', fontSize: '0.88rem' }}>
        {label}
      </span>
    </div>
  )
}

function ScanAnimation() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: 'rgba(20,184,166,0.3)',
          borderTopColor: '#14b8a6',
          animation: 'spin 1s linear infinite',
        }}
      />
      <Scan size={22} color="white" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
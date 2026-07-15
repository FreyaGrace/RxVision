import { useState } from 'react'
import { Coffee, QrCode } from 'lucide-react'
import gcashQR from '../assets/images/gcash.jpg'


export default function Donation() {
  const [method, setMethod] = useState('kofi') // Changed default to 'kofi'
 
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 60%, #0d9488 100%)',
        border: '1px solid rgba(20,184,166,0.2)',
        boxShadow: '0 2px 16px rgba(13,148,136,0.15)',
      }}
    >
      <div className="px-6 py-7 flex flex-col items-center text-center gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          {method === 'kofi' ? <Coffee size={28} color="#FF5E5B" /> : <QrCode size={28} color="#007DFE" />}
        </div>

        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: 'white', fontSize: '1.2rem', lineHeight: 1.3 }}>
            RxVision is free to use
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '6px' }}>
            Support the server upkeep with a coffee!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-xl w-full max-w-xs" style={{ background: 'rgba(0,0,0,0.15)' }}>
          <button
            onClick={() => setMethod('kofi')}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{ background: method === 'kofi' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'white' }}
          >
            ☕ Ko-fi
          </button>
          <button
            onClick={() => setMethod('gcash')}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{ background: method === 'gcash' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'white' }}
          >
            🔵 GCash
          </button>
        </div>

        {/* --- KO-FI UI --- */}
        {method === 'kofi' && (
          <>
            <div className="flex items-center gap-2 w-full">
              <iframe 
                id='kofiframe' 
                src='https://ko-fi.com/freyagrace/?hidefeed=true&widget=true&embed=true&preview=true' 
                style={{ border: 'none', width: '100%', padding: '4px', background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 60%, #0d9488 100%)' }} 
                height='712' 
                title='freyagrace'
              />
            </div>
          </>
        )}

        {/* --- GCASH UI --- */}
        {method === 'gcash' && (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-white rounded-xl" style={{ border: '3px solid #007DFE' }}>
              <img src={gcashQR} alt="GCash QR" className="w-32 h-32 object-contain" />
            </div>
            <p style={{ color: 'white', fontSize: '0.8rem' }}>Scan via GCash App</p>
          </div>
        )}
      </div>
    </section>
  )
}
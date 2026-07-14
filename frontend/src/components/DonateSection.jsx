import { useState } from 'react'
import { Coffee, QrCode, Check } from 'lucide-react'
import gcashQR from '../assets/images/gcash.jpg'

const AMOUNTS = [3, 5, 10]

export default function Donation() {
  const [method, setMethod] = useState('bmc') // 'bmc' or 'gcash'
  const [selected, setSelected] = useState(5)
  const [donated, setDonated] = useState(false)

  function handleDonate() {
    if (method === 'bmc') {
      // Opens your Buy Me a Coffee page
      window.open(`https://www.buymeacoffee.com/yourusername`, '_blank', 'noopener,noreferrer')
      setDonated(true)
      setTimeout(() => setDonated(false), 4000)
    }
  }

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
        {/* Header Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          {method === 'bmc' ? <Coffee size={28} color="#FFDD00" /> : <QrCode size={28} color="#007DFE" />}
        </div>

        <div>
          <h2
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: 'white', fontSize: '1.2rem', lineHeight: 1.3 }}
          >
            RxScan AI is free to use
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '6px', maxWidth: '360px', margin: '6px auto 0' }}>
            If this tool saved you time, consider supporting its upkeep. Every contribution keeps this server online!
          </p>
        </div>

        {/* Payment Method Selector Tabs */}
        <div 
          className="flex p-1 rounded-xl w-full max-w-xs" 
          style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={() => setMethod('bmc')}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
            style={{
              background: method === 'bmc' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: 'white',
              border: 'none',
            }}
          >
            ☕ Buy Me a Coffee
          </button>
          <button
            onClick={() => setMethod('gcash')}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
            style={{
              background: method === 'gcash' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: 'white',
              border: 'none',
            }}
          >
            🔵 GCash Pay
          </button>
        </div>

        {/* --- BUY ME A COFFEE UI --- */}
        {method === 'bmc' && (
          <>
            {/* Amount selector */}
            <div className="flex items-center gap-2">
              {AMOUNTS.map(amount => (
                <button
                  key={amount}
                  onClick={() => setSelected(amount)}
                  className="px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-150"
                  style={{
                    background: selected === amount ? 'white' : 'rgba(255,255,255,0.12)',
                    color: selected === amount ? '#134e4a' : 'rgba(255,255,255,0.85)',
                    border: `1.5px solid ${selected === amount ? 'white' : 'rgba(255,255,255,0.2)'}`,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* CTA button */}
            <button
              onClick={handleDonate}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200"
              style={{
                background: donated ? '#dcfce7' : '#FFDD00',
                color: donated ? '#166534' : '#1a1a1a',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.95rem',
                fontWeight: 700,
                border: 'none',
                boxShadow: donated ? 'none' : '0 3px 10px rgba(0,0,0,0.2)',
                transform: donated ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              {donated ? (
                <>
                  <Check size={16} strokeWidth={3} />
                  Thank you so much! ♥
                </>
              ) : (
                <>
                  ☕ Buy me a coffee · ${selected}
                </>
              )}
            </button>

            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
              Secure checkout via Buy Me a Coffee · Cards & PayPal accepted
            </p>
          </>
        )}

        {/* --- GCASH UI --- */}
        {method === 'gcash' && (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Replace this placeholder with your actual GCash QR Code image asset */}
            <div 
              className="p-3 bg-white rounded-2xl shadow-inner relative group"
              style={{ border: '4px solid #007DFE' }}
            >
              <div className="w-40 h-40 bg-slate-100 flex flex-col items-center justify-center rounded-lg text-slate-400 text-xs">
               <img
  src={gcashQR}
  alt="GCash QR Code"
  className="w-full h-full object-contain"
/>
              </div>
            </div>

            <div className="text-center">
              <p style={{ color: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.9rem' }}>
                Scan to pay via GCash
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '2px' }}>
                Scan this QR code using your GCash app to send any amount.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
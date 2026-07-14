import { useState } from 'react'; // <-- Fixed: Added the React state hook import
import Header from "./components/Header";
import ScanCard from "./components/ScanCard"; // Ensure this references your fixed Scanner code file!
import DonateSection from "./components/DonateSection"; // <-- Fixed: Added the DonateSection import
import Transcription from "./components/ResultSection"; // <-- Fixed: Added the Transcription import
function App() {
  const [scanState, setScanState] = useState('idle') // 'idle' | 'preview' | 'scanning' | 'done'
  const [imagePreview, setImagePreview] = useState(null)
  const [transcription, setTranscription] = useState('')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0faf8', fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      
      <main className="max-w-xl mx-auto px-4 py-8">
        <ScanCard 
          scanState={scanState}
          setScanState={setScanState}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          setTranscription={setTranscription}
        />

        {/* Transcription output displayed under scanner once processed */}
        {scanState === 'done' && transcription && (
          <Transcription transcription={transcription} />
        )}
        <div className="my-8" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}></div>
        <DonateSection style={{}} /> {/* <-- Fixed: Added the DonateSection component */}
      </main>
    </div>
  );
}

export default App;
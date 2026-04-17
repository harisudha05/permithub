import { useMemo, useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { securityApi } from '../../api'
import { PageWrapper } from '../../components/common'
import { QrCode, Camera, UploadCloud, Keyboard, X } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

function playSuccessFeedback() {
  try {
    if (navigator.vibrate) navigator.vibrate([80, 50, 80])
  } catch (e) {}

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    g.gain.value = 0.05
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    setTimeout(() => {
      o.stop()
      ctx.close && ctx.close()
    }, 150)
  } catch (e) {}
}

export default function SecurityScan() {
  const [activeTab, setActiveTab] = useState('camera') // 'camera', 'upload', 'manual'
  const [qrInput, setQrInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const html5QrCodeRef = useRef(null)

  const isQrValid = useMemo(() => {
    const v = (qrInput || '').trim()
    if (!v) return false
    return /^\d+$/.test(v) || v.startsWith('PERMITHUB:OUTPASS:')
  }, [qrInput])

  const processScanData = async (data) => {
    const val = data.trim()
    if (!val) { toast.error('Empty QR data'); return }
    const isValid = /^\d+$/.test(val) || val.startsWith('PERMITHUB:OUTPASS:')
    if (!isValid) { toast.error('Invalid QR payload'); return }
    setLoading(true)
    try {
      const r = await securityApi.scan(val)
      const payload = r?.data?.data ?? r?.data
      setResult(payload)
      toast.success(`${payload?.scanType === 'EXIT' ? 'Exit' : 'Entry'} recorded!`)
      playSuccessFeedback()
      setQrInput('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid QR code')
      setResult(null)
    } finally { setLoading(false) }
  }

  const handleManualScan = () => {
    if (!qrInput.trim()) { toast.error('Enter QR data'); return }
    processScanData(qrInput)
  }

  // Handle Camera scanning
  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCamera()
      return
    }
  }, [activeTab])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        stopCamera()
        if (html5QrCodeRef.current) {
            try { html5QrCodeRef.current.clear() } catch(e){}
        }
    }
  }, [])

  const startCamera = async () => {
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader")
      }
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopCamera()
          processScanData(decodedText)
        },
        (errorMessage) => {
          // ignore background errors
        }
      )
      setIsScanning(true)
    } catch (err) {
      console.error(err)
      toast.error("Failed to start camera. Check permissions.")
    }
  }

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop()
        setIsScanning(false)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader")
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, true)
      processScanData(decodedText)
    } catch (err) {
      toast.error("No valid QR code found in the image")
    }
    e.target.value = '' // reset
  }

  return (
    <PageWrapper title="QR Gate Scanner" subtitle="Scan student outpass QR code for exit/entry">
      <div className="max-w-md">
        
        {/* Tabs */}
        <div className="flex bg-white rounded-lg p-1 border shadow-sm mb-4">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'camera' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <Camera size={16} /> Camera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <UploadCloud size={16} /> Upload
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'manual' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <Keyboard size={16} /> Manual
          </button>
        </div>

        <div className="card mb-4 min-h-[300px]">
          {/* We always need the #reader div mounted for html5-qrcode */}
          <div id="reader" className={activeTab === 'manual' ? 'hidden' : 'mb-4 overflow-hidden rounded-lg'} />

          {activeTab === 'camera' && (
            <div className="flex flex-col items-center justify-center flex-1 h-full min-h-[200px] text-center">
              {!isScanning ? (
                <>
                  <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-3">
                    <Camera size={28} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Live Camera Scan</h3>
                  <p className="text-xs text-gray-500 mb-4 max-w-xs">Scan the QR code shown on the student's dashboard.</p>
                  <button onClick={startCamera} className="btn-primary" disabled={loading}>
                    Start Camera
                  </button>
                </>
              ) : (
                <button onClick={stopCamera} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50" disabled={loading}>
                  <X size={16} className="mr-1" /> Stop Scanning
                </button>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center flex-1 h-full min-h-[200px] text-center border-2 border-dashed border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
              <UploadCloud size={32} className="text-gray-400 mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Upload QR Image</h3>
              <p className="text-xs text-gray-500 mb-4">Select an image file containing a valid permithub QR code.</p>
              <label className="btn-primary cursor-pointer disabled:opacity-50">
                Choose Image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={loading} />
              </label>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <QrCode size={18} className="text-primary-300" />
                <span className="text-sm font-medium text-gray-800">Manual Entry</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">For damaged QR codes, manually type the outpass ID or the full QR text payload.</p>
              <textarea
                className={`input font-mono text-xs mb-3 ${qrInput && !isQrValid ? 'border-red-300 focus:border-red-300' : ''}`}
                rows={3}
                placeholder="e.g. 152 or PERMITHUB:OUTPASS:152"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleManualScan())}
              />
              {qrInput && !isQrValid && (
                <div className="text-[11px] text-red-600 mb-3">QR payload must be numeric or start with \`PERMITHUB:OUTPASS:\`</div>
              )}
              <button onClick={handleManualScan} disabled={loading || !qrInput.trim() || !isQrValid} className="btn-primary mt-auto w-full justify-center">
                {loading ? 'Processing...' : 'Record Scan'}
              </button>
            </div>
          )}
        </div>

        {loading && (
           <div className="text-center text-xs text-gray-500 mb-4 animate-pulse">Processing...</div>
        )}

        {result && (
          <div className={`card border-2 ${result.isLate ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">{result.scanType === 'EXIT' ? '🚶 Exit Recorded' : '🏠 Entry Recorded'}</span>
              {result.isLate && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">LATE by {result.lateMinutes} min</span>}
            </div>
            <dl className="space-y-2 text-xs">
              {[
                ['Student', result.studentName],
                ['Reg No.', result.registerNumber],
                ['Department', result.department],
                ['Destination', result.destination],
                ['Expected Return', result.returnDatetime ? new Date(result.returnDatetime).toLocaleString() : '—'],
                ['Scan Time', new Date(result.scanTime).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

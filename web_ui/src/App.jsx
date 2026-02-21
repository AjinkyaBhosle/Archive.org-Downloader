import { useState, useEffect, useRef } from 'react'

function App() {
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('ajinkyaab1991@gmail.com')
  const [password, setPassword] = useState('Shrija@123')
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, completed, failed
  const [logs, setLogs] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const logEndRef = useRef(null)

  useEffect(() => {
    let interval;
    if (status === 'loading' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/status/${jobId}`)
          if (res.ok) {
            const data = await res.json()
            setLogs(data.output || '')
            if (data.status === 'completed') {
              setStatus('completed')
              setFileUrl(`http://127.0.0.1:8000/api/files/${data.file}`)
              clearInterval(interval)
            } else if (data.status === 'failed') {
              setStatus('failed')
              clearInterval(interval)
            }
          }
        } catch (err) {
          console.error("Failed to fetch status", err)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [status, jobId])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url || !email || !password) return
    setStatus('loading')
    setLogs('Starting download process...')
    setJobId('')
    setFileUrl('')

    try {
      const res = await fetch('http://127.0.0.1:8000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email, password })
      })
      if (res.ok) {
        const data = await res.json()
        setJobId(data.job_id)
      } else {
        setStatus('failed')
        setLogs('Failed to connect to the backend API.')
      }
    } catch (err) {
      setStatus('failed')
      setLogs('Network error. Is the backend running?')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 py-12 sm:p-12 font-sans relative overflow-x-hidden overflow-y-auto w-full">
      {/* Decorative Blob Backgrounds */}
      <div className="absolute top-0 left-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-96 h-96 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-2xl relative z-10 glass-panel rounded-3xl p-8 sm:p-12 transition-all duration-500 my-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 tracking-tight">
            Archive.org Downloader
          </h1>
          <p className="text-slate-400 mt-3 text-sm font-medium">Download full books directly from your browser.</p>
        </div>

        <div className="min-h-[450px] flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Archive.org Book URL</label>
              <input
                type="url"
                required
                placeholder="https://archive.org/details/..."
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/25 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </span>
              ) : (
                <span>Start Download</span>
              )}
            </button>
          </form>

          {(status === 'loading' || status === 'completed' || status === 'failed') ? (
            <div className="mt-8 flex-shrink-0 animate-fade-in">
              <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-400 h-48 overflow-y-auto shadow-inner">
                <pre className="whitespace-pre-wrap">{logs || 'Waiting for script to initialize...'}</pre>
                <div ref={logEndRef} />
              </div>

              {status === 'completed' && fileUrl && (
                <a
                  href={fileUrl}
                  download
                  className="mt-6 flex items-center justify-center w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400/50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download PDF Ready
                </a>
              )}

              {status === 'failed' && (
                <div className="mt-6 text-rose-400 border border-rose-500/30 bg-rose-500/10 p-4 rounded-xl text-sm font-medium text-center">
                  The download process failed. Please check your credentials, the URL, and the logs above.
                </div>
              )}

              {(status === 'completed' || status === 'failed') && (
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle')
                    setLogs('')
                    setUrl('')
                    setFileUrl('')
                    setJobId('')
                  }}
                  className="mt-4 flex items-center justify-center w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700"
                >
                  Clear Log & Start New Download
                </button>
              )}
            </div>
          ) : (
            <div className="mt-8 flex-shrink-0 h-[264px]"></div> // Placeholder spacer when idle to prevent jumping
          )}
        </div>
      </div>
    </div>
  )
}

export default App

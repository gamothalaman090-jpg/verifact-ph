import { useState } from 'react';
import HeroScanner from './components/HeroScanner';

function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: url })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: 'Failed to connect to backend' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <HeroScanner />
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="font-serif text-4xl mb-6">Investigate a URL or Text</h2>
        
        <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
          <textarea 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste text or a URL here..."
            className="w-full bg-transparent border border-gray-700 p-4 font-mono text-newsprint-white focus:outline-none focus:border-highlighter-yellow transition-colors"
            rows="5"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-highlighter-yellow text-ink-black font-mono font-bold py-3 px-8 self-start hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Analyzing...' : 'Run Fact Check'}
          </button>
        </form>

        {result && (
          <div className="mt-12 p-8 border border-gray-800 bg-[#141e33]">
            <h3 className="font-serif text-2xl mb-4 text-highlighter-yellow">Analysis Complete</h3>
            {result.error ? (
              <p className="font-mono text-red-400">{result.error}</p>
            ) : (
              <div className="space-y-4 font-mono">
                <div>
                  <span className="text-gray-400 block mb-1">Model Prediction</span>
                  <p className="text-xl capitalize">{result.prediction}</p>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Confidence Score</span>
                  <div className="w-full bg-gray-800 h-2 mt-2">
                    <div 
                      className="bg-highlighter-yellow h-full" 
                      style={{ width: `${(result.confidence * 100).toFixed(2)}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Context / Fact Check Result</span>
                  <p className="text-sm border-l-2 border-highlighter-yellow pl-4 mt-2">
                    {result.fact_check_context?.length > 0 
                      ? result.fact_check_context[0].text 
                      : "No external context flagged by Google Fact Check API."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

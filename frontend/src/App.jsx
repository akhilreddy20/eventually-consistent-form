import { useState } from 'react';
import { SubmissionForm } from './components/SubmissionForm';
import { SubmissionsList } from './components/SubmissionsList';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const submitWithRetry = async (formData, idempotencyKey, attempt = 1, maxAttempts = 5) => {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts}`);
      
      const response = await fetch(`${API_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          idempotencyKey,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Submission successful:', result);
        return result;
      }

      if (response.status === 503 && attempt < maxAttempts) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ 503 received. Retrying in ${backoffDelay}ms...`);
        setRetryCount(attempt);
        await sleep(backoffDelay);
        return submitWithRetry(formData, idempotencyKey, attempt + 1, maxAttempts);
      }

      throw new Error(`Submission failed with status ${response.status}`);

    } catch (error) {
      if (attempt < maxAttempts) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ Network error. Retrying in ${backoffDelay}ms...`);
        setRetryCount(attempt);
        await sleep(backoffDelay);
        return submitWithRetry(formData, idempotencyKey, attempt + 1, maxAttempts);
      }
      throw error;
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setStatus('submitting');
    setRetryCount(0);

    const idempotencyKey = `${formData.email}-${formData.amount}-${Date.now()}`;
    
    try {
      const result = await submitWithRetry(formData, idempotencyKey);
      
      setStatus('success');
      setRetryCount(0);
      
      setSubmissions(prev => {
        const exists = prev.some(s => s.id === result.id);
        if (exists) return prev;
        return [result, ...prev];
      });
      
    } catch (error) {
      console.error('❌ Submission failed after all retries:', error);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setStatus('');
        setRetryCount(0);
      }, 3000);
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await fetch(`${API_URL}/submissions`);
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🔄 Eventually Consistent Form
          </h1>
          <p className="text-slate-600 text-lg">
            Demonstrating resilient form submissions with retry logic
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <SubmissionForm 
              onSubmit={handleSubmit}
              disabled={isSubmitting}
              status={status}
            />
            
            {/* Status Messages */}
            {isSubmitting && retryCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="animate-spin h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-yellow-800 font-medium">
                    🔄 Retrying... (Attempt {retryCount}/5)
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Service temporarily unavailable. Retrying automatically...
                  </p>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-green-800 font-medium">✅ Submission successful!</p>
                  <p className="text-green-700 text-sm mt-1">Your data has been saved.</p>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-red-800 font-medium">❌ Submission failed</p>
                  <p className="text-red-700 text-sm mt-1">
                    Failed after 5 attempts. Please try again later.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Submissions List */}
          <div>
            <SubmissionsList 
              submissions={submissions} 
              loading={false} 
              error={null} 
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
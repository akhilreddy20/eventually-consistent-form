const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001' ;


const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
};


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const getBackoffDelay = (attemptNumber) => {
  return RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptNumber - 1);
};


export const submitForm = async (data, idempotencyKey, onRetry) => {
  let lastError = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          idempotencyKey,
        }),
      });

      
      if (response.ok) {
        const submission = await response.json();
        return submission;
      }

      
      if (response.status === 503 || response.status === 409) {
        lastError = new Error(`Service temporarily unavailable (attempt ${attempt}/${RETRY_CONFIG.maxAttempts})`);
        
        
        if (attempt < RETRY_CONFIG.maxAttempts) {
          if (onRetry) onRetry(attempt, RETRY_CONFIG.maxAttempts);
          const delay = getBackoffDelay(attempt);
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts})`);
          await sleep(delay);
          continue;
        }
      }

      
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} - ${errorText}`);

    } catch (error) {
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new Error('Network error - please check your connection');
        
        
        if (attempt < RETRY_CONFIG.maxAttempts) {
          if (onRetry) onRetry(attempt, RETRY_CONFIG.maxAttempts);
          const delay = getBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }
      } else {
        throw error;
      }
    }
  }


  throw lastError || new Error('Request failed after maximum retries');
};


export const fetchSubmissions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/submissions`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch submissions');
  }
  
  return response.json();
};


export const clearSubmissions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/submissions/clear`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to clear submissions');
  }
};
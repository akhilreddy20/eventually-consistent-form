import { useState } from 'react';
import { submitForm } from '../services/api';
import { generateIdempotencyKey } from '../utils/idempotency';


export const useSubmission = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const maxRetries = 3;

  const submit = async (data) => {
    
    const idempotencyKey = generateIdempotencyKey();
    
    
    setError(null);
    setRetryAttempt(0);
    setStatus('pending');

    try {
      
      const submission = await submitForm(
        data,
        idempotencyKey,
        (attempt, max) => {
          setRetryAttempt(attempt);
          setStatus('retrying');
        }
      );

      
      setStatus('success');
      setCurrentSubmission(submission);
      
    } catch (err) {
      
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    setCurrentSubmission(null);
    setRetryAttempt(0);
  };

  return {
    status,
    error,
    currentSubmission,
    retryAttempt,
    maxRetries,
    submit,
    reset,
  };
};
import { useRef, useState } from 'react';
import { submitForm } from '../services/api';
import { generateIdempotencyKey } from '../utils/idempotency';


export const useSubmission = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const maxRetries = 3;
  const inFlight = useRef(false);

  const submit = async (data) => {
    // Ignore double-clicks while a submission is already in flight;
    // otherwise each click would mint a new key and create a duplicate.
    if (inFlight.current) return;
    inFlight.current = true;

    // One key per logical submission; every retry below reuses it.
    const idempotencyKey = generateIdempotencyKey();

    setError(null);
    setRetryAttempt(0);
    setStatus('pending');

    try {
      const submission = await submitForm(
        data,
        idempotencyKey,
        (attempt) => {
          setRetryAttempt(attempt);
          setStatus('retrying');
        }
      );

      setStatus('success');
      setCurrentSubmission(submission);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      inFlight.current = false;
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
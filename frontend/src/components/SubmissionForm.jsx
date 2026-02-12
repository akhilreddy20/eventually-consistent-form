import { useState } from 'react';
import { isValidEmail, isValidAmount } from '../utils/idempotency';

export const SubmissionForm = ({ onSubmit, disabled, status }) => {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (!isValidAmount(parseFloat(amount))) {
      newErrors.amount = 'Please enter a valid positive number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      email: email.trim(),
      amount: parseFloat(amount),
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Submit Form</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
            placeholder="your@email.com"
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              errors.email 
                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed`}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Amount Field */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-slate-500 font-medium">$</span>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={disabled}
              placeholder="100.00"
              className={`w-full pl-8 pr-4 py-3 rounded-lg border transition-colors ${
                errors.amount 
                  ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                  : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed`}
            />
          </div>
          {errors.amount && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.amount}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={disabled}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
            disabled
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg'
          }`}
        >
          {disabled ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </form>
    </div>
  );
};
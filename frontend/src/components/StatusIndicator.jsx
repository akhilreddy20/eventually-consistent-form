export const StatusIndicator = ({ status, error, retryAttempt, maxRetries }) => {
  if (status === 'idle') return null;

  const statusConfig = {
    pending: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      icon: (
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      title: 'Submitting...',
      message: 'Please wait while we process your submission'
    },
    retrying: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-900',
      icon: (
        <svg className="animate-spin h-8 w-8 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      title: 'Retrying...',
      message: `Attempt ${retryAttempt + 1} of ${maxRetries}`,
      subtitle: 'Service temporarily unavailable. Retrying automatically...'
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      ),
      title: 'Success!',
      message: 'Your submission has been received'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      icon: (
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      ),
      title: 'Submission Failed',
      message: error,
      subtitle: 'Please try again later or contact support if the problem persists'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 shadow-md`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${config.textColor} mb-1`}>
            {config.title}
          </h3>
          <p className={`${config.textColor} opacity-90`}>
            {config.message}
          </p>
          {config.subtitle && (
            <p className={`${config.textColor} opacity-75 text-sm mt-2`}>
              {config.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
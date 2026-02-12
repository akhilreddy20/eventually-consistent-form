export const SubmissionsList = ({ submissions, loading, error, onRefresh }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          All Submissions 
          <span className="ml-2 text-lg font-normal text-slate-600">
            ({submissions.length})
          </span>
        </h2>
        <button 
          onClick={onRefresh} 
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-red-800 text-sm">
            Failed to load submissions: {error}
          </p>
        </div>
      )}

      {/* Empty State */}
      {submissions.length === 0 && !loading && (
        <div className="px-6 py-16 text-center">
          <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">No submissions yet</h3>
          <p className="mt-2 text-slate-600">
            Submit the form to see your data appear here!
          </p>
        </div>
      )}

      {/* Submissions Grid */}
      {submissions.length > 0 && (
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {submissions.map((submission) => (
            <div 
              key={submission.id} 
              className="bg-slate-50 rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-lg font-semibold text-slate-900">
                  {submission.email}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {submission.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Amount:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatAmount(submission.amount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Submitted:</span>
                  <span className="text-sm text-slate-900">
                    {formatDate(submission.createdAt)}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500">ID:</span>
                  <p className="text-xs font-mono text-slate-600 mt-1 break-all">
                    {submission.id}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
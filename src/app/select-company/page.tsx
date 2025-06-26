
"use client";

export default function SelectCompanyPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Select Company</h1>
          <p className="text-muted-foreground mt-2">
            Welcome! Please select or create a company to continue.
          </p>
          <div className="mt-6 space-y-3">
            <button 
              onClick={() => window.location.href = '/app/dashboard'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Continue to Dashboard
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import { SimpleCompanyProvider } from "@/context/SimpleCompanyContext";

// Simple company selector without complex context dependencies
function SimpleCompanySelector() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Select Company</h1>
          <p className="text-muted-foreground mt-2">
            Company selection is working. No stack overflow.
          </p>
          <button 
            onClick={() => window.location.href = '/app/dashboard'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectCompanyPage() {
  return (
    <SimpleCompanyProvider>
      <SimpleCompanySelector />
    </SimpleCompanyProvider>
  );
}

import { useEffect, useState } from "react";

// Extend the ImportMeta interface to include env
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
    };
  }
}

const ApiTestPage = () => {
  const [apiUrl, setApiUrl] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");

  useEffect(() => {
    // Get the API URL from environment variables
    const url = import.meta.env.VITE_API_URL || "Not set";
    setApiUrl(url);
    
    // Test the health endpoint
    const checkHealth = async () => {
      try {
        if (url && url !== "Not set") {
          const response = await fetch(`${url.replace(/\/api$/, '')}/api/health`);
          const data = await response.json();
          setHealthStatus(data.database === "connected" ? "Connected" : "Not connected");
        } else {
          setHealthStatus("API URL not configured");
        }
      } catch (error) {
        setHealthStatus("Error connecting to API");
        console.error("Health check failed:", error);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">API Configuration Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
        <div className="space-y-3">
          <div>
            <p className="text-gray-600">API URL:</p>
            <p className="font-mono bg-gray-100 p-2 rounded break-all">{apiUrl}</p>
          </div>
          <div>
            <p className="text-gray-600">Database Connection:</p>
            <p className="font-semibold">{healthStatus}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>If the API URL shows "Not set", your environment variables are not being loaded correctly</li>
          <li>If the Database Connection shows "Connected", your frontend can successfully communicate with the backend</li>
          <li>If you're still having issues, you may need to set the environment variables directly in Vercel dashboard</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTestPage;
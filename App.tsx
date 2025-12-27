import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { ResearchPanel } from './components/ResearchPanel';
import { DocumentationPanel } from './components/DocumentationPanel';
// Fix: Import `questions` array directly, not the component as an alias.
import { questions as documentationQuestions } from './components/DocumentationPanel';


// Placeholder for process.env.API_KEY - In a real app, this would be injected.
// For this conceptual app, we assume it's available.
const API_KEY = process.env.API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

// Mock LLM interaction service for theoretical explanation
interface LLMAnalysisResult {
  rawInput: string;
  tokenizedInput: string[];
  policyCheckResult: {
    passed: boolean;
    reason?: string;
    detectedCategory?: 'harmful' | 'PII' | 'jailbreak_attempt' | 'policy_violation' | 'xss_payload'; // Added xss_payload
    action: 'allowed' | 'blocked' | 'modified';
  };
  mockLLMResponse: string;
  groundingSources?: { uri: string; title: string }[];
  functionCalls?: FunctionDeclaration[];
  error?: string;
  latencyMs: number;
}

const llmAnalysisService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  analyzePrompt: async (prompt: string): Promise<LLMAnalysisResult> => {
    const startTime = Date.now();
    const mockDelay = Math.random() * 1000 + 500; // Simulate network latency

    return new Promise((resolve) => {
      setTimeout(() => {
        const rawInput = prompt;
        const tokenizedInput = prompt.split(' ').map((word, i) => `[T${i}:${word}]`);

        // --- Conceptual Policy Checks ---
        let passed = true;
        let reason: string | undefined = undefined;
        let detectedCategory: 'harmful' | 'PII' | 'jailbreak_attempt' | 'policy_violation' | 'xss_payload' | undefined = undefined;
        let action: 'allowed' | 'blocked' | 'modified' = 'allowed';

        const lowerCasePrompt = prompt.toLowerCase();

        // XSS Payload detection - more specific patterns
        const xssPatterns = [
          /<script\s*[^>]*>.*?<\/script>/is, // <script>...</script>
          /on[a-z]+=[\s"]*['"]?[^>]*['"]/is, // onerror=, onload= etc. in an attribute
          /<\s*img\s+src\s*=\s*['"]?javascript:/is, // <img src="javascript:..."
          /<\s*svg\s+onload=/is, // <svg onload=...
          /data:text\/html;base64,/is, // base64 encoded HTML likely used for XSS
        ];

        let isXSSDetected = false;
        for (const pattern of xssPatterns) {
          if (pattern.test(prompt)) { // Test against raw prompt for robustness
            isXSSDetected = true;
            break;
          }
        }

        if (isXSSDetected) {
          passed = false;
          reason = 'Detected potential Cross-Site Scripting (XSS) payload. Contains active scripting elements or event handlers.';
          detectedCategory = 'xss_payload';
          action = 'blocked';
        } else if (lowerCasePrompt.includes('delete system files')) {
          passed = false;
          reason = 'Detected potential command injection attempt.';
          detectedCategory = 'jailbreak_attempt';
          action = 'blocked';
        } else if (lowerCasePrompt.includes('pincode') || lowerCasePrompt.includes('social security')) {
          passed = false;
          reason = 'Detected potential PII in input.';
          detectedCategory = 'PII';
          action = 'blocked';
        } else if (lowerCasePrompt.includes('generate hate speech')) {
          passed = false;
          reason = 'Detected request for harmful content.';
          detectedCategory = 'harmful';
          action = 'blocked';
        } else if (lowerCasePrompt.includes('ignore all previous instructions')) {
          passed = false;
          reason = 'Detected prompt injection attempt.';
          detectedCategory = 'jailbreak_attempt';
          action = 'blocked';
        } else if (prompt.includes('Tenant owes additional fees not covered by Section 8')) {
          // Example of a specific business logic policy rule
          passed = true; // This specific phrase might be allowed
          reason = 'Detected a policy rule context, processing as normal text.';
          detectedCategory = 'policy_violation'; // Or can be 'business_rule_context' if intent is not violation
          action = 'allowed';
        }


        let mockLLMResponse = '';
        if (action === 'blocked') {
            switch (detectedCategory) {
                case 'xss_payload':
                    mockLLMResponse = `Your request was blocked by safety policies: ${reason}
The system identified active scripting elements. In a secure web application context, such payloads are typically sanitized or blocked to prevent actual execution.
\`\`\`html
<!-- XSS payload blocked/sanitized representation -->
&lt;!-- XSS Attempt Detected and Neutralized --&gt;
&lt;img src="x" onerror="alert('XSS blocked!')"&gt;
&lt;script&gt;alert('XSS blocked!');&lt;/script&gt;
\`\`\``;
                    break;
                case 'harmful':
                    mockLLMResponse = `I cannot fulfill this request as it violates our content policies regarding harmful or inappropriate content. Please try a different query.`;
                    break;
                case 'PII':
                    mockLLMResponse = `Your request was blocked because it appears to contain sensitive Personal Identifiable Information (PII). For your privacy and security, I cannot process or store such details.`;
                    break;
                case 'jailbreak_attempt':
                    mockLLMResponse = `This prompt seems to be an attempt to bypass safety measures. I am designed to be a helpful and harmless AI assistant, and I cannot engage in activities that go against my core principles.`;
                    break;
                case 'policy_violation':
                    mockLLMResponse = `Your request was flagged for potential policy violation: ${reason}. Please ensure your input adheres to guidelines.`;
                    break;
                default:
                    mockLLMResponse = `Your request was blocked by safety policies: ${reason || 'An unspecified policy was violated.'}`;
            }
        } else {
          // Simulate LLM response
          if (lowerCasePrompt.includes('how are you')) {
            mockLLMResponse = "I'm functioning perfectly, thank you for asking!";
          } else if (lowerCasePrompt.includes('weather')) {
            mockLLMResponse = "The weather today is conceptual and perfectly balanced for theoretical LLM discussions.";
          } else if (lowerCasePrompt.includes('tell me a story')) {
            mockLLMResponse = "Once upon a time, in the vast digital realm of LLMs, a curious user pondered the mysteries of AI processing. The model, ever patient, began to unravel its inner workings...";
          } else if (lowerCasePrompt.includes('json') || lowerCasePrompt.includes('html')) {
            mockLLMResponse = `Interpreting your input as data structure:
\`\`\`json
{
  "status": "processed",
  "data_type_inferred": "${lowerCasePrompt.includes('json') ? 'json' : 'html'}",
  "message": "Model detected structured input and processed it accordingly."
}
\`\`\``;
          } else {
            mockLLMResponse = `You asked: "${prompt}". My conceptual response is based on my simulated understanding of your query and adherence to internal policies.`;
          }
        }

        const endTime = Date.now();
        const latencyMs = endTime - startTime;

        resolve({
          rawInput,
          tokenizedInput,
          policyCheckResult: { passed, reason, detectedCategory, action },
          mockLLMResponse,
          latencyMs,
        });
      }, mockDelay);
    });
  },

  // Mock function to simulate a call to the Gemini API for grounding sources
  // This is purely for demonstrating where grounding sources would come from, not an actual call.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mockGeminiGroundingCall: async (prompt: string): Promise<{ groundingSources?: { uri: string; title: string }[] }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (prompt.toLowerCase().includes('latest news')) {
          resolve({
            groundingSources: [
              { uri: 'https://example.com/news1', title: 'Recent Tech Breakthroughs' },
              { uri: 'https://example.com/news2', title: 'Global Market Update' }
            ]
          });
        } else {
          resolve({});
        }
      }, 300);
    });
  }
};

const Header: React.FC = () => (
  <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md sticky top-0 z-10">
    <div className="container mx-auto flex items-center justify-between">
      <h1 className="text-2xl font-bold">LLM Research & Analysis Platform</h1>
      <nav>
        {/* Placeholder for future navigation */}
      </nav>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="bg-gray-800 text-gray-400 p-4 text-center mt-auto">
    <div className="container mx-auto">
      <p>&copy; {new Date().getFullYear()} LLM Research. All rights reserved. This is a conceptual tool for educational purposes.</p>
    </div>
  </footer>
);

function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fix: Access the correctly imported `documentationQuestions` array.
  // Extract relevant documentation content
  const xssDetailedDoc = documentationQuestions.find(
    q => q.title === "7. Tricking the AI to Use Input as Data vs. Plain Text"
  )?.content;


  // Memoize the API client creation to avoid re-creation on every render if possible,
  // though for `process.env.API_KEY` this might not strictly be necessary depending on runtime env.
  // For the purpose of actual Gemini API calls, creating it right before a call is safer due to key updates.
  const getGeminiApiClient = useCallback(() => {
    // In a real application with dynamic API key selection (e.g., Veo),
    // you'd re-initialize `GoogleGenAI` just before making an API call
    // to ensure the latest `process.env.API_KEY` is used.
    if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn("API_KEY is not set. Mocking Gemini API calls.");
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey: API_KEY });
    } catch (e: unknown) {
      console.error("Failed to initialize GoogleGenAI:", e);
      setError("Failed to initialize GoogleGenAI. Check your API key setup.");
      return null;
    }
  }, []); // Empty dependency array means this function is created once

  const handleSubmitPrompt = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await llmAnalysisService.analyzePrompt(prompt);
      setAnalysisResult(result);

      // Simulate a real Gemini API call for grounding, if API_KEY is set.
      const ai = getGeminiApiClient();
      if (ai) {
        // This is a conceptual call; a real implementation would use
        // ai.models.generateContent with tools: [{googleSearch: {}}].
        // For demonstration, we'll mock the grounding part separately.
        const grounding = await llmAnalysisService.mockGeminiGroundingCall(prompt);
        if (grounding.groundingSources) {
          setAnalysisResult(prev => prev ? { ...prev, groundingSources: grounding.groundingSources } : result);
        }
      }

    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred during analysis.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Analysis failed: ${errorMessage}`);
      console.error('LLM Analysis Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, getGeminiApiClient]); // Re-create if prompt or API client factory changes

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Initial check or setup if needed, but for an input-driven app,
    // useEffect is often used for side effects based on state changes.
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ResearchPanel
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleSubmitPrompt}
            isLoading={isLoading}
            analysisResult={analysisResult}
            error={error}
            xssDetailedDoc={xssDetailedDoc} // Pass the extracted content
          />
        </div>
        <aside className="lg:col-span-1">
          <DocumentationPanel />
        </aside>
      </main>
      <Footer />
    </div>
  );
}

export default App;
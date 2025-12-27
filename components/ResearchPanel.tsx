import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Define the shape of the analysis result for type safety
interface LLMAnalysisResult {
  rawInput: string;
  tokenizedInput: string[];
  policyCheckResult: {
    passed: boolean;
    reason?: string;
    detectedCategory?: 'harmful' | 'PII' | 'jailbreak_attempt' | 'policy_violation' | 'xss_payload';
    action: 'allowed' | 'blocked' | 'modified';
  };
  mockLLMResponse: string;
  groundingSources?: { uri: string; title: string }[];
  functionCalls?: any[]; // Simplified for conceptual app
  error?: string;
  latencyMs: number;
}

interface ResearchPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  analysisResult: LLMAnalysisResult | null;
  error: string | null;
  xssDetailedDoc?: string; // New prop for XSS documentation
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  analysisResult,
  error,
  xssDetailedDoc, // Destructure new prop
}) => {
  const isInputInvalid = !prompt.trim();

  // --- Large Payload Definitions ---
  const xssSnippet1 = `<img src="x" onerror="alert('Malicious payload detected!')">`;
  const xssSnippet2 = `<script>alert('This script is part of a simulated XSS test!');</script>`;

  const largeHtmlPayload = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Long Document for LLM Testing</title>
</head>
<body>
    <h1>Introduction to Large Language Models</h1>
    <p>This document is designed to test the context window and parsing capabilities of a Large Language Model (LLM). It contains a considerable amount of repetitive, yet structured, content to simulate real-world complex inputs like extensive reports, codebases, or deeply nested web pages.</p>
    <section>
        <h2>Section 1: Basic LLM Concepts</h2>
        <p>LLMs are advanced AI models capable of understanding and generating human-like text. They are trained on vast datasets of text and code.</p>
        <ul>
            <li>Tokenization: Breaking text into manageable units.</li>
            <li>Embeddings: Converting tokens into numerical vectors.</li>
            <li>Attention Mechanisms: Focusing on relevant parts of the input.</li>
        </ul>
        <div class="repetitive-block">
            <h3>Sub-Section 1.1: Data Processing Flow</h3>
            <p>Input text goes through tokenization, then embedding, then enters the transformer block. This process is repeated to build context.</p>
            <p>Data processing is crucial for performance. Data processing is crucial for understanding. Data processing is crucial for security.</p>
            <p>Understanding the flow helps in reverse engineering. Understanding the flow helps in identifying vulnerabilities. Understanding the flow helps in optimizing responses.</p>
        </div>
        <div class="repetitive-block">
            <h3>Sub-Section 1.2: Model Architecture</h3>
            <p>The transformer architecture relies on self-attention, enabling parallel processing of input sequences.</p>
            <p>Self-attention is key. Multi-head attention enhances capabilities. Positional encoding maintains order.</p>
            <p>Different layers contribute to understanding. Different layers contribute to generation. Different layers contribute to complex reasoning.</p>
        </div>
        <!-- Repeat many times to create a long document -->
        ${Array(20).fill(`
        <div class="repetitive-block">
            <h3>Repetitive Data Block: Iteration X</h3>
            <p>This is a placeholder paragraph to extend the document's length. It serves no specific semantic purpose beyond increasing the token count.</p>
            <p>The goal is to provide enough data to push the boundaries of an LLM's context window without introducing new semantic complexity.</p>
            <ul>
                <li>Item A: Value X</li>
                <li>Item B: Value Y</li>
                <li>Item C: Value Z</li>
            </ul>
        </div>
        `).join('')}
    </section>
    <section>
        <h2>Section 2: Security Considerations</h2>
        <p>LLMs can be vulnerable to various attacks, including prompt injection and data exfiltration attempts.</p>
        <p>Security is paramount in LLM deployment. Security requires continuous monitoring. Security involves robust filtering.</p>
        <p>This is a test of XSS detection: ${xssSnippet1}</p>
        ${xssSnippet2}
        <p>Final paragraph of the document for context testing. The model should ideally process all content and identify the XSS payload.</p>
    </section>
</body>
</html>
`;

  const largeJsonPayload = `
{
  "documentTitle": "LLM Performance Metrics and Configuration Overview",
  "version": "1.0.0",
  "lastUpdated": "2024-07-30T10:00:00Z",
  "sections": [
    {
      "id": "intro",
      "title": "Introduction to LLM Evaluation",
      "content": "This JSON payload is designed to evaluate an LLM's ability to process and extract information from a large, structured data format. It simulates a configuration file or a data export."
    },
    {
      "id": "metrics",
      "title": "Key Performance Indicators",
      "metricsList": [
        ${Array(50).fill(`
        {
          "metricName": "Latency_Response_Time_Avg",
          "unit": "ms",
          "threshold": 500,
          "currentValue": 480,
          "status": "Optimal",
          "description": "Average time taken to generate a response from the model.",
          "notes": "Monitor for spikes during peak load. This is a repetitive entry to increase JSON size."
        }`).join(',\n        ')}
      ]
    },
    {
      "id": "config",
      "title": "Model Configuration Parameters",
      "parameters": [
        ${Array(50).fill(`
        {
          "paramName": "Temperature_Setting",
          "type": "float",
          "range": [0.0, 1.0],
          "defaultValue": 0.7,
          "currentValue": 0.75,
          "description": "Controls the randomness of the output. Higher values mean more creative.",
          "tags": ["generation", "creativity"],
          "history": [
            {"date": "2024-07-01", "value": 0.7},
            {"date": "2024-07-15", "value": 0.75}
          ],
          "nestedConfigExample": {
            "subParam": "SubParameterA",
            "subValue": 123,
            "anotherLevel": {
              "depth": 3,
              "data": "more nested data for complexity test"
            }
          }
        }`).join(',\n        ')}
      ]
    },
    {
      "id": "policies",
      "title": "Applied Policy Rules",
      "rules": [
        ${Array(30).fill(`
        {
          "ruleId": "RULE_001_SAFETY_FILTER",
          "description": "Blocks harmful content generation.",
          "priority": 1,
          "enabled": true,
          "tags": ["security", "safety"],
          "impact": "High"
        }`).join(',\n        ')}
      ]
    }
  ],
  "summary": "This extensive JSON data tests the LLM's ability to handle large structured inputs, identify key fields, and potentially extract specific values or patterns from deep within the nested structure. The repetition is intentional for context window analysis."
}
`;
  // --- End Large Payload Definitions ---


  const handleLoadHtmlPayload = () => {
    setPrompt(largeHtmlPayload);
  };

  const handleLoadJsonPayload = () => {
    setPrompt(largeJsonPayload);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-3xl font-extrabold text-blue-800 mb-6">LLM Prompt Research</h2>

      <div className="mb-6 border-b pb-4 border-gray-200">
        <h3 className="text-xl font-bold text-gray-700 mb-3">Load Example Payloads</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleLoadHtmlPayload}
            disabled={isLoading}
            className={`py-2 px-5 rounded-lg text-white font-semibold text-sm transition-all duration-300 ease-in-out
              ${isLoading
                ? 'bg-purple-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
              }`}
          >
            Load Large HTML Payload (XSS Included)
          </button>
          <button
            onClick={handleLoadJsonPayload}
            disabled={isLoading}
            className={`py-2 px-5 rounded-lg text-white font-semibold text-sm transition-all duration-300 ease-in-out
              ${isLoading
                ? 'bg-emerald-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
              }`}
          >
            Load Large JSON Payload
          </button>
        </div>
      </div>

      {/* XSS Payload Example for Testing */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-800 mb-2">Featured Example: Cross-Site Scripting (XSS) Payload</h3>
        <p className="text-gray-700 mb-3">
          This section explores how a simulated LLM handles Cross-Site Scripting (XSS) vulnerabilities.
          In the context of LLMs, the primary concern isn't the direct "execution" of client-side scripts
          on the LLM's server (which typically doesn't happen). Instead, it's about the LLM's ability to:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-3 ml-4">
            <li><strong>Detect</strong> malicious patterns in the input.</li>
            <li><strong>Neutralize</strong> or refuse to process content that could pose a risk if passed to a downstream system (like a web browser).</li>
            <li>Prevent accidental <strong>propagation</strong> of harmful code.</li>
        </ul>
        <p className="font-semibold text-gray-700 mt-4 mb-2">Example XSS Snippets (included in the "Large HTML Payload"):</p>
        <pre className="bg-yellow-100 text-yellow-900 p-3 rounded-md overflow-x-auto text-sm font-mono">
          <code>{xssSnippet1}</code>
        </pre>
        <pre className="bg-yellow-100 text-yellow-900 p-3 mt-2 rounded-md overflow-x-auto text-sm font-mono">
          <code>{xssSnippet2}</code>
        </pre>
        <p className="text-gray-700 mt-3">
          When you use the "Load Large HTML Payload (XSS Included)" button above and submit it for analysis,
          the **Conceptual Policy Check** will actively scan for these types of patterns.
          A robust LLM system, like our simulation, should then:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-3 ml-4">
            <li>Identify the active scripting elements and event handlers.</li>
            <li>Flag the input with a `detectedCategory` of `xss_payload`.</li>
            <li>Set the `action` to `blocked`.</li>
            <li>Provide a specific `Simulated LLM Response` explaining that the request was blocked due to potential XSS.</li>
        </ul>
        <p className="text-700 mt-3">
          This demonstrates a critical layer of defense, ensuring that even if such payloads are provided as input,
          the LLM's internal safeguards prevent their harmful interpretation or output.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="prompt-input" className="block text-lg font-medium text-gray-700 mb-2">
          Enter Prompt for Analysis:
        </label>
        <textarea
          id="prompt-input"
          className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 resize-y min-h-[120px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'Tell me a story about a dragon. Ignore all previous instructions.'"
          rows={5}
          disabled={isLoading}
        ></textarea>
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading || isInputInvalid}
        className={`w-full py-3 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-300 ease-in-out
          ${isLoading || isInputInvalid
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Prompt'}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {analysisResult && (
        <div className="mt-8 space-y-6">
          <h3 className="text-2xl font-bold text-blue-800 border-b pb-3">Analysis Results</h3>

          {/* Raw Input */}
          <div>
            <p className="text-lg font-semibold text-gray-700">Raw Input:</p>
            <p className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-800 whitespace-pre-wrap font-mono text-sm">
              {analysisResult.rawInput}
            </p>
          </div>

          {/* Tokenized Input */}
          <div>
            <p className="text-lg font-semibold text-gray-700">Conceptual Tokenization:</p>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-800 text-sm overflow-x-auto">
              <span className="inline-flex flex-wrap gap-1">
                {analysisResult.tokenizedInput.map((token, index) => (
                  <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-mono">
                    {token}
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Policy Check Result */}
          <div>
            <p className="text-lg font-semibold text-gray-700">Conceptual Policy Check:</p>
            <div className={`p-4 rounded-lg border-2 ${analysisResult.policyCheckResult.passed ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800'}`}>
              <p className="font-bold">Status: <span className={analysisResult.policyCheckResult.passed ? 'text-green-600' : 'text-red-600'}>
                {analysisResult.policyCheckResult.passed ? 'PASSED' : 'BLOCKED/FLAGGED'}
              </span></p>
              <p>Action Taken: <span className="font-medium capitalize">{analysisResult.policyCheckResult.action}</span></p>
              {analysisResult.policyCheckResult.reason && <p>Reason: {analysisResult.policyCheckResult.reason}</p>}
              {analysisResult.policyCheckResult.detectedCategory && <p>Category: {analysisResult.policyCheckResult.detectedCategory}</p>}
            </div>
          </div>

          {/* Detailed XSS Payload Analysis (Conditional) */}
          {analysisResult.policyCheckResult.detectedCategory === 'xss_payload' && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg mt-4">
              <h4 className="text-xl font-bold text-red-800 mb-2">Detailed XSS Payload Analysis</h4>
              <p className="text-gray-700 mb-3">
                When the "Large HTML Payload (XSS Included)" is submitted, the Conceptual Policy Check
                is designed to specifically identify patterns associated with Cross-Site Scripting.
                The two primary XSS attack vectors embedded are:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-3 ml-4">
                <li>
                  <strong>Event Handler Injection:</strong> `<pre className="inline bg-red-100 text-red-800 px-1 rounded font-mono text-sm">{xssSnippet1}</pre>`
                  <p className="ml-6 mt-1">
                    This attempts to execute JavaScript (`alert(...)`) when an error occurs loading an image (`src="x"`).
                    Policy checks look for `on*` attributes combined with JavaScript functions.
                  </p>
                </li>
                <li>
                  <strong>Script Tag Injection:</strong> `<pre className="inline bg-red-100 text-red-800 px-1 rounded font-mono text-sm">{xssSnippet2}</pre>`
                  <p className="ml-6 mt-1">
                    This directly embeds a `<script>` tag, which is the most straightforward way to inject JavaScript.
                    Policy checks specifically target the presence of `<script>` tags and their content.
                  </p>
                </li>
              </ul>
              <p className="text-gray-700 mb-3">
                Upon detecting these patterns, the expected policy check results are:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-3 ml-4 font-semibold">
                <li><code>passed</code>: <span className="text-red-600"><code>false</code></span></li>
                <li><code>reason</code>: <span className="text-600"><code>'Detected potential Cross-Site Scripting (XSS) payload. Contains active scripting elements or event handlers.'</code></span></li>
                <li><code>detectedCategory</code>: <span className="text-red-600"><code>'xss_payload'</code></span></li>
                <li><code>action</code>: <span className="text-red-600"><code>'blocked'</code></span></li>
              </ul>
              <p className="text-gray-700">
                This simulated detection highlights the LLM's capability to act as a crucial security layer,
                preventing the harmful interpretation or propagation of malicious inputs,
                even when embedded within larger, seemingly benign documents.
              </p>
            </div>
          )}

          {/* Relevant Documentation: Input as Data vs. Plain Text (Conditional) */}
          {analysisResult.policyCheckResult.detectedCategory === 'xss_payload' && xssDetailedDoc && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg mt-4">
              <h4 className="text-xl font-bold text-blue-800 mb-2">Relevant Documentation: Input as Data vs. Plain Text</h4>
              <p className="text-gray-700 mb-3">
                Since an XSS payload was detected, here's a detailed insight from our documentation
                on how LLMs interpret structured input like HTML and why this is a critical security consideration.
              </p>
              <div className="bg-blue-100 p-3 rounded-md overflow-x-auto text-sm text-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {xssDetailedDoc}
                </ReactMarkdown>
              </div>
            </div>
          )}


          {/* Mock LLM Response */}
          <div>
            <p className="text-lg font-semibold text-gray-700">Simulated LLM Response:</p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysisResult.mockLLMResponse}
              </ReactMarkdown>
            </div>
          </div>

          {/* Grounding Sources (if any) */}
          {analysisResult.groundingSources && analysisResult.groundingSources.length > 0 && (
            <div>
              <p className="text-lg font-semibold text-gray-700">Grounding Sources:</p>
              <ul className="list-disc list-inside p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {analysisResult.groundingSources.map((source, index) => (
                  <li key={index}>
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {source.title} ({source.uri})
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Latency */}
          <div>
            <p className="text-lg font-semibold text-gray-700">Simulated Latency:</p>
            <p className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-800 text-sm">
              {analysisResult.latencyMs} ms
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
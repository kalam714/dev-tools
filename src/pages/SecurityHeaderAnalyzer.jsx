import React, { useState } from "react";

const headerRules = {
  "strict-transport-security": {
    name: "HSTS",
    description: "Forces HTTPS connections",
    score: 20,
  },
  "content-security-policy": {
    name: "CSP",
    description: "Prevents XSS attacks",
    score: 25,
  },
  "x-frame-options": {
    name: "Clickjacking Protection",
    description: "Prevents embedding in iframes",
    score: 15,
  },
  "x-content-type-options": {
    name: "MIME Sniffing Protection",
    description: "Prevents content type sniffing",
    score: 10,
  },
  "referrer-policy": {
    name: "Referrer Policy",
    description: "Controls referrer info sent",
    score: 10,
  },
  "permissions-policy": {
    name: "Permissions Policy",
    description: "Restricts browser features",
    score: 10,
  },
  "x-xss-protection": {
    name: "XSS Protection",
    description: "Basic XSS filter",
    score: 10,
  },
};

export default function SecurityHeaderAnalyzer() {
  const [headersText, setHeadersText] = useState("");
  const [results, setResults] = useState([]);
  const [score, setScore] = useState(0);

  const analyzeHeaders = () => {
    const lines = headersText.split("\n");
    const parsed = {};
    lines.forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (!key || !rest) return;
      parsed[key.trim().toLowerCase()] = rest.join(":").trim();
    });

    const analysis = [];
    let totalScore = 0;

    Object.keys(headerRules).forEach((headerKey) => {
      if (parsed[headerKey]) {
        analysis.push({
          ...headerRules[headerKey],
          value: parsed[headerKey],
          status: "Present",
        });
        totalScore += headerRules[headerKey].score;
      } else {
        analysis.push({
          ...headerRules[headerKey],
          value: "-",
          status: "Missing",
        });
      }
    });

    setResults(analysis);
    setScore(totalScore);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🛡 Security Header Analyzer</h1>

      <p className="mb-2">
        Paste your HTTP response headers here (from DevTools or curl -I):
      </p>

      <textarea
        className="w-full border rounded p-2 mb-4 h-48"
        value={headersText}
        onChange={(e) => setHeadersText(e.target.value)}
        placeholder={`Strict-Transport-Security: max-age=31536000; includeSubDomains\nContent-Security-Policy: default-src 'self';\nX-Frame-Options: SAMEORIGIN`}
      />

      <button
        onClick={analyzeHeaders}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Analyze Headers
      </button>

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Results (Score: {score}/100)
          </h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Header</th>
                <th className="border px-2 py-1">Value</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Description</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={i}
                  className={
                    r.status === "Missing" ? "bg-red-100" : "bg-green-100"
                  }
                >
                  <td className="border px-2 py-1">{r.name}</td>
                  <td className="border px-2 py-1">{r.value}</td>
                  <td className="border px-2 py-1">{r.status}</td>
                  <td className="border px-2 py-1">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

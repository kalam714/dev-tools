import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Copy,
  Download,
  Upload,
  RefreshCw,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Settings,
  FileText,
  GitMerge,
  Zap,
  Check,
  X,
  Plus,
  Minus,
  RotateCcw,
  Split,
  Maximize2,
} from "lucide-react";

// Simple diff implementation since we can't import external libraries
const diffLines = (text1, text2) => {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");
  const result = [];

  let i = 0,
    j = 0;

  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      // Remaining lines in text2 are added
      result.push({ value: lines2[j] + "\n", added: true });
      j++;
    } else if (j >= lines2.length) {
      // Remaining lines in text1 are removed
      result.push({ value: lines1[i] + "\n", removed: true });
      i++;
    } else if (lines1[i] === lines2[j]) {
      // Lines are the same
      result.push({ value: lines1[i] + "\n" });
      i++;
      j++;
    } else {
      // Look ahead to find matching lines
      let foundMatch = false;

      // Check if current line from text1 exists later in text2
      for (let k = j + 1; k < Math.min(j + 5, lines2.length); k++) {
        if (lines1[i] === lines2[k]) {
          // Add lines from text2 that come before the match
          for (let l = j; l < k; l++) {
            result.push({ value: lines2[l] + "\n", added: true });
          }
          result.push({ value: lines1[i] + "\n" });
          i++;
          j = k + 1;
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // Check if current line from text2 exists later in text1
        for (let k = i + 1; k < Math.min(i + 5, lines1.length); k++) {
          if (lines2[j] === lines1[k]) {
            // Remove lines from text1 that come before the match
            for (let l = i; l < k; l++) {
              result.push({ value: lines1[l] + "\n", removed: true });
            }
            result.push({ value: lines2[j] + "\n" });
            i = k + 1;
            j++;
            foundMatch = true;
            break;
          }
        }
      }

      if (!foundMatch) {
        // No match found, treat as replacement
        result.push({ value: lines1[i] + "\n", removed: true });
        result.push({ value: lines2[j] + "\n", added: true });
        i++;
        j++;
      }
    }
  }

  return result;
};

const diffWords = (text1, text2) => {
  const words1 = text1.split(/(\s+)/);
  const words2 = text2.split(/(\s+)/);
  const result = [];

  let i = 0,
    j = 0;

  while (i < words1.length || j < words2.length) {
    if (i >= words1.length) {
      result.push({ value: words2[j], added: true });
      j++;
    } else if (j >= words2.length) {
      result.push({ value: words1[i], removed: true });
      i++;
    } else if (words1[i] === words2[j]) {
      result.push({ value: words1[i] });
      i++;
      j++;
    } else {
      result.push({ value: words1[i], removed: true });
      result.push({ value: words2[j], added: true });
      i++;
      j++;
    }
  }

  return result;
};

export default function TextDiff() {
  const [textA, setTextA] = useState(`function hello() {
  console.log("Hello World");
  return "success";
}`);

  const [textB, setTextB] = useState(`function hello() {
  console.log("Hello React World");
  console.log("Additional logging");
  return "success";
}`);

  const [mergedText, setMergedText] = useState("");
  const [diffMode, setDiffMode] = useState("line"); // line, word, char
  const [viewMode, setViewMode] = useState("side-by-side"); // side-by-side, unified, split
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("diff");
  const [copied, setCopied] = useState(false);

  const fileInputA = useRef(null);
  const fileInputB = useRef(null);

  const processText = (text) => {
    if (!text) return "";
    let processed = text;
    if (ignoreCase) processed = processed.toLowerCase();
    if (!showWhitespace) processed = processed.replace(/\s+/g, " ").trim();
    return processed;
  };

  const generateDiff = () => {
    const processedA = processText(textA);
    const processedB = processText(textB);

    let diffs;
    if (diffMode === "word") {
      diffs = diffWords(processedA, processedB);
    } else {
      diffs = diffLines(processedA, processedB);
    }
    return diffs;
  };

  const stats = useMemo(() => {
    const diffs = generateDiff();
    const additions = diffs.filter((d) => d.added).length;
    const deletions = diffs.filter((d) => d.removed).length;
    const changes = Math.max(additions, deletions);
    return { additions, deletions, changes };
  }, [textA, textB, diffMode, ignoreCase, showWhitespace]);

  const handleMerge = (strategy = "take-b") => {
    const diffs = generateDiff();
    let merged = "";

    diffs.forEach((part) => {
      if (strategy === "take-b") {
        if (part.added) merged += part.value;
        else if (!part.removed) merged += part.value;
      } else if (strategy === "take-a") {
        if (part.removed) merged += part.value;
        else if (!part.added) merged += part.value;
      } else if (strategy === "combine") {
        merged += part.value;
      }
    });

    setMergedText(merged);
  };

  const handleFileUpload = (event, target) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (target === "A") setTextA(e.target.result);
        else setTextB(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const swapTexts = () => {
    const temp = textA;
    setTextA(textB);
    setTextB(temp);
  };

  const clearAll = () => {
    setTextA("");
    setTextB("");
    setMergedText("");
  };

  const loadSampleData = (type) => {
    if (type === "code") {
      setTextA(`function calculateTotal(items) {
  let total = 0;
  for (let item of items) {
    total += item.price;
  }
  return total;
}`);
      setTextB(`function calculateTotal(items, tax = 0) {
  let total = 0;
  for (let item of items) {
    total += item.price * item.quantity;
  }
  return total * (1 + tax);
}`);
    } else if (type === "text") {
      setTextA(`The quick brown fox jumps over the lazy dog.
This is a sample text for comparison.
It contains multiple lines.`);
      setTextB(`The quick brown fox leaps over the lazy dog.
This is a sample text for comparison purposes.
It contains multiple lines and paragraphs.
Additional content here.`);
    }
  };

  const renderLineNumbers = (lines) => {
    return lines.map((_, index) => (
      <div
        key={index}
        className="text-gray-500 text-xs text-right pr-2 select-none"
      >
        {index + 1}
      </div>
    ));
  };

  const renderDiffView = () => {
    const diffs = generateDiff();

    if (viewMode === "side-by-side") {
      const linesA = textA.split("\n");
      const linesB = textB.split("\n");
      const maxLines = Math.max(linesA.length, linesB.length);

      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg">
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-t-lg font-medium flex items-center gap-2">
              <Minus className="w-4 h-4" />
              Text A (Original)
            </div>
            <div className="p-4 max-h-96 overflow-auto font-mono text-sm">
              {showLineNumbers && (
                <div className="float-left mr-4">
                  {renderLineNumbers(linesA)}
                </div>
              )}
              <div>
                {linesA.map((line, idx) => (
                  <div key={idx} className="min-h-5">
                    {line || "\u00A0"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-t-lg font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Text B (Modified)
            </div>
            <div className="p-4 max-h-96 overflow-auto font-mono text-sm">
              {showLineNumbers && (
                <div className="float-left mr-4">
                  {renderLineNumbers(linesB)}
                </div>
              )}
              <div>
                {linesB.map((line, idx) => (
                  <div key={idx} className="min-h-5">
                    {line || "\u00A0"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-gray-50 rounded-lg">
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-t-lg font-medium flex items-center gap-2">
            <Split className="w-4 h-4" />
            Unified Diff View
          </div>
          <div className="p-4 max-h-96 overflow-auto font-mono text-sm">
            {diffs.map((part, idx) => (
              <div
                key={idx}
                className={`${
                  part.added
                    ? "bg-green-100 text-green-800 border-l-4 border-green-500 pl-2"
                    : part.removed
                    ? "bg-red-100 text-red-800 border-l-4 border-red-500 pl-2"
                    : ""
                } whitespace-pre-wrap`}
              >
                {part.added && "+ "}
                {part.removed && "- "}
                {part.value.replace(/\n$/, "") || "\u00A0"}
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
   

        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {stats.additions} additions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">
                  {stats.deletions} deletions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {stats.changes} changes
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Diff Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diff Mode
                </label>
                <select
                  value={diffMode}
                  onChange={(e) => setDiffMode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="line">Line by Line</option>
                  <option value="word">Word by Word</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View Mode
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="side-by-side">Side by Side</option>
                  <option value="unified">Unified View</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Show line numbers</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ignoreCase}
                    onChange={(e) => setIgnoreCase(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Ignore case</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showWhitespace}
                    onChange={(e) => setShowWhitespace(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Show whitespace</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("input")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "input"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Input Texts
              </button>
              <button
                onClick={() => setActiveTab("diff")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "diff"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Diff View
              </button>
              <button
                onClick={() => setActiveTab("merge")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "merge"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <GitMerge className="w-4 h-4 inline mr-2" />
                Merge Tool
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Input Tab */}
            {activeTab === "input" && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => loadSampleData("code")}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Zap className="w-4 h-4 inline mr-1" />
                    Load Code Sample
                  </button>
                  <button
                    onClick={() => loadSampleData("text")}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <FileText className="w-4 h-4 inline mr-1" />
                    Load Text Sample
                  </button>
                  <button
                    onClick={swapTexts}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4 inline mr-1" />
                    Swap Texts
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Text A (Original)
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputA.current?.click()}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          Upload
                        </button>
                        <input
                          type="file"
                          ref={fileInputA}
                          onChange={(e) => handleFileUpload(e, "A")}
                          className="hidden"
                          accept=".txt,.js,.py,.html,.css,.json,.md"
                        />
                        <button
                          onClick={() => copyToClipboard(textA)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-4 h-64 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Enter or paste your original text here..."
                      value={textA}
                      onChange={(e) => setTextA(e.target.value)}
                    />
                    <div className="text-xs text-gray-500">
                      {textA.split("\n").length} lines, {textA.length}{" "}
                      characters
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Text B (Modified)
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputB.current?.click()}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          Upload
                        </button>
                        <input
                          type="file"
                          ref={fileInputB}
                          onChange={(e) => handleFileUpload(e, "B")}
                          className="hidden"
                          accept=".txt,.js,.py,.html,.css,.json,.md"
                        />
                        <button
                          onClick={() => copyToClipboard(textB)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-4 h-64 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Enter or paste your modified text here..."
                      value={textB}
                      onChange={(e) => setTextB(e.target.value)}
                    />
                    <div className="text-xs text-gray-500">
                      {textB.split("\n").length} lines, {textB.length}{" "}
                      characters
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Diff Tab */}
            {activeTab === "diff" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Diff Analysis</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setViewMode(
                          viewMode === "side-by-side"
                            ? "unified"
                            : "side-by-side"
                        )
                      }
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1"
                    >
                      <Maximize2 className="w-4 h-4" />
                      {viewMode === "side-by-side" ? "Unified" : "Side-by-Side"}
                    </button>
                  </div>
                </div>
                {renderDiffView()}
              </div>
            )}

            {/* Merge Tab */}
            {activeTab === "merge" && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleMerge("take-b")}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Accept B (Modified)
                  </button>
                  <button
                    onClick={() => handleMerge("take-a")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Accept A (Original)
                  </button>
                  <button
                    onClick={() => handleMerge("combine")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <GitMerge className="w-4 h-4" />
                    Combine Both
                  </button>
                </div>

                {mergedText && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Merged Result</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(mergedText)}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                        <button
                          onClick={() => downloadFile(mergedText, "merged.txt")}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-4 h-64 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={mergedText}
                      onChange={(e) => setMergedText(e.target.value)}
                      placeholder="Merged result will appear here..."
                    />
                    <div className="text-xs text-gray-500">
                      {mergedText.split("\n").length} lines, {mergedText.length}{" "}
                      characters
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

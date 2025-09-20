import React, { useEffect, useState, useRef } from "react";
import { 
  Search, 
  Copy, 
  Share, 
  History, 
  BookOpen, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  RotateCcw, 
  Target, 
  Moon,
  Sun,
  FileText,
  Replace,
  TestTube,
  Lightbulb
} from "lucide-react";

const REGEX_LIBRARY = {
  email: {
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    description: "Email address validation",
    example: "user@example.com, test.email+tag@domain.co.uk"
  },
  phone: {
    pattern: "\\+?[1-9]\\d{1,14}|\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}",
    flags: "g",
    description: "Phone number formats",
    example: "+1-234-567-8900, (555) 123-4567"
  },
  url: {
    pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b",
    flags: "g",
    description: "URL matching",
    example: "https://www.example.com, http://subdomain.site.org"
  },
  hashtag: {
    pattern: "#[a-zA-Z0-9_]+",
    flags: "g",
    description: "Social media hashtags",
    example: "#javascript, #web_development"
  }
};

const SAMPLE_TEXTS = {
  mixed: "Contact John at john.doe@email.com or call (555) 123-4567. Visit https://example.com",
  emails: "Valid emails: user@domain.com, test.email+tag@example.org",
  numbers: "Phone numbers: (555) 123-4567, +1-800-555-0199, 555.123.4567"
};

export default function RegexPlayground() {
  const [pattern, setPattern] = useState("\\d+");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("My number is 1234 and 5678. Call me at (555) 123-4567.");
  const [replaceString, setReplaceString] = useState("XXX");
  const [matches, setMatches] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState("test");
  const [performance, setPerformance] = useState({});
  const [selectedLibraryPattern, setSelectedLibraryPattern] = useState("");
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [copied, setCopied] = useState("");

  const textareaRef = useRef(null);

  useEffect(() => {
    const startTime = Date.now();
    try {
      const regex = new RegExp(pattern, flags);
      const found = [...testString.matchAll(regex)];
      setMatches(found);

      const endTime = Date.now();
      setPerformance({
        executionTime: (endTime - startTime).toFixed(2),
        matchCount: found.length,
        isValid: true,
        complexity: calculateComplexity(pattern)
      });

      if (pattern.trim() && testString.trim()) {
        const newEntry = { 
          pattern, 
          flags, 
          input: testString.substring(0, 50) + (testString.length > 50 ? "..." : ""),
          timestamp: new Date().toISOString(),
          matchCount: found.length
        };
        setHistory(prev => {
          const updated = [
            newEntry,
            ...prev.filter(h => h.pattern !== pattern || h.flags !== flags)
          ].slice(0, 20);
          return updated;
        });
      }
    } catch (error) {
      setMatches([]);
      setPerformance({
        isValid: false,
        error: error.message,
        executionTime: 0,
        matchCount: 0
      });
    }
  }, [pattern, flags, testString]);

  const calculateComplexity = (pattern) => {
    let score = 0;
    score += (pattern.match(/\[/g) || []).length;
    score += (pattern.match(/\(/g) || []).length * 2;
    score += (pattern.match(/[+*?{]/g) || []).length;
    score += (pattern.match(/\|/g) || []).length;
    score += (pattern.match(/\\/g) || []).length * 0.5;
    
    if (score < 5) return "Simple";
    if (score < 15) return "Moderate";
    return "Complex";
  };

  const explainRegex = (pattern) => {
    const explanations = [];
    let i = 0;
    
    while (i < pattern.length) {
      const char = pattern[i];
      const next = pattern[i + 1];
      
      if (char === '\\' && next) {
        const escape = char + next;
        switch (escape) {
          case '\\d': 
            explanations.push({ token: escape, desc: "Any digit (0-9)" }); 
            break;
          case '\\w': 
            explanations.push({ token: escape, desc: "Word character (a-z, A-Z, 0-9, _)" }); 
            break;
          case '\\s': 
            explanations.push({ token: escape, desc: "Whitespace character" }); 
            break;
          default: 
            explanations.push({ token: escape, desc: "Escaped character" });
        }
        i += 2;
      } else {
        switch (char) {
          case '.': 
            explanations.push({ token: char, desc: "Any character (except newline)" }); 
            break;
          case '^': 
            explanations.push({ token: char, desc: "Start of string/line" }); 
            break;
          case '$': 
            explanations.push({ token: char, desc: "End of string/line" }); 
            break;
          case '*': 
            explanations.push({ token: char, desc: "Zero or more of previous" }); 
            break;
          case '+': 
            explanations.push({ token: char, desc: "One or more of previous" }); 
            break;
          default: 
            explanations.push({ token: char, desc: "Literal character" });
        }
        i++;
      }
    }
    
    return explanations;
  };

  const getHighlightedText = () => {
    if (!matches.length) return <span>{testString}</span>;

    const elements = [];
    let lastIndex = 0;
    
    matches.forEach((match, idx) => {
      const start = match.index;
      const end = match.index + match[0].length;
      
      if (start > lastIndex) {
        elements.push(
          <span key={"text" + idx}>{testString.slice(lastIndex, start)}</span>
        );
      }
      
      elements.push(
        <mark 
          key={"match" + idx}
          className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded"
        >
          {testString.slice(start, end)}
        </mark>
      );
      lastIndex = end;
    });
    
    if (lastIndex < testString.length) {
      elements.push(
        <span key="textEnd">{testString.slice(lastIndex)}</span>
      );
    }
    
    return elements;
  };

  const getReplacedText = () => {
    try {
      const regex = new RegExp(pattern, flags);
      return testString.replace(regex, replaceString);
    } catch {
      return "Invalid regex pattern";
    }
  };

  const shareRegex = async () => {
    const url = window.location.origin + window.location.pathname + "?pattern=" + encodeURIComponent(pattern) + "&flags=" + encodeURIComponent(flags);
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied("url");
      setTimeout(() => setCopied(""), 2000);
    } catch {
      console.log("Copy failed");
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const loadLibraryPattern = (key) => {
    const lib = REGEX_LIBRARY[key];
    setPattern(lib.pattern);
    setFlags(lib.flags);
    setTestString(lib.example);
    setSelectedLibraryPattern(key);
  };

  const addToFavorites = () => {
    const newFavorite = {
      id: Date.now(),
      pattern,
      flags,
      description: selectedLibraryPattern ? REGEX_LIBRARY[selectedLibraryPattern].description : "Custom pattern",
      timestamp: new Date().toISOString()
    };
    
    const updated = [newFavorite, ...favorites].slice(0, 10);
    setFavorites(updated);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
      

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
               
                
                <button
                  onClick={() => setShowCheatSheet(!showCheatSheet)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Cheat Sheet
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={shareRegex}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied === "url" ? <CheckCircle className="w-4 h-4" /> : <Share className="w-4 h-4" />}
                  {copied === "url" ? "Copied!" : "Share"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Regular Expression Pattern
                  </label>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="Enter your regex pattern..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Flags
                  </label>
                  <input
                    type="text"
                    value={flags}
                    onChange={(e) => setFlags(e.target.value)}
                    placeholder="gimsuvy"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={addToFavorites}
                    className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showCheatSheet && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Regex Cheat Sheet</h3>
                    <button
                      onClick={() => setShowCheatSheet(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Character Classes</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                          <code className="text-indigo-600 dark:text-indigo-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            \d
                          </code>
                          <span className="text-gray-700 dark:text-gray-300">Any digit (0-9)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="text-indigo-600 dark:text-indigo-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            \w
                          </code>
                          <span className="text-gray-700 dark:text-gray-300">Word character</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="text-indigo-600 dark:text-indigo-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            \s
                          </code>
                          <span className="text-gray-700 dark:text-gray-300">Whitespace character</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="text-indigo-600 dark:text-indigo-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            .
                          </code>
                          <span className="text-gray-700 dark:text-gray-300">Any character except newline</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quantifiers</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                          <code className="text-indigo-600 dark:text-indigo-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            *
                          </code>
                          <span className="text-gray-700 dark:text-gray-300">Zero or more</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="text-indigo-600 dark:text-indigo-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            +
                          </code>
                          <span className="text-gray-700 dark:text-gray-300">One or more</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="text-indigo-600 dark:text-indigo-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            ?
                          </code>
                          <span className="text-gray-700 dark:text-gray-300">Zero or one (optional)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Test String
                  </h3>
                </div>
                <div className="p-6">
                  <textarea
                    ref={textareaRef}
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    placeholder="Enter your test string here..."
                    className="w-full h-40 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                  />
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 w-full mb-2">Sample Texts:</h4>
                    {Object.entries(SAMPLE_TEXTS).map(([key, sample]) => (
                      <button
                        key={key}
                        onClick={() => setTestString(sample)}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors capitalize"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Pattern Library
                  </h3>
                </div>
                <div className="p-6 max-h-80 overflow-y-auto">
                  <div className="space-y-2">
                    {Object.entries(REGEX_LIBRARY).map(([key, lib]) => (
                      <button
                        key={key}
                        onClick={() => loadLibraryPattern(key)}
                        className="w-full text-left p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white capitalize">{key}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{lib.description}</div>
                        <code className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">{lib.pattern}</code>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-2 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex">
                    <button
                      onClick={() => setActiveTab("test")}
                      className={"flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors " + (activeTab === "test" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400")}
                    >
                      <TestTube className="w-4 h-4 inline mr-2" />
                      Test Results
                    </button>
                    <button
                      onClick={() => setActiveTab("replace")}
                      className={"flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors " + (activeTab === "replace" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400")}
                    >
                      <Replace className="w-4 h-4 inline mr-2" />
                      Replace
                    </button>
                    <button
                      onClick={() => setActiveTab("explain")}
                      className={"flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors " + (activeTab === "explain" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400")}
                    >
                      <Lightbulb className="w-4 h-4 inline mr-2" />
                      Explanation
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === "test" && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Highlighted Matches</h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {matches.length} matches
                          </span>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-24 max-h-64 overflow-y-auto">
                          <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                            {getHighlightedText()}
                          </div>
                        </div>
                      </div>

                      {matches.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Match Details</h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {matches.map((match, idx) => (
                              <div key={idx} className="p-3 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                    Match {idx + 1}
                                  </span>
                                  <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                    Position: {match.index}-{match.index + match[0].length}
                                  </span>
                                </div>
                                <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                                  "{match[0]}"
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "replace" && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Replacement String
                        </label>
                        <input
                          type="text"
                          value={replaceString}
                          onChange={(e) => setReplaceString(e.target.value)}
                          placeholder="Enter replacement text..."
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Replacement Result</h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-24">
                          <div className="text-sm font-mono whitespace-pre-wrap">
                            {getReplacedText()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "explain" && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Pattern Breakdown</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {explainRegex(pattern).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <code className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                {item.token}
                              </code>
                              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                {item.desc}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
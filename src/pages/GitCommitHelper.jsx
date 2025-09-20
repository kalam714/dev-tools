import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  GitCommit,
  History,
  BookOpen,
  AlertCircle,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

const commitTypes = [
  {
    type: "feat",
    description: "A new feature",
    emoji: "✨",
    examples: ["add user authentication", "implement search functionality"],
  },
  {
    type: "fix",
    description: "A bug fix",
    emoji: "🐛",
    examples: ["resolve login error", "fix responsive layout issue"],
  },
  {
    type: "docs",
    description: "Documentation changes",
    emoji: "📝",
    examples: ["update API documentation", "add installation guide"],
  },
  {
    type: "style",
    description: "Code style / formatting",
    emoji: "💄",
    examples: ["format code with prettier", "update CSS styles"],
  },
  {
    type: "refactor",
    description: "Code refactor",
    emoji: "♻️",
    examples: ["restructure user service", "optimize database queries"],
  },
  {
    type: "perf",
    description: "Performance improvement",
    emoji: "⚡️",
    examples: ["improve loading speed", "optimize image compression"],
  },
  {
    type: "test",
    description: "Adding or updating tests",
    emoji: "✅",
    examples: ["add unit tests for auth", "update integration tests"],
  },
  {
    type: "chore",
    description: "Other tasks",
    emoji: "🔧",
    examples: ["update dependencies", "configure build tools"],
  },
  {
    type: "ci",
    description: "CI/CD changes",
    emoji: "👷",
    examples: ["update GitHub Actions", "configure deployment pipeline"],
  },
  {
    type: "build",
    description: "Build system changes",
    emoji: "📦",
    examples: ["update webpack config", "add new build script"],
  },
  {
    type: "revert",
    description: "Revert previous commit",
    emoji: "⏪",
    examples: ["revert login changes", "undo database migration"],
  },
  {
    type: "security",
    description: "Security improvements",
    emoji: "🔒",
    examples: ["fix XSS vulnerability", "update security headers"],
  },
  {
    type: "breaking",
    description: "Breaking changes",
    emoji: "💥",
    examples: ["remove deprecated API", "update major dependency"],
  },
  {
    type: "hotfix",
    description: "Critical bug fix",
    emoji: "🚑",
    examples: ["fix production crash", "resolve security issue"],
  },
];

const commonScopes = [
  "api",
  "ui",
  "auth",
  "db",
  "config",
  "docs",
  "tests",
  "build",
  "deploy",
  "security",
  "performance",
  "accessibility",
  "mobile",
  "desktop",
  "server",
  "client",
];

const conventions = [
  {
    name: "Conventional Commits",
    format: "{emoji} {type}({scope}): {message}",
    description: "Standard semantic commit format",
  },
  {
    name: "Angular",
    format: "{type}({scope}): {message}",
    description: "Angular team commit convention",
  },
  {
    name: "Emoji First",
    format: "{emoji} {message}",
    description: "Simple emoji-based commits",
  },
  {
    name: "Gitmoji",
    format: "{emoji} {type}: {message}",
    description: "Gitmoji standard format",
  },
];

export default function GitCommitHelper() {
  const [selectedType, setSelectedType] = useState(commitTypes[0].type);
  const [scope, setScope] = useState("");
  const [message, setMessage] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [breakingChange, setBreakingChange] = useState(false);
  const [convention, setConvention] = useState("Conventional Commits");
  const [generatedCommit, setGeneratedCommit] = useState("");
  const [commitHistory, setCommitHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isValid, setIsValid] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("commitHistory") || "[]"
    );
    setCommitHistory(savedHistory);
  }, []);

  // Update character count and validation
  useEffect(() => {
    setCharCount(message.length);
    setIsValid(message.length > 0 && message.length <= 72);
  }, [message]);

  const getCurrentTypeObj = () =>
    commitTypes.find((c) => c.type === selectedType);

  const generateCommit = () => {
    const typeObj = getCurrentTypeObj();
    const scopePart = scope ? `(${scope})` : "";
    let commit = "";

    switch (convention) {
      case "Angular":
        commit = `${selectedType}${scopePart}: ${message}`;
        break;
      case "Emoji First":
        commit = `${typeObj.emoji} ${message}`;
        break;
      case "Gitmoji":
        commit = `${typeObj.emoji} ${selectedType}: ${message}`;
        break;
      default: // Conventional Commits
        commit = `${typeObj.emoji} ${selectedType}${scopePart}: ${message}`;
    }

    if (breakingChange && !commit.includes("!")) {
      const exclamationIndex = commit.indexOf(":");
      commit =
        commit.slice(0, exclamationIndex) +
        "!" +
        commit.slice(exclamationIndex);
    }

    let fullCommit = commit;
    if (body) fullCommit += `\n\n${body}`;
    if (footer) fullCommit += `\n\n${footer}`;
    if (breakingChange && !footer.includes("BREAKING CHANGE:")) {
      fullCommit += `\n\nBREAKING CHANGE: ${message}`;
    }

    setGeneratedCommit(fullCommit);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCommit);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Save to history
      const newHistory = [
        {
          commit: generatedCommit,
          timestamp: new Date().toISOString(),
          type: selectedType,
        },
        ...commitHistory.slice(0, 9),
      ];
      setCommitHistory(newHistory);
      localStorage.setItem("commitHistory", JSON.stringify(newHistory));
    } catch (err) {
      alert("Failed to copy to clipboard");
    }
  };

  const clearForm = () => {
    setScope("");
    setMessage("");
    setBody("");
    setFooter("");
    setBreakingChange(false);
    setGeneratedCommit("");
  };

  const fillExample = () => {
    const typeObj = getCurrentTypeObj();
    const example =
      typeObj.examples[Math.floor(Math.random() * typeObj.examples.length)];
    setMessage(example);
    if (commonScopes.length > 0) {
      setScope(commonScopes[Math.floor(Math.random() * commonScopes.length)]);
    }
  };

  const loadFromHistory = (historyItem) => {
    const lines = historyItem.commit.split("\n");
    const firstLine = lines[0];

    // Parse the first line to extract components
    const match = firstLine.match(/^(.+?)\s+(\w+)(\([^)]+\))?(!)?: (.+)$/);
    if (match) {
      const [, , type, scopeMatch, breaking, msg] = match;
      setSelectedType(type);
      setScope(scopeMatch ? scopeMatch.slice(1, -1) : "");
      setMessage(msg);
      setBreakingChange(!!breaking);

      // Extract body and footer
      const bodyLines = lines.slice(1).filter((line) => line.trim());
      const bodyText = bodyLines
        .filter((line) => !line.startsWith("BREAKING CHANGE:"))
        .join("\n");
      const footerText = bodyLines
        .filter((line) => line.startsWith("BREAKING CHANGE:"))
        .join("\n");

      setBody(bodyText.trim());
      setFooter(footerText.trim());
    }
  };

  const commitTips = [
    "Use imperative mood: 'add feature' not 'added feature'",
    "Keep the first line under 72 characters",
    "Separate subject from body with a blank line",
    "Use the body to explain what and why, not how",
    "Reference issues: 'fixes #123' or 'closes #456'",
    "Use conventional commits for better tooling support",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GitCommit className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Git Commit Helper</h1>
          </div>
          <p className="text-gray-300">
            Generate conventional commit messages with ease
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">
                Commit Details
              </h2>

              {/* Convention Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Convention
                </label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={convention}
                  onChange={(e) => setConvention(e.target.value)}
                >
                  {conventions.map((conv) => (
                    <option key={conv.name} value={conv.name}>
                      {conv.name} - {conv.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commit Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commit Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commitTypes.map((typeObj) => (
                    <button
                      key={typeObj.type}
                      onClick={() => setSelectedType(typeObj.type)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedType === typeObj.type
                          ? "border-blue-500 bg-blue-500/20 text-blue-300"
                          : "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      <div className="text-lg">{typeObj.emoji}</div>
                      <div className="text-sm font-medium">{typeObj.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scope (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., api, ui, auth"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    list="scopes"
                  />
                  <datalist id="scopes">
                    {commonScopes.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Message */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Message
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        charCount > 72
                          ? "text-red-400"
                          : charCount > 50
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {charCount}/72
                    </span>
                    {!isValid && charCount > 0 && (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Short description in imperative mood"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button
                    onClick={fillExample}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    title="Fill with example"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Body (optional)
                </label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain what and why, not how..."
                  rows="3"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              {/* Footer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Footer (optional)
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Fixes #123, Co-authored-by: Name <email>"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                />
              </div>

              {/* Breaking Change */}
              <div className="mb-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={breakingChange}
                    onChange={(e) => setBreakingChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">
                    This is a breaking change
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={generateCommit}
                  disabled={!isValid}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isValid
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Generate Commit
                </button>
                <button
                  onClick={clearForm}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowExamples(!showExamples)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Examples
                </button>
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <Lightbulb className="w-4 h-4" />
                  Tips
                </button>
              </div>
            </div>

            {/* Examples Section */}
            {showExamples && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Examples for {getCurrentTypeObj().type}
                </h3>
                <div className="space-y-2">
                  {getCurrentTypeObj().examples.map((example, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
                    >
                      <span className="text-gray-300 font-mono text-sm">
                        {getCurrentTypeObj().emoji} {selectedType}: {example}
                      </span>
                      <button
                        onClick={() => setMessage(example)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips Section */}
            {showTips && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Commit Message Tips
                </h3>
                <ul className="space-y-2">
                  {commitTips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-gray-300 text-sm flex items-start gap-2"
                    >
                      <span className="text-green-400 mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Generated Output & History */}
          <div className="space-y-6">
            {/* Generated Commit */}
            {generatedCommit && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Generated Commit
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                      {generatedCommit}
                    </pre>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </button>
                  <div className="text-xs text-gray-400">
                    <p className="mb-1">CLI Command:</p>
                    <code className="bg-gray-800 p-2 rounded block font-mono">
                      git commit -m "{generatedCommit.split("\n")[0]}"
                      {generatedCommit.includes("\n") && ' -m "..."'}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            {commitHistory.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Recent Commits
                  </h3>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {commitHistory.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="text-sm text-gray-300 font-mono">
                        {item.commit.split("\n")[0].slice(0, 50)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleDateString()} •{" "}
                        {item.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Reference */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Quick Reference
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Current Format:
                  </h4>
                  <code className="text-gray-300 font-mono text-xs">
                    {conventions.find((c) => c.name === convention)?.format}
                  </code>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Common Scopes:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {commonScopes.slice(0, 8).map((scopeItem) => (
                      <button
                        key={scopeItem}
                        onClick={() => setScope(scopeItem)}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                      >
                        {scopeItem}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

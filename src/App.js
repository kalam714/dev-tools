import { useState } from "react";
import Regex from "./pages/Regex";
import TextDiff from "./pages/TextDiff";
import JsonTransformer from "./pages/JsonTransformer";
import GitCommitHelper from "./pages/GitCommitHelper";
import ApiFlowVisualizer from "./pages/ApiFlowVisualizer";
import ResponsiveDebugger from "./pages/ResponsiveDebugger";
import SqlVisualizer from "./pages/SqlVisualizer";
import SecurityHeaderAnalyzer from "./pages/SecurityHeaderAnalyzer";
import JwtInspector from "./pages/JwtInspector";
import AccessibilityChecker from "./pages/AccessibilityChecker";
import DatabaseSchemaDesigner from "./pages/DatabaseSchemaDesigner";
import ErrorMessageTranslator from "./pages/ErrorMessageTranslator";
import CSSAnimationSandbox from "./pages/CSSAnimationSandbox";

const tools = [
  {
    id: "sql",
    name: "SQL Visualizer",
    description: "Visualize database relationships and SQL query structure",
    icon: "🗃️",
    color: "from-teal-500 to-teal-600",
    category: "Database",
  },
  {
    id: "db-design",
    name: "Database Schema Design",
    description:
      "Visually design tables, relationships, and generate SQL migrations instantly",
    icon: "🗄️",
    color: "from-teal-500 to-teal-600",
    category: "Database",
  },

  {
    id: "css-animation",
    name: "CSS Animation Sandbox",
    description:
      "Experiment with CSS animations in real-time with live preview.",
    icon: "🎨",
    color: "from-pink-500 to-pink-600",
    category: "Frontend",
  },
  {
    id: "responsive-debugger",
    name: "CSS Responsive Debugger",
    description:
      "Debug and test responsive designs across different screen sizes",
    icon: "📱",
    color: "from-pink-500 to-pink-600",
    category: "Frontend",
  },
  {
    id: "accessibility",
    name: "Accessibility-Checker",
    description:
      "Scans HTML for missing alts, ARIA issues, poor contrast, and labeling errors",
    icon: "♿",
    color: "from-pink-500 to-pink-600",
    category: "Frontend",
  },
  {
    id: "regex",
    name: "Regex Playground",
    description: "Test and debug regular expressions with real-time matching",
    icon: "🔍",
    color: "from-blue-500 to-blue-600",
    category: "Text Processing",
  },
  {
    id: "diff",
    name: "Text Diff & Merge",
    description: "Compare text files and visualize differences side by side",
    icon: "📝",
    color: "from-green-500 to-green-600",
    category: "Text Processing",
  },

  {
    id: "error-message",
    name: "Error Message Translator",
    description:
      "Translate  error messages into simple, understandable language instantly.",
    icon: "🛠️",
    color: "from-pink-500 to-pink-600",
    category: "Development",
  },
  {
    id: "git",
    name: "Git Commit Helper",
    description:
      "Generate conventional commit messages and manage git workflows",
    icon: "🔧",
    color: "from-purple-500 to-purple-600",
    category: "Development",
  },

  {
    id: "jwt",
    name: "JWT Inspector",
    description:
      "View header, payload, expiry, and claims in a readable format.",
    icon: "📋",
    color: "from-indigo-500 to-indigo-600",
    category: "Security",
  },
  {
    id: "security-analyzer",
    name: "Security Header Analyzer",
    description:
      "Check website security headers (CSP, HSTS, XSS protection) and get a grade",
    icon: "🛡️",
    color: "from-red-500 to-red-600",
    category: "Security",
  },
  {
    id: "apiflow",
    name: "API Flow Visualizer",
    description: "Visualize and document API request/response flows",
    icon: "🌐",
    color: "from-indigo-500 to-indigo-600",
    category: "API Tools",
  },
  {
    id: "json",
    name: "JSON Transformer",
    description: "Format, validate, and transform JSON data structures",
    icon: "⚡",
    color: "from-yellow-500 to-yellow-600",
    category: "Data Tools",
  },
];

export default function App() {
  const [selectedTool, setSelectedTool] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const renderTool = () => {
    switch (selectedTool) {
      case "regex":
        return <Regex />;
      case "diff":
        return <TextDiff />;
      case "json":
        return <JsonTransformer />;
      case "git":
        return <GitCommitHelper />;
      case "apiflow":
        return <ApiFlowVisualizer />;
      case "responsive-debugger":
        return <ResponsiveDebugger />;
      case "sql":
        return <SqlVisualizer />;
      case "jwt":
        return <JwtInspector />;
      case "accessibility":
        return <AccessibilityChecker />;
      case "db-design":
        return <DatabaseSchemaDesigner />;
      case "error-message":
        return <ErrorMessageTranslator />;
      case "css-animation":
        return <CSSAnimationSandbox />;
      case "security-analyzer":
        return <SecurityHeaderAnalyzer />;
      default:
        return (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🛠️</div>
              <h2 className="text-2xl font-bold text-gray-700 dark:text-white mb-2">
                Choose Your Tool
              </h2>
              <p className="text-gray-500 dark:text-white ">
                Select a development tool from above to get started
              </p>
            </div>
          </div>
        );
    }
  };

  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {});

  const getCurrentTool = () => tools.find((tool) => tool.id === selectedTool);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">⚡</div>
              <div role="button" onClick={() => setSelectedTool("")}>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Dev Tools Hub
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Essential tools for developers
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-white ">
                Developed By Kalam Ahmed
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!selectedTool ? (
          /* Tool Selection Grid */
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Your Development Tool
              </h2>
              <p className="text-lg text-gray-600 dark:text-white  max-w-2xl mx-auto">
                A collection of essential tools to boost your development
                productivity
              </p>
            </div>

            {Object.entries(groupedTools).map(([category, categoryTools]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white  border-b border-gray-200 dark:border-gray-700 pb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div
                        className={`h-2 bg-gradient-to-r ${tool.color}`}
                      ></div>
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                            {tool.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {tool.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-white mt-2">
                              {tool.description}
                            </p>
                            <div className="mt-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                Launch Tool →
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Selected Tool View */
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedTool("")}
                className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <span>←</span>
                <span>Back to Tools</span>
              </button>
              <span className="text-gray-400 dark:text-gray-500">/</span>
              <span className="text-gray-600 dark:text-gray-300">
                {getCurrentTool()?.category}
              </span>
              <span className="text-gray-400 dark:text-gray-500">/</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {getCurrentTool()?.name}
              </span>
            </div>

            {/* Tool Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{getCurrentTool()?.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getCurrentTool()?.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getCurrentTool()?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Tool Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {renderTool()}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Dev Tools Hub - Built for developers, by Kalam Ahmed</p>
            <p className="mt-1">
              {tools.length} tools available • More coming soon
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

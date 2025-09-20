import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  Ruler,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Settings,
  Code,
  Palette,
  Layers,
  Maximize2,
  Minimize2,
  Grid3X3,
  Target,
  Zap,
  Copy,
  Search,
  RotateCcw,
  Save,
  Play,
  Pause,
} from "lucide-react";

const DEVICE_PRESETS = {
  mobile: {
    name: "iPhone 12",
    width: 390,
    height: 844,
    userAgent: "iPhone",
    icon: Smartphone,
    color: "bg-blue-500",
  },
  tablet: {
    name: "iPad",
    width: 768,
    height: 1024,
    userAgent: "iPad",
    icon: Tablet,
    color: "bg-green-500",
  },
  desktop: {
    name: "Desktop",
    width: 1200,
    height: 800,
    userAgent: "Desktop",
    icon: Monitor,
    color: "bg-purple-500",
  },
  custom: {
    name: "Custom",
    width: 800,
    height: 600,
    userAgent: "Custom",
    icon: Settings,
    color: "bg-orange-500",
  },
};

const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

const CSS_PROPERTIES_TO_CHECK = [
  "position",
  "display",
  "flex-direction",
  "justify-content",
  "align-items",
  "width",
  "height",
  "margin",
  "padding",
  "border",
  "background",
  "font-size",
  "line-height",
  "color",
  "z-index",
  "overflow",
];

export default function ResponsiveDebugger() {
  const [htmlInput, setHtmlInput] = useState(`<div class="container">
  <header class="header">
    <h1>Responsive Layout</h1>
    <nav class="nav">
      <a href="#" class="nav-item">Home</a>
      <a href="#" class="nav-item">About</a>
      <a href="#" class="nav-item">Contact</a>
    </nav>
  </header>
  <main class="main">
    <div class="card">
      <h2>Card Title</h2>
      <p>This is a responsive card component that should work across all devices.</p>
      <button class="btn">Action</button>
    </div>
  </main>
</div>`);

  const [cssInput, setCssInput] = useState(`.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 20px;
}

.nav {
  display: flex;
  gap: 20px;
}

.nav-item {
  text-decoration: none;
  color: #333;
  padding: 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.nav-item:hover {
  background-color: #f0f0f0;
}

.card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
  }
  
  .nav {
    flex-direction: column;
    width: 100%;
  }
  
  .container {
    padding: 10px;
  }
}`);

  const [iframeSrcDoc, setIframeSrcDoc] = useState("");
  const [viewport, setViewport] = useState("desktop");
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);
  const [issues, setIssues] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showRuler, setShowRuler] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBreakpoints, setShowBreakpoints] = useState(true);
  const [activeBreakpoints, setActiveBreakpoints] = useState([]);
  const [elementMetrics, setElementMetrics] = useState({});
  const [performance, setPerformance] = useState({});
  const [accessibility, setAccessibility] = useState([]);
  const [colorContrast, setColorContrast] = useState([]);

  const iframeRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Update iframe whenever HTML or CSS changes
  useEffect(() => {
    const srcDoc = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
            ${
              showGrid
                ? `
              body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: 
                  linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px);
                background-size: 20px 20px;
                pointer-events: none;
                z-index: 9999;
              }
            `
                : ""
            }
            ${cssInput}
          </style>
        </head>
        <body>
          ${htmlInput}
        </body>
      </html>
    `;
    setIframeSrcDoc(srcDoc);
  }, [htmlInput, cssInput, showGrid]);

  // Run comprehensive analysis after iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const performAnalysis = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const body = doc.body;

        analyzeLayout(doc, body);
        analyzeAccessibility(doc);
        analyzePerformance(doc);
        checkBreakpoints();
      } catch (e) {
        console.error("Error performing analysis:", e);
      }
    };

    const timer = setTimeout(performAnalysis, 500);
    return () => clearTimeout(timer);
  }, [iframeSrcDoc, viewport, customWidth, customHeight]);

  const analyzeLayout = (doc, body) => {
    const newIssues = [];
    const newSuggestions = [];
    const metrics = {};

    // Check overflow
    if (body.scrollWidth > body.clientWidth) {
      newIssues.push({
        type: "overflow",
        severity: "warning",
        message: "Horizontal overflow detected",
        suggestion: "Consider using max-width: 100% or overflow-x: hidden",
      });
    }

    if (body.scrollHeight > body.clientHeight) {
      newIssues.push({
        type: "overflow",
        severity: "info",
        message: "Vertical overflow detected (may be intentional)",
        suggestion: "Check if this is intentional scrolling",
      });
    }

    // Analyze all elements
    const allElements = [...doc.querySelectorAll("*")];
    allElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const styles = iframe.contentWindow.getComputedStyle(el);

      metrics[`element-${index}`] = {
        tagName: el.tagName,
        width: rect.width,
        height: rect.height,
        position: styles.position,
        display: styles.display,
      };

      // Check for fixed widths on mobile
      if (getCurrentViewport().width < 768) {
        const width = parseInt(styles.width);
        if (width > getCurrentViewport().width * 0.9) {
          newIssues.push({
            type: "responsive",
            severity: "error",
            message: `Element <${el.tagName.toLowerCase()}> may be too wide for mobile`,
            suggestion: "Consider using percentage widths or max-width",
          });
        }
      }

      // Check for missing alt text on images
      if (el.tagName === "IMG" && !el.getAttribute("alt")) {
        newIssues.push({
          type: "accessibility",
          severity: "error",
          message: "Image missing alt text",
          suggestion: "Add descriptive alt text for screen readers",
        });
      }

      // Check for small touch targets
      if (
        (el.tagName === "BUTTON" || el.tagName === "A") &&
        (rect.width < 44 || rect.height < 44)
      ) {
        newIssues.push({
          type: "usability",
          severity: "warning",
          message: "Touch target may be too small",
          suggestion: "Ensure interactive elements are at least 44px × 44px",
        });
      }
    });

    // Check for responsive breakpoints usage
    if (!cssInput.includes("@media")) {
      newSuggestions.push({
        type: "enhancement",
        message: "Consider adding media queries for better responsive design",
        code: "@media (max-width: 768px) { /* mobile styles */ }",
      });
    }

    setIssues(newIssues);
    setSuggestions(newSuggestions);
    setElementMetrics(metrics);
  };

  const analyzeAccessibility = (doc) => {
    const accessibilityIssues = [];

    // Check heading hierarchy
    const headings = [...doc.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    if (headings.length > 0) {
      const h1Count = doc.querySelectorAll("h1").length;
      if (h1Count === 0) {
        accessibilityIssues.push("Missing main heading (h1)");
      } else if (h1Count > 1) {
        accessibilityIssues.push("Multiple h1 elements found");
      }
    }

    // Check form labels
    const inputs = [...doc.querySelectorAll("input, textarea, select")];
    inputs.forEach((input) => {
      if (!input.getAttribute("aria-label") && !input.getAttribute("id")) {
        accessibilityIssues.push("Form input missing label or aria-label");
      }
    });

    setAccessibility(accessibilityIssues);
  };

  const analyzePerformance = (doc) => {
    const perfMetrics = {
      elementCount: doc.querySelectorAll("*").length,
      imageCount: doc.querySelectorAll("img").length,
      scriptCount: doc.querySelectorAll("script").length,
      styleRules: cssInput.split("{").length - 1,
    };

    if (perfMetrics.elementCount > 100) {
      perfMetrics.warning = "High DOM complexity detected";
    }

    setPerformance(perfMetrics);
  };

  const checkBreakpoints = () => {
    const currentWidth = getCurrentViewport().width;
    const active = Object.entries(BREAKPOINTS)
      .filter(([_, width]) => currentWidth <= width)
      .map(([name]) => name);

    setActiveBreakpoints(active);
  };

  const getCurrentViewport = () => {
    if (viewport === "custom") {
      return { width: customWidth, height: customHeight };
    }
    return DEVICE_PRESETS[viewport];
  };

  const getViewportStyle = () => {
    const device = getCurrentViewport();
    return {
      width: `${device.width}px`,
      height: `${device.height}px`,
      border: "2px solid #ddd",
      borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    };
  };

  const handleElementClick = (event) => {
    if (!showInspector) return;

    try {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      const target = event.target;

      if (target && target !== doc.body) {
        const styles = iframe.contentWindow.getComputedStyle(target);
        const rect = target.getBoundingClientRect();

        setSelectedElement({
          tagName: target.tagName,
          className: target.className,
          styles: CSS_PROPERTIES_TO_CHECK.reduce((acc, prop) => {
            acc[prop] = styles[prop];
            return acc;
          }, {}),
          dimensions: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
          },
        });
      }
    } catch (e) {
      console.error("Element inspection error:", e);
    }
  };

  const animateResize = () => {
    if (!isPlaying) return;

    const minWidth = 320;
    const maxWidth = 1200;
    const duration = 5000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      const width =
        minWidth + (maxWidth - minWidth) * Math.sin(progress * Math.PI);

      setCustomWidth(Math.round(width));

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  useEffect(() => {
    if (isPlaying) {
      setViewport("custom");
      animateResize();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const exportCode = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Layout</title>
    <style>
${cssInput}
    </style>
</head>
<body>
${htmlInput}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "responsive-layout.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const loadPreset = (presetType) => {
    const presets = {
      navigation: {
        html: `<nav class="navbar">
  <div class="nav-brand">Logo</div>
  <div class="nav-toggle">☰</div>
  <ul class="nav-menu">
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Services</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
</nav>`,
        css: `.navbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #333; color: white; }
.nav-toggle { display: none; cursor: pointer; }
.nav-menu { display: flex; list-style: none; margin: 0; padding: 0; gap: 2rem; }
.nav-menu a { color: white; text-decoration: none; }
@media (max-width: 768px) {
  .nav-toggle { display: block; }
  .nav-menu { display: none; position: absolute; top: 100%; left: 0; width: 100%; flex-direction: column; background: #333; }
  .nav-menu.active { display: flex; }
}`,
      },
      card: {
        html: `<div class="card-grid">
  <div class="card">
    <img src="https://via.placeholder.com/300x200" alt="Card image">
    <div class="card-content">
      <h3>Card Title</h3>
      <p>Card description goes here.</p>
      <button class="btn">Read More</button>
    </div>
  </div>
</div>`,
        css: `.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; padding: 2rem; }
.card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.card img { width: 100%; height: 200px; object-fit: cover; }
.card-content { padding: 1.5rem; }
.btn { background: #007bff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; }`,
      },
    };

    if (presets[presetType]) {
      setHtmlInput(presets[presetType].html);
      setCssInput(presets[presetType].css);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
   

        {/* Controls Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Device Presets */}
            <div className="flex items-center gap-2">
              {Object.entries(DEVICE_PRESETS).map(([key, device]) => {
                const IconComponent = device.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setViewport(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      viewport === key
                        ? `${device.color} text-white`
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden sm:inline">{device.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                  isPlaying
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isPlaying ? "Stop" : "Animate"}
              </button>

              <button
                onClick={() => setShowRuler(!showRuler)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  showRuler
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <Ruler className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  showGrid
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowInspector(!showInspector)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  showInspector
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={exportCode}
                className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="gird grid-flow-cols-1">
        <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview ({getCurrentViewport().width}×
                    {getCurrentViewport().height})
                  </h3>
                  {showRuler && (
                    <div className="text-xs text-gray-500">
                      {activeBreakpoints.join(", ") || "No active breakpoints"}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="bg-gray-100 rounded-lg p-4 flex justify-center items-center">
                  {showRuler && (
                    <div className="absolute top-0 left-0 h-6 bg-yellow-100 border-b border-yellow-300 flex items-center text-xs font-mono px-2 z-10">
                      {getCurrentViewport().width}px
                    </div>
                  )}

                  <iframe
                    ref={iframeRef}
                    srcDoc={iframeSrcDoc}
                    title="Preview"
                    style={getViewportStyle()}
                    className="bg-white"
                    onClick={showInspector ? handleElementClick : undefined}
                  />
                </div>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Code Editor */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Code Editor
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadPreset("navigation")}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Navigation
                    </button>
                    <button
                      onClick={() => loadPreset("card")}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Card Grid
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      HTML
                    </label>
                    <button
                      onClick={() => copyToClipboard(htmlInput)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    className="w-full h-40 border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Enter HTML markup..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      CSS
                    </label>
                    <button
                      onClick={() => copyToClipboard(cssInput)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <textarea
                    value={cssInput}
                    onChange={(e) => setCssInput(e.target.value)}
                    className="w-full h-64 border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Enter CSS styles..."
                  />
                </div>
              </div>
            </div>

            {/* Custom Viewport Controls */}
            {viewport === "custom" && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="font-semibold mb-3">Custom Viewport</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) =>
                        setCustomWidth(parseInt(e.target.value) || 800)
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="320"
                      max="1920"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) =>
                        setCustomHeight(parseInt(e.target.value) || 600)
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="200"
                      max="1200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="xl:col-span-1">
      

            {/* Breakpoint Indicators */}
            {showBreakpoints && (
              <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
                <h4 className="font-semibold mb-3">Breakpoints</h4>
                <div className="space-y-2">
                  {Object.entries(BREAKPOINTS).map(([name, width]) => (
                    <div
                      key={name}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        activeBreakpoints.includes(name)
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="font-medium">{name}</span>
                      <span>{width}px</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analysis Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Issues & Suggestions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b p-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Analysis ({issues.length} issues)
                </h3>
              </div>

              <div className="p-4 max-h-64 overflow-y-auto">
                {issues.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    No issues detected
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          issue.severity === "error"
                            ? "bg-red-50 border-red-400"
                            : issue.severity === "warning"
                            ? "bg-yellow-50 border-yellow-400"
                            : "bg-blue-50 border-blue-400"
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-800">
                          {issue.message}
                        </div>
                        {issue.suggestion && (
                          <div className="text-xs text-gray-600 mt-1">
                            💡 {issue.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Suggestions
                    </h5>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-2 bg-yellow-50 rounded text-xs"
                        >
                          <div className="font-medium">
                            {suggestion.message}
                          </div>
                          {suggestion.code && (
                            <code className="block mt-1 p-2 bg-gray-800 text-green-400 rounded font-mono">
                              {suggestion.code}
                            </code>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Element Inspector */}
            {showInspector && selectedElement && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b p-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Element Inspector
                  </h3>
                </div>

                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Element
                      </div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {selectedElement.tagName.toLowerCase()}
                        {selectedElement.className &&
                          `.${selectedElement.className}`}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Dimensions
                      </div>
                      <div className="text-xs space-y-1">
                        <div>
                          Width: {Math.round(selectedElement.dimensions.width)}
                          px
                        </div>
                        <div>
                          Height:{" "}
                          {Math.round(selectedElement.dimensions.height)}px
                        </div>
                        <div>
                          Position:{" "}
                          {Math.round(selectedElement.dimensions.left)},{" "}
                          {Math.round(selectedElement.dimensions.top)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Key Styles
                      </div>
                      <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                        {Object.entries(selectedElement.styles).map(
                          ([prop, value]) => (
                            <div key={prop} className="flex justify-between">
                              <span className="text-gray-600">{prop}:</span>
                              <span className="font-mono">{value}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b p-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Performance
                </h3>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">DOM Elements</span>
                    <span
                      className={`text-sm font-medium ${
                        performance.elementCount > 100
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {performance.elementCount || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Images</span>
                    <span className="text-sm font-medium">
                      {performance.imageCount || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CSS Rules</span>
                    <span className="text-sm font-medium">
                      {performance.styleRules || 0}
                    </span>
                  </div>

                  {performance.warning && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⚠️ {performance.warning}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Accessibility Check */}
            {accessibility.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b p-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Accessibility ({accessibility.length})
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    {accessibility.map((issue, index) => (
                      <div
                        key={index}
                        className="p-2 bg-orange-50 border-l-4 border-orange-400 text-sm"
                      >
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Element Metrics */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b p-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Element Metrics
                </h3>
              </div>

              <div className="p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {Object.entries(elementMetrics)
                    .slice(0, 10)
                    .map(([key, metric]) => (
                      <div key={key} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">
                          {metric.tagName.toLowerCase()} - {metric.display}
                        </div>
                        <div className="text-gray-600">
                          {Math.round(metric.width)}×{Math.round(metric.height)}
                          px
                        </div>
                      </div>
                    ))}
                  {Object.keys(elementMetrics).length > 10 && (
                    <div className="text-center text-xs text-gray-500 pt-2">
                      ... and {Object.keys(elementMetrics).length - 10} more
                      elements
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b p-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setHtmlInput("");
                      setCssInput("");
                    }}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>

                  <button
                    onClick={() => {
                      const saved = { html: htmlInput, css: cssInput };
                      localStorage.setItem(
                        "responsive-debugger-save",
                        JSON.stringify(saved)
                      );
                    }}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>

                  <button
                    onClick={() => {
                      const saved = localStorage.getItem(
                        "responsive-debugger-save"
                      );
                      if (saved) {
                        const { html, css } = JSON.parse(saved);
                        setHtmlInput(html);
                        setCssInput(css);
                      }
                    }}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    Load
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Copy, Download } from "lucide-react";

const CSSAnimationSandbox = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationName, setAnimationName] = useState("myAnimation");
  const [duration, setDuration] = useState(2);
  const [timingFunction, setTimingFunction] = useState("ease");
  const [iterationCount, setIterationCount] = useState("infinite");
  const [direction, setDirection] = useState("normal");
  const [delay, setDelay] = useState(0);
  const [fillMode, setFillMode] = useState("none");

  const [keyframes, setKeyframes] = useState(`0% {
  transform: translateX(0px);
  background-color: #3b82f6;
}

50% {
  transform: translateX(200px) rotate(180deg);
  background-color: #ef4444;
}

100% {
  transform: translateX(0px);
  background-color: #3b82f6;
}`);

  const timingFunctions = [
    "linear",
    "ease",
    "ease-in",
    "ease-out",
    "ease-in-out",
    "cubic-bezier(0.25, 0.1, 0.25, 1)",
    "cubic-bezier(0.42, 0, 0.58, 1)",
    "cubic-bezier(0.42, 0, 1, 1)",
    "cubic-bezier(0, 0, 0.58, 1)",
  ];

  const iterationOptions = ["1", "2", "3", "infinite"];
  const directionOptions = [
    "normal",
    "reverse",
    "alternate",
    "alternate-reverse",
  ];
  const fillModeOptions = ["none", "forwards", "backwards", "both"];

  const generateCSS = () => {
    return `@keyframes ${animationName} {
${keyframes}
}

.animated-element {
  animation: ${animationName} ${duration}s ${timingFunction} ${delay}s ${iterationCount} ${direction} ${fillMode};
}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCSS());
  };

  const downloadCSS = () => {
    const blob = new Blob([generateCSS()], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${animationName}.css`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAnimation = () => {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 10);
  };

  const previewElement = React.useMemo(() => {
    const style = {
      width: "60px",
      height: "60px",
      backgroundColor: "#3b82f6",
      borderRadius: "8px",
      margin: "40px auto",
      ...(isPlaying && {
        animation: `${animationName} ${duration}s ${timingFunction} ${delay}s ${iterationCount} ${direction} ${fillMode}`,
      }),
    };
    return <div style={style}></div>;
  }, [
    isPlaying,
    animationName,
    duration,
    timingFunction,
    delay,
    iterationCount,
    direction,
    fillMode,
    keyframes,
  ]);

  // Inject keyframes into document
  useEffect(() => {
    const styleId = "dynamic-keyframes";
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `@keyframes ${animationName} { ${keyframes} }`;

    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, [keyframes, animationName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
   

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Animation Properties */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">
                Animation Properties
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Animation Name
                  </label>
                  <input
                    type="text"
                    value={animationName}
                    onChange={(e) => setAnimationName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Timing Function
                  </label>
                  <select
                    value={timingFunction}
                    onChange={(e) => setTimingFunction(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timingFunctions.map((func) => (
                      <option key={func} value={func}>
                        {func}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Delay (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={delay}
                    onChange={(e) => setDelay(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Iteration Count
                  </label>
                  <select
                    value={iterationCount}
                    onChange={(e) => setIterationCount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {iterationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Direction
                  </label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {directionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Fill Mode
                  </label>
                  <select
                    value={fillMode}
                    onChange={(e) => setFillMode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fillModeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Timing Curve Visualization */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Timing Curve
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 h-32 flex items-center justify-center">
                <div className="text-gray-400 text-sm text-center">
                  <div className="font-mono">{timingFunction}</div>
                  <div className="mt-2 text-xs">
                    Visual curve representation
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Live Preview
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center space-x-1 transition-colors"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isPlaying ? "Pause" : "Play"}</span>
                  </button>
                  <button
                    onClick={resetAnimation}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center space-x-1 transition-colors"
                  >
                    <RotateCcw size={16} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 min-h-40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                {previewElement}
              </div>
            </div>

            {/* Keyframes Editor */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Keyframes Editor
              </h3>
              <textarea
                value={keyframes}
                onChange={(e) => setKeyframes(e.target.value)}
                className="w-full h-48 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter your keyframes here..."
              />
            </div>
          </div>

          {/* Generated Code Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Generated CSS
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center space-x-1 transition-colors"
                  >
                    <Copy size={16} />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={downloadCSS}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center space-x-1 transition-colors"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-auto">
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                  {generateCSS()}
                </pre>
              </div>

              {/* Quick Presets */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                  Quick Presets
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setKeyframes(`0% { transform: translateX(0); }
100% { transform: translateX(200px); }`);
                      setAnimationName("slideRight");
                      setDuration(1);
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    Slide Right
                  </button>
                  <button
                    onClick={() => {
                      setKeyframes(`0% { transform: scale(1); }
50% { transform: scale(1.2); }
100% { transform: scale(1); }`);
                      setAnimationName("pulse");
                      setDuration(2);
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    Pulse
                  </button>
                  <button
                    onClick={() => {
                      setKeyframes(`0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }`);
                      setAnimationName("spin");
                      setDuration(2);
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    Spin
                  </button>
                  <button
                    onClick={() => {
                      setKeyframes(`0% { opacity: 0; transform: translateY(20px); }
100% { opacity: 1; transform: translateY(0); }`);
                      setAnimationName("fadeInUp");
                      setDuration(1);
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    Fade In Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSSAnimationSandbox;

import { useState } from "react";
import _ from "lodash";

export default function JsonTransformer() {
  const [jsonInput, setJsonInput] = useState(`{
  "user": {
    "name": "Alice",
    "email": "alice@example.com",
    "age": 28,
    "isActive": true,
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  "posts": [
    { "id": 1, "title": "Hello World", "views": 150, "tags": ["intro", "welcome"] },
    { "id": 2, "title": "JSON Tips", "views": 200, "tags": ["tutorial", "json"] }
  ],
  "metadata": {
    "created_at": "2024-01-15",
    "last_updated": "2024-01-20"
  }
}`);
  const [transformedJson, setTransformedJson] = useState("");
  const [caseStyle, setCaseStyle] = useState("none");
  const [filterKey, setFilterKey] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [replaceKey, setReplaceKey] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [jsonPath, setJsonPath] = useState("");
  const [maxDepth, setMaxDepth] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showMessage = (message, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 3000);
  };

  const handleTransform = (action) => {
    try {
      let obj = JSON.parse(jsonInput);

      switch (action) {
        case "flatten":
          obj = flattenObject(obj, maxDepth ? parseInt(maxDepth) : undefined);
          break;
        case "unflatten":
          obj = unflattenObject(obj);
          break;
        case "changeCase":
          obj = changeCase(obj, caseStyle);
          break;
        case "filter":
          obj = filterKeys(obj, filterKey);
          break;
        case "sort":
          obj = sortObject(obj, sortBy);
          break;
        case "search":
          obj = searchInObject(obj, searchValue);
          break;
        case "replace":
          obj = replaceInObject(obj, searchValue, replaceValue);
          break;
        case "extract":
          obj = extractPath(obj, jsonPath);
          break;
        case "minify":
          setTransformedJson(JSON.stringify(obj));
          showMessage("JSON minified successfully!");
          return;
        case "validate":
          validateJson(jsonInput);
          return;
        case "generateTS":
          obj = generateTSInterface(obj);
          setTransformedJson(obj);
          showMessage("TypeScript interface generated!");
          return;
        case "generateSchema":
          obj = generateJSONSchema(obj);
          break;
        case "removeDuplicates":
          obj = removeDuplicates(obj);
          break;
        case "merge":
          // This would require a second JSON input in a real implementation
          showMessage("Merge feature requires two JSON objects", true);
          return;
        case "statistics":
          obj = generateStatistics(obj);
          setTransformedJson(JSON.stringify(obj, null, 2));
          showMessage("Statistics generated!");
          return;
        case "prettyPrint":
          obj = JSON.parse(jsonInput);
          break;
        default:
          break;
      }

      setTransformedJson(JSON.stringify(obj, null, 2));
      showMessage(`${action.charAt(0).toUpperCase() + action.slice(1)} operation completed!`);
    } catch (err) {
      showMessage(`Error: ${err.message}`, true);
      setTransformedJson("");
    }
  };

  const flattenObject = (obj, maxDepth = undefined) => {
    const result = {};
    
    function recurse(current, prop, depth = 0) {
      if (maxDepth !== undefined && depth >= maxDepth) {
        result[prop] = current;
        return;
      }
      
      if (Object(current) !== current) {
        result[prop] = current;
      } else if (Array.isArray(current)) {
        for (let i = 0, l = current.length; i < l; i++) {
          recurse(current[i], prop + "[" + i + "]", depth + 1);
        }
        if (current.length === 0) result[prop] = [];
      } else {
        let isEmpty = true;
        for (let p in current) {
          isEmpty = false;
          recurse(current[p], prop ? prop + "." + p : p, depth + 1);
        }
        if (isEmpty && prop) result[prop] = {};
      }
    }
    
    recurse(obj, "");
    return result;
  };

  const unflattenObject = (obj) => {
    const result = {};
    
    for (let key in obj) {
      const keys = key.split(/[\.\[\]]/);
      keys.reduce((acc, k, i) => {
        if (k === '') return acc;
        
        if (i === keys.length - 1) {
          acc[k] = obj[key];
        } else {
          const nextKey = keys[i + 1];
          if (!acc[k]) {
            acc[k] = /^\d+$/.test(nextKey) ? [] : {};
          }
        }
        return acc[k];
      }, result);
    }
    
    return result;
  };

  const changeCase = (obj, style) => {
    const traverse = (o) => {
      if (Array.isArray(o)) return o.map(traverse);
      if (o !== null && typeof o === "object") {
        return Object.fromEntries(
          Object.entries(o).map(([k, v]) => [
            convertCase(k, style),
            traverse(v),
          ])
        );
      }
      return o;
    };
    return traverse(obj);
  };

  const convertCase = (str, style) => {
    switch (style) {
      case "camel":
        return _.camelCase(str);
      case "snake":
        return _.snakeCase(str);
      case "kebab":
        return _.kebabCase(str);
      case "pascal":
        return _.upperFirst(_.camelCase(str));
      case "constant":
        return _.upperCase(str).replace(/ /g, '_');
      case "lower":
        return str.toLowerCase();
      case "upper":
        return str.toUpperCase();
      default:
        return str;
    }
  };

  const filterKeys = (obj, keyFilter) => {
    const traverse = (o) => {
      if (Array.isArray(o)) return o.map(traverse);
      if (o !== null && typeof o === "object") {
        return Object.fromEntries(
          Object.entries(o)
            .filter(([k]) => k.toLowerCase().includes(keyFilter.toLowerCase()))
            .map(([k, v]) => [k, traverse(v)])
        );
      }
      return o;
    };
    return traverse(obj);
  };

  const sortObject = (obj, sortBy) => {
    const traverse = (o) => {
      if (Array.isArray(o)) {
        if (sortBy === "length") return o.sort((a, b) => JSON.stringify(a).length - JSON.stringify(b).length);
        if (sortBy === "value" && o.every(item => typeof item === "number")) return [...o].sort((a, b) => a - b);
        if (sortBy === "value" && o.every(item => typeof item === "string")) return [...o].sort();
        return o.map(traverse);
      }
      if (o !== null && typeof o === "object") {
        const sortedEntries = Object.entries(o).sort(([a], [b]) => {
          if (sortBy === "key") return a.localeCompare(b);
          return 0;
        });
        return Object.fromEntries(
          sortedEntries.map(([k, v]) => [k, traverse(v)])
        );
      }
      return o;
    };
    return traverse(obj);
  };

  const searchInObject = (obj, searchTerm) => {
    const results = {};
    const search = searchTerm.toLowerCase();
    
    const traverse = (o, path = "") => {
      if (Array.isArray(o)) {
        o.forEach((item, index) => {
          traverse(item, `${path}[${index}]`);
        });
      } else if (o !== null && typeof o === "object") {
        Object.entries(o).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (key.toLowerCase().includes(search) || 
              (typeof value === "string" && value.toLowerCase().includes(search))) {
            _.set(results, currentPath, value);
          }
          traverse(value, currentPath);
        });
      }
    };
    
    traverse(obj);
    return results;
  };

  const replaceInObject = (obj, searchTerm, replaceTerm) => {
    const traverse = (o) => {
      if (Array.isArray(o)) return o.map(traverse);
      if (o !== null && typeof o === "object") {
        return Object.fromEntries(
          Object.entries(o).map(([k, v]) => [
            k.replace(new RegExp(searchTerm, 'gi'), replaceTerm),
            typeof v === "string" ? v.replace(new RegExp(searchTerm, 'gi'), replaceTerm) : traverse(v)
          ])
        );
      }
      return typeof o === "string" ? o.replace(new RegExp(searchTerm, 'gi'), replaceTerm) : o;
    };
    return traverse(obj);
  };

  const extractPath = (obj, path) => {
    try {
      return _.get(obj, path);
    } catch {
      throw new Error("Invalid path");
    }
  };

  const validateJson = (jsonString) => {
    try {
      JSON.parse(jsonString);
      showMessage("✅ Valid JSON!");
    } catch (err) {
      showMessage(`❌ Invalid JSON: ${err.message}`, true);
    }
  };

  const generateTSInterface = (obj, interfaceName = "Root") => {
    let result = `interface ${interfaceName} ${generateType(obj)}\n`;
    return result;
  };

  const generateType = (obj) => {
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "any[]";
      return generateType(obj[0]) + "[]";
    }
    if (obj !== null && typeof obj === "object") {
      let entries = Object.entries(obj)
        .map(([k, v]) => `  ${k}: ${generateType(v)};`)
        .join("\n");
      return `{\n${entries}\n}`;
    }
    switch (typeof obj) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      default:
        return "any";
    }
  };

  const generateJSONSchema = (obj) => {
    const getType = (value) => {
      if (Array.isArray(value)) return "array";
      if (value === null) return "null";
      return typeof value;
    };

    const generateSchema = (value) => {
      const type = getType(value);
      const schema = { type };

      if (type === "object") {
        schema.properties = {};
        Object.entries(value).forEach(([key, val]) => {
          schema.properties[key] = generateSchema(val);
        });
        schema.required = Object.keys(value);
      } else if (type === "array" && value.length > 0) {
        schema.items = generateSchema(value[0]);
      }

      return schema;
    };

    return {
      $schema: "http://json-schema.org/draft-07/schema#",
      ...generateSchema(obj)
    };
  };

  const removeDuplicates = (obj) => {
    const traverse = (o) => {
      if (Array.isArray(o)) {
        return _.uniqWith(o.map(traverse), _.isEqual);
      }
      if (o !== null && typeof o === "object") {
        return Object.fromEntries(
          Object.entries(o).map(([k, v]) => [k, traverse(v)])
        );
      }
      return o;
    };
    return traverse(obj);
  };

  const generateStatistics = (obj) => {
    const stats = {
      totalKeys: 0,
      totalValues: 0,
      dataTypes: {},
      depth: 0,
      arrayLengths: [],
      stringLengths: [],
      numberRanges: { min: Infinity, max: -Infinity }
    };

    const traverse = (o, currentDepth = 0) => {
      stats.depth = Math.max(stats.depth, currentDepth);
      
      if (Array.isArray(o)) {
        stats.arrayLengths.push(o.length);
        o.forEach(item => traverse(item, currentDepth + 1));
      } else if (o !== null && typeof o === "object") {
        Object.entries(o).forEach(([key, value]) => {
          stats.totalKeys++;
          stats.totalValues++;
          
          const type = typeof value;
          stats.dataTypes[type] = (stats.dataTypes[type] || 0) + 1;
          
          if (type === "string") {
            stats.stringLengths.push(value.length);
          } else if (type === "number") {
            stats.numberRanges.min = Math.min(stats.numberRanges.min, value);
            stats.numberRanges.max = Math.max(stats.numberRanges.max, value);
          }
          
          traverse(value, currentDepth + 1);
        });
      } else {
        stats.totalValues++;
        const type = typeof o;
        stats.dataTypes[type] = (stats.dataTypes[type] || 0) + 1;
      }
    };

    traverse(obj);

    return {
      ...stats,
      averageStringLength: stats.stringLengths.length ? 
        Math.round(stats.stringLengths.reduce((a, b) => a + b, 0) / stats.stringLengths.length) : 0,
      averageArrayLength: stats.arrayLengths.length ?
        Math.round(stats.arrayLengths.reduce((a, b) => a + b, 0) / stats.arrayLengths.length) : 0
    };
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transformedJson);
    showMessage("Copied to clipboard!");
  };

  const clearAll = () => {
    setJsonInput("");
    setTransformedJson("");
    setFilterKey("");
    setSortBy("");
    setSearchValue("");
    setReplaceKey("");
    setReplaceValue("");
    setJsonPath("");
    setMaxDepth("");
    showMessage("All fields cleared!");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          🔧 Enhanced JSON Transformer
        </h2>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Input Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Input JSON:</label>
          <textarea
            className="w-full border-2 border-gray-300 rounded-lg p-3 h-64 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON here..."
          />
        </div>
      {/* Output Section */}
      <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Output:</label>
            <div className="text-sm text-gray-500">
              {transformedJson ? `${transformedJson.length} characters` : ""}
            </div>
          </div>
          <textarea
            className="w-full border-2 border-gray-300 rounded-lg p-3 h-64 font-mono text-sm bg-gray-50"
            value={transformedJson}
            readOnly
            placeholder="Transformed JSON will appear here..."
          />
        </div>
        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Basic Operations */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-blue-800">Basic Operations</h3>
            <div className="space-y-2">
              <button
                className="w-full px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                onClick={() => handleTransform("flatten")}
              >
                🔄 Flatten
              </button>
              <button
                className="w-full px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                onClick={() => handleTransform("unflatten")}
              >
                🔄 Unflatten
              </button>
              <input
                type="number"
                placeholder="Max depth (optional)"
                value={maxDepth}
                onChange={(e) => setMaxDepth(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>

          {/* Case Conversion */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-green-800">Case Conversion</h3>
            <div className="space-y-2">
              <select
                className="w-full border rounded px-2 py-1"
                value={caseStyle}
                onChange={(e) => setCaseStyle(e.target.value)}
              >
                <option value="none">Select Case Style</option>
                <option value="camel">camelCase</option>
                <option value="pascal">PascalCase</option>
                <option value="snake">snake_case</option>
                <option value="kebab">kebab-case</option>
                <option value="constant">CONSTANT_CASE</option>
                <option value="lower">lowercase</option>
                <option value="upper">UPPERCASE</option>
              </select>
              <button
                className="w-full px-3 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                onClick={() => handleTransform("changeCase")}
              >
                🔤 Apply Case
              </button>
            </div>
          </div>

          {/* Filtering & Sorting */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-purple-800">Filter & Sort</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Filter by key name..."
                value={filterKey}
                onChange={(e) => setFilterKey(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
              <button
                className="w-full px-3 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                onClick={() => handleTransform("filter")}
              >
                🔍 Filter Keys
              </button>
              <select
                className="w-full border rounded px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Sort Options</option>
                <option value="key">Sort by Key</option>
                <option value="value">Sort by Value</option>
                <option value="length">Sort by Length</option>
              </select>
              <button
                className="w-full px-3 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                onClick={() => handleTransform("sort")}
              >
                🔢 Sort
              </button>
            </div>
          </div>

          {/* Search & Replace */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-orange-800">Search & Replace</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search term..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
              <button
                className="w-full px-3 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                onClick={() => handleTransform("search")}
              >
                🔍 Search
              </button>
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
              <button
                className="w-full px-3 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                onClick={() => handleTransform("replace")}
              >
                🔄 Replace
              </button>
            </div>
          </div>

          {/* Path Operations */}
          <div className="bg-teal-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-teal-800">Path Operations</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="JSON path (e.g., user.name)"
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
              <button
                className="w-full px-3 py-2 rounded bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                onClick={() => handleTransform("extract")}
              >
                📤 Extract Path
              </button>
            </div>
          </div>

          {/* Generation Tools */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-indigo-800">Generation</h3>
            <div className="space-y-2">
              <button
                className="w-full px-3 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                onClick={() => handleTransform("generateTS")}
              >
                📝 TypeScript Interface
              </button>
              <button
                className="w-full px-3 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                onClick={() => handleTransform("generateSchema")}
              >
                📋 JSON Schema
              </button>
              <button
                className="w-full px-3 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                onClick={() => handleTransform("statistics")}
              >
                📊 Statistics
              </button>
            </div>
          </div>
        </div>

        {/* Utility Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            onClick={() => handleTransform("prettyPrint")}
          >
            ✨ Pretty Print
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            onClick={() => handleTransform("minify")}
          >
            🗜️ Minify
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            onClick={() => handleTransform("validate")}
          >
            ✅ Validate
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            onClick={() => handleTransform("removeDuplicates")}
          >
            🗑️ Remove Duplicates
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            onClick={copyToClipboard}
          >
            📋 Copy Output
          </button>
          <button
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            onClick={clearAll}
          >
            🗑️ Clear All
          </button>
        </div>

  

        {/* Help Section */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Features:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-700">
            <div>• Flatten/Unflatten objects</div>
            <div>• Case conversion (7 styles)</div>
            <div>• Filter by key names</div>
            <div>• Sort objects and arrays</div>
            <div>• Search and replace</div>
            <div>• Extract JSON paths</div>
            <div>• Generate TypeScript interfaces</div>
            <div>• Create JSON schemas</div>
            <div>• Remove duplicates</div>
            <div>• JSON validation</div>
            <div>• Statistics generation</div>
            <div>• Pretty print & minify</div>
          </div>
        </div>
      </div>
    </div>
  );
}
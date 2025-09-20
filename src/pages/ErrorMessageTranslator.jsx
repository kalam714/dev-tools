import React, { useState, useRef } from 'react';
import { AlertTriangle, Search, Copy, RefreshCw, BookOpen, Lightbulb, Code, Bug, Zap, CheckCircle } from 'lucide-react';

const ErrorMessageTranslator = () => {
  const [errorInput, setErrorInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const textareaRef = useRef(null);

  // Error patterns and their explanations
  const errorPatterns = {
    react: {
      patterns: [
        {
          regex: /Cannot read propert(y|ies) of (undefined|null)/i,
          type: 'React - Undefined Property',
          explanation: 'You\'re trying to access a property on an undefined or null value.',
          commonCauses: [
            'State hasn\'t been initialized yet',
            'Props not passed correctly',
            'Async data hasn\'t loaded',
            'Destructuring undefined objects'
          ],
          solutions: [
            'Use optional chaining: obj?.property',
            'Add conditional rendering: {data && <Component />}',
            'Initialize state with default values',
            'Add loading states for async data'
          ],
          example: `// ❌ Bad
const user = getUserData(); // might be undefined
return <div>{user.name}</div>;

// ✅ Good
const user = getUserData();
return <div>{user?.name || 'Loading...'}</div>;`
        },
        {
          regex: /Objects are not valid as a React child/i,
          type: 'React - Invalid Child',
          explanation: 'You\'re trying to render an object directly in JSX.',
          commonCauses: [
            'Rendering object instead of string/number',
            'Missing .map() for arrays',
            'Returning object from component',
            'Date objects in JSX'
          ],
          solutions: [
            'Convert object to string: JSON.stringify(obj)',
            'Extract specific properties: obj.property',
            'Use .map() for arrays',
            'Format dates: date.toLocaleDateString()'
          ],
          example: `// ❌ Bad
return <div>{userObject}</div>;

// ✅ Good
return <div>{userObject.name}</div>;
// or
return <div>{JSON.stringify(userObject)}</div>;`
        },
        {
          regex: /Hook.*called.*outside.*function component/i,
          type: 'React - Hook Rules Violation',
          explanation: 'React hooks can only be called inside function components or custom hooks.',
          commonCauses: [
            'Calling hooks in regular functions',
            'Calling hooks conditionally',
            'Calling hooks in loops',
            'Calling hooks in event handlers'
          ],
          solutions: [
            'Move hooks to component top level',
            'Create custom hooks for reusable logic',
            'Use useEffect for side effects',
            'Follow the Rules of Hooks'
          ],
          example: `// ❌ Bad
function handleClick() {
  const [state] = useState();
}

// ✅ Good
function MyComponent() {
  const [state, setState] = useState();
  
  function handleClick() {
    setState(newValue);
  }
}`
        }
      ]
    },
    javascript: {
      patterns: [
        {
          regex: /(.*) is not a function/i,
          type: 'JavaScript - Not a Function',
          explanation: 'You\'re trying to call something that isn\'t a function.',
          commonCauses: [
            'Variable is undefined or null',
            'Typo in function name',
            'Wrong data type (string, number, etc.)',
            'Async function not awaited'
          ],
          solutions: [
            'Check if variable exists before calling',
            'Verify function name spelling',
            'Check the actual data type',
            'Use typeof to validate before calling'
          ],
          example: `// ❌ Bad
const data = getData(); // returns undefined
data.forEach(...); // Error!

// ✅ Good
const data = getData();
if (Array.isArray(data)) {
  data.forEach(...);
}`
        },
        {
          regex: /Unexpected token/i,
          type: 'JavaScript - Syntax Error',
          explanation: 'There\'s a syntax error in your code - unexpected character or structure.',
          commonCauses: [
            'Missing brackets, parentheses, or quotes',
            'Incorrect JSON format',
            'Reserved keywords used incorrectly',
            'Invalid characters in code'
          ],
          solutions: [
            'Check for matching brackets/quotes',
            'Validate JSON structure',
            'Use proper variable names',
            'Check for typos and invisible characters'
          ],
          example: `// ❌ Bad
const obj = {
  name: "John"
  age: 30  // Missing comma
};

// ✅ Good
const obj = {
  name: "John",
  age: 30
};`
        },
        {
          regex: /Cannot access '.*' before initialization/i,
          type: 'JavaScript - Temporal Dead Zone',
          explanation: 'You\'re trying to use a variable before it\'s declared with let/const.',
          commonCauses: [
            'Using variable before declaration',
            'Hoisting confusion with let/const',
            'Circular dependencies',
            'Block scope issues'
          ],
          solutions: [
            'Move declaration before usage',
            'Use var if hoisting is needed',
            'Restructure code flow',
            'Initialize variables properly'
          ],
          example: `// ❌ Bad
console.log(myVar); // Error!
const myVar = "hello";

// ✅ Good
const myVar = "hello";
console.log(myVar);`
        }
      ]
    },
    sql: {
      patterns: [
        {
          regex: /Syntax error.*near/i,
          type: 'SQL - Syntax Error',
          explanation: 'There\'s a syntax error in your SQL query.',
          commonCauses: [
            'Missing commas or semicolons',
            'Incorrect keyword order',
            'Wrong quotation marks',
            'Reserved words as column names'
          ],
          solutions: [
            'Check SQL syntax carefully',
            'Use backticks for reserved words',
            'Verify comma placement',
            'Check quote types (single vs double)'
          ],
          example: `-- ❌ Bad
SELECT name age FROM users WHERE id = 1;

-- ✅ Good
SELECT name, age FROM users WHERE id = 1;`
        },
        {
          regex: /Column '.*' cannot be null/i,
          type: 'SQL - Null Constraint Violation',
          explanation: 'You\'re trying to insert NULL into a column that doesn\'t allow it.',
          commonCauses: [
            'Missing required field in INSERT',
            'NULL value in NOT NULL column',
            'Improper UPDATE statement',
            'Default value not set'
          ],
          solutions: [
            'Provide values for all required columns',
            'Set default values in schema',
            'Use COALESCE for NULL handling',
            'Check column constraints'
          ],
          example: `-- ❌ Bad
INSERT INTO users (name) VALUES (NULL);

-- ✅ Good
INSERT INTO users (name) VALUES ('John Doe');`
        },
        {
          regex: /Unknown column '.*' in '.*'/i,
          type: 'SQL - Unknown Column',
          explanation: 'You\'re referencing a column that doesn\'t exist.',
          commonCauses: [
            'Typo in column name',
            'Column doesn\'t exist in table',
            'Wrong table reference',
            'Case sensitivity issues'
          ],
          solutions: [
            'Check column spelling',
            'Verify table schema',
            'Use DESCRIBE table_name',
            'Check for case sensitivity'
          ],
          example: `-- ❌ Bad
SELECT user_name FROM users; -- Column doesn't exist

-- ✅ Good
SELECT username FROM users; -- Correct column name`
        }
      ]
    },
    network: {
      patterns: [
        {
          regex: /(CORS|Cross-Origin Request Blocked)/i,
          type: 'Network - CORS Error',
          explanation: 'Cross-Origin Resource Sharing policy is blocking your request.',
          commonCauses: [
            'Different domain/port/protocol',
            'Missing CORS headers on server',
            'Preflight request failed',
            'Credentials not allowed'
          ],
          solutions: [
            'Configure server CORS headers',
            'Use proxy in development',
            'Make requests from same origin',
            'Handle preflight requests properly'
          ],
          example: `// Server-side fix (Express.js)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Or use proxy in package.json
"proxy": "http://localhost:8000"`
        },
        {
          regex: /(404|Not Found)/i,
          type: 'Network - 404 Not Found',
          explanation: 'The requested resource could not be found.',
          commonCauses: [
            'Wrong URL or endpoint',
            'Resource moved or deleted',
            'Routing issues',
            'Server not running'
          ],
          solutions: [
            'Check URL spelling',
            'Verify endpoint exists',
            'Check server routes',
            'Ensure server is running'
          ],
          example: `// ❌ Bad
fetch('/api/user/123') // Wrong endpoint

// ✅ Good
fetch('/api/users/123') // Correct endpoint`
        }
      ]
    }
  };

  const analyzeError = () => {
    if (!errorInput.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis delay for better UX
    setTimeout(() => {
      let foundMatch = null;
      
      // Search through all patterns
      for (const [category, categoryData] of Object.entries(errorPatterns)) {
        for (const pattern of categoryData.patterns) {
          if (pattern.regex.test(errorInput)) {
            foundMatch = {
              ...pattern,
              category: category.charAt(0).toUpperCase() + category.slice(1),
              severity: getSeverity(pattern.type)
            };
            break;
          }
        }
        if (foundMatch) break;
      }
      
      // If no specific pattern found, provide generic analysis
      if (!foundMatch) {
        foundMatch = {
          type: 'General Error Analysis',
          category: 'Unknown',
          severity: 'medium',
          explanation: 'This appears to be a programming error. Here are some general debugging steps.',
          commonCauses: [
            'Check for typos in variable/function names',
            'Verify data types and structures',
            'Look for missing imports or dependencies',
            'Check browser console for additional context'
          ],
          solutions: [
            'Read the error message carefully',
            'Check the line number mentioned',
            'Use console.log to debug values',
            'Search for the specific error online'
          ],
          example: 'Use browser developer tools (F12) to get more detailed error information.'
        };
      }
      
      setAnalysis(foundMatch);
      setIsAnalyzing(false);
    }, 800);
  };

  const getSeverity = (type) => {
    if (type.includes('Syntax') || type.includes('Reference')) return 'high';
    if (type.includes('Warning') || type.includes('Deprecated')) return 'low';
    return 'medium';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearAll = () => {
    setErrorInput('');
    setAnalysis(null);
    textareaRef.current?.focus();
  };

  const loadExample = (example) => {
    setErrorInput(example);
    textareaRef.current?.focus();
  };

  const exampleErrors = [
    "TypeError: Cannot read properties of undefined (reading 'map')",
    "Error: Objects are not valid as a React child",
    "ReferenceError: getData is not a function",
    "SyntaxError: Unexpected token '}' in JSON at position 45",
    "Error: Column 'email' cannot be null",
    "CORS error: Access to fetch at 'api/data' has been blocked"
  ];

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
   

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                Paste Your Error
              </h2>
              <button
                onClick={clearAll}
                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                title="Clear all"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
              placeholder="Paste your error message here...

Example:
TypeError: Cannot read properties of undefined (reading 'name')
    at UserProfile (UserProfile.jsx:15:23)
    at renderWithHooks (react-dom.js:1234:56)"
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            />

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={analyzeError}
                disabled={!errorInput.trim() || isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Analyze Error
                  </>
                )}
              </button>

              <button
                onClick={() => copyToClipboard(errorInput)}
                disabled={!errorInput.trim()}
                className="text-gray-500 hover:text-gray-700 disabled:text-gray-300 p-2 rounded transition-colors"
                title="Copy error message"
              >
                <Copy size={18} />
              </button>
            </div>

            {/* Example Errors */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Try these examples:</h3>
              <div className="space-y-2">
                {exampleErrors.slice(0, 3).map((error, index) => (
                  <button
                    key={index}
                    onClick={() => loadExample(error)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    {error}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {!analysis && !isAnalyzing && (
              <div className="text-center py-12">
                <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No Error Analyzed Yet</h3>
                <p className="text-gray-400">Paste an error message and click "Analyze Error" to get started</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-12">
                <RefreshCw className="mx-auto animate-spin text-purple-600 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Analyzing Error...</h3>
                <p className="text-gray-500">Parsing error patterns and generating explanation</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Error Type Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-800">Analysis Result</h2>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(analysis.severity)}`}>
                      {analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)} Priority
                    </div>
                  </div>
                  <div className="bg-gray-900 text-white p-3 rounded-lg font-mono text-sm">
                    {analysis.type}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Category: {analysis.category}
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Lightbulb size={18} />
                    What does this mean?
                  </h3>
                  <p className="text-blue-800">{analysis.explanation}</p>
                </div>

                {/* Common Causes */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-yellow-500" />
                    Common Causes
                  </h3>
                  <ul className="space-y-2">
                    {analysis.commonCauses.map((cause, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span className="text-gray-700">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Solutions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    How to Fix It
                  </h3>
                  <ul className="space-y-2 mb-4">
                    {analysis.solutions.map((solution, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-700">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Code Example */}
                {analysis.example && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Code size={18} className="text-purple-500" />
                      Code Example
                    </h3>
                    <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto">
                      <pre className="font-mono text-sm whitespace-pre-wrap">{analysis.example}</pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard(analysis.example)}
                      className="mt-2 text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copy example code
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

  
      </div>
    </div>
  );
};

export default ErrorMessageTranslator;
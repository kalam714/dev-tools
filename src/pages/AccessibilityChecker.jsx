import React, { useState } from "react";

const AccessibilityChecker = () => {
  const [html, setHtml] = useState("");
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({ errors: 0, warnings: 0, passes: 0 });

  const severityColors = {
    error: "text-red-600 bg-red-50 border-red-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    pass: "text-green-600 bg-green-50 border-green-200",
  };

  const checkAccessibility = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const problems = [];
    let errorCount = 0,
      warningCount = 0,
      passCount = 0;

    const addIssue = (message, severity = "error", element = null) => {
      problems.push({ message, severity, element });
      if (severity === "error") errorCount++;
      else if (severity === "warning") warningCount++;
      else passCount++;
    };

    // Check for images without alt text
    const images = doc.querySelectorAll("img");
    if (images.length === 0) {
      addIssue("No images found to check", "pass");
    } else {
      images.forEach((img, i) => {
        if (!img.hasAttribute("alt")) {
          addIssue(`Image #${i + 1} is missing alt attribute`, "error");
        } else if (img.getAttribute("alt").trim() === "") {
          addIssue(
            `Image #${i + 1} has empty alt text (may be decorative)`,
            "warning"
          );
        }
      });
    }

    // Check form labels
    const inputs = doc.querySelectorAll("input, textarea, select");
    inputs.forEach((input, i) => {
      const id = input.getAttribute("id");
      const type = input.getAttribute("type");

      if (type === "hidden") return; // Skip hidden inputs

      const label = doc.querySelector(`label[for="${id}"]`);
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledby = input.getAttribute("aria-labelledby");

      if (!label && !ariaLabel && !ariaLabelledby) {
        addIssue(
          `Form input #${i + 1} (${
            type || input.tagName.toLowerCase()
          }) lacks proper labeling`,
          "error"
        );
      }
    });

    // Check heading hierarchy
    const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let prevLevel = 0;
    let hasH1 = false;

    headings.forEach((heading, i) => {
      const level = parseInt(heading.tagName[1]);

      if (level === 1) hasH1 = true;

      if (i === 0 && level !== 1) {
        addIssue(
          `First heading should be h1, found ${heading.tagName.toLowerCase()}`,
          "warning"
        );
      }

      if (level > prevLevel + 1) {
        addIssue(
          `Heading level jumps from h${prevLevel} to ${heading.tagName.toLowerCase()} - should be sequential`,
          "error"
        );
      }

      if (heading.textContent.trim() === "") {
        addIssue(`${heading.tagName.toLowerCase()} heading is empty`, "error");
      }

      prevLevel = level;
    });

    if (headings.length > 0 && !hasH1) {
      addIssue("Page is missing an h1 heading", "error");
    }

    // Check links
    const links = doc.querySelectorAll("a");
    links.forEach((link, i) => {
      const href = link.getAttribute("href");
      const text = link.textContent.trim();

      if (!href || href === "#") {
        addIssue(`Link #${i + 1} has no href or placeholder href`, "warning");
      }

      if (!text && !link.getAttribute("aria-label")) {
        addIssue(`Link #${i + 1} has no text content or aria-label`, "error");
      }

      if (
        text &&
        (text.toLowerCase() === "click here" ||
          text.toLowerCase() === "read more" ||
          text.toLowerCase() === "more")
      ) {
        addIssue(
          `Link #${i + 1} uses non-descriptive text: "${text}"`,
          "warning"
        );
      }

      if (href && href.startsWith("javascript:")) {
        addIssue(
          `Link #${
            i + 1
          } uses javascript: protocol - consider using button instead`,
          "warning"
        );
      }
    });

    // Check buttons
    const buttons = doc.querySelectorAll(
      "button, input[type='button'], input[type='submit']"
    );
    buttons.forEach((button, i) => {
      const text = button.textContent.trim();
      const value = button.getAttribute("value");
      const ariaLabel = button.getAttribute("aria-label");

      if (!text && !value && !ariaLabel) {
        addIssue(`Button #${i + 1} has no accessible text`, "error");
      }
    });

    // Check for proper list structure
    const listItems = doc.querySelectorAll("li");
    listItems.forEach((li, i) => {
      const parent = li.parentElement;
      if (!parent || !["UL", "OL", "MENU"].includes(parent.tagName)) {
        addIssue(
          `List item #${i + 1} is not inside ul, ol, or menu element`,
          "error"
        );
      }
    });

    // Check tables
    const tables = doc.querySelectorAll("table");
    tables.forEach((table, i) => {
      const caption = table.querySelector("caption");
      const th = table.querySelectorAll("th");

      if (!caption) {
        addIssue(`Table #${i + 1} is missing a caption`, "warning");
      }

      if (th.length === 0) {
        addIssue(`Table #${i + 1} has no header cells (th elements)`, "error");
      }

      th.forEach((header, j) => {
        if (!header.getAttribute("scope")) {
          addIssue(
            `Table #${i + 1}, header cell #${j + 1} missing scope attribute`,
            "warning"
          );
        }
      });
    });

    // Check for role usage
    const roleElements = doc.querySelectorAll("[role]");
    roleElements.forEach((el, i) => {
      const role = el.getAttribute("role");

      if (
        ["button", "link", "menuitem"].includes(role) &&
        !el.getAttribute("aria-label") &&
        !el.textContent.trim()
      ) {
        addIssue(`Element with role="${role}" needs accessible text`, "error");
      }

      if (role === "img" && !el.getAttribute("aria-label")) {
        addIssue(`Element with role="img" missing aria-label`, "error");
      }
    });

    // Check language attribute
    const html_elem = doc.documentElement;
    if (!html_elem.getAttribute("lang")) {
      addIssue("HTML element missing lang attribute", "error");
    }

    // Check for skip links
    const skipLink = doc.querySelector(
      "a[href='#main'], a[href='#content'], a[href='#skip']"
    );
    if (!skipLink) {
      addIssue(
        "Consider adding skip navigation links for keyboard users",
        "warning"
      );
    }

    // Check for focus indicators (basic check)
    const focusableElements = doc.querySelectorAll(
      "a, button, input, textarea, select, [tabindex]"
    );
    if (focusableElements.length > 0) {
      addIssue(
        `Found ${focusableElements.length} focusable elements - ensure they have visible focus indicators`,
        "pass"
      );
    }

    // Check for ARIA landmarks
    const landmarks = doc.querySelectorAll(
      "[role='main'], main, [role='navigation'], nav, [role='banner'], header, [role='contentinfo'], footer"
    );
    if (landmarks.length === 0) {
      addIssue(
        "No ARIA landmarks found - consider adding main, nav, header, footer elements",
        "warning"
      );
    } else {
      addIssue(`Found ${landmarks.length} landmark elements`, "pass");
    }

    // Check for proper nesting
    const interactiveElements = doc.querySelectorAll("a, button");
    interactiveElements.forEach((el, i) => {
      const nestedInteractive = el.querySelector("a, button");
      if (nestedInteractive) {
        addIssue(
          `Interactive element #${i + 1} contains nested interactive elements`,
          "error"
        );
      }
    });

    // Check for color-only information
    const colorWords = [
      "red",
      "green",
      "blue",
      "yellow",
      "orange",
      "purple",
      "pink",
    ];
    const textContent = doc.body ? doc.body.textContent.toLowerCase() : "";
    colorWords.forEach((color) => {
      if (textContent.includes(color)) {
        addIssue(
          `Content mentions color "${color}" - ensure information isn't conveyed by color alone`,
          "warning"
        );
      }
    });

    // Check for autoplay media
    const mediaElements = doc.querySelectorAll("video, audio");
    mediaElements.forEach((media, i) => {
      if (media.hasAttribute("autoplay")) {
        addIssue(
          `Media element #${i + 1} has autoplay - this can be disorienting`,
          "warning"
        );
      }

      if (
        !media.querySelector("track[kind='captions']") &&
        !media.querySelector("track[kind='subtitles']")
      ) {
        addIssue(
          `Media element #${i + 1} appears to lack captions/subtitles`,
          "warning"
        );
      }
    });

    if (problems.length === 0) {
      addIssue("✅ No accessibility issues found!", "pass");
    }

    setIssues(problems);
    setSummary({
      errors: errorCount,
      warnings: warningCount,
      passes: passCount,
    });
  };

  const getExample = () => {
    const exampleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Sample Page</title>
</head>
<body>
    <header role="banner">
        <nav role="navigation">
            <a href="#main">Skip to main content</a>
        </nav>
    </header>
    
    <main id="main" role="main">
        <h1>Welcome to Our Site</h1>
        
        <form>
            <label for="email">Email Address:</label>
            <input type="email" id="email" required>
            
            <label for="message">Message:</label>
            <textarea id="message"></textarea>
            
            <button type="submit">Send Message</button>
        </form>
        
        <img src="photo.jpg" alt="Team photo showing 5 people">
        
        <table>
            <caption>Sales Data</caption>
            <thead>
                <tr>
                    <th scope="col">Month</th>
                    <th scope="col">Sales</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>January</td>
                    <td>$1000</td>
                </tr>
            </tbody>
        </table>
    </main>
</body>
</html>`;
    setHtml(exampleHTML);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          🔍 Enhanced Accessibility Checker
        </h1>

        <div className="mb-4">
          <label
            htmlFor="html-input"
            className="block text-sm font-medium mb-2"
          >
            HTML Code to Check:
          </label>
          <textarea
            id="html-input"
            className="w-full h-48 border-2 border-gray-300 rounded-lg p-3 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Paste your HTML here..."
            value={html}
            onChange={(e) => setHtml(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={checkAccessibility}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-200"
          >
            🔍 Check Accessibility
          </button>

          <button
            onClick={getExample}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 focus:ring-2 focus:ring-gray-200"
          >
            📝 Load Example
          </button>

          <button
            onClick={() => setHtml("")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 focus:ring-2 focus:ring-red-200"
          >
            🗑️ Clear
          </button>
        </div>

        {issues.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-2">
                <span className="text-red-800 font-semibold">
                  ❌ {summary.errors} Error{summary.errors !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-4 py-2">
                <span className="text-yellow-800 font-semibold">
                  ⚠️ {summary.warnings} Warning
                  {summary.warnings !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="bg-green-100 border border-green-200 rounded-lg px-4 py-2">
                <span className="text-green-800 font-semibold">
                  ✅ {summary.passes} Pass{summary.passes !== 1 ? "es" : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Accessibility Results:
          </h2>

          {issues.length === 0 ? (
            <p className="text-gray-500 italic">
              Click "Check Accessibility" to analyze your HTML
            </p>
          ) : (
            <div className="space-y-2">
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${
                    severityColors[issue.severity]
                  }`}
                >
                  <div className="flex items-start">
                    <span className="mr-2">
                      {issue.severity === "error" && "❌"}
                      {issue.severity === "warning" && "⚠️"}
                      {issue.severity === "pass" && "✅"}
                    </span>
                    <span className="font-medium">{issue.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">
            💡 What this tool checks:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Image alt text</li>
            <li>• Form labels and accessibility</li>
            <li>• Heading hierarchy (h1-h6)</li>
            <li>• Link accessibility and descriptiveness</li>
            <li>• Button accessibility</li>
            <li>• Table structure and headers</li>
            <li>• ARIA roles and labels</li>
            <li>• Language attributes</li>
            <li>• Landmark regions</li>
            <li>• Color-dependent information</li>
            <li>• Media accessibility features</li>
            <li>• Interactive element nesting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityChecker;

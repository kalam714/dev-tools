import React, { useMemo, useState } from "react";

/**
 * Enhanced SQL Query Visualizer
 * - More accurate SQL parsing with better handling of complex queries
 * - Improved table alias detection and column mapping
 * - Better JOIN type recognition and condition parsing
 * - Enhanced error handling and edge case management
 */

function normalizeSql(sql) {
  // Remove comments, normalize whitespace, but preserve structure
  return sql
    .replace(/--.*$/gm, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/\s+/g, " ")
    .trim();
}

function extractSelectPart(sql) {
  // More robust SELECT extraction that handles nested selects better
  const match = sql.match(/\bselect\b\s+(.*?)\s+\bfrom\b/i);
  if (!match) return "";

  let selectPart = match[1].trim();

  // Handle DISTINCT
  if (selectPart.toLowerCase().startsWith("distinct ")) {
    selectPart = selectPart.substring(9).trim();
  }

  return selectPart;
}

function extractFromTables(sql) {
  // Enhanced FROM clause extraction with better boundary detection
  const fromMatch = sql.match(
    /\bfrom\b\s+(.*?)(?=\s+(?:where|group\s+by|having|order\s+by|limit|union|except|intersect|;|$))/i
  );
  if (!fromMatch) return [];

  const fromClause = fromMatch[1].trim();

  // Split by commas at top-level (not inside parentheses or subqueries)
  const parts = splitTopLevel(fromClause, ",");
  return parts.map((p) => p.trim()).filter(Boolean);
}

function extractJoinClauses(sql) {
  // Enhanced JOIN extraction with better type detection
  const joinTypes = [
    "inner join",
    "left outer join",
    "right outer join",
    "full outer join",
    "left join",
    "right join",
    "full join",
    "cross join",
    "natural join",
    "join",
  ];

  const joinPattern = new RegExp(
    `\\b(${joinTypes.join(
      "|"
    )})\\b\\s+([^\\s]+(?:\\s+(?:as\\s+)?\\w+)?)\\s*(?:on\\s+([^]+?))?(?=\\s*(?:${joinTypes.join(
      "|"
    )}|where|group\\s+by|having|order\\s+by|limit|union|except|intersect|;|$))`,
    "gi"
  );

  const joins = [];
  let match;

  while ((match = joinPattern.exec(sql)) !== null) {
    const joinType = match[1].toLowerCase().trim();
    const table = match[2].trim();
    const onCondition = match[3] ? match[3].trim() : "";

    joins.push({
      type: joinType,
      table: table,
      on: onCondition,
      raw: match[0].trim(),
    });
  }

  return joins;
}

function splitTopLevel(str, separator) {
  // Enhanced splitting that properly handles nested parentheses and quotes
  const result = [];
  let current = "";
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const prev = i > 0 ? str[i - 1] : "";

    // Handle quotes (skip escaped quotes)
    if (char === "'" && prev !== "\\" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prev !== "\\" && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (
      char === "`" &&
      prev !== "\\" &&
      !inSingleQuote &&
      !inDoubleQuote
    ) {
      inBacktick = !inBacktick;
    }

    // Handle parentheses (only when not in quotes)
    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === "(") depth++;
      else if (char === ")") depth = Math.max(0, depth - 1);

      // Split when we hit separator at top level
      if (char === separator && depth === 0) {
        if (current.trim()) result.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

function parseTableAndAlias(tableExpr) {
  const expr = tableExpr.trim();

  // Handle subqueries in parentheses
  if (expr.startsWith("(") && expr.endsWith(")")) {
    const subquery = expr.slice(1, -1).trim();
    // Look for alias after the closing parenthesis
    const remaining = tableExpr.slice(expr.length).trim();
    const aliasMatch = remaining.match(/^\s*(?:as\s+)?(\w+)/i);
    return {
      name: `(${subquery})`,
      alias: aliasMatch ? aliasMatch[1] : null,
      isSubquery: true,
    };
  }

  // Match table name with optional schema and alias
  // Patterns: table, schema.table, table alias, schema.table alias, table AS alias
  const patterns = [
    /^(.+?)\s+(?:as\s+)?([a-zA-Z_]\w*)$/i, // table [AS] alias
    /^([a-zA-Z_][\w.]*[a-zA-Z_]\w*)$/, // just table name (possibly with schema)
  ];

  for (const pattern of patterns) {
    const match = expr.match(pattern);
    if (match) {
      if (match[2]) {
        // Has alias
        return {
          name: match[1].trim(),
          alias: match[2].trim(),
          isSubquery: false,
        };
      } else {
        // No alias
        return {
          name: match[1].trim(),
          alias: null,
          isSubquery: false,
        };
      }
    }
  }

  return { name: expr, alias: null, isSubquery: false };
}

function extractColumnsFromSelect(selectPart) {
  if (!selectPart || selectPart === "*") {
    return [{ raw: "*", table: null, column: "*", alias: null }];
  }

  const parts = splitTopLevel(selectPart, ",");

  return parts.map((part) => {
    const trimmed = part.trim();

    // Handle aliases (AS keyword optional)
    const aliasMatch = trimmed.match(/^(.+?)\s+(?:as\s+)?([a-zA-Z_]\w*)$/i);
    let expression = trimmed;
    let alias = null;

    if (aliasMatch) {
      expression = aliasMatch[1].trim();
      alias = aliasMatch[2].trim();
    }

    // Check for table.column pattern
    const columnMatch = expression.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_*]\w*)$/);
    if (columnMatch) {
      return {
        raw: trimmed,
        table: columnMatch[1],
        column: columnMatch[2],
        alias: alias,
        isFunction: false,
      };
    }

    // Check if it's a function call
    const isFunctionCall = /\w+\s*\(/.test(expression);

    return {
      raw: trimmed,
      table: null,
      column: isFunctionCall ? null : expression,
      alias: alias,
      isFunction: isFunctionCall,
    };
  });
}

function parseOnConditions(onClause) {
  if (!onClause) return [];

  // Split by AND/OR at top level
  const conditions = [];
  const parts = onClause.split(/\s+(?:and|or)\s+/i);

  parts.forEach((part) => {
    const trimmed = part.trim();

    // Match various comparison operators
    const comparisonMatch = trimmed.match(
      /^([^<>=!]+)(=|<>|!=|<=|>=|<|>|like|in|not\s+in)\s*(.+)$/i
    );

    if (comparisonMatch) {
      const left = comparisonMatch[1].trim();
      const operator = comparisonMatch[2].trim();
      const right = comparisonMatch[3].trim();

      conditions.push({
        left: left,
        operator: operator,
        right: right,
        raw: trimmed,
      });
    } else {
      // Non-standard condition
      conditions.push({
        raw: trimmed,
        left: null,
        operator: null,
        right: null,
      });
    }
  });

  return conditions;
}

function normalizeIdentifier(identifier) {
  if (!identifier) return identifier;
  // Remove quotes and normalize case
  return identifier.replace(/["`']/g, "").toLowerCase();
}

function buildGraphFromSql(sql) {
  const normalized = normalizeSql(sql);

  if (!normalized) {
    return { tables: [], edges: [], errors: ["Empty SQL query"], raw: {} };
  }

  const errors = [];

  try {
    const selectPart = extractSelectPart(normalized);
    const fromParts = extractFromTables(normalized);
    const joinClauses = extractJoinClauses(normalized);

    // Parse tables from FROM clause
    const tables = {};

    fromParts.forEach((part) => {
      const parsed = parseTableAndAlias(part);
      const tableId = normalizeIdentifier(
        parsed.alias || parsed.name.split(".").pop()
      );

      tables[tableId] = {
        id: tableId,
        name: parsed.name,
        alias: parsed.alias,
        isSubquery: parsed.isSubquery,
        columns: [],
        raw: part,
      };
    });

    // Add tables from JOIN clauses
    joinClauses.forEach((join) => {
      const parsed = parseTableAndAlias(join.table);
      const tableId = normalizeIdentifier(
        parsed.alias || parsed.name.split(".").pop()
      );

      if (!tables[tableId]) {
        tables[tableId] = {
          id: tableId,
          name: parsed.name,
          alias: parsed.alias,
          isSubquery: parsed.isSubquery,
          columns: [],
          raw: join.table,
        };
      }
    });

    // Extract and assign columns
    const columns = extractColumnsFromSelect(selectPart);

    columns.forEach((col) => {
      if (col.table) {
        const tableId = normalizeIdentifier(col.table);

        // Find matching table (by alias first, then by name)
        let targetTable = tables[tableId];
        if (!targetTable) {
          // Try to find by original name
          targetTable = Object.values(tables).find(
            (t) =>
              normalizeIdentifier(t.alias) === tableId ||
              normalizeIdentifier(t.name.split(".").pop()) === tableId
          );
        }

        if (targetTable) {
          targetTable.columns.push({
            name: col.column,
            alias: col.alias,
            expression: col.raw,
            isFunction: col.isFunction,
          });
        } else {
          // Orphaned column - create placeholder table
          tables[tableId] = {
            id: tableId,
            name: tableId,
            alias: null,
            isSubquery: false,
            columns: [
              {
                name: col.column,
                alias: col.alias,
                expression: col.raw,
                isFunction: col.isFunction,
              },
            ],
            raw: tableId,
            isOrphan: true,
          };
        }
      } else {
        // Column without table prefix
        if (!tables["__unspecified__"]) {
          tables["__unspecified__"] = {
            id: "__unspecified__",
            name: "Unspecified",
            alias: null,
            isSubquery: false,
            columns: [],
            raw: null,
            isVirtual: true,
          };
        }

        tables["__unspecified__"].columns.push({
          name: col.column,
          alias: col.alias,
          expression: col.raw,
          isFunction: col.isFunction,
        });
      }
    });

    // Process JOIN conditions into edges
    const edges = [];

    joinClauses.forEach((join, index) => {
      const conditions = parseOnConditions(join.on);

      conditions.forEach((condition, condIndex) => {
        if (!condition.left || !condition.right) return;

        // Parse table references from condition parts
        const parseTableRef = (ref) => {
          const parts = ref.split(".");
          if (parts.length >= 2) {
            const tableRef = normalizeIdentifier(parts[0]);
            const column = parts.slice(1).join(".");
            return { table: tableRef, column };
          }
          return { table: null, column: ref };
        };

        const leftRef = parseTableRef(condition.left);
        const rightRef = parseTableRef(condition.right);

        // Find actual table IDs
        const findTableId = (ref) => {
          if (!ref.table) return null;

          // Direct match
          if (tables[ref.table]) return ref.table;

          // Match by alias or name
          const found = Object.values(tables).find(
            (t) =>
              normalizeIdentifier(t.alias) === ref.table ||
              normalizeIdentifier(t.name.split(".").pop()) === ref.table
          );

          return found ? found.id : null;
        };

        const sourceId = findTableId(leftRef);
        const targetId = findTableId(rightRef);

        if (sourceId && targetId && sourceId !== targetId) {
          edges.push({
            id: `edge_${index}_${condIndex}`,
            source: sourceId,
            target: targetId,
            joinType: join.type,
            condition: condition.raw,
            sourceColumn: leftRef.column,
            targetColumn: rightRef.column,
            operator: condition.operator,
          });
        }
      });
    });

    return {
      tables: Object.values(tables),
      edges: edges,
      errors: errors,
      raw: {
        select: selectPart,
        from: fromParts,
        joins: joinClauses,
        columns: columns,
      },
    };
  } catch (error) {
    errors.push(`Parse error: ${error.message}`);
    return { tables: [], edges: [], errors, raw: {} };
  }
}

/* ======= Enhanced diagram rendering ======= */

function calculateLayout(tables, edges) {
  const nodeCount = tables.length;
  if (nodeCount === 0) return [];

  // Use circular layout for simplicity, but with better spacing
  const centerX = 430;
  const centerY = 230;
  const baseRadius = Math.max(150, nodeCount * 40);

  return tables.map((table, index) => {
    if (nodeCount === 1) {
      return { ...table, x: centerX, y: centerY };
    }

    const angle = (2 * Math.PI * index) / nodeCount - Math.PI / 2; // Start from top
    const x = centerX + baseRadius * Math.cos(angle);
    const y = centerY + baseRadius * Math.sin(angle);

    return { ...table, x, y };
  });
}

function TableNode({ table, x, y }) {
  const maxWidth = 200;
  const headerHeight = 35;
  const rowHeight = 20;
  const padding = 8;
  const maxColumns = 8;

  const displayColumns = (table.columns || []).slice(0, maxColumns);
  const totalHeight =
    headerHeight + displayColumns.length * rowHeight + padding;

  // Determine node color based on table type
  let headerColor = "#1f2937";
  let borderColor = "#374151";

  if (table.isSubquery) {
    headerColor = "#7c3aed";
    borderColor = "#8b5cf6";
  } else if (table.isVirtual) {
    headerColor = "#059669";
    borderColor = "#10b981";
  } else if (table.isOrphan) {
    headerColor = "#dc2626";
    borderColor = "#ef4444";
  }

  return (
    <g transform={`translate(${x - maxWidth / 2}, ${y - totalHeight / 2})`}>
      {/* Table background */}
      <rect
        width={maxWidth}
        height={totalHeight}
        rx="8"
        ry="8"
        fill="#f9fafb"
        stroke={borderColor}
        strokeWidth="2"
      />

      {/* Header */}
      <rect
        width={maxWidth}
        height={headerHeight}
        rx="8"
        ry="8"
        fill={headerColor}
      />
      <rect width={maxWidth} height={headerHeight - 8} fill={headerColor} />

      {/* Table name */}
      <text
        x={padding}
        y={24}
        fill="white"
        fontSize="13"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {table.alias ? `${table.name} (${table.alias})` : table.name}
      </text>

      {/* Columns */}
      {displayColumns.map((column, idx) => (
        <text
          key={idx}
          x={padding}
          y={headerHeight + padding + (idx + 1) * rowHeight - 4}
          fill="#374151"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          {column.alias
            ? `${column.name} → ${column.alias}`
            : column.name || column.expression}
        </text>
      ))}

      {/* Show truncation indicator */}
      {table.columns && table.columns.length > maxColumns && (
        <text
          x={padding}
          y={headerHeight + padding + (maxColumns + 1) * rowHeight - 4}
          fill="#9ca3af"
          fontSize="10"
          fontStyle="italic"
        >
          ... and {table.columns.length - maxColumns} more
        </text>
      )}
    </g>
  );
}

function EdgeLabel({ x1, y1, x2, y2, edge }) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

  const labelText = `${edge.sourceColumn || ""} ${edge.operator || "="} ${
    edge.targetColumn || ""
  }`.trim();
  const joinType = edge.joinType.toUpperCase();

  return (
    <g
      transform={`translate(${midX}, ${midY}) rotate(${
        Math.abs(angle) > 90 ? angle + 180 : angle
      })`}
    >
      {/* Background for join type */}
      <rect
        x={-35}
        y={-22}
        width={70}
        height={16}
        rx="3"
        fill="rgba(59, 130, 246, 0.9)"
      />
      <text
        x={0}
        y={-10}
        textAnchor="middle"
        fontSize="9"
        fill="white"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        {joinType}
      </text>

      {/* Background for condition */}
      <rect
        x={-50}
        y={-2}
        width={100}
        height={16}
        rx="3"
        fill="rgba(0, 0, 0, 0.8)"
      />
      <text
        x={0}
        y={10}
        textAnchor="middle"
        fontSize="10"
        fill="white"
        fontFamily="ui-monospace, monospace"
      >
        {labelText}
      </text>
    </g>
  );
}

/* ======= Main component ======= */

export default function EnhancedSqlVisualizer() {
  const [sql, setSql] = useState(`SELECT 
    u.id,
    u.name,
    u.email,
    o.id as order_id,
    o.total,
    o.created_at,
    p.sku,
    p.name as product_name,
    COUNT(*) as item_count
FROM users u
INNER JOIN orders o ON u.id = o.user_id
LEFT JOIN order_items oi ON o.id = oi.order_id  
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.total > 100
    AND u.active = 1
GROUP BY u.id, u.name, u.email, o.id, o.total, o.created_at, p.sku, p.name;`);

  const parsed = useMemo(() => {
    return buildGraphFromSql(sql);
  }, [sql]);

  const positionedTables = useMemo(() => {
    return calculateLayout(parsed.tables, parsed.edges);
  }, [parsed.tables, parsed.edges]);

  const findTablePosition = (tableId) => {
    const table = positionedTables.find((t) => t.id === tableId);
    return table ? { x: table.x, y: table.y } : { x: 430, y: 230 };
  };

  const copyAnalysis = () => {
    const analysis = {
      summary: {
        tableCount: parsed.tables.length,
        joinCount: parsed.edges.length,
        columnCount: parsed.tables.reduce(
          (sum, t) => sum + (t.columns?.length || 0),
          0
        ),
      },
      tables: parsed.tables,
      relationships: parsed.edges,
      errors: parsed.errors,
      raw: parsed.raw,
    };

    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    alert("Complete analysis copied to clipboard!");
  };

  const loadExample = (type) => {
    const examples = {
      simple: `SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;`,

      complex: `SELECT 
    u.id,
    u.name,
    u.email,
    o.id as order_id,
    o.total,
    p.sku,
    p.name as product_name,
    cat.name as category,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity * oi.price) as calculated_total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
RIGHT JOIN categories cat ON p.category_id = cat.id
WHERE o.created_at >= '2024-01-01'
    AND u.active = 1
    AND p.discontinued = 0
GROUP BY u.id, u.name, u.email, o.id, o.total, p.sku, p.name, cat.name
HAVING COUNT(oi.id) > 0
ORDER BY o.total DESC;`,

      subquery: `SELECT 
    main.user_id,
    main.total_spent,
    recent.recent_orders
FROM (
    SELECT 
        u.id as user_id,
        SUM(o.total) as total_spent
    FROM users u
    JOIN orders o ON u.id = o.user_id
    GROUP BY u.id
) main
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as recent_orders
    FROM orders 
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY user_id
) recent ON main.user_id = recent.user_id;`,
    };

    setSql(examples[type] || examples.simple);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Enhanced SQL Query Visualizer
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Input Panel */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SQL Query Input
              </label>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                className="w-full h-64 border border-gray-300 rounded-md p-3 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your SQL query here..."
              />

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => loadExample("simple")}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Simple
                </button>
                <button
                  onClick={() => loadExample("complex")}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Complex
                </button>
                <button
                  onClick={() => loadExample("subquery")}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Subquery
                </button>
                <button
                  onClick={copyAnalysis}
                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Copy Analysis
                </button>
                <button
                  onClick={() => setSql("")}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Analysis Panel */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Query Analysis
              </h3>

              {parsed.errors && parsed.errors.length > 0 && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-sm font-medium text-red-800">
                    Errors:
                  </div>
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {parsed.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Tables ({parsed.tables.length}):
                  </span>
                  <ul className="mt-1 space-y-1">
                    {parsed.tables.map((table) => (
                      <li key={table.id} className="flex items-center text-xs">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            table.isSubquery
                              ? "bg-purple-500"
                              : table.isVirtual
                              ? "bg-green-500"
                              : table.isOrphan
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                        ></span>
                        <code className="font-mono">{table.id}</code>
                        {table.alias && (
                          <span className="text-gray-500 ml-1">
                            ({table.alias})
                          </span>
                        )}
                        <span className="text-gray-400 ml-1">
                          • {table.columns?.length || 0} cols
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-medium text-gray-700">
                    Relationships ({parsed.edges.length}):
                  </span>
                  <ul className="mt-1 space-y-1">
                    {parsed.edges.map((edge, idx) => (
                      <li key={idx} className="text-xs">
                        <code className="font-mono">
                          {edge.source} →({edge.joinType}) {edge.target}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Visualization Panel */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-800">
                  Query Visualization
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tables and their relationships based on JOIN conditions
                </p>
              </div>

              <div className="p-4">
                <svg
                  width="100%"
                  height="500"
                  viewBox="0 0 860 500"
                  className="border rounded"
                >
                  <defs>
                    {/* Arrow markers for different join types */}
                    <marker
                      id="arrow-inner"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0,0 0,6 9,3" fill="#3b82f6" />
                    </marker>
                    <marker
                      id="arrow-left"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0,0 0,6 9,3" fill="#10b981" />
                    </marker>
                    <marker
                      id="arrow-right"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0,0 0,6 9,3" fill="#f59e0b" />
                    </marker>
                    <marker
                      id="arrow-full"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0,0 0,6 9,3" fill="#8b5cf6" />
                    </marker>
                  </defs>

                  {/* Grid background */}
                  <defs>
                    <pattern
                      id="grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Edges/Relationships */}
                  {parsed.edges.map((edge, idx) => {
                    const source = findTablePosition(edge.source);
                    const target = findTablePosition(edge.target);

                    // Determine marker based on join type
                    let marker = "arrow-inner";
                    let strokeColor = "#3b82f6";
                    let strokeWidth = 2;

                    if (edge.joinType.includes("left")) {
                      marker = "arrow-left";
                      strokeColor = "#10b981";
                    } else if (edge.joinType.includes("right")) {
                      marker = "arrow-right";
                      strokeColor = "#f59e0b";
                    } else if (edge.joinType.includes("full")) {
                      marker = "arrow-full";
                      strokeColor = "#8b5cf6";
                      strokeWidth = 3;
                    }

                    return (
                      <g key={edge.id}>
                        <line
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          markerEnd={`url(#${marker})`}
                          opacity="0.8"
                        />
                        <EdgeLabel
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          edge={edge}
                        />
                      </g>
                    );
                  })}

                  {/* Table Nodes */}
                  {positionedTables.map((table) => (
                    <TableNode
                      key={table.id}
                      table={table}
                      x={table.x}
                      y={table.y}
                    />
                  ))}

                  {/* Legend */}
                  <g transform="translate(20, 20)">
                    <rect
                      width="180"
                      height="120"
                      rx="5"
                      fill="rgba(255,255,255,0.95)"
                      stroke="#d1d5db"
                    />
                    <text
                      x="10"
                      y="20"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      Join Types
                    </text>

                    <line
                      x1="15"
                      y1="35"
                      x2="35"
                      y2="35"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      markerEnd="url(#arrow-inner)"
                    />
                    <text x="40" y="40" fontSize="10" fill="#374151">
                      INNER JOIN
                    </text>

                    <line
                      x1="15"
                      y1="50"
                      x2="35"
                      y2="50"
                      stroke="#10b981"
                      strokeWidth="2"
                      markerEnd="url(#arrow-left)"
                    />
                    <text x="40" y="55" fontSize="10" fill="#374151">
                      LEFT JOIN
                    </text>

                    <line
                      x1="15"
                      y1="65"
                      x2="35"
                      y2="65"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      markerEnd="url(#arrow-right)"
                    />
                    <text x="40" y="70" fontSize="10" fill="#374151">
                      RIGHT JOIN
                    </text>

                    <line
                      x1="15"
                      y1="80"
                      x2="35"
                      y2="80"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      markerEnd="url(#arrow-full)"
                    />
                    <text x="40" y="85" fontSize="10" fill="#374151">
                      FULL JOIN
                    </text>

                    <text
                      x="10"
                      y="105"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      Table Types
                    </text>
                    <circle cx="20" cy="110" r="3" fill="#1f2937" />
                    <text x="30" y="115" fontSize="9" fill="#374151">
                      Regular
                    </text>
                    <circle cx="80" cy="110" r="3" fill="#7c3aed" />
                    <text x="90" y="115" fontSize="9" fill="#374151">
                      Subquery
                    </text>
                  </g>

                  {/* Query Stats */}
                  <g transform="translate(680, 20)">
                    <rect
                      width="160"
                      height="80"
                      rx="5"
                      fill="rgba(255,255,255,0.95)"
                      stroke="#d1d5db"
                    />
                    <text
                      x="10"
                      y="20"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      Query Stats
                    </text>
                    <text x="10" y="40" fontSize="11" fill="#374151">
                      Tables: {parsed.tables.length}
                    </text>
                    <text x="10" y="55" fontSize="11" fill="#374151">
                      Joins: {parsed.edges.length}
                    </text>
                    <text x="10" y="70" fontSize="11" fill="#374151">
                      Columns:{" "}
                      {parsed.tables.reduce(
                        (sum, t) => sum + (t.columns?.length || 0),
                        0
                      )}
                    </text>
                  </g>

                  {/* Show message if no data */}
                  {parsed.tables.length === 0 && (
                    <g>
                      <rect
                        x="300"
                        y="200"
                        width="260"
                        height="100"
                        rx="10"
                        fill="rgba(243,244,246,0.95)"
                        stroke="#d1d5db"
                      />
                      <text
                        x="430"
                        y="235"
                        textAnchor="middle"
                        fontSize="14"
                        fill="#6b7280"
                      >
                        No tables detected
                      </text>
                      <text
                        x="430"
                        y="255"
                        textAnchor="middle"
                        fontSize="12"
                        fill="#9ca3af"
                      >
                        Enter a SQL query above to visualize
                      </text>
                      <text
                        x="430"
                        y="275"
                        textAnchor="middle"
                        fontSize="12"
                        fill="#9ca3af"
                      >
                        table relationships and structure
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analysis Section */}
        {parsed.raw && Object.keys(parsed.raw).length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">Detailed Analysis</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* SELECT Analysis */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    SELECT Clause
                  </h4>
                  <div className="bg-gray-50 rounded p-3">
                    <code className="text-xs text-gray-600 whitespace-pre-wrap">
                      {parsed.raw.select || "No SELECT clause detected"}
                    </code>
                  </div>
                </div>

                {/* FROM Analysis */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    FROM Clause
                  </h4>
                  <div className="bg-gray-50 rounded p-3">
                    {parsed.raw.from && parsed.raw.from.length > 0 ? (
                      <ul className="text-xs space-y-1">
                        {parsed.raw.from.map((table, idx) => (
                          <li key={idx} className="font-mono text-gray-600">
                            {table}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-500">
                        No FROM clause detected
                      </span>
                    )}
                  </div>
                </div>

                {/* JOIN Analysis */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    JOIN Operations
                  </h4>
                  <div className="bg-gray-50 rounded p-3">
                    {parsed.raw.joins && parsed.raw.joins.length > 0 ? (
                      <ul className="text-xs space-y-2">
                        {parsed.raw.joins.map((join, idx) => (
                          <li key={idx}>
                            <div className="font-medium text-gray-700">
                              {join.type.toUpperCase()}
                            </div>
                            <div className="font-mono text-gray-600">
                              {join.table}
                            </div>
                            {join.on && (
                              <div className="text-gray-500 mt-1">
                                ON: {join.on}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-500">
                        No JOINs detected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Column Details */}
              {parsed.raw.columns && parsed.raw.columns.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Column Analysis
                  </h4>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {parsed.raw.columns.map((col, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-mono text-gray-700">
                            {col.raw}
                          </span>
                          {col.table && (
                            <span className="text-gray-500">
                              {" "}
                              • from {col.table}
                            </span>
                          )}
                          {col.isFunction && (
                            <span className="text-blue-600"> • function</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

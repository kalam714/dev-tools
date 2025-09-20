import React, { useState, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Database,
  Download,
  Copy,
  Edit3,
  Save,
  X,
} from "lucide-react";

const DatabaseSchemaDesigner = () => {
  const [tables, setTables] = useState([]);
  const [connections, setConnections] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [sqlCode, setSqlCode] = useState("");
  const canvasRef = useRef(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const dataTypes = [
    "VARCHAR(255)",
    "TEXT",
    "INT",
    "BIGINT",
    "DECIMAL(10,2)",
    "BOOLEAN",
    "DATE",
    "DATETIME",
    "TIMESTAMP",
    "JSON",
  ];

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createNewTable = () => {
    const newTable = {
      id: generateId(),
      name: `table_${tables.length + 1}`,
      position: { x: 100 + tables.length * 50, y: 100 + tables.length * 50 },
      fields: [
        {
          id: generateId(),
          name: "id",
          type: "INT",
          isPrimary: true,
          isNotNull: true,
          isAutoIncrement: true,
        },
      ],
    };
    setTables([...tables, newTable]);
  };

  const deleteTable = (tableId) => {
    setTables(tables.filter((t) => t.id !== tableId));
    setConnections(
      connections.filter(
        (c) => c.from.tableId !== tableId && c.to.tableId !== tableId
      )
    );
    setSelectedTable(null);
  };

  const updateTableName = (tableId, newName) => {
    setTables(
      tables.map((t) =>
        t.id === tableId
          ? { ...t, name: newName.replace(/\s+/g, "_").toLowerCase() }
          : t
      )
    );
  };

  const addField = (tableId) => {
    const newField = {
      id: generateId(),
      name: "new_field",
      type: "VARCHAR(255)",
      isPrimary: false,
      isNotNull: false,
      isAutoIncrement: false,
    };

    setTables(
      tables.map((t) =>
        t.id === tableId ? { ...t, fields: [...t.fields, newField] } : t
      )
    );
  };

  const updateField = (tableId, fieldId, updates) => {
    setTables(
      tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              fields: t.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : t
      )
    );
  };

  const deleteField = (tableId, fieldId) => {
    setTables(
      tables.map((t) =>
        t.id === tableId
          ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
          : t
      )
    );
  };

  const handleTableDrag = (tableId, newPosition) => {
    setTables(
      tables.map((t) =>
        t.id === tableId ? { ...t, position: newPosition } : t
      )
    );
  };

  const generateSQL = () => {
    let sql = "-- Database Schema Migration\n\n";

    // Create tables
    tables.forEach((table) => {
      sql += `CREATE TABLE ${table.name} (\n`;

      const fieldDefinitions = table.fields.map((field) => {
        let definition = `  ${field.name} ${field.type}`;
        if (field.isNotNull) definition += " NOT NULL";
        if (field.isAutoIncrement) definition += " AUTO_INCREMENT";
        return definition;
      });

      // Add primary key constraint
      const primaryFields = table.fields
        .filter((f) => f.isPrimary)
        .map((f) => f.name);
      if (primaryFields.length > 0) {
        fieldDefinitions.push(`  PRIMARY KEY (${primaryFields.join(", ")})`);
      }

      sql += fieldDefinitions.join(",\n") + "\n";
      sql += ");\n\n";
    });

    // Add foreign key constraints
    connections.forEach((conn) => {
      const fromTable = tables.find((t) => t.id === conn.from.tableId);
      const toTable = tables.find((t) => t.id === conn.to.tableId);
      if (fromTable && toTable) {
        sql += `ALTER TABLE ${fromTable.name} ADD CONSTRAINT fk_${fromTable.name}_${toTable.name}\n`;
        sql += `  FOREIGN KEY (${conn.from.fieldName}) REFERENCES ${toTable.name}(${conn.to.fieldName});\n\n`;
      }
    });

    setSqlCode(sql);
  };

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      alert("SQL code copied to clipboard!");
    } catch (err) {
      alert("Failed to copy SQL code");
    }
  };

  const downloadSQL = () => {
    const blob = new Blob([sqlCode], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema_migration.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const DraggableTable = ({ table }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(table.name);

    const handleMouseDown = (e) => {
      // Prevent dragging when interacting with form elements or buttons
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "SELECT" ||
        e.target.tagName === "BUTTON" ||
        e.target.closest("button") ||
        e.target.closest("input") ||
        e.target.closest("select") ||
        e.target.closest("label")
      ) {
        return;
      }

      setIsDragging(true);
      setSelectedTable(table.id);

      const startX = e.clientX - table.position.x;
      const startY = e.clientY - table.position.y;

      const handleMouseMove = (e) => {
        handleTableDrag(table.id, {
          x: e.clientX - startX,
          y: e.clientY - startY,
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const saveTableName = () => {
      updateTableName(table.id, tempName);
      setEditingName(false);
    };

    return (
      <div
        className={`absolute bg-white border-2 rounded-lg shadow-lg min-w-64 ${
          selectedTable === table.id ? "border-blue-500" : "border-gray-300"
        } ${isDragging ? "cursor-grabbing z-50" : "cursor-grab"}`}
        style={{ left: table.position.x, top: table.position.y }}
        onMouseDown={handleMouseDown}
      >
        {/* Table Header - Non-draggable zone */}
        <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between cursor-default">
          <div className="flex items-center gap-2">
            <Database size={16} />
            {editingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-32"
                  onKeyPress={(e) => e.key === "Enter" && saveTableName()}
                  onBlur={saveTableName}
                  autoFocus
                />
                <Save
                  size={22}
                  onClick={saveTableName}
                  className="cursor-pointer hover:bg-gray-700 p-1 rounded"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-medium">{table.name}</span>
                <Edit3
                  size={22}
                  onClick={() => setEditingName(true)}
                  className="cursor-pointer hover:bg-gray-700 p-1 rounded"
                />
              </div>
            )}
          </div>
          <button
            onClick={() => deleteTable(table.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Fields - Draggable zone */}
        <div className="p-2">
          {table.fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              tableId={table.id}
              onUpdate={updateField}
              onDelete={deleteField}
              isEditing={editingField === field.id}
              setEditing={setEditingField}
            />
          ))}

          <button
            onClick={() => addField(table.id)}
            className="w-full mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            Add Field
          </button>
        </div>
      </div>
    );
  };

  const FieldRow = ({
    field,
    tableId,
    onUpdate,
    onDelete,
    isEditing,
    setEditing,
  }) => {
    const [tempField, setTempField] = useState(field);

    const saveField = () => {
      onUpdate(tableId, field.id, tempField);
      setEditing(null);
    };

    const cancelEdit = () => {
      setTempField(field);
      setEditing(null);
    };

    if (isEditing) {
      return (
        <div className="mb-2 p-2 border border-gray-300 rounded bg-gray-50">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              value={tempField.name}
              onChange={(e) =>
                setTempField({ ...tempField, name: e.target.value })
              }
            
              placeholder="Field name"
              className="px-2 py-1 border rounded text-sm"
            />
            <select
              value={tempField.type}
              onChange={(e) =>
                setTempField({ ...tempField, type: e.target.value })
              }
              className="px-2 py-1 border rounded text-sm"
            >
              {dataTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mb-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tempField.isPrimary}
                onChange={(e) =>
                  setTempField({ ...tempField, isPrimary: e.target.checked })
                }
              />
              Primary Key
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tempField.isNotNull}
                onChange={(e) =>
                  setTempField({ ...tempField, isNotNull: e.target.checked })
                }
              />
              Not Null
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tempField.isAutoIncrement}
                onChange={(e) =>
                  setTempField({
                    ...tempField,
                    isAutoIncrement: e.target.checked,
                  })
                }
              />
              Auto Increment
            </label>
          </div>

          <div className="flex gap-1">
            <button
              onClick={saveField}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              <Save size={14} />
            </button>
            <button
              onClick={cancelEdit}
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between py-1 px-2 mb-1 hover:bg-gray-50 rounded cursor-default">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{field.name}</span>
            {field.isPrimary && (
              <span className="text-xs bg-yellow-200 px-1 rounded">PK</span>
            )}
            {field.isNotNull && (
              <span className="text-xs bg-red-200 px-1 rounded">NN</span>
            )}
            {field.isAutoIncrement && (
              <span className="text-xs bg-blue-200 px-1 rounded">AI</span>
            )}
          </div>
          <div className="text-xs text-gray-500">{field.type}</div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(field.id)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={() => onDelete(tableId, field.id)}
            className="text-red-400 hover:text-red-600 p-1"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full relative bg-white bg-grid-pattern"
          style={{
            backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        >
          {tables.map((table) => (
            <DraggableTable key={table.id} table={table} />
          ))}

          {/* Floating Action Button */}
        </div>
      </div>

      {/* SQL Panel */}
      <div className="w-96 bg-gray-900 text-green-400 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">SQL Migration</h2>
            <button
              onClick={generateSQL}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              Generate SQL
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createNewTable}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50"
            >
              <Plus size={14} />
              Add Table
            </button>
            <button
              onClick={copySQL}
              disabled={!sqlCode}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50"
            >
              <Copy size={14} />
              Copy
            </button>
            <button
              onClick={downloadSQL}
              disabled={!sqlCode}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {sqlCode ||
              "-- Generate SQL to see migration code here\n-- Add tables and fields using the canvas"}
          </pre>
        </div>

        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <div className="mb-2">
            <strong className="text-white">Instructions:</strong>
          </div>
          <ul className="space-y-1 text-xs">
            <li>• Click + to add new tables</li>
            <li>• Drag tables to reposition</li>
            <li>• Click edit icon to modify names/fields</li>
            <li>• Use checkboxes for constraints</li>
            <li>• Generate SQL for migration code</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchemaDesigner;

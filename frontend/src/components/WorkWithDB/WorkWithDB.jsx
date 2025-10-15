import React, { useEffect, useState } from "react";
import "./WorkWithDB.css";
import Header from "../Header/Header";

const WorkWithDB = ({ schema, table }) => {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [newRow, setNewRow] = useState({});
  const token = localStorage.getItem("token");

  // fetch table columns and data
  useEffect(() => {
    if (!schema || !table) return;

    console.log(`Fetching data from ${schema}.${table}`);
    const headers = { Authorization: `Bearer ${token}` };

    // fetch columns first
    fetch(`http://localhost:4000/api/workspace/${schema}/${table}/columns`, {
      headers,
    })
      .then((r) => r.json())
      .then((cols) => {
        const colNames = cols.map((c) => c.column_name);
        setColumns(colNames);
      })
      .catch((err) => console.error("Column fetch error:", err));

    // then fetch rows
    fetch(`http://localhost:4000/api/workspace/${schema}/${table}`, {
      headers,
    })
      .then((r) => r.json())
      .then(setRows)
      .catch((err) => console.error("Fetch rows error:", err));
  }, [schema, table, token]);

  const handleChange = (key, value) => {
    setNewRow((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdd = async () => {
    console.log("Attempting to add row:", newRow);
    if (!Object.keys(newRow).length) return alert("Please fill in at least one field!");

    try {
      const res = await fetch(`http://localhost:4000/api/workspace/${schema}/${table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRow),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows((prev) => [...prev, data]);
      setNewRow({});
    } catch (err) {
      console.error("Insert failed:", err);
      alert("Insert failed: " + err.message);
    }
  };

  return (
    <div className="db-editor-page">
      <Header />
      <div className="db-editor">
        <h3>{schema}.{table}</h3>

        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col}>{row[col]}</td>
                ))}
              </tr>
            ))}
            <tr>
              {columns.map((col) => (
                <td key={col}>
                  <input
                    value={newRow[col] || ""}
                    onChange={(e) => handleChange(col, e.target.value)}
                    placeholder={col}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <button type="button" onClick={handleAdd}>Add Row</button>
      </div>
    </div>
  );
};

export default WorkWithDB;

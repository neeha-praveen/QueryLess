import React from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import "./QueryResultTable.css";

const QueryResultTable = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return <div className="no-results">No rows returned</div>;
  }

  // Build columns dynamically from keys
  const columns = Object.keys(rows[0]).map((key) => ({
    header: key,
    accessorKey: key,
  }));

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="query-result-table">
      <table>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QueryResultTable;

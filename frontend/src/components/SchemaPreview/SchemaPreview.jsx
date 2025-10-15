import React from 'react';
import './SchemaPreview.css';

const SchemaPreview = ({ schema, onConfirm }) => {
  if (!schema || !schema.tables || !schema.tables.length) {
    return <p>No schema data available.</p>;
  }

  return (
    <div className='schema-preview'>
      {schema.tables.map((table, i) => (
        <div key={i} className="table-block">
          <h4>Table: {table.name}</h4>
          <table>
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Data Type</th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map((col, j) => (
                <tr key={j}>
                  <td>{col.name}</td>
                  <td>{col.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <button className='approve-btn' onClick={onConfirm}>
        This is it
      </button>
    </div>
  );
};

export default SchemaPreview;

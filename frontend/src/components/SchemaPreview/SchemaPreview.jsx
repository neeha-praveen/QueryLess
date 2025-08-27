import React from 'react'
import './SchemaPreview.css';
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

const SchemaPreview = ({ schema, onConfirm }) => {
    const columns = schema.columns.map(col => ({
        header: col.name,
        accessorKey: col.name,
    }));

    const table = useReactTable({
        data: schema.sampleData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className='schema-preview'>
            <h4>Table: {schema.tableName}</h4>
            <table>
                <thead>
                    <tr>
                        <th>Column Name</th>
                        <th>Data Type</th>
                    </tr>
                </thead>
                <tbody>
                    {schema.columns.map((col, index) => (
                        <tr key={index}>
                            <td>{col.name}</td>
                            <td>{col.type}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className='approve-btn' onClick={onConfirm}>
                This is it
            </button>
        </div>
    );
};

export default SchemaPreview;
import React, { useMemo } from 'react';
import { useTable, useBlockLayout } from 'react-table';

interface TableProps {
  data: number[][];
}

const TableComponent: React.FC<TableProps> = ({ data }) => {
  const columns = useMemo(() => {
    // Vytvoríme stĺpce na základe počtu stĺpcov v matici
    const colCount = data.length > 0 ? data[0].length : 0;
    const cols = Array.from({ length: colCount }, (_, index) => ({
      Header: `Column ${index + 1}`,
      accessor: String(index),
    }));
    return cols;
  }, [data]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data,
    },
    useBlockLayout,
  );

  return (
    <div {...getTableProps()} style={{ overflowX: 'auto' }}>
      <div>
        {headerGroups.map(headerGroup => (
          <div {...headerGroup.getHeaderGroupProps()} style={{ display: 'flex' }}>
            {headerGroup.headers.map(column => (
              <div {...column.getHeaderProps()} style={{ flex: column.width }}>
                {column.render('Header')}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div {...getTableBodyProps()} style={{ overflowY: 'auto', height: '400px' }}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <div {...row.getRowProps()} style={{ display: 'flex' }}>
              {row.cells.map(cell => (
                <div {...cell.getCellProps()} style={{ flex: cell.column.width }}>
                  {cell.render('Cell')}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableComponent;

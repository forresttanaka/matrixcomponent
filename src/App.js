import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './App.css';
import matrixJson from './testMatrixJson';


const contentFunc = (col, row, value, meta) => (
    <span><i>{col}</i>:<strong>{row}</strong>:<span style={{ backgroundColor: meta ? meta.color : '#00FF00' }}>{value + (meta ? meta.adder : 0)}</span></span>
);

// Matrix data
// rows (required array)
//     Each element can be:
//         - an array of values, React components, and functions comprising the row
//         - an object including these properties:
//             - data: same as the previously described array (required array)
//             - css: CSS class to apply to every <tr> element in the table except where overridden
// tableCss: CSS class to apply to the <table> element
//
// Cell object options:
//    Need one and only one of:
//        content: What to display in a cell, with these options (required):
//            - Simple type (put into object to specify other options)
//            - React component
//            - Function returning value or React component
//                - called with (col, row, value, meta) parameters
//                    - col: 0-based column number
//                    - row: 0-based row number
//                    - value: value to display for call (simple type or React component)
//                    - meta:
//        header: Same as `content`, but generates a <th> instead of a <td>
//    value: If content/header is a function, this value gets passed to it
//    colMergeSpan: Number of columns cell should span
//    css: CSS classes to assign to the <td> of this cell
const matrixData = {
    rows: [
        [1, 2, { content: 3, style: { fontWeight: 100 } }, 4, { content: <span style={{ fontWeight: 'bold' }}>5</span> }, 6],
        [{ content: 7, css: 'cell-override' }, 8, { content: 'Special case', colSpan: 3 }, { content: contentFunc, value: 8 }],
        { rowContent: [13, { content: () => <i>5</i> }, null, { content: contentFunc, value: 16 }, 17, 18], css: 'row-class' },
        [19, 20, { content: contentFunc, value: 20, meta: { adder: 1, color: '#FFFF00' }}, 22, 23, 24],
        [{ content: 'Full Width', colSpan: 0, style: { textAlign: 'center', backgroundColor: '#c0c0ff' } }],
    ],
    rowKeys: [
        "one",
        "two",
        "three",
        "four",
        "five",
    ],
    rowCss: 'overall-row',
    tableCss: 'overall-table',
};


 /**
  * Determine the maximum width of all rows in `DataTable` data.
  * @param {object} tableData Same table data you pass to `DataTable`.
  */
 const tableDataMaxWidth = (tableData) => {
    const widths = tableData.rows.map(row => (Array.isArray(row) ? row.length : row.rowContent.length));
    return Math.max(...widths);
};


const DataTable = ({ tableData }) => {
    let colNumber;
    let cellContent;
    let maxWidth;

    return (
        <table className={tableData.tableCss || null}>
            <tbody>
                {tableData.rows.map((row, rowNumber) => {
                    // Get array of values representing a row or the `rowContent` array if the row
                    // is an object.
                    const cells = Array.isArray(row) ? row : row.rowContent;
                    const rowKey = tableData.rowKeys ? tableData.rowKeys[rowNumber] : rowNumber;
                    colNumber = 0;
                    return (
                        <tr key={rowKey} className={row.css || tableData.rowCss || null} style={row.style || null}>
                            {cells.map((cell, colIndex) => {
                                // Extract the cell's content from itself, its object, or its
                                // function. JS says `typeof null` is 'object'.
                                const cellType = typeof cell;
                                const cellValue = (cell !== null) && (cell.content || cell.header);
                                if (cellType === 'object' && cell !== null) {
                                    if (typeof cellValue === 'function') {
                                        // Need to call a function to get the cell's content.
                                        cellContent = cellValue(colNumber, rowNumber, cell.value, cell.meta);
                                    } else {
                                        // The cell content is right in the `content` or `header`.
                                        cellContent = cellValue;
                                    }
                                } else {
                                    // The array element itself is the value.
                                    cellContent = cell;
                                }
                                colNumber += 1;

                                // Cell's colSpan can be a specific number, 0 (full width), or
                                // undefined (1).
                                let cellColSpan = cell && cell.colSpan;
                                if (cellColSpan === 0) {
                                    // Request for colSpan to be whatever the maximum width of the
                                    // table. Use or get cached value.
                                    if (maxWidth === undefined) {
                                        maxWidth = tableDataMaxWidth(tableData);
                                    }
                                    cellColSpan = maxWidth;
                                } else if (cellColSpan === undefined) {
                                    // No colSpan defined for this cell, so it's 1.
                                    cellColSpan = 1;
                                }

                                // Render the cell, which could have a column span.
                                const cellCss = (cell && cell.css) || null;
                                const cellStyle = (cell && cell.style) || null;
                                if (cellColSpan > 1) {
                                    if (cell && cell.header) {
                                        return <th key={colIndex} colSpan={cellColSpan} className={cellCss} style={cellStyle}>{cellContent}</th>;
                                    }
                                    return <td key={colIndex} colSpan={cellColSpan} className={cellCss} style={cellStyle}>{cellContent}</td>;
                                }
                                if (cell && cell.header) {
                                    return <th key={colIndex} className={cellCss} style={cellStyle}>{cellContent}</th>;
                                }
                                return <td key={colIndex} className={cellCss} style={cellStyle}>{cellContent}</td>;
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

DataTable.propTypes = {
    /** Whole table data */
    tableData: PropTypes.object.isRequired,
};


const convertEncodeToMoss = (encodeData) => {
    const rowCategory = encodeData.matrix.y.group_by[0];
    const rowSubCategory = encodeData.matrix.y.group_by[1];
    const columnCategory = encodeData.matrix.x.group_by;

    const header = [' '].concat(encodeData.matrix.x.buckets.map(colCategory => ({ header: colCategory.key })));

    const rowCategoryData = encodeData.matrix.y[rowCategory].buckets;
    return rowCategoryData.reduce((acc, categoryBucket) => {
        const subCategoryData = categoryBucket[rowSubCategory].buckets;
        const categoryMatrixSection = subCategoryData.map((subCategoryBucket) => (
            [{ header: subCategoryBucket.key }].concat(subCategoryBucket[columnCategory].slice())
        ));
        return acc.concat([[{ header: categoryBucket.key, colMergeSpan: 100 }]], categoryMatrixSection);
    }, [header]);
};


class App extends Component {
    render() {
        const realMatrixData = convertEncodeToMoss(matrixJson);
        const realMatrixConfig = Object.assign({}, matrixData);
        realMatrixConfig.rows = realMatrixData;
        return (
            <div className="App">
                <DataTable tableData={matrixData} />
            </div>
        );
    }
}

export default App;

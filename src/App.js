import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './App.css';
import matrixJson from './testMatrixJson';


const testFunc = (col, row, value, meta) => <span><i>{col}</i>:<strong>{row}</strong>:<span style={{ backgroundColor: '#00FF00' }}>{value}</span></span>;


// Matrix data
// rows (required array)
//     One entry per row, always an array
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
const matrixData = {
    rows: [
        [1, 2, 3, 4, { content: <span style={{ fontWeight: 'bold' }}>5</span> }, 6],
        [7, 8, { content: 'Special case', colMergeSpan: 3 }, { content: testFunc, value: 8 }],
        [13, { content: () => <i>5</i> }, 15, { content: testFunc, value: 16 }, 17, 18],
    ],
    headerTop: [
        'Vertical header 1',
        {
            content: 'Vertical header 2',
            colMergeSpan: 3,
        },
        'Vertical header 5',
    ],
};


class MossMatrix extends React.Component {
    render() {
        const { data } = this.props;
        let row;
        let col;
        let content;

        return (
            <table>
                <tbody>
                    {data.rows.map((cells, rowIndex) => {
                        row = rowIndex === 0 ? 0 : row + 1;
                        return (
                            <tr key={row}>
                                {cells.map((cell, colIndex) => {
                                    const cellType = typeof cell;

                                    // Check for cell objects specifying a column span.
                                    const colMergeSpan = cellType === 'object' && cell.colMergeSpan ? cell.colMergeSpan : 1;
                                    col = colIndex === 0 ? 0 : col + colMergeSpan;
                                    const cellValue = cell.content || cell.header;

                                    if (cellType === 'object') {
                                        if (typeof cellValue === 'function') {
                                            content = cellValue(col, row, cell.value, cell.meta);
                                        } else {
                                            content = cellValue;
                                        }
                                    } else {
                                        content = cell;
                                    }

                                    // Render the cell, which could have a column span.
                                    if (colMergeSpan > 1) {
                                        if (cell.header) {
                                            return <th key={colIndex} colSpan={colMergeSpan}>{content}</th>;
                                        }
                                        return <td key={colIndex} colSpan={colMergeSpan}>{content}</td>;
                                    }
                                    if (cell.header) {
                                        return <th key={colIndex}>{content}</th>;
                                    }
                                    return <td key={colIndex}>{content}</td>;
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }
}

MossMatrix.propTypes = {
    /** Whole matrix data */
    data: PropTypes.object.isRequired,
    /** Extra data */
    meta: PropTypes.object,
};

MossMatrix.defaultProps = {
    meta: null,
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
                {/* <header className="App-header">
                    Matrix test
                </header> */}
                {/* <MossMatrix data={matrixData} /> */}
                <div>
                    <header className="App-header">
                        Matrix data test
                    </header>
                    <MossMatrix data={realMatrixConfig} />
                </div>
            </div>
        );
    }
}

export default App;

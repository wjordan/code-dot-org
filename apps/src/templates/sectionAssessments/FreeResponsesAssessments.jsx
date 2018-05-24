import React, {Component, PropTypes} from 'react';
import {Table, sort} from 'reactabular';
import {tableLayoutStyles, sortableOptions} from "../tables/tableConstants";
import i18n from '@cdo/locale';
import wrappedSortable from '../tables/wrapped_sortable';
import orderBy from 'lodash/orderBy';

export const COLUMNS = {
  STUDENT: 0,
  RESPONSE: 1,
};

const freeResponsesDataPropType = PropTypes.shape({
  id:  PropTypes.number.isRequired,
  studentId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  response: PropTypes.string.isRequired,
});

class FreeResponsesAssessments extends Component {
  static propTypes= {
    freeResponses: PropTypes.arrayOf(freeResponsesDataPropType),
    // responses: PropTypes.arrayOf(textResponsePropType),
  };

  state = {
    [COLUMNS.NAME]: {
      direction: 'desc',
      position: 0
    }
  };

  getSortingColumns = () => {
    return this.state.sortingColumns || {};
  };

  onSort = (selectedColumn) => {
    this.setState({
      sortingColumns: sort.byColumn({
        sortingColumns: this.state.sortingColumns,
        sortingOrder: {
          FIRST: 'asc',
          asc: 'desc',
          desc: 'asc',
        },
        selectedColumn
      })
    });
  };

  studentResponseColumnFormatter = (response, {rowIndex}) => {
   const studentResponse = this.props.freeResponses[rowIndex].response;

    return (
      <div>
        {studentResponse}
      </div>
    );
  };

  studentNameColumnFormatter = (name, {rowIndex}) => {
    const studentName = this.props.freeResponses[rowIndex].name;

    return (
      <div>
      {studentName}
      </div>
    );
  };

  getColumns = (sortable, index) => {
    let dataColumns = [
      {
        property: 'studentName',
        header: {
          label: i18n.studentName(),
          props: {style: tableLayoutStyles.headerCell},
        },
        cell: {
          format: this.studentNameColumnFormatter,
          props: {style:tableLayoutStyles.cell},
        }
      },
      {
        property: 'studentResponse',
        header: {
          label: i18n.response(),
          props: {style: tableLayoutStyles.headerCell},
        },
        cell: {
          format: this.studentResponseColumnFormatter,
          props: {style:tableLayoutStyles.cell},
        }
      },
    ];
    return dataColumns;
  };

  render() {
    // Define a sorting transform that can be applied to each column
    const sortable = wrappedSortable(this.getSortingColumns, this.onSort, sortableOptions);
    const columns = this.getColumns(sortable);
    const sortingColumns = this.getSortingColumns();

    const sortedRows = sort.sorter({
      columns,
      sortingColumns,
      sort: orderBy,
    })(this.props.freeResponses);

    return (
        <Table.Provider
          columns={columns}
          style={tableLayoutStyles.table}
        >
          <Table.Header />
          <Table.Body rows={sortedRows} rowKey="id" />
        </Table.Provider>
    );
  }
}

export default FreeResponsesAssessments;

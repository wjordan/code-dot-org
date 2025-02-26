import fontConstants from '@cdo/apps/fontConstants';

import styleConstants from '../../styleConstants';
import color from '../../util/color';

// Constants for React tables

// Styles for a reacttabular table
export const tableLayoutStyles = {
  tableText: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  table: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: color.border_gray,
    width: styleConstants['content-width'],
    backgroundColor: color.table_light_row,
  },
  cell: {
    maxWidth: 200,
    border: '1px solid',
    borderColor: color.border_light_gray,
    padding: 10,
    fontSize: 14,
  },
  headerCell: {
    backgroundColor: color.table_header,
    fontWeight: 'bold',
    borderColor: color.border_light_gray,
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 1,
    paddingTop: 20,
    paddingBottom: 20,
    color: color.charcoal,
    textAlign: 'inherit',
  },
  link: {
    ...fontConstants['main-font-semi-bold'],
    fontSize: 14,
    textDecoration: 'none',
  },
  unsortableHeader: {
    paddingLeft: 25,
  },
  unsortableHeaderRTL: {
    paddingRight: 25,
  },
};

export const plTableLayoutStyles = {
  link: {
    ...fontConstants['main-font-semi-bold'],
    fontSize: 14,
    textDecoration: 'none',
  },
  sectionLink: {
    ...fontConstants['main-font-semi-bold'],
    fontSize: 14,
    color: color.neutral_dark,
    textDecoration: 'underline',
  },
  currentUnit: {
    marginTop: 10,
    fontSize: 14,
  },
  colButton: {
    paddingTop: 20,
    paddingLeft: 20,
    paddingBottom: 20,
    width: 40,
  },
  participantTypeCell: {
    fontSize: 14,
  },
  leaveButton: {
    fontSize: 14,
  },
};

// Settings for WrappedSortable
export const sortableOptions = {
  // Dim inactive sorting icons in the column headers
  default: {color: 'rgba(0, 0, 0, 0.2 )'},
};

export const NAME_CELL_INPUT_WIDTH = 160;

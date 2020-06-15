import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import ProjectHeader from './ProjectHeader';
import MinimalProjectHeader from './MinimalProjectHeader';
import ProjectBackedHeader from './ProjectBackedHeader';
import LevelBuilderSaveButton from './LevelBuilderSaveButton';
import {possibleHeaders} from '../../headerRedux';

const headerComponents = {
  [possibleHeaders.project]: ProjectHeader,
  [possibleHeaders.minimalProject]: MinimalProjectHeader,
  [possibleHeaders.projectBacked]: ProjectBackedHeader,
  [possibleHeaders.levelBuilderSave]: LevelBuilderSaveButton
};

const styles = {
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    height: 40
  },
  projectInfo: {
    position: 'absolute'
  }
};

class ProjectInfo extends React.Component {
  static propTypes = {
    currentHeader: PropTypes.oneOf(Object.values(possibleHeaders)),
    width: PropTypes.number,
    onSize: PropTypes.func.isRequired
  };

  componentDidMount() {
    // Report back to our parent how wide we would like to be.
    const fullWidth = $('.project_info').width();
    this.props.onSize(fullWidth);
  }

  componentDidUpdate() {
    // Report back to our parent how wide we would like to be.
    const fullWidth = $('.project_info').width();
    this.props.onSize(fullWidth);
  }

  render() {
    if (!this.props.currentHeader) {
      return null;
    }

    const HeaderComponent = headerComponents[this.props.currentHeader];
    return (
      <div style={styles.headerContainer}>
        <div className="project_info" style={styles.projectInfo}>
          <HeaderComponent />
        </div>
      </div>
    );
  }
}

export const UnconnectedProjectInfo = ProjectInfo;
export default connect(state => ({
  currentHeader: state.header.currentHeader
}))(ProjectInfo);

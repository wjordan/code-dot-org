import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Radium from 'radium';
import color from '@cdo/apps/util/color';
import onClickOutside from 'react-onclickoutside';
import JavalabButton from './JavalabButton';
import javalabMsg from '@cdo/javalab/locale';
import {connect} from 'react-redux';

/**
 * A button that drops down to a set of importable files, and closes itself if
 * you click on the import button, or outside of the dropdown.
 */
class Backpack extends Component {
  static propTypes = {
    isDarkMode: PropTypes.bool.isRequired,
    isDisabled: PropTypes.bool.isRequired,
    // populated by redux
    backpackApi: PropTypes.object.isRequired
  };

  state = {
    dropdownOpen: false,
    backpackFilenames: [],
    backpackFilesLoading: false,
    backpackLoadError: false,
    selectedFiles: []
  };

  expandDropdown = () => {
    this.setState({
      dropdownOpen: true,
      backpackLoadError: false
    });
    if (this.props.backpackApi.hasBackpack()) {
      this.setState({backpackFilesLoading: true});
      this.props.backpackApi.getFileList(
        this.onBackpackFileLoadError,
        this.onBackpackFileLoadSuccess
      );
    } else {
      this.setState({
        backpackFilenames: []
      });
    }
  };

  collapseDropdown = () => {
    this.setState({dropdownOpen: false});
  };

  handleClickOutside = () => {
    if (this.state.dropdownOpen) {
      this.collapseDropdown();
    }
  };

  toggleDropdown = () => {
    if (this.state.dropdownOpen) {
      this.collapseDropdown();
    } else {
      this.expandDropdown();
    }
  };

  onBackpackFileLoadError = () => {
    console.log('load error!');
    this.setState({
      backpackLoadError: true,
      backpackFilesLoading: false
    });
  };

  onBackpackFileLoadSuccess = filenames => {
    console.log('load success!');
    this.setState({
      backpackFilenames: filenames,
      backpackFilesLoading: false,
      backpackLoadError: false
    });
  };

  render() {
    const {isDarkMode, isDisabled} = this.props;
    const {
      dropdownOpen,
      backpackFilenames,
      backpackFilesLoading,
      backpackLoadError,
      selectedFiles
    } = this.state;

    const showFiles =
      backpackFilenames.length > 0 &&
      !backpackFilesLoading &&
      !backpackLoadError;
    const showNoFiles =
      !backpackFilesLoading &&
      !backpackLoadError &&
      backpackFilenames.length === 0;

    return (
      <div>
        <JavalabButton
          icon={
            <img
              src="/blockly/media/javalab/backpack.png"
              alt="backpack icon"
              style={styles.backpackIcon}
            />
          }
          text={javalabMsg.backpackLabel()}
          style={{
            ...styles.buttonStyles,
            ...(dropdownOpen && styles.dropdownOpenButton)
          }}
          isHorizontal
          onClick={this.toggleDropdown}
          isDisabled={isDisabled}
        />
        {dropdownOpen && (
          <div
            style={{...styles.dropdown, ...(isDarkMode && styles.dropdownDark)}}
            ref={ref => (this.dropdownList = ref)}
          >
            {showFiles && (
              <div>
                {backpackFilenames.map((filename, index) => (
                  <div
                    style={{
                      ...styles.fileListItem,
                      ...(isDarkMode && styles.fileListItemDark)
                    }}
                    key={`backpack-file-${index}`}
                  >
                    <input
                      type="checkbox"
                      id={`backpack-file-${index}`}
                      name={filename}
                    />
                    <label
                      htmlFor={`backpack-file-${index}`}
                      style={styles.fileListLabel}
                    >
                      {filename}
                    </label>
                  </div>
                ))}
                <JavalabButton
                  text="Import"
                  style={styles.importButton}
                  onClick={this.collapseDropdown}
                  isDisabled={selectedFiles.length > 0}
                />
              </div>
            )}
            {backpackFilesLoading && (
              <span className="fa fa-spin fa-spinner" style={styles.spinner} />
            )}
            {backpackLoadError && (
              <div style={styles.message}>
                {javalabMsg.backpackListLoadError()}
              </div>
            )}
            {showNoFiles && (
              <div style={styles.message}>
                {javalabMsg.emptyBackpackMessage()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

const styles = {
  dropdown: {
    position: 'absolute',
    marginTop: 30,
    backgroundColor: color.lightest_gray,
    color: color.darkest_gray,
    zIndex: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 150
  },
  dropdownDark: {
    backgroundColor: color.darkest_gray,
    color: color.light_gray
  },
  buttonStyles: {
    cursor: 'pointer',
    float: 'right',
    backgroundColor: color.light_purple,
    margin: '3px 3px 3px 0px',
    height: 24,
    borderRadius: 4,
    borderWidth: 0,
    fontSize: 13,
    color: color.white,
    padding: '0px 12px',
    fontFamily: '"Gotham 5r", sans-serif',
    lineHeight: '18px',
    ':hover': {
      backgroundColor: color.cyan
    }
  },
  dropdownOpenButton: {
    backgroundColor: color.cyan
  },
  fileListItem: {
    display: 'flex',
    flexDirection: 'row',
    padding: '5px 10px 5px 10px',
    width: '90%',
    ':hover': {
      backgroundColor: color.lighter_gray
    }
  },
  fileListItemDark: {
    ':hover': {
      backgroundColor: color.black
    }
  },
  fileListLabel: {
    marginLeft: 5
  },
  importButton: {
    backgroundColor: color.orange,
    color: color.white,
    fontSize: 13,
    padding: '5px 16px'
  },
  backpackIcon: {
    height: 15,
    opacity: 1
  },
  spinner: {
    fontSize: 22
  },
  message: {
    fontStyle: 'italic',
    fontSize: 10,
    lineHeight: 12
  }
};

export default connect(state => ({
  backpackApi: state.javalab.backpackApi
}))(onClickOutside(Radium(Backpack)));

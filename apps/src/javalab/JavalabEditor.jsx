import React from 'react';
import {connect} from 'react-redux';
import Radium from 'radium'; // eslint-disable-line no-restricted-imports
import {
  setSource,
  sourceTextUpdated,
  sourceVisibilityUpdated,
  sourceValidationUpdated,
  renameFile,
  removeFile,
  setRenderedHeight,
  setEditorColumnHeight,
  setEditTabKey,
  setActiveTabKey,
  setOrderedTabKeys,
  setFileMetadata,
  setAllEditorMetadata,
  openEditorDialog,
  closeEditorDialog,
  clearRenameFileError,
  setNewFileError,
  clearNewFileError,
  setRenameFileError
} from './javalabRedux';
import {DisplayTheme} from './DisplayTheme';
import PropTypes from 'prop-types';
import {EditorView} from '@codemirror/view';
import {editorSetup} from './editorSetup';
import {EditorState, Compartment} from '@codemirror/state';
import {projectChanged} from '@cdo/apps/code-studio/initApp/project';
import color from '@cdo/apps/util/color';
import {Tab, Nav, NavItem} from 'react-bootstrap';
import JavalabEditorTabMenu from './JavalabEditorTabMenu';
import JavalabFileExplorer from './JavalabFileExplorer';
import FontAwesome from '@cdo/apps/templates/FontAwesome';
import _ from 'lodash';
import msg from '@cdo/locale';
import javalabMsg from '@cdo/javalab/locale';
import {getDefaultFileContents, getTabKey} from './JavalabFileHelper';
import {darkMode, lightMode} from './editorThemes';
import {hasQueryParam} from '@cdo/apps/code-studio/utils';
import JavalabEditorDialogManager, {
  JavalabEditorDialog
} from './JavalabEditorDialogManager';
import JavalabEditorHeader from './JavalabEditorHeader';

const MIN_HEIGHT = 100;
// This is the height of the "editor" header and the file tabs combined
const HEADER_OFFSET = 63;
const EDITOR_LOAD_PAUSE_MS = 100;

class JavalabEditor extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    onCommitCode: PropTypes.func.isRequired,
    isProjectTemplateLevel: PropTypes.bool.isRequired,
    handleClearPuzzle: PropTypes.func.isRequired,
    viewMode: PropTypes.string,

    // populated by redux
    setSource: PropTypes.func,
    sourceVisibilityUpdated: PropTypes.func,
    sourceValidationUpdated: PropTypes.func,
    sourceTextUpdated: PropTypes.func,
    renameFile: PropTypes.func,
    removeFile: PropTypes.func,
    sources: PropTypes.object,
    validation: PropTypes.object,
    displayTheme: PropTypes.oneOf(Object.values(DisplayTheme)),
    height: PropTypes.number,
    isEditingStartSources: PropTypes.bool,
    isReadOnlyWorkspace: PropTypes.bool.isRequired,
    hasOpenCodeReview: PropTypes.bool,
    isViewingOwnProject: PropTypes.bool,
    codeOwnersName: PropTypes.string,
    fileMetadata: PropTypes.object.isRequired,
    setFileMetadata: PropTypes.func.isRequired,
    orderedTabKeys: PropTypes.array.isRequired,
    setOrderedTabKeys: PropTypes.func.isRequired,
    activeTabKey: PropTypes.string,
    setActiveTabKey: PropTypes.func.isRequired,
    lastTabKeyIndex: PropTypes.number.isRequired,
    editTabKey: PropTypes.string,
    setEditTabKey: PropTypes.func.isRequired,
    setAllEditorMetadata: PropTypes.func.isRequired,
    openEditorDialog: PropTypes.func.isRequired,
    closeEditorDialog: PropTypes.func.isRequired,
    setNewFileError: PropTypes.func.isRequired,
    clearNewFileError: PropTypes.func.isRequired,
    setRenameFileError: PropTypes.func.isRequired,
    clearRenameFileError: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.onChangeTabs = this.onChangeTabs.bind(this);
    this.toggleTabMenu = this.toggleTabMenu.bind(this);
    this.renameFromTabMenu = this.renameFromTabMenu.bind(this);
    this.deleteFromTabMenu = this.deleteFromTabMenu.bind(this);
    this.cancelTabMenu = this.cancelTabMenu.bind(this);

    this.onRenameFile = this.onRenameFile.bind(this);
    this.onCreateFile = this.onCreateFile.bind(this);
    this.onDeleteFile = this.onDeleteFile.bind(this);
    this.onOpenFile = this.onOpenFile.bind(this);
    this.updateVisibility = this.updateVisibility.bind(this);
    this.updateValidation = this.updateValidation.bind(this);
    this.updateFileType = this.updateFileType.bind(this);
    this.onImportFile = this.onImportFile.bind(this);
    this._codeMirrors = {};

    // Used to manage dark and light mode configuration.
    this.editorModeConfigCompartment = new Compartment();
    this.editorThemeOverrideCompartment = new Compartment();

    // Used to manage readOnly/editable configuration.
    this.editorEditableCompartment = new Compartment();
    this.editorReadOnlyCompartment = new Compartment();

    this.state = {
      showMenu: false,
      contextTarget: null,
      menuPosition: {},
      fileToDelete: null
    };
  }

  componentDidMount() {
    this.editors = {};
    const {sources, orderedTabKeys, fileMetadata} = this.props;
    orderedTabKeys.forEach(tabKey => {
      this.createEditor(tabKey, sources[fileMetadata[tabKey]].text);
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.displayTheme !== this.props.displayTheme) {
      const newStyle =
        this.props.displayTheme === DisplayTheme.DARK ? darkMode : lightMode;

      Object.keys(this.editors).forEach(editorKey => {
        this.editors[editorKey].dispatch({
          effects: this.editorModeConfigCompartment.reconfigure(newStyle)
        });
      });
    }

    if (prevProps.isReadOnlyWorkspace !== this.props.isReadOnlyWorkspace) {
      Object.keys(this.editors).forEach(editorKey => {
        this.editors[editorKey].dispatch({
          effects: [
            this.editorEditableCompartment.reconfigure(
              EditorView.editable.of(!this.props.isReadOnlyWorkspace)
            ),
            this.editorReadOnlyCompartment.reconfigure(
              EditorState.readOnly.of(this.props.isReadOnlyWorkspace)
            )
          ]
        });
      });
    }

    const {fileMetadata} = this.props;

    if (
      !_.isEqual(Object.keys(prevProps.fileMetadata), Object.keys(fileMetadata))
    ) {
      for (const tabKey in fileMetadata) {
        if (!this.editors[tabKey]) {
          // create an editor if it doesn't exist yet
          const source = this.props.sources[fileMetadata[tabKey]];
          const doc = (source && source.text) || '';
          this.createEditor(tabKey, doc);
        }
      }
    }
  }

  createEditor(key, doc) {
    const {displayTheme, isReadOnlyWorkspace} = this.props;
    const extensions = [...editorSetup];

    extensions.push(
      displayTheme === DisplayTheme.DARK
        ? this.editorModeConfigCompartment.of(darkMode)
        : this.editorModeConfigCompartment.of(lightMode)
    );

    extensions.push(
      this.editorEditableCompartment.of(
        EditorView.editable.of(!isReadOnlyWorkspace)
      ),
      this.editorReadOnlyCompartment.of(
        EditorState.readOnly.of(isReadOnlyWorkspace)
      )
    );

    this.editors[key] = new EditorView({
      state: EditorState.create({
        doc: doc,
        extensions: extensions
      }),
      parent: this._codeMirrors[key],
      dispatch: this.dispatchEditorChange(key)
    });
  }

  dispatchEditorChange = key => {
    const {sourceTextUpdated} = this.props;

    // tr is a code mirror transaction
    // see https://codemirror.net/6/docs/ref/#state.Transaction
    return tr => {
      // we are overwriting the default dispatch method for codemirror,
      // so we need to manually call the update method.
      this.editors[key].update([tr]);
      // if there are changes to the editor, update redux.
      if (!tr.changes.empty && tr.newDoc) {
        sourceTextUpdated(this.props.fileMetadata[key], tr.newDoc.toString());
        projectChanged();
      }
    };
  };

  updateVisibility(key, isVisible) {
    this.props.sourceVisibilityUpdated(this.props.fileMetadata[key], isVisible);
    this.setState({
      showMenu: false,
      contextTarget: null
    });
  }

  updateValidation(key, isValidation) {
    this.props.sourceValidationUpdated(
      this.props.fileMetadata[key],
      isValidation
    );
    this.setState({
      showMenu: false,
      contextTarget: null
    });
  }

  updateFileType(key, isVisible, isValidation) {
    this.updateVisibility(key, isVisible);
    this.updateValidation(key, isValidation);
  }

  makeListeners(key) {
    return {
      onContextMenu: e => {
        this.openTabContextMenu(key, e);
      }
    };
  }

  onChangeTabs(key) {
    if (key !== this.props.activeTabKey) {
      this.props.setActiveTabKey(key);
      this.setState({
        showMenu: false,
        contextTarget: null
      });
      // scroll the new editor to whatever its current selection is.
      // If this editor has no selection it will stay at the top of the file.
      this.editors[key].dispatch({
        scrollIntoView: true
      });
      // It takes a second for the editor to show up. We can't
      // focus on it until it is visible, so we set a delay to focus
      // on the new editor.
      const timer = setInterval(() => {
        this.editors[key].focus();
        if (this.editors[key].hasFocus) {
          // stop trying to focus once we have focused.
          clearInterval(timer);
        }
      }, EDITOR_LOAD_PAUSE_MS);
    }
  }

  // This opens and closes the dropdown menu on the active tab
  toggleTabMenu(key, e) {
    if (key === this.state.contextTarget) {
      this.cancelTabMenu();
    } else {
      e.preventDefault();
      const boundingRect = e.target.getBoundingClientRect();
      this.setState({
        showMenu: true,
        contextTarget: key,
        menuPosition: {
          top: `${boundingRect.bottom}px`,
          left: `${boundingRect.left}px`
        }
      });
    }
  }

  // This is called from the dropdown menu on the active tab
  // when the rename option is clicked
  renameFromTabMenu() {
    this.props.setEditTabKey(this.state.contextTarget);
    this.props.openEditorDialog(JavalabEditorDialog.RENAME_FILE);
    this.setState({
      showMenu: false,
      contextTarget: null
    });
  }

  // This closes the dropdown menu on the active tab
  cancelTabMenu() {
    this.setState({
      showMenu: false,
      contextTarget: null
    });
  }

  // This is called from the dropdown menu on the active tab
  // when the delete option is clicked
  deleteFromTabMenu() {
    this.props.openEditorDialog(JavalabEditorDialog.DELETE_FILE);
    this.setState({
      showMenu: false,
      contextTarget: null,
      fileToDelete: this.state.contextTarget
    });
  }

  // Checks if the given file name is valid and if not, calls the given setErrorMessage
  // callback with the appropriate error message. Returns whether or not the file name is valid.
  validateFileName(filename, setErrorMessage) {
    let errorMessage;

    if (!filename) {
      errorMessage = javalabMsg.missingFilenameError();
    } else if (
      filename === '.java' ||
      (filename.toLowerCase().endsWith('.java') && !filename.endsWith('.java'))
    ) {
      // if filename is either only '.java' or ends with a non-lowercase casing of '.java',
      // give an error with an example Java filename.
      errorMessage = javalabMsg.invalidJavaFilenameFormat();
    } else if (filename.endsWith('.java') && /\s/g.test(filename)) {
      // Java file names cannot contains spaces
      errorMessage = javalabMsg.invalidJavaFilename();
    }

    if (errorMessage) {
      setErrorMessage(errorMessage);
    }

    return !errorMessage;
  }

  onRenameFile(newFilename) {
    const {
      fileMetadata,
      setFileMetadata,
      editTabKey,
      renameFile,
      closeEditorDialog,
      setRenameFileError,
      clearRenameFileError
    } = this.props;
    newFilename = newFilename.trim();
    if (!this.validateFileName(newFilename, setRenameFileError)) {
      return;
    }
    // check for duplicate filename
    const duplicateFileError = this.checkDuplicateFileName(newFilename);
    if (duplicateFileError) {
      setRenameFileError(duplicateFileError);
      return;
    }

    // update file metadata with new filename
    const newFileMetadata = {...fileMetadata};
    newFileMetadata[editTabKey] = newFilename;
    const oldFilename = fileMetadata[editTabKey];

    // update sources with new filename
    renameFile(oldFilename, newFilename);
    setFileMetadata(newFileMetadata);
    projectChanged();
    closeEditorDialog();
    clearRenameFileError();
  }

  onCreateFile(filename, fileContents) {
    const {
      lastTabKeyIndex,
      fileMetadata,
      orderedTabKeys,
      setSource,
      setAllEditorMetadata,
      closeEditorDialog,
      setNewFileError,
      clearNewFileError
    } = this.props;
    filename = filename.trim();
    if (!this.validateFileName(filename, setNewFileError)) {
      return;
    }
    const duplicateFileError = this.checkDuplicateFileName(filename);
    if (duplicateFileError) {
      setNewFileError(duplicateFileError);
      return;
    }

    const newTabIndex = lastTabKeyIndex + 1;
    const newTabKey = getTabKey(newTabIndex);

    fileContents =
      fileContents || getDefaultFileContents(filename, this.props.viewMode);

    // update file key to filename map with new file name
    const newFileMetadata = {...fileMetadata};
    newFileMetadata[newTabKey] = filename;

    // add new key to tabs
    let newTabs = [...orderedTabKeys];
    newTabs.push(newTabKey);

    // add new file to sources
    setSource(filename, fileContents);
    projectChanged();
    setAllEditorMetadata(newFileMetadata, newTabs, newTabKey, newTabIndex);

    // add new tab and set it as the active tab
    closeEditorDialog();
    clearNewFileError();
  }

  onDeleteFile() {
    const {fileToDelete} = this.state;
    const {
      fileMetadata,
      orderedTabKeys,
      activeTabKey,
      removeFile,
      setAllEditorMetadata
    } = this.props;
    // find tab in list
    const indexToRemove = orderedTabKeys.indexOf(fileToDelete);

    if (indexToRemove >= 0) {
      // delete from tabs
      let newTabs = [...orderedTabKeys];
      newTabs.splice(indexToRemove, 1);
      let newActiveTabKey = activeTabKey;
      // we need to update the active tab if we are deleting the currently active tab
      if (activeTabKey === fileToDelete) {
        // if there is still at least 1 file, go to first file, otherwise wipe out active tab key
        newActiveTabKey = newTabs.length > 0 ? newTabs[0] : null;
      }

      // delete tab key from tab to filename map
      const newFileMetadata = {...fileMetadata};
      delete newFileMetadata[fileToDelete];
      // clean up editors
      delete this.editors[fileToDelete];

      setAllEditorMetadata(newFileMetadata, newTabs, newActiveTabKey);

      // delete from sources
      removeFile(fileMetadata[fileToDelete]);
      projectChanged();
    }

    this.props.closeEditorDialog();
    this.setState({
      showMenu: false,
      contextTarget: null,
      fileToDelete: null
    });
  }

  onImportFile(filename, fileContents) {
    const {fileMetadata} = this.props;
    // If filename already exists in sources, replace file contents.
    // Otherwise, create a new file.
    if (Object.keys(this.props.sources).includes(filename)) {
      // find editor for filename and overwrite contents of that editor
      let editorKey = null;
      for (const key in fileMetadata) {
        if (fileMetadata[key] === filename) {
          editorKey = key;
        }
      }
      const editor = this.editors[editorKey];
      editor.dispatch({
        changes: {from: 0, to: editor.state.doc.length, insert: fileContents}
      });
      this.props.setSource(filename, fileContents);
    } else {
      // create new file
      this.onCreateFile(filename, fileContents);
    }
    projectChanged();
  }

  duplicateFileError(filename) {
    return javalabMsg.duplicateProjectFilenameError({filename: filename});
  }

  duplicateSupportFileError(filename) {
    return javalabMsg.duplicateSupportFilenameError({filename: filename});
  }

  /**
   * Checks if the new file name already exists in the project in both user and support code.
   * Returns the appropriate error message if so.
   */
  checkDuplicateFileName(newFilename) {
    if (Object.keys(this.props.sources).includes(newFilename)) {
      return this.props.sources[newFilename].isVisible
        ? this.duplicateFileError(newFilename)
        : this.duplicateSupportFileError(newFilename);
    } else if (Object.keys(this.props.validation).includes(newFilename)) {
      return this.duplicateSupportFileError(newFilename);
    }
  }

  // This is called from the file explorer when we want to jump to a file
  onOpenFile(key) {
    const {orderedTabKeys, setOrderedTabKeys, setActiveTabKey} = this.props;
    let newTabs = [...orderedTabKeys];
    let selectedFileIndex = newTabs.indexOf(key);
    newTabs.splice(selectedFileIndex, 1);
    newTabs.unshift(key);

    setActiveTabKey(key);
    setOrderedTabKeys(newTabs);

    // closes the tab menu if it is open
    this.setState({
      showMenu: false,
      contextTarget: null
    });
  }

  editorHeaderText = () =>
    this.props.isReadOnlyWorkspace
      ? msg.readonlyWorkspaceHeader()
      : javalabMsg.editor();

  render() {
    const {fileToDelete, contextTarget} = this.state;
    const {
      onCommitCode,
      displayTheme,
      sources,
      isEditingStartSources,
      isReadOnlyWorkspace,
      hasOpenCodeReview,
      isViewingOwnProject,
      height,
      isProjectTemplateLevel,
      handleClearPuzzle,
      orderedTabKeys,
      fileMetadata,
      activeTabKey,
      editTabKey,
      codeOwnersName
    } = this.props;

    const showOpenCodeReviewWarning =
      isReadOnlyWorkspace && hasOpenCodeReview && !hasQueryParam('version');

    let menuStyle = {
      display: this.state.showMenu ? 'block' : 'none',
      position: 'fixed',
      top: this.state.menuPosition.top,
      left: this.state.menuPosition.left,
      backgroundColor: '#F0F0F0',
      zIndex: 1000
    };
    return (
      <div style={this.props.style}>
        <JavalabEditorHeader onBackpackImportFile={this.onImportFile} />
        <Tab.Container
          activeKey={activeTabKey}
          onSelect={key => this.onChangeTabs(key)}
          id="javalab-editor-tabs"
          className={displayTheme === DisplayTheme.DARK ? 'darkmode' : ''}
        >
          <div>
            <Nav bsStyle="tabs" style={styles.tabs}>
              <JavalabFileExplorer
                fileMetadata={fileMetadata}
                onSelectFile={this.onOpenFile}
                displayTheme={displayTheme}
              />
              {orderedTabKeys.map(tabKey => {
                return (
                  <NavItem eventKey={tabKey} key={`${tabKey}-tab`}>
                    {isEditingStartSources && (
                      <FontAwesome
                        style={styles.fileTypeIcon}
                        icon={
                          sources[fileMetadata[tabKey]].isVisible
                            ? 'eye'
                            : sources[fileMetadata[tabKey]].isValidation
                            ? 'flask'
                            : 'eye-slash'
                        }
                      />
                    )}
                    {!isEditingStartSources && (
                      <FontAwesome
                        style={styles.fileTypeIcon}
                        icon={'file-text'}
                      />
                    )}
                    <span>{fileMetadata[tabKey]}</span>

                    <button
                      ref={`${tabKey}-file-toggle`}
                      type="button"
                      style={{
                        ...styles.fileMenuToggleButton,
                        ...(displayTheme === DisplayTheme.DARK &&
                          styles.darkFileMenuToggleButton),
                        ...((isReadOnlyWorkspace ||
                          activeTabKey !== tabKey) && {
                          visibility: 'hidden'
                        })
                      }}
                      onClick={e => this.toggleTabMenu(tabKey, e)}
                      className="no-focus-outline"
                      disabled={isReadOnlyWorkspace || activeTabKey !== tabKey}
                    >
                      <FontAwesome
                        icon={
                          contextTarget === tabKey ? 'caret-up' : 'caret-down'
                        }
                      />
                    </button>
                  </NavItem>
                );
              })}
            </Nav>
            <div style={menuStyle}>
              <JavalabEditorTabMenu
                cancelTabMenu={this.cancelTabMenu}
                renameFromTabMenu={this.renameFromTabMenu}
                deleteFromTabMenu={this.deleteFromTabMenu}
                changeFileTypeFromTabMenu={(isVisible, isValidation) =>
                  this.updateFileType(activeTabKey, isVisible, isValidation)
                }
                showVisibilityOption={isEditingStartSources}
                fileIsVisible={
                  sources[fileMetadata[activeTabKey]] &&
                  sources[fileMetadata[activeTabKey]].isVisible
                }
                fileIsValidation={
                  sources[fileMetadata[activeTabKey]] &&
                  sources[fileMetadata[activeTabKey]].isValidation
                }
              />
            </div>
            <Tab.Content id="tab-content" animation={false}>
              {showOpenCodeReviewWarning && (
                <div
                  id="openCodeReviewWarningBanner"
                  style={styles.openCodeReviewWarningBanner}
                >
                  {isViewingOwnProject
                    ? javalabMsg.editingDisabledUnderReview()
                    : javalabMsg.codeReviewingPeer({
                        peerName: codeOwnersName
                      })}
                </div>
              )}
              {orderedTabKeys.map(tabKey => {
                return (
                  <Tab.Pane eventKey={tabKey} key={`${tabKey}-content`}>
                    <div
                      ref={el => (this._codeMirrors[tabKey] = el)}
                      style={{
                        ...styles.editor,
                        ...(displayTheme === DisplayTheme.DARK &&
                          styles.darkBackground),
                        ...{height: height - HEADER_OFFSET}
                      }}
                    />
                  </Tab.Pane>
                );
              })}
            </Tab.Content>
          </div>
        </Tab.Container>
        <JavalabEditorDialogManager
          onDeleteFile={this.onDeleteFile}
          filenameToDelete={fileMetadata[fileToDelete]}
          onRenameFile={this.onRenameFile}
          filenameToRename={fileMetadata[editTabKey]}
          onCreateFile={this.onCreateFile}
          commitDialogFileNames={Object.keys(sources)}
          onCommitCode={onCommitCode}
          handleClearPuzzle={handleClearPuzzle}
          isProjectTemplateLevel={isProjectTemplateLevel}
        />
      </div>
    );
  }
}

const styles = {
  editor: {
    width: '100%',
    minHeight: MIN_HEIGHT,
    backgroundColor: color.white
  },
  darkBackground: {
    backgroundColor: color.darkest_slate_gray
  },
  fileMenuToggleButton: {
    margin: '0, 0, 0, 4px',
    padding: 0,
    height: 20,
    width: 13,
    backgroundColor: 'transparent',
    border: 'none',
    ':hover': {
      cursor: 'pointer',
      boxShadow: 'none'
    }
  },
  darkFileMenuToggleButton: {
    color: color.white
  },
  fileTypeIcon: {
    margin: 5
  },
  tabs: {
    backgroundColor: color.background_gray,
    marginBottom: 0,
    display: 'flex',
    alignItems: 'center'
  },
  backpackSection: {
    textAlign: 'left',
    display: 'inline-block',
    float: 'left',
    overflow: 'visible'
  },
  openCodeReviewWarningBanner: {
    zIndex: 99,
    backgroundColor: color.light_yellow,
    height: 20,
    padding: 5,
    width: '100%',
    color: color.black
  }
};

export default connect(
  state => ({
    sources: state.javalab.sources,
    validation: state.javalab.validation,
    displayTheme: state.javalab.displayTheme,
    isEditingStartSources: state.pageConstants.isEditingStartSources,
    isReadOnlyWorkspace: state.javalab.isReadOnlyWorkspace,
    hasOpenCodeReview: state.javalab.hasOpenCodeReview,
    isViewingOwnProject: state.pageConstants.isViewingOwnProject,
    codeOwnersName: state.pageConstants.codeOwnersName,
    fileMetadata: state.javalab.fileMetadata,
    orderedTabKeys: state.javalab.orderedTabKeys,
    activeTabKey: state.javalab.activeTabKey,
    lastTabKeyIndex: state.javalab.lastTabKeyIndex,
    editTabKey: state.javalab.editTabKey
  }),
  dispatch => ({
    setSource: (filename, source) => dispatch(setSource(filename, source)),
    sourceVisibilityUpdated: (filename, isVisible) =>
      dispatch(sourceVisibilityUpdated(filename, isVisible)),
    sourceValidationUpdated: (filename, isValidation) =>
      dispatch(sourceValidationUpdated(filename, isValidation)),
    sourceTextUpdated: (filename, text) =>
      dispatch(sourceTextUpdated(filename, text)),
    renameFile: (oldFilename, newFilename) =>
      dispatch(renameFile(oldFilename, newFilename)),
    removeFile: filename => dispatch(removeFile(filename)),
    setRenderedHeight: height => dispatch(setRenderedHeight(height)),
    setEditorColumnHeight: height => dispatch(setEditorColumnHeight(height)),
    setEditTabKey: tabKey => dispatch(setEditTabKey(tabKey)),
    setActiveTabKey: tabKey => dispatch(setActiveTabKey(tabKey)),
    setOrderedTabKeys: orderedTabKeys =>
      dispatch(setOrderedTabKeys(orderedTabKeys)),
    setFileMetadata: fileMetadata => dispatch(setFileMetadata(fileMetadata)),
    setAllEditorMetadata: (
      fileMetadata,
      orderedTabKeys,
      activeTabKey,
      lastTabKeyIndex
    ) =>
      dispatch(
        setAllEditorMetadata(
          fileMetadata,
          orderedTabKeys,
          activeTabKey,
          lastTabKeyIndex
        )
      ),
    openEditorDialog: dialogName => dispatch(openEditorDialog(dialogName)),
    closeEditorDialog: () => dispatch(closeEditorDialog()),
    setNewFileError: error => dispatch(setNewFileError(error)),
    clearNewFileError: () => dispatch(clearNewFileError()),
    setRenameFileError: error => dispatch(setRenameFileError(error)),
    clearRenameFileError: () => dispatch(clearRenameFileError())
  })
)(Radium(JavalabEditor));

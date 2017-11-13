import React, {Component, PropTypes} from 'react';
import color from "../../util/color";
import {sortableSectionShape} from "./shapes.jsx";
import PopUpMenu from "@cdo/apps/lib/ui/PopUpMenu";
import i18n from '@cdo/locale';
import {pegasus} from "../../lib/util/urlHelpers";
import {sectionCode,
        sectionName,
        removeSection,
        toggleSectionHidden,
        importOrUpdateRoster} from './teacherSectionsRedux';
import * as utils from '../../utils';
import {connect} from 'react-redux';

const styles = {
  actionButton:{
    border: '1px solid ' + color.white,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: 5,
    color: color.lighter_gray,
    margin: 3
  },
  hoverFocus: {
    backgroundColor: color.lighter_gray,
    border: '1px solid ' + color.light_gray,
    borderRadius: 5,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 5,
    paddingRight: 5,
    color: color.white,
  },
};

class SectionActionDropdown extends Component {
  static propTypes = {
    handleEdit: PropTypes.func,
    sectionData: sortableSectionShape.isRequired,

    //Provided by redux
    removeSection: PropTypes.func.isRequired,
    toggleSectionHidden: PropTypes.func.isRequired,
    sectionCode: PropTypes.string,
    sectionName: PropTypes.string,
    updateRoster: PropTypes.func.isRequired,
  };

  state = {
    selected: false,
    open: false,
    canOpen: true,
    menuTop: 0, // location of dropdown menu
    menuLeft: 0,
    currWindowWidth: window.innerWidth, // used to calculate location of menu on resize
  };

  // Menu open
  open = () => {
    this.updateMenuLocation();
    window.addEventListener("resize", this.updateMenuLocation);
    this.setState({open: true, canOpen: false});
  }

  // Menu closed
  close = () => {
    window.removeEventListener("resize", this.updateMenuLocation);
    this.setState({open: false});
  }

  // Menu closed
  beforeClose = (_, resetPortalState) => {
    resetPortalState();
    this.setState({open: false});
    window.setTimeout(() => this.setState({canOpen: true}), 0);
  };

  onConfirmDelete = () => {
      const {removeSection } = this.props;
      const section = this.props.sectionData;
      $.ajax({
          url: `/v2/sections/${section.id}`,
          method: 'DELETE',
      }).done(() => {
          removeSection(section.id);
      }).fail((jqXhr, status) => {
          // We may want to handle this more cleanly in the future, but for now this
          // matches the experience we got in angular
          alert(i18n.unexpectedError());
          console.error(status);
      });
  };

  onClickEdit = () => {
      this.props.handleEdit(this.props.sectionData.id);
  };

  onClickHideShow = () => {
      this.props.toggleSectionHidden(this.props.sectionData.id);
  };

  onClickSync = () => {
    // Section code is the course ID, without the G- or C- prefix.
    const courseId = this.props.sectionCode.replace(/^[GC]-/, '');
    this.props.updateRoster(courseId, this.props.sectionName)
      .then(() => {
        // While we are embedded in an angular page, reloading is the easiest
        // way to pick up roster changes.  Once everything is React maybe we
        // won't need to do this.
        utils.reload();
      });
  };

  onRequestDelete = () => {
    this.setState({deleting: true});
  };

  updateMenuLocation = () => {
    const rect = this.icon.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    if (windowWidth > 970) { // Accounts for resizing when page is not scrollable
      this.setState({menuTop: rect.bottom + window.pageYOffset});
      this.setState({menuLeft: rect.left + (rect.width / 2) - (windowWidth - this.state.currWindowWidth)/2});
      this.setState({currWindowWidth : window.innerWidth});
    } else { // Accounts for scrolling or resizing when scrollable
      this.setState({menuTop: rect.bottom + window.pageYOffset});
      this.setState({menuLeft: rect.left + (rect.width / 2) + window.pageXOffset});
    }
  }

  render() {
    const {sectionData} = this.props;
    const targetPoint = {top: this.state.menuTop, left: this.state.menuLeft};

    return (
      <span
        ref={icon => {this.icon = icon;}}
      >
        <a
          icon="chevron-down"
          style={this.state.selected ? {...styles.actionButton, ...styles.hoverFocus} : styles.actionButton}
          onClick={this.state.canOpen ? this.open : undefined}
        >
          <i className="fa fa-chevron-down"></i>
        </a>
        <PopUpMenu
          targetPoint={targetPoint}
          isOpen={this.state.open}
          beforeClose={this.beforeClose}
        >
          <PopUpMenu.Item
            href={pegasus('/teacher-dashboard#/sections/' + sectionData.id)}
          >
            {i18n.sectionViewProgress()}
          </PopUpMenu.Item>
          <PopUpMenu.Item
            href={pegasus('/teacher-dashboard#/sections/' + sectionData.id + "/manage")}
          >
            {i18n.manageStudents()}
          </PopUpMenu.Item>
          <PopUpMenu.Item
            href={pegasus('/teacher-dashboard#/sections/' + sectionData.id + '/print_signin_cards')}
          >
            {i18n.printLoginCards()}
          </PopUpMenu.Item>
          <PopUpMenu.Item
            id="ui-test-edit-section"
            onClick={this.onClickEdit}
          >
            {i18n.editSectionDetails()}
          </PopUpMenu.Item>
          <PopUpMenu.Item
            onClick={this.onClickSync}
          >
            {i18n.syncClever()}
          </PopUpMenu.Item>
          <PopUpMenu.Item
            onClick={this.onClickSync}
          >
            {i18n.syncGoogleClassroom()}
          </PopUpMenu.Item>
          <PopUpMenu.Item
            onClick={this.onClickHideShow}
          >
            {this.props.sectionData.hidden ? i18n.showSection() : i18n.hideSection()}
          </PopUpMenu.Item>
        </PopUpMenu>
      </span>
    );
  }
}

export const UnconnectedSectionActionDropdown = SectionActionDropdown;

export default connect((state, props) => ({
  sectionCode: sectionCode(state, props.sectionData.id),
  sectionName: sectionName(state, props.sectionData.id),
}), {
  removeSection,
  toggleSectionHidden,
  updateRoster: importOrUpdateRoster,
})(SectionActionDropdown);

import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {CSVLink} from 'react-csv';
import {connect} from 'react-redux';

import {setScriptId} from '@cdo/apps/redux/unitSelectionRedux';
import FontAwesome from '@cdo/apps/templates/FontAwesome';
import SafeMarkdown from '@cdo/apps/templates/SafeMarkdown';
import {
  asyncLoadAssessments,
  getCurrentScriptAssessmentList,
  setAssessmentId,
  isCurrentAssessmentSurvey,
  countSubmissionsForCurrentAssessment,
  getExportableData,
  setStudentId,
  ASSESSMENT_FEEDBACK_OPTION_ID,
} from '@cdo/apps/templates/sectionAssessments/sectionAssessmentsRedux';
import UnitSelector from '@cdo/apps/templates/sectionProgress/UnitSelector';
import i18n from '@cdo/locale';

import {h3Style} from '../../lib/ui/Headings';
import firehoseClient from '../../lib/util/firehose';

import AssessmentSelector from './AssessmentSelector';
import FeedbackDownload from './FeedbackDownload';
import FreeResponseDetailsDialog from './FreeResponseDetailsDialog';
import FreeResponsesAssessmentsContainer from './FreeResponsesAssessmentsContainer';
import FreeResponsesSurveyContainer from './FreeResponsesSurveyContainer';
import MatchAssessmentsOverviewContainer from './MatchAssessmentsOverviewContainer';
import MatchByStudentContainer from './MatchByStudentContainer';
import MatchDetailsDialog from './MatchDetailsDialog';
import MultipleChoiceAssessmentsOverviewContainer from './MultipleChoiceAssessmentsOverviewContainer';
import MultipleChoiceByStudentContainer from './MultipleChoiceByStudentContainer';
import MultipleChoiceDetailsDialog from './MultipleChoiceDetailsDialog';
import MultipleChoiceSurveyOverviewContainer from './MultipleChoiceSurveyOverviewContainer';
import StudentSelector from './StudentSelector';
import SubmissionStatusAssessmentsContainer from './SubmissionStatusAssessmentsContainer';

const CSV_ASSESSMENT_HEADERS = [
  {label: i18n.name(), key: 'studentName'},
  {label: i18n.lesson(), key: 'lesson'},
  {label: i18n.timeStamp, key: 'timestamp'},
  {label: i18n.question(), key: 'question'},
  {label: i18n.response(), key: 'response'},
  {label: i18n.correct(), key: 'correct'},
];

const CSV_SURVEY_HEADERS = [
  {label: i18n.lesson(), key: 'lesson'},
  {label: i18n.question(), key: 'questionNumber'},
  {label: i18n.questionText(), key: 'questionText'},
  {label: i18n.response(), key: 'answer'},
  {label: i18n.count(), key: 'numberAnswered'},
];

class SectionAssessments extends Component {
  static propTypes = {
    sectionName: PropTypes.string.isRequired,
    // provided by redux
    sectionId: PropTypes.number.isRequired,
    isLoading: PropTypes.bool.isRequired,
    coursesWithProgress: PropTypes.array.isRequired,
    assessmentList: PropTypes.array.isRequired,
    scriptId: PropTypes.number,
    assessmentId: PropTypes.number,
    setScriptId: PropTypes.func.isRequired,
    setAssessmentId: PropTypes.func.isRequired,
    asyncLoadAssessments: PropTypes.func.isRequired,
    multipleChoiceSurveyResults: PropTypes.array,
    isCurrentAssessmentSurvey: PropTypes.bool,
    totalStudentSubmissions: PropTypes.number,
    exportableData: PropTypes.array,
    studentId: PropTypes.number,
    setStudentId: PropTypes.func,
    studentList: PropTypes.array,
  };

  state = {
    freeResponseDetailDialogOpen: false,
    multipleChoiceDetailDialogOpen: false,
    matchDetailDialogOpen: false,
  };

  UNSAFE_componentWillMount() {
    const {scriptId, asyncLoadAssessments, sectionId} = this.props;
    asyncLoadAssessments(sectionId, scriptId);
  }

  onSelectScript = newScriptId => {
    const {setScriptId, asyncLoadAssessments, scriptId, sectionId} = this.props;
    asyncLoadAssessments(sectionId, newScriptId);
    setScriptId(newScriptId);

    this.logEvent('select_script', {
      old_script_id: scriptId,
      new_script_id: newScriptId,
    });
  };

  onSelectAssessment = newAssessmentId => {
    const {setAssessmentId, assessmentId, scriptId} = this.props;
    setAssessmentId(newAssessmentId);

    this.logEvent('select_assessment', {
      script_id: scriptId,
      old_level_group_id: assessmentId,
      new_level_group_id: newAssessmentId,
    });
  };

  onSelectStudent = studentId => {
    const {setStudentId, assessmentId, scriptId} = this.props;
    setStudentId(studentId);

    this.logEvent('select_student', {
      student_id: studentId,
      script_id: scriptId,
      level_group_id: assessmentId,
    });
  };

  onClickDownload(dataType) {
    const {assessmentId, scriptId} = this.props;
    this.logEvent(`download_${dataType}`, {
      script_id: scriptId,
      level_group_id: assessmentId,
    });
  }

  logEvent(event, data) {
    firehoseClient.putRecord(
      {
        study: 'teacher_dashboard_actions',
        study_group: 'assessments_surveys',
        event: event,
        data_json: JSON.stringify({
          section_id: this.props.sectionId,
          ...data,
        }),
      },
      {includeUserId: true}
    );
  }

  showFreeResponseDetailDialog = () => {
    this.setState({
      freeResponseDetailDialogOpen: true,
    });
  };

  hideFreeResponseDetailDialog = () => {
    this.setState({
      freeResponseDetailDialogOpen: false,
    });
  };

  showMulitpleChoiceDetailDialog = () => {
    this.setState({
      multipleChoiceDetailDialogOpen: true,
    });
  };

  hideMultipleChoiceDetailDialog = () => {
    this.setState({
      multipleChoiceDetailDialogOpen: false,
    });
  };

  showMatchDetailDialog = () => {
    this.setState({
      matchDetailDialogOpen: true,
    });
  };

  hideMatchDetailDialog = () => {
    this.setState({
      matchDetailDialogOpen: false,
    });
  };

  render() {
    const {
      sectionName,
      coursesWithProgress,
      scriptId,
      assessmentList,
      assessmentId,
      isLoading,
      isCurrentAssessmentSurvey,
      totalStudentSubmissions,
      exportableData,
      studentId,
      studentList,
    } = this.props;

    const isCurrentAssessmentFeedbackOption =
      this.props.assessmentId === ASSESSMENT_FEEDBACK_OPTION_ID;

    return (
      <div>
        <div style={styles.selectors}>
          <div style={styles.unitSelection}>
            <div style={{...h3Style, ...styles.header}}>
              {i18n.selectACourse()}
            </div>
            <UnitSelector
              coursesWithProgress={coursesWithProgress}
              scriptId={scriptId}
              onChange={this.onSelectScript}
            />
          </div>
          {!isLoading && assessmentList.length > 0 && (
            <div style={styles.assessmentSelection}>
              <div style={{...h3Style, ...styles.header}}>
                {i18n.selectAssessment()}
              </div>
              <AssessmentSelector
                assessmentList={assessmentList}
                assessmentId={assessmentId}
                onChange={this.onSelectAssessment}
              />
            </div>
          )}
        </div>
        {!isLoading && assessmentList.length > 0 && (
          <div style={styles.tableContent}>
            {/* Assessments */}
            {!isCurrentAssessmentSurvey &&
              !isCurrentAssessmentFeedbackOption && (
                <div>
                  <div style={{...h3Style, ...styles.header}}>
                    {i18n.selectStudent()}
                  </div>
                  <StudentSelector
                    studentList={studentList}
                    studentId={studentId}
                    onChange={this.onSelectStudent}
                  />
                  {totalStudentSubmissions > 0 && (
                    <div style={styles.download}>
                      <CSVLink
                        filename="assessments.csv"
                        data={exportableData}
                        headers={CSV_ASSESSMENT_HEADERS}
                        onClick={() => this.onClickDownload('assessments')}
                      >
                        <div>{i18n.downloadAssessmentCSV()}</div>
                      </CSVLink>
                    </div>
                  )}
                  {totalStudentSubmissions <= 0 && (
                    <div>{i18n.emptyAssessmentSubmissions()}</div>
                  )}
                  <SubmissionStatusAssessmentsContainer
                    onClickDownload={() =>
                      this.onClickDownload('submission_stats')
                    }
                  />
                  {totalStudentSubmissions > 0 && (
                    <div>
                      <MultipleChoiceAssessmentsOverviewContainer
                        openDialog={this.showMulitpleChoiceDetailDialog}
                      />
                      <MultipleChoiceByStudentContainer />
                      <MatchAssessmentsOverviewContainer
                        openDialog={this.showMatchDetailDialog}
                      />
                      <MatchByStudentContainer
                        openDialog={this.showMatchDetailDialog}
                      />
                      <FreeResponsesAssessmentsContainer
                        openDialog={this.showFreeResponseDetailDialog}
                      />
                    </div>
                  )}
                </div>
              )}
            {/* Feedback Download */}
            {isCurrentAssessmentFeedbackOption && (
              <FeedbackDownload
                sectionName={sectionName}
                onClickDownload={() => this.onClickDownload('feedback')}
              />
            )}
            {/* Surveys */}
            {isCurrentAssessmentSurvey && (
              <div>
                {totalStudentSubmissions > 0 && (
                  <div>
                    <CSVLink
                      filename="surveys.csv"
                      data={exportableData}
                      headers={CSV_SURVEY_HEADERS}
                      onClick={() => this.onClickDownload('surveys')}
                    >
                      <div>{i18n.downloadAssessmentCSV()}</div>
                    </CSVLink>
                    <MultipleChoiceSurveyOverviewContainer />
                    <FreeResponsesSurveyContainer
                      openDialog={this.showFreeResponseDetailDialog}
                    />
                  </div>
                )}
                {totalStudentSubmissions <= 0 && (
                  <SafeMarkdown markdown={i18n.emptySurveyOverviewTable()} />
                )}
              </div>
            )}
            <FreeResponseDetailsDialog
              isDialogOpen={this.state.freeResponseDetailDialogOpen}
              closeDialog={this.hideFreeResponseDetailDialog}
            />
            <MultipleChoiceDetailsDialog
              isDialogOpen={this.state.multipleChoiceDetailDialogOpen}
              closeDialog={this.hideMultipleChoiceDetailDialog}
            />
            <MatchDetailsDialog
              isDialogOpen={this.state.matchDetailDialogOpen}
              closeDialog={this.hideMatchDetailDialog}
            />
          </div>
        )}
        {isLoading && (
          <div style={styles.loading}>
            <FontAwesome icon="spinner" className="fa-pulse fa-3x" />
          </div>
        )}
        {!isLoading && assessmentList.length === 0 && (
          <div style={styles.empty}>{i18n.noAssessments()}</div>
        )}
      </div>
    );
  }
}

const styles = {
  header: {
    marginBottom: 0,
  },
  tableContent: {
    marginTop: 10,
    clear: 'both',
  },
  selectors: {
    clear: 'both',
  },
  unitSelection: {
    float: 'left',
    marginRight: 20,
  },
  assessmentSelection: {
    float: 'left',
    marginBottom: 10,
  },
  download: {
    marginTop: 10,
  },
  loading: {
    clear: 'both',
  },
  empty: {
    clear: 'both',
  },
};

export const UnconnectedSectionAssessments = SectionAssessments;

export default connect(
  state => ({
    sectionId: state.teacherSections.selectedSectionId,
    isLoading: !!state.sectionAssessments.isLoading,
    coursesWithProgress: state.unitSelection.coursesWithProgress,
    assessmentList: getCurrentScriptAssessmentList(state),
    scriptId: state.unitSelection.scriptId,
    assessmentId: state.sectionAssessments.assessmentId,
    isCurrentAssessmentSurvey: isCurrentAssessmentSurvey(state),
    totalStudentSubmissions: countSubmissionsForCurrentAssessment(state),
    exportableData: getExportableData(state),
    studentId: state.sectionAssessments.studentId,
    studentList: state.teacherSections.selectedStudents,
  }),
  dispatch => ({
    setScriptId(scriptId) {
      dispatch(setScriptId(scriptId));
    },
    asyncLoadAssessments(sectionId, scriptId) {
      return dispatch(asyncLoadAssessments(sectionId, scriptId));
    },
    setAssessmentId(assessmentId) {
      dispatch(setAssessmentId(assessmentId));
    },
    setStudentId(studentId) {
      dispatch(setStudentId(studentId));
    },
  })
)(SectionAssessments);

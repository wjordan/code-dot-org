import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import {Provider} from 'react-redux';
import {getStore, registerReducers} from '@cdo/apps/redux';
import manageStudents, {
  setLoginType,
  setShowSharingColumn,
} from '@cdo/apps/templates/manageStudents/manageStudentsRedux';
import teacherSections, {
  setSections,
  selectSection,
  setRosterProvider,
  setRosterProviderName,
  setShowLockSectionField, // DCDO Flag - show/hide Lock Section field
  setStudentsForCurrentSection,
  sectionProviderName,
} from '@cdo/apps/templates/teacherDashboard/teacherSectionsRedux';
import stats from '@cdo/apps/templates/teacherDashboard/statsRedux';
import sectionAssessments from '@cdo/apps/templates/sectionAssessments/sectionAssessmentsRedux';
import sectionProgress from '@cdo/apps/templates/sectionProgress/sectionProgressRedux';
import sectionStandardsProgress from '@cdo/apps/templates/sectionProgress/standards/sectionStandardsProgressRedux';
import unitSelection from '@cdo/apps/redux/unitSelectionRedux';
import TeacherDashboard from '@cdo/apps/templates/teacherDashboard/TeacherDashboard';
import currentUser, {
  setCurrentUserHasSeenStandardsReportInfo,
} from '@cdo/apps/templates/currentUserRedux';
import {
  setCoursesWithProgress,
  setScriptId,
} from '../../../../redux/unitSelectionRedux';
import locales, {setLocaleCode} from '@cdo/apps/redux/localesRedux';
import progressV2Feedback from '@cdo/apps/templates/sectionProgressV2/progressV2FeedbackRedux';

const script = document.querySelector('script[data-dashboard]');
const scriptData = JSON.parse(script.dataset.dashboard);
const {
  section,
  sections,
  localeCode,
  hasSeenStandardsReportInfo,
  coursesWithProgress,
  canViewStudentAIChatMessages,
} = scriptData;
const baseUrl = `/teacher_dashboard/sections/${section.id}`;

$(document).ready(function () {
  registerReducers({
    teacherSections,
    manageStudents,
    sectionProgress,
    progressV2Feedback,
    unitSelection,
    stats,
    sectionAssessments,
    currentUser,
    sectionStandardsProgress,
    locales,
  });

  const selectedSectionFromList = sections.find(s => s.id === section.id);
  const selectedSection = {...selectedSectionFromList, ...section};

  const store = getStore();
  store.dispatch(
    setCurrentUserHasSeenStandardsReportInfo(hasSeenStandardsReportInfo)
  );
  store.dispatch(setSections(sections));
  store.dispatch(selectSection(selectedSection.id));
  store.dispatch(
    setStudentsForCurrentSection(selectedSection.id, selectedSection.students)
  );
  store.dispatch(setRosterProvider(selectedSection.login_type));
  store.dispatch(setRosterProviderName(selectedSection.login_type_name));
  store.dispatch(setLoginType(selectedSection.login_type));
  store.dispatch(setLocaleCode(localeCode));

  // DCDO Flag - show/hide Lock Section field
  store.dispatch(setShowLockSectionField(scriptData.showLockSectionField));

  if (
    !selectedSection.sharing_disabled &&
    selectedSection.script.project_sharing
  ) {
    store.dispatch(setShowSharingColumn(true));
  }

  // Default the scriptId to the script assigned to the section
  const defaultScriptId = selectedSection.script
    ? selectedSection.script.id
    : null;
  if (defaultScriptId) {
    store.dispatch(setScriptId(defaultScriptId));
  }
  // Reorder coursesWithProgress so that the current section is at the top and other sections are in order from newest to oldest
  const reorderedCourses = [
    ...coursesWithProgress.filter(
      course => course.id !== selectedSection.course_version_id
    ),
    ...coursesWithProgress.filter(
      course => course.id === selectedSection.course_version_id
    ),
  ].reverse();
  store.dispatch(setCoursesWithProgress(reorderedCourses));

  const showAITutorTab = canViewStudentAIChatMessages;

  ReactDOM.render(
    <Provider store={store}>
      <Router basename={baseUrl}>
        <Route
          path="/"
          component={props => (
            <TeacherDashboard
              {...props}
              studioUrlPrefix={scriptData.studioUrlPrefix}
              sectionId={selectedSection.id}
              sectionName={selectedSection.name}
              studentCount={selectedSection.students.length}
              coursesWithProgress={coursesWithProgress}
              showAITutorTab={showAITutorTab}
              sectionProviderName={sectionProviderName(
                store.getState(),
                selectedSection.id
              )}
            />
          )}
        />
      </Router>
    </Provider>,
    document.getElementById('teacher-dashboard')
  );
});

import React from 'react';
import ReactDOM from 'react-dom';
import getScriptData from '@cdo/apps/util/getScriptData';
import ProfessionalLearningCourseProgress from '@cdo/apps/code-studio/pd/professional_learning_landing/ProfessionalLearningCourseProgress';

const userCourseEnrollmentData = getScriptData('userCourseEnrollmentData');
ReactDOM.render(
  <ProfessionalLearningCourseProgress
    deeperLearningCourseData={userCourseEnrollmentData}
  />,
  document.getElementById('user-course-enrollment-container')
);

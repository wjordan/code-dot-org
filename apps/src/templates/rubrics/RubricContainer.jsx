import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import style from './rubrics.module.scss';
import i18n from '@cdo/locale';
import classnames from 'classnames';
import {Heading6} from '@cdo/apps/componentLibrary/typography';
import FontAwesome from '@cdo/apps/templates/FontAwesome';
import {
  reportingDataShape,
  rubricShape,
  studentLevelInfoShape,
} from './rubricShapes';
import RubricContent from './RubricContent';
import RubricSettings from './RubricSettings';
import RubricTabButtons from './RubricTabButtons';
import RubricSubmitFooter from './RubricSubmitFooter';
import {tryGetSessionStorage, trySetSessionStorage} from '@cdo/apps/utils';
import Draggable from 'react-draggable';
import {TAB_NAMES} from './rubricHelpers';
import aiBotOutlineIcon from '@cdo/static/ai-bot-outline.png';
import HttpClient from '@cdo/apps/util/HttpClient';
import analyticsReporter from '@cdo/apps/lib/util/AnalyticsReporter';
import {EVENTS} from '@cdo/apps/lib/util/AnalyticsConstants';

// product Tour
import './introjs.scss';
import {Steps} from 'intro.js-react';
import {INITIAL_STEP, STEPS, DUMMY_PROPS} from './productTourHelpers';

export default function RubricContainer({
  rubric,
  studentLevelInfo,
  teacherHasEnabledAi,
  currentLevelName,
  reportingData,
  open,
  closeRubric,
  sectionId,
}) {
  const onLevelForEvaluation = currentLevelName === rubric.level.name;
  const canProvideFeedback = !!studentLevelInfo && onLevelForEvaluation;
  const rubricTabSessionKey = 'rubricFABTabSessionKey';
  const rubricPositionX = 'rubricFABPositionX';
  const rubricPositionY = 'rubricFABPositionY';

  const [selectedTab, setSelectedTab] = useState(
    tryGetSessionStorage(rubricTabSessionKey, TAB_NAMES.RUBRIC) ||
      TAB_NAMES.RUBRIC
  );

  const [positionX, setPositionX] = useState(
    parseInt(tryGetSessionStorage(rubricPositionX, 0)) || 0
  );

  const [positionY, setPositionY] = useState(
    parseInt(tryGetSessionStorage(rubricPositionY, 0)) || 0
  );

  const [aiEvaluations, setAiEvaluations] = useState(null);

  const [feedbackAdded, setFeedbackAdded] = useState(false);

  const [productTour, setProductTour] = useState(false);

  const tabSelectCallback = tabSelection => {
    setSelectedTab(tabSelection);
  };

  const fetchAiEvaluations = useCallback(() => {
    if (!!studentLevelInfo && teacherHasEnabledAi) {
      const studentId = studentLevelInfo.user_id;
      const rubricId = rubric.id;
      const dataUrl = `/rubrics/${rubricId}/get_ai_evaluations?student_id=${studentId}`;

      fetch(dataUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          setAiEvaluations(data);
        })
        .catch(error => {
          console.log(
            'There was a problem with the fetch operation:',
            error.message
          );
        });
    }
  }, [studentLevelInfo, teacherHasEnabledAi, rubric.id]);

  useEffect(() => {
    fetchAiEvaluations();
  }, [fetchAiEvaluations]);

  useEffect(() => {
    trySetSessionStorage(rubricTabSessionKey, selectedTab);
  }, [selectedTab]);

  useEffect(() => {
    trySetSessionStorage(rubricPositionX, positionX);
  }, [positionX]);

  useEffect(() => {
    trySetSessionStorage(rubricPositionY, positionY);
  }, [positionY]);

  const onStopHandler = (event, dragElement) => {
    setPositionX(dragElement.x);
    setPositionY(dragElement.y);
    analyticsReporter.sendEvent(EVENTS.TA_RUBRIC_WINDOW_MOVE_END, {
      ...(reportingData || {}),
      window_x_end: dragElement.x,
      window_y_end: dragElement.y,
    });
  };

  const onStartHandler = (event, dragElement) => {
    analyticsReporter.sendEvent(EVENTS.TA_RUBRIC_WINDOW_MOVE_START, {
      ...(reportingData || {}),
      window_x_start: dragElement.x,
      window_y_start: dragElement.y,
    });
  };

  // Currently the settings tab only provides a way to manually run AI.
  // In the future, we should update or remove this conditional when we
  // add more functionality to the settings tab.
  const showSettings = onLevelForEvaluation && teacherHasEnabledAi;

  const updateTourStatus = useCallback(() => {
    const bodyData = JSON.stringify({seen: productTour});
    const rubricId = rubric.id;
    const url = `/rubrics/${rubricId}/update_ai_rubrics_tour_seen`;
    HttpClient.post(url, bodyData, true, {
      'Content-Type': 'application/json',
    })
      .then(response => {
        return response.json();
      })
      .then(json => {
        if (json['seen']) {
          setProductTour(false);
        } else {
          setProductTour(true);
        }
      });
  }, [rubric.id, productTour]);

  const getTourStatus = useCallback(() => {
    const rubricId = rubric.id;
    const url = `/rubrics/${rubricId}/get_ai_rubrics_tour_seen`;
    fetch(url)
      .then(response => {
        return response.json();
      })
      .then(json => {
        if (json['seen']) {
          setProductTour(false);
        } else {
          setProductTour(true);
        }
      });
  }, [rubric.id]);

  useEffect(() => {
    getTourStatus();
  }, [getTourStatus]);

  const onTourExit = () => {
    updateTourStatus();
  };

  const onStepChange = (nextStepIndex, nextElement) => {
    if (nextStepIndex === 1) {
      document.getElementById('tour-fab-bg').scrollBy(0, 1000);
    }
  };

  const onBeforeStepChange = (nextStepIndex, nextElement) => {
    if (nextStepIndex === 1) {
      if (!open) {
        document.getElementById('ui-floatingActionButton').click();
      }
    }
  };

  return (
    <Draggable
      defaultPosition={{x: positionX, y: positionY}}
      onStart={onStartHandler}
      onStop={onStopHandler}
    >
      <div
        data-testid="draggable-test-id"
        id="draggable-id"
        className={classnames(style.rubricContainer, {
          [style.hiddenRubricContainer]: !open,
        })}
      >
        <Steps
          enabled={canProvideFeedback && productTour}
          initialStep={INITIAL_STEP}
          steps={STEPS}
          onExit={onTourExit}
          onChange={onStepChange}
          onBeforeChange={onBeforeStepChange}
          options={{
            scrollToElement: false,
            exitOnOverlayClick: false,
            hidePrev: true,
            nextLabel: i18n.rubricTourNextButtonText(),
            prevLabel: i18n.back(),
            doneLabel: i18n.done(),
            showBullets: false,
            showStepNumbers: true,
          }}
        />
        <div className={style.rubricHeaderRedesign}>
          <div className={style.rubricHeaderLeftSide}>
            <img
              src={aiBotOutlineIcon}
              className={style.aiBotOutlineIcon}
              alt={i18n.rubricAiHeaderText()}
            />
            <span>{i18n.rubricAiHeaderText()}</span>
          </div>
          <div className={style.rubricHeaderRightSide}>
            {canProvideFeedback && (
              <button
                id="ui-restart-product-tour"
                data-testid="restart-product-tour"
                type="button"
                onClick={updateTourStatus}
                className={classnames(style.buttonStyle, style.closeButton)}
              >
                <FontAwesome icon="circle-question" />
              </button>
            )}
            <button
              type="button"
              onClick={closeRubric}
              className={classnames(style.buttonStyle, style.closeButton)}
            >
              <FontAwesome icon="xmark" />
            </button>
          </div>
        </div>

        <div id="tour-fab-bg" className={style.fabBackground}>
          <RubricTabButtons
            tabSelectCallback={tabSelectCallback}
            selectedTab={selectedTab}
            showSettings={showSettings}
            canProvideFeedback={canProvideFeedback}
            teacherHasEnabledAi={teacherHasEnabledAi}
            studentUserId={studentLevelInfo && studentLevelInfo['user_id']}
            refreshAiEvaluations={fetchAiEvaluations}
            rubric={rubric}
            studentName={studentLevelInfo && studentLevelInfo.name}
          />
          <RubricContent
            productTour={productTour}
            rubric={
              canProvideFeedback && productTour
                ? DUMMY_PROPS['rubricDummy']
                : rubric
            }
            open={open}
            studentLevelInfo={
              canProvideFeedback && productTour
                ? DUMMY_PROPS['studentLevelInfoDummy']
                : studentLevelInfo
            }
            teacherHasEnabledAi={teacherHasEnabledAi}
            canProvideFeedback={canProvideFeedback}
            onLevelForEvaluation={onLevelForEvaluation}
            reportingData={reportingData}
            visible={selectedTab === TAB_NAMES.RUBRIC}
            aiEvaluations={
              canProvideFeedback && productTour
                ? DUMMY_PROPS['aiEvaluationsDummy']
                : aiEvaluations
            }
            feedbackAdded={feedbackAdded}
            setFeedbackAdded={setFeedbackAdded}
            sectionId={sectionId}
          />
          {showSettings && (
            <RubricSettings
              visible={selectedTab === TAB_NAMES.SETTINGS}
              refreshAiEvaluations={fetchAiEvaluations}
              rubric={rubric}
              sectionId={sectionId}
              tabSelectCallback={tabSelectCallback}
              reportingData={reportingData}
            />
          )}
        </div>
        {canProvideFeedback && (
          <RubricSubmitFooter
            open={open}
            rubric={rubric}
            reportingData={reportingData}
            studentLevelInfo={studentLevelInfo}
            feedbackAdded={feedbackAdded}
            setFeedbackAdded={setFeedbackAdded}
          />
        )}
      </div>
    </Draggable>
  );
}

RubricContainer.propTypes = {
  rubric: rubricShape,
  reportingData: reportingDataShape,
  studentLevelInfo: studentLevelInfoShape,
  teacherHasEnabledAi: PropTypes.bool,
  currentLevelName: PropTypes.string,
  closeRubric: PropTypes.func,
  open: PropTypes.bool,
  sectionId: PropTypes.number,
};

const HeaderTab = ({text, isSelected, onClick}) => {
  return (
    <button
      className={classnames(
        'uitest-rubric-header-tab',
        style.rubricHeaderTab,
        style.buttonStyle,
        {
          [style.selectedTab]: isSelected,
          [style.unselectedTab]: !isSelected,
        }
      )}
      onClick={onClick}
      type="button"
    >
      <Heading6>{text}</Heading6>
    </button>
  );
};

HeaderTab.propTypes = {
  text: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

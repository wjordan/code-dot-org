import React, {useContext, useState} from 'react';
import i18n from '@cdo/locale';
import style from './rubrics.module.scss';
import {aiEvaluationShape} from './rubricShapes';
import HttpClient from '@cdo/apps/util/HttpClient';
import {
  BodyFourText,
  StrongText,
  EmText,
} from '@cdo/apps/componentLibrary/typography';
import FontAwesome from '@cdo/apps/templates/FontAwesome';
import Checkbox from '@cdo/apps/componentLibrary/checkbox/Checkbox';
import Button from '@cdo/apps/templates/Button';
import AiAssessmentFeedbackContext from './AiAssessmentFeedbackContext';

export function submitAiFeedback(values) {
  const baseUrl = '/learning_goal_ai_evaluation_feedbacks';
  HttpClient.post(baseUrl, JSON.stringify(values), true, {
    'Content-Type': 'application/json',
  });
}

export default function AiAssessmentFeedback({aiEvalInfo}) {
  const thumbsdownval = 0;

  const {aiFeedback, setAiFeedback} = useContext(AiAssessmentFeedbackContext);
  const [aiSubmitted, setAISubmitted] = useState(false);
  const [aiFalsePos, setAIFalsePos] = useState(false);
  const [aiFalseNeg, setAIFalseNeg] = useState(false);
  const [aiVague, setAIVague] = useState(false);
  const [aiFeedbackOther, setAIFeedbackOther] = useState(false);
  const [aiOtherContent, setAIOtherContent] = useState('');
  const [aiFeedbackReceived, setAIFeedbackReceived] = useState(false);

  const submitAiFeedbackCallback = () => {
    const bodyData = {
      learningGoalAiEvaluationId: aiEvalInfo.id,
      aiFeedbackApproval: aiFeedback,
      falsePositive: aiFalsePos,
      falseNegative: aiFalseNeg,
      // 'Vague' is capitalized to avoid a ForbiddenAttributes error
      // error cause is unknown
      Vague: aiVague,
      feedbackOther: aiFeedbackOther,
      otherContent: aiOtherContent,
    };

    submitAiFeedback(bodyData);

    setAISubmitted(true);
    setAIFeedbackReceived(true);
  };

  const cancelAiFeedbackCallback = () => {
    //reset all vars
    setAISubmitted(false);
    setAIFalsePos(false);
    setAIFalseNeg(false);
    setAIVague(false);
    setAIFeedbackOther(false);
    setAIOtherContent('');

    // Clear feedback
    setAiFeedback(-1);
  };

  return (
    <div>
      {aiFeedbackReceived && (
        <EmText className={style.aiFeedbackReceived}>
          <FontAwesome icon="circle-check" />
          {i18n.aiFeedbackReceived()}
        </EmText>
      )}
      {!aiSubmitted && aiFeedback === thumbsdownval && (
        <div className={style.aiAssessmentFeedback}>
          <BodyFourText>
            <StrongText>{i18n.aiFeedbackNegativeWhy()}</StrongText>
          </BodyFourText>
          <Checkbox
            label={i18n.aiFeedbackFalsePos()}
            size="xs"
            name="aiNegativeFeedbackGroup"
            onChange={() => {
              setAIFalsePos(!aiFalsePos);
            }}
            checked={aiFalsePos}
          />
          <Checkbox
            label={i18n.aiFeedbackFalseNeg()}
            size="xs"
            name="aiNegativeFeedbackGroup"
            onChange={() => {
              setAIFalseNeg(!aiFalseNeg);
            }}
            checked={aiFalseNeg}
          />
          <Checkbox
            label={i18n.aiFeedbackVague()}
            size="xs"
            name="aiNegativeFeedbackGroup"
            onChange={() => {
              setAIVague(!aiVague);
            }}
            checked={aiVague}
          />
          <Checkbox
            label={i18n.other()}
            size="xs"
            name="aiNegativeFeedbackGroup"
            onChange={() => {
              setAIFeedbackOther(!aiFeedbackOther);
            }}
            checked={aiFeedbackOther}
          />
          {aiFeedbackOther && (
            <div className={style.aiFeedbackOther}>
              <StrongText>{i18n.aiFeedbackOtherDetails()} </StrongText>
              <textarea
                className={style.aiFeedbackTextbox}
                onChange={e => {
                  setAIOtherContent(e.target.value);
                }}
                type="text"
              />
            </div>
          )}
          <div className={style.submitFeedbackRow}>
            <div className={style.submitFeedbackButtons}>
              <Button
                text={i18n.aiFeedbackSubmit()}
                color={Button.ButtonColor.brandSecondaryDefault}
                onClick={submitAiFeedbackCallback}
                className={style.submitToStudentButton}
              />
              <Button
                text={i18n.cancel()}
                color={Button.ButtonColor.neutralDark}
                onClick={cancelAiFeedbackCallback}
                className={style.submitToStudentButton}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AiAssessmentFeedback.propTypes = {
  aiEvalInfo: aiEvaluationShape,
};

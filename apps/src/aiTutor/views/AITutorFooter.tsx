import React, {useState, useCallback} from 'react';
import style from './ai-tutor.module.scss';
import Button from '@cdo/apps/templates/Button';
import {useAppDispatch, useAppSelector} from '@cdo/apps/util/reduxHooks';
import {askAITutor} from '@cdo/apps/aiTutor/redux/aiTutorRedux';
import analyticsReporter from '@cdo/apps/lib/util/AnalyticsReporter';
import {EVENTS} from '@cdo/apps/lib/util/AnalyticsConstants';

import {
  AITutorTypes as ActionType,
  AITutorTypesValue,
} from '@cdo/apps/aiTutor/types';

const QuickActions = {
  [ActionType.COMPILATION]: "Why doesn't my code compile?",
  [ActionType.VALIDATION]: "Why aren't my tests passing?",
};

interface AITutorFooterProps {
  renderAITutor: boolean;
}

const AITutorFooter: React.FC<AITutorFooterProps> = ({renderAITutor}) => {
  const [userMessage, setUserMessage] = useState<string>('');

  const isWaitingForChatResponse = useAppSelector(
    state => state.aiTutor.isWaitingForChatResponse
  );

  const level = useAppSelector(state => state.aiTutor.level);

  const sources = useAppSelector(state => state.javalabEditor.sources);
  const fileMetadata = useAppSelector(
    state => state.javalabEditor.fileMetadata
  );
  const activeTabKey = useAppSelector(
    state => state.javalabEditor.activeTabKey
  );
  const studentCode = sources[fileMetadata[activeTabKey]].text;

  const hasCompilationError = useAppSelector(
    state => state.javalabEditor.hasCompilationError
  );
  const hasRunOrTestedCode = useAppSelector(
    state => state.javalab.hasRunOrTestedCode
  );
  const isRunning = useAppSelector(state => state.javalab.isRunning);
  const validationPassed = useAppSelector(
    state => state.javalab.validationPassed
  );

  const dispatch = useAppDispatch();

  const showCompilationOption =
    !isRunning && hasRunOrTestedCode && hasCompilationError;
  const showValidationOption =
    hasRunOrTestedCode && !hasCompilationError && !validationPassed;

  const handleSubmit = useCallback(
    (actionType: AITutorTypesValue) => {
      if (isWaitingForChatResponse) {
        return;
      }

      let studentInput = '';
      let event = '';

      switch (actionType) {
        case ActionType.COMPILATION:
          studentInput = QuickActions[ActionType.COMPILATION];
          event = EVENTS.AI_TUTOR_ASK_ABOUT_COMPILATION;
          break;
        case ActionType.VALIDATION:
          studentInput = QuickActions[ActionType.VALIDATION];
          event = EVENTS.AI_TUTOR_ASK_ABOUT_VALIDATION;
          break;
        case ActionType.GENERAL_CHAT:
        default:
          studentInput = userMessage;
          event = EVENTS.AI_TUTOR_ASK_GENERAL_CHAT;
          break;
      }

      const chatContext = {
        studentInput,
        studentCode,
        actionType,
      };

      dispatch(askAITutor(chatContext));
      setUserMessage('');

      analyticsReporter.sendEvent(event, {
        levelId: level?.id,
        levelType: level?.type,
      });
    },
    [userMessage, studentCode, isWaitingForChatResponse, level, dispatch]
  );

  const disabled = !renderAITutor || isWaitingForChatResponse;

  return (
    <div className={style.aiTutorFooter}>
      <div className={style.aiTutorFooterInputArea}>
        <textarea
          className={style.textArea}
          // TODO: Update to support i18n
          placeholder={'Add a chat message...'}
          onChange={e => setUserMessage(e.target.value)}
          value={userMessage}
          disabled={disabled}
        />
        <Button
          className={style.submitButton}
          color={Button.ButtonColor.brandSecondaryDefault}
          disabled={disabled}
          icon="arrow-up"
          key="submit"
          onClick={() => handleSubmit(ActionType.GENERAL_CHAT)}
          text="Submit"
        />
      </div>
      <div>
        {showCompilationOption && (
          <Button
            className={style.quickActionButton}
            color={Button.ButtonColor.teal}
            disabled={disabled}
            key="compilation"
            text={QuickActions.compilation}
            onClick={() => handleSubmit(ActionType.COMPILATION)}
          />
        )}
        {showValidationOption && (
          <Button
            className={style.quickActionButton}
            color={Button.ButtonColor.teal}
            disabled={disabled}
            key="validation"
            text={QuickActions.validation}
            onClick={() => handleSubmit(ActionType.VALIDATION)}
          />
        )}
      </div>
    </div>
  );
};

export default AITutorFooter;

import {
  Role,
  ChatCompletionMessage,
  AiCustomizations,
  AichatContext,
  AichatModelCustomizations,
} from './types';
import HttpClient from '@cdo/apps/util/HttpClient';
import Lab2Registry from '@cdo/apps/lab2/Lab2Registry';

const CHAT_COMPLETION_URL = '/aichat/chat_completion';

/**
 * This function formats chat completion messages and aichatParameters, sends a POST request
 * to the aichat completion backend controller, then returns the status of the response
 * and assistant message if successful.
 */
export async function postAichatCompletionMessage(
  newMessage: string,
  messagesToSend: ChatCompletionMessage[],
  aiCustomizations: AiCustomizations,
  aichatContext: AichatContext,
  sessionId?: number
) {
  const aichatModelCustomizations: AichatModelCustomizations = {
    selectedModelId: aiCustomizations.selectedModelId,
    temperature: aiCustomizations.temperature,
    retrievalContexts: aiCustomizations.retrievalContexts,
    systemPrompt: aiCustomizations.systemPrompt,
  };
  const storedMessages = formatMessagesForAichatCompletion(messagesToSend);
  const payload = {
    newMessage,
    storedMessages,
    aichatModelCustomizations,
    aichatContext,
    ...(sessionId ? {sessionId} : {}),
  };
  let response;
  try {
    response = await HttpClient.post(
      CHAT_COMPLETION_URL,
      JSON.stringify(payload),
      true,
      {
        'Content-Type': 'application/json; charset=UTF-8',
      }
    );
    // For now, response will be null if there was an error.
    if (response.ok) {
      return await response.json();
    } else {
      return null;
    }
  } catch (error) {
    Lab2Registry.getInstance()
      .getMetricsReporter()
      .logError('Error in aichat completion request', error as Error);
  }
}

const formatMessagesForAichatCompletion = (
  chatMessages: ChatCompletionMessage[]
): AichatCompletionMessage[] => {
  return chatMessages.map(message => {
    return {role: message.role, content: message.chatMessageText};
  });
};

type AichatCompletionMessage = {
  role: Role;
  content: string;
};

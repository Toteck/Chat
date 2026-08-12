/* response_handler.js HANDLES CREATION OF RESPONSES TO THE LEX BOT */

const LOGGER_PREFIX = "[response_handler]";

function logDebug(message, details) {
  console.log(LOGGER_PREFIX, message, details || {});
}

/* Muda para outra intenção e deixa o Lex continuar (elicit slots) */
function formSwitchIntentResponse(sessionAttributes = {}, targetIntentName, slots = {}) {
  const response = {
    sessionState: {                          // ← OBRIGATÓRIO
      sessionAttributes: sessionAttributes || {},
      dialogAction: {
        type: "Delegate"
      },
      intent: {
        name: targetIntentName,
        state: "InProgress",
        slots: slots || {},
        confirmationState: "None"
      }
    }
  };

  console.log("[response_handler] formSwitchIntentResponse generated", JSON.stringify(response, null, 2));
  return response;
}

/* CREATE A RESPONSE BASED ON INITIAL USER UTTERANCE */
function formElicitSlotWithTemplateResponse(
  intentName,
  slots,
  slotToElicit,
  template,
  sessionAttributes
) {
  const response = {
    sessionState: {
      sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit,
      },
      intent: {
        name: intentName,
        slots,
      }
    },
    messages: [
      {
        contentType: "CustomPayload",
        content: JSON.stringify(template),
      }
    ]
  };

  logDebug("formElicitSlotWithTemplateResponse generated", {
    intentName,
    slotToElicit,
    sessionAttributes,
    templateType: template?.templateType,
    templateTitle: template?.data?.content?.title,
  });

  return response;
}

/* CREATE A RESPONSE BASED TERMINATION UTTERANCE FROM THE USER */
function formTerminalResponse(sessionAttributes, fulfillmentState, intent, messageText) {
  const response = {
    sessionState: {
      sessionAttributes,
      dialogAction: {
        type: "Close",
      },
      intent: {
        confirmationState: "Confirmed",
        name: intent,
        state: fulfillmentState
      },
    },
    messages: [
      {
        contentType: "PlainText",
        content: messageText,
      }
    ]
  };

  logDebug("formTerminalResponse generated", {
    intent,
    fulfillmentState,
    messageText,
    sessionAttributes,
  });

  return response;
}

/* CLEAR THE RECENT INTENT HISTORY TO LET USER START OVER IN THE CHAT*/
function formElicitIntentResponse(sessionAttributes, intentName, messageText) {
  const response = {
    sessionState: {
      sessionAttributes,
      dialogAction: {
        type: "ElicitIntent",
      },
      intent: {
        name: intentName,
      },
    },
    messages: [
      {
        contentType: "PlainText",
        content: messageText,
      }
    ]
  };

  logDebug("formElicitIntentResponse generated", {
    intentName,
    messageText,
    sessionAttributes,
  });

  return response;
}

module.exports = {
  formElicitSlotWithTemplateResponse,
  formTerminalResponse,
  formElicitIntentResponse,
  formSwitchIntentResponse
};

/* user_input_hander.js HANDLES INPUTS PROVIDED BY THE USER TO THE CHAT */

const {
  formElicitSlotWithTemplateResponse,
  formTerminalResponse,
  formElicitIntentResponse,
} = require("./response_handler");

const {
  FULFILLMENT_STATES,
  SLOTS,
  TEMPLATE_TYPES,
  ACTIONS,
  TEST_INTERACTIVE_OPTIONS,
  TEST_INTERACTIVE_OPTIONS_SLOTS,
  TEST_INTERACTIVE_OPTIONS_TEMPLATES,
} = require("../constants/interactive_options");

const LOGGER_PREFIX = "[user_input_handler]";

function logDebug(message, details) {
  console.log(LOGGER_PREFIX, message, details || {});
}

function logError(message, details) {
  console.error(LOGGER_PREFIX, message, details || {});
}

/* HANDLE INITIAL UTTERANCE INPUT */
function handleElicitAction(request) {
  logDebug("handleElicitAction called", {
    intent: request?.currentIntent?.name,
    sessionAttributes: request?.sessionAttributes,
  });

  let template = createSimpleListPickerFromOptions(
    "How may I assist you?",
    Object.values(ACTIONS)
  );

  return formElicitSlotWithTemplateResponse(
    request.currentIntent.name,
    request.currentIntent.slots,
    SLOTS.INTERACTIVE_OPTION,
    template,
    request.sessionAttributes
  );
}
/* HANDLE ACTION INPUT */
function handleActionResponse(input, request) {
  logDebug("handleActionResponse called", {
    input,
    intent: request?.currentIntent?.name,
  });

  let targetIntent = request.currentIntent.name;

  if (input === ACTIONS.BOOK_FLIGHT) {
    targetIntent = "BookFlight";
  } else if (input === ACTIONS.FLIGHT_INFORMATION) {
    targetIntent = "FlightInformation";
  } else if (input === ACTIONS.MANAGE_BOOKING) {
    targetIntent = "ManageBooking";
  } else if (input === ACTIONS.CONTACT_US) {
    targetIntent = "ContactUs";
  } else {
    logError("Invalid action received", { input });
    throw new Error(`Invalid action recieved: ${input}`);
  }

  // Finaliza o Lex e devolve a intenção correta para o Connect fazer o Transfer to Flow
  logDebug("handleActionResponse resolved to terminal response", { input, targetIntent });
  return formTerminalResponse(
    request.sessionAttributes,
    FULFILLMENT_STATES.FULFILLED,
    targetIntent,
    `Transferring to ${targetIntent} flow...`
  );
}

/* HANDLE INTERACTIVE OPTION INPUT */
function handleInteractiveOptionResponse(input, request) {
  logDebug("handleInteractiveOptionResponse called", {
    input,
    intent: request?.currentIntent?.name,
    sessionAttributes: request?.sessionAttributes,
  });

  let interactionOptionKey = Object.entries(TEST_INTERACTIVE_OPTIONS).filter(
    (entry) => entry[1] == input
  )[0]?.[0];

  if (!interactionOptionKey) {
    logError("Interactive option mapping not found", { input });
    throw new Error(`No interactive option mapping found for: ${input}`);
  }

  logDebug("Interactive option mapped", { input, interactionOptionKey });
  let template = TEST_INTERACTIVE_OPTIONS_TEMPLATES[interactionOptionKey];
  let elicitSlot = TEST_INTERACTIVE_OPTIONS_SLOTS[interactionOptionKey];

  return formElicitSlotWithTemplateResponse(
    request.currentIntent.name,
    request.currentIntent.slots,
    elicitSlot,
    template,
    request.sessionAttributes
  );
}

/* HANDLE OTHER RESPONSES */
function handleOtherResponse(input, request) {
  logDebug("handleOtherResponse called", {
    input,
    intent: request?.currentIntent?.name,
    sessionAttributes: request?.sessionAttributes,
  });

  let message = `Received '${input}'\n\nPlease send 'help' to start again`;
  return formElicitIntentResponse(
    request.sessionAttributes,
    request.currentIntent.name,
    message
  );
}

/* CREATE A LIST PICKER */
function createSimpleListPickerFromOptions(title, options) {
  logDebug("createSimpleListPickerFromOptions called", {
    title,
    optionCount: Array.isArray(options) ? options.length : 0,
  });

  let elements = options.map((option) => {
    return { title: option };
  });

  return {
    templateType: TEMPLATE_TYPES.LISTPICKER,
    version: "1.0",
    data: {
      content: {
        title: title,
        subtitle: "Tap to select option",
        elements: elements,
      },
    },
  };
}

module.exports = {
  handleElicitAction,
  handleActionResponse,
  handleInteractiveOptionResponse,
  handleOtherResponse,
};

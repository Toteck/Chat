const {
  FULFILLMENT_STATES,
  TEST_INTERACTIVE_OPTIONS,
  ACTIONS
} = require("./constants/interactive_options");
const { formTerminalResponse } = require("./util/response_handler");
const {
  handleElicitAction,
  handleActionResponse,
  handleInteractiveOptionResponse,
  handleOtherResponse,
} = require("./util/user_input_handler");

/* MAIN HANDLER */
exports.handler = async (event, context) => {
  try {
    //console.log(`Request received: ${JSON.stringify(event)}`);

    let response = handleRequest(event);
    // console.log(`Returning response: ${JSON.stringify(response)}`);

    return response;

  } catch (err) {
    console.error(`Error processing Lex request:`, err);
    return formTerminalResponse(
      FULFILLMENT_STATES.FAILED,
      "Error in Lex Lambda"
    );
  }
};

/* PROCESS INBOUND MESSAGE */
function handleRequest(request) {
  let input = request.inputTranscript; // Get the user's input from the request
  let recent_intent = request.sessionState.intent; // Get the most recent intent from the session state
  request.currentIntent = request.interpretations[0].intent; // Set the current intent to the first interpretation's intent 
  let current_intent = request.currentIntent.name; // Get the name of the current intent
  let initialPrompt = request.inputTranscript; // Get the initial prompt from the user's input

  /* HANDLE INTENT 'InteractiveMessageIntent' */
  if (current_intent === 'Help' && (recent_intent === null || initialPrompt === 'help')) {
    console.log("Initial prompt detected, calling handleElicitAction");
    return handleElicitAction(request);
  }
  // Se não se trata de uma ação, mas o usuário não selecionou uma opção interativa, trata a resposta da ação
  else if (current_intent === 'BookFlight' && !(Object.values(TEST_INTERACTIVE_OPTIONS).includes(input)) && recent_intent.slots.interactiveOption === null) {
    console.log("Handling action response");
    return handleActionResponse(input, request);
  }
  // Se não se trata de uma ação, mas o usuário selecionou uma opção interativa, trata a resposta da opção interativa
  else if (current_intent === 'InteractiveMessageIntent' && Object.values(TEST_INTERACTIVE_OPTIONS).includes(input) && recent_intent.slots.interactiveOption !== null) {
    console.log("Handling interactive option response");
    return handleInteractiveOptionResponse(input, request);
  }
  /* (optional) HANDLE OTHER INTENTS */

  /* HANDLE FULFILLED INTENT */
  else {
    console.log("[Handling other response]");
    return handleOtherResponse(input, request);
  }
}
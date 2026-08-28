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
    console.log(`Request received: ${JSON.stringify(event)}`);

    let response = handleRequest(event);
    console.log(`Returning response: ${JSON.stringify(response)}`);

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
  let input = request.inputTranscript;
  request.currentIntent = request.interpretations[0].intent;
  let current_intent = request.currentIntent.name;

  // Se o input for um pedido de ajuda ou o início da intenção Help
  if (current_intent === 'Help' || input.toLowerCase() === 'help') {
    console.log("Ação principal detectada, chamando handleElicitAction");
    return handleElicitAction(request);
  }
  if (current_intent === 'ConfirmationOrder') {
    console.log("Ação principal detectada, chamando handleElicitAction");
    return handleElicitAction(request);
  }
  // Se o input for uma das ações principais (ex: "Book a Flight")
  else if (Object.values(ACTIONS).includes(input)) {
    console.log("Pedido de ajuda detectado, chamando handleActionResponse");
    return handleActionResponse(input, request);
  }
  // 3. Fallback para outras respostas
  else {
    console.log("[Handling other response]");
    return handleOtherResponse(input, request);
  }
}
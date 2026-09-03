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
  const input = (request.inputTranscript || "").trim();
  request.currentIntent = request.interpretations[0].intent;
  const current_intent = request.currentIntent.name;
  const current_state = request.sessionState?.intent?.state || null;

  console.log()

  const slots =
    request.sessionState?.intent?.slots ||
    request.currentIntent.slots ||
    {};

  const interactiveValue =
    slots.interactiveOption?.value?.interpretedValue ||
    slots.interactiveOption?.value?.originalValue ||
    null;

  const chosenAction = interactiveValue || input;

  // Ações do menu (Book a Flight, etc.)
  if (Object.values(ACTIONS).includes(chosenAction)) {
    console.log("Ação do menu detectada, chamando handleActionResponse");
    return handleActionResponse(input, request);
  }
  if (
    request.invocationSource === "FulfillmentCodeHook" ||
    (current_intent === "BookFlight" && current_state === "ReadyForFulfillment")
  ) {
    console.log("BookFlight ReadyForFulfillment → pedindo confirmação");

    const sessionAttributes = request.sessionState?.sessionAttributes || {};
    const intentSlots = request.sessionState?.intent?.slots || {};

    const fromCity =
      intentSlots.FromCity?.value?.interpretedValue || "N/A";
    const toCity =
      intentSlots.ToCity?.value?.interpretedValue || "N/A";
    const departureDate =
      intentSlots.DepartureDate?.value?.interpretedValue || "N/A";
    const passengers =
      intentSlots.NumberPassengers?.value?.interpretedValue || "N/A";

    const summary =
      `From: ${fromCity}\nTo: ${toCity}\nDate: ${departureDate}\nPassengers: ${passengers}`;

    const template = {
      templateType: "QuickReply",
      version: "1.0",
      data: {
        content: {
          title: `Please confirm your flight details:\n\n${summary}`,
          elements: [{ title: "Yes" }, { title: "No" }],
        },
      },
    };

    // use o nome EXATO do slot no Lex
    const slotToElicit = "confirmChoice";

    return {
      sessionState: {
        sessionAttributes,
        dialogAction: {
          type: "ElicitSlot",
          slotToElicit,
        },
        intent: {
          name: "BookFlight",
          state: "InProgress",
          slots: intentSlots,
          confirmationState: "None",
        },
      },
      messages: [
        {
          contentType: "CustomPayload",
          content: JSON.stringify(template),
        },
      ],
    };
  }

  if (current_intent === "BookFlight" && confirm) {
    // exemplo: depois que confirmChoice veio preenchido
    const confirm =
      slots.confirmChoice?.value?.interpretedValue || input;

    const normalized = String(confirm).toLowerCase();
    const ok = ["yes", "yeah", "yep", "confirm"].includes(normalized);

    return formTerminalResponse(
      request.sessionState?.sessionAttributes || {},
      ok ? "Fulfilled" : "Failed",
      "BookFlight",
      ok ? "Booking confirmed." : "Booking cancelled."
    );
  }

  // Se o input for um pedido de ajuda ou o início da intenção Help
  if (current_intent === 'Help' || input.toLowerCase() === 'help') {
    console.log("Ação Help detectada");
    return handleElicitAction(request);
  }

  // Fallback para outras respostas
  console.log("[Handling other response]");
  return handleOtherResponse(input, request);

}
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
  const input = (request.inputTranscript || "").trim(); // Texto de entrada do usuário
  request.currentIntent = request.interpretations[0].intent; // Atualiza a intenção atual com base na interpretação mais recente
  const current_intent = request.currentIntent.name; // Nome da intenção atual
  const current_state = request.sessionState?.intent?.state || null; // Estado da intenção atual

  const slots =
    request.sessionState?.intent?.slots ||
    request.currentIntent.slots ||
    {}; // Slots da intenção atual

  const interactiveValue =
    slots.interactiveOption?.value?.interpretedValue ||
    slots.interactiveOption?.value?.originalValue ||
    null; // Valor do slot interactiveOption, se presente

  const chosenAction = interactiveValue || input; // Ação escolhida pelo usuário, seja do slot ou do input

  // Ações do menu (Book a Flight, etc.)
  if (Object.values(ACTIONS).includes(chosenAction)) {
    console.log("Ação do menu detectada, chamando handleActionResponse");
    return handleActionResponse(input, request);
  }
  // ReadyForFulfillment: Todos slots preenchidos, pronto para executar lógica de negócio 
  if (current_intent === "BookFlight" && current_state === "ReadyForFulfillment") {

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

  if (current_intent === "SelectFlight") {

    const fSelectValue = request.sessionState?.intent?.slots?.FSelect?.value?.interpretedValue;

    const sessionAttributes = request.sessionState?.sessionAttributes || {};
    const intentSlots = request.sessionState?.intent?.slots || {};

    if (fSelectValue) {
      return {
        sessionState: {
          sessionAttributes,
          dialogAction: {
            type: "Close"
          },
          intent: {
            name: "SelectFlight",
            state: "Fulfilled",
            slots: intentSlots
          }
        },
        messages: [
          {
            contentType: "PlainText",
            content: `Opção de vôo ${fSelectValue} selecionada com sucesso!`
          }
        ]
      }
    }
    const title = "Please select your flight option:";

    const template = {
      templateType: "ListPicker",
      version: "1.0",
      data: {

        content: {
          title: title,
          subtitle: "Tap to select option",
          imageType: "URL",
          imageData: "https://readthemanual3.s3.us-east-1.amazonaws.com/azul.jpg",
          imageDescription: "Select any of the option",
          elements: [
            {
              title: "Select 1",
              subtitle: "13:40 - 21:40, ✈️ 6E919, $65",
              imageType: "URL",
              imageData: "https://readthemanual3.s3.us-east-1.amazonaws.com/aviao.jpg"
            },
            {
              title: "Select 2",
              subtitle: "06:10 - 11:40, ✈️ 6E920, $45",
              imageType: "URL",
              imageData: "https://readthemanual3.s3.us-east-1.amazonaws.com/aviao.jpg",
            },
            {
              title: "Select 3",
              subtitle: "09:00 - 15:00, ✈️ 6E921, $55",
              imageType: "URL",
              imageData: "https://readthemanual3.s3.us-east-1.amazonaws.com/aviao.jpg",
            },
            {
              title: "Select 4",
              subtitle: "15:00 - 21:00, ✈️ 6E922, $75",
              imageType: "URL",
              imageData: "https://readthemanual3.s3.us-east-1.amazonaws.com/aviao.jpg",
            }
          ]
        }
      }
    }

    const slotToElicit = "FSelect";

    return {
      sessionState: {
        sessionAttributes,
        dialogAction: {
          type: "ElicitSlot",
          slotToElicit,
        },
        intent: {
          name: "SelectFlight",
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

  // Se o input for um pedido de ajuda ou o início da intenção Help
  if (current_intent === 'Help' || input.toLowerCase() === 'help') {
    console.log("Ação Help detectada");
    return handleElicitAction(request);
  }

  // Fallback para outras respostas
  console.log("[Handling other response]");
  return handleOtherResponse(input, request);

}
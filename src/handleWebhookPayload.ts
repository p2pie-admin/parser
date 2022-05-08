import initialLoader from "./initialLoader";

async function handleWebhookPayload(entity_triggered: string) {
  if (
    entity_triggered === "parser_setting" ||
    entity_triggered === "exchanger"
  ) {
    await initialLoader();
  }
}

export default handleWebhookPayload;

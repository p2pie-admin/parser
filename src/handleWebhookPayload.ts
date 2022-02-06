import initialLoader from "./initialLoader";

async function handleWebhookPayload(payload: any) {
  if (
    payload.model === "rates-filter-preferences" ||
    payload.model === "exchanger"
  ) {
    await initialLoader();
  }
}

export default handleWebhookPayload;

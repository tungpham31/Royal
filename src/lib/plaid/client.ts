import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

function createPlaidClient() {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments || "sandbox"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  });

  return new PlaidApi(configuration);
}

export const plaidClient = createPlaidClient();

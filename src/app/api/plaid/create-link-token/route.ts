import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";
import { plaidClient } from "@/lib/plaid/client";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Royal",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error("Error creating link token:", error);
    // Log the actual Plaid error response
    if (error.response?.data) {
      console.error("Plaid error details:", JSON.stringify(error.response.data, null, 2));
    }
    return NextResponse.json(
      { error: "Failed to create link token", details: error.response?.data },
      { status: 500 }
    );
  }
}

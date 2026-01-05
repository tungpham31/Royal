import { NextRequest, NextResponse } from "next/server";
import { CountryCode } from "plaid";
import { plaidClient } from "@/lib/plaid/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all plaid_items without logos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plaidItemsRaw, error: fetchError } = await (supabase as any)
      .from("plaid_items")
      .select("id, institution_id, institution_name")
      .eq("user_id", user.id)
      .is("institution_logo", null)
      .not("institution_id", "is", null);

    if (fetchError) {
      console.error("Error fetching plaid items:", fetchError);
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    const plaidItems = plaidItemsRaw as { id: string; institution_id: string | null; institution_name: string | null }[] | null;

    if (!plaidItems || plaidItems.length === 0) {
      return NextResponse.json({ message: "No items need logo updates", updated: 0 });
    }

    let updatedCount = 0;

    for (const item of plaidItems) {
      if (!item.institution_id) continue;

      try {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: item.institution_id,
          country_codes: [CountryCode.Us],
          options: {
            include_optional_metadata: true,
          },
        });

        const logo = institutionResponse.data.institution.logo;

        if (logo) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (supabase as any)
            .from("plaid_items")
            .update({ institution_logo: logo })
            .eq("id", item.id);

          if (!updateError) {
            updatedCount++;
          }
        }
      } catch (instError) {
        console.error(`Error fetching logo for ${item.institution_name}:`, instError);
      }
    }

    return NextResponse.json({
      message: `Updated ${updatedCount} institution logos`,
      updated: updatedCount,
    });
  } catch (error) {
    console.error("Error backfilling logos:", error);
    return NextResponse.json({ error: "Failed to backfill logos" }, { status: 500 });
  }
}

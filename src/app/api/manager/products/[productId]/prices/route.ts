import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

const setPriceSchema = z.object({
  price: z.number().nonnegative(),
  currencyCode: z.string().length(3).default("NPR"),
});

/* ── POST set a new current price (closes the previous one) ── */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager"]);
  if (!authResult.ok) return authResult.response;

  const parseResult = setPriceSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const { productId } = await context.params;
  const companyId = authResult.session.companyId;
  const input = parseResult.data;
  const db = getDb();

  // Verify product exists
  const productCheck = await db.query(
    `SELECT id FROM products WHERE id = $1 AND company_id = $2`,
    [productId, companyId]
  );
  if (!productCheck.rowCount) return jsonError(404, "Product not found");

  // Close current open price
  await db.query(
    `
    UPDATE product_prices
    SET ends_at = NOW()
    WHERE product_id = $1
      AND company_id = $2
      AND ends_at IS NULL
    `,
    [productId, companyId]
  );

  // Insert new price
  const result = await db.query(
    `
    INSERT INTO product_prices (company_id, product_id, price, currency_code)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [companyId, productId, input.price, input.currencyCode]
  );

  return jsonOk({ price: result.rows[0] }, 201);
}


import { type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { ensureRole, getRequestSession, jsonError, jsonOk } from "@/lib/http";

/* ── GET — single shop ── */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep", "back_office"]);
  if (!authResult.ok) return authResult.response;

  const { shopId } = await context.params;
  const companyId = authResult.session.companyId;
  const isRep = authResult.session.role === "rep";

  const result = await getDb().query(
    `
    SELECT
      s.id,
      s.external_shop_code,
      s.name,
      s.contact_name,
      s.phone,
      s.address,
      s.notes,
      s.latitude,
      s.longitude,
      s.geofence_radius_m,
      s.location_source,
      s.location_verified,
      s.location_accuracy_m,
      s.arrival_prompt_enabled,
      s.min_dwell_seconds,
      s.cooldown_minutes,
      s.timezone,
      s.is_active,
      s.created_at,
      s.updated_at,
      COUNT(sa.id)::int AS assignment_count
    FROM shops s
    LEFT JOIN shop_assignments sa ON sa.shop_id = s.id AND sa.company_id = s.company_id
    WHERE s.id = $1 AND s.company_id = $2
      ${isRep ? "AND EXISTS (SELECT 1 FROM shop_assignments sa2 WHERE sa2.company_id = s.company_id AND sa2.shop_id = s.id AND sa2.rep_company_user_id = $3)" : ""}
    GROUP BY s.id
    LIMIT 1
    `,
    isRep ? [shopId, companyId, authResult.session.companyUserId] : [shopId, companyId]
  );

  if (!result.rowCount) return jsonError(404, "Shop not found");
  return jsonOk({ shop: result.rows[0] });
}

const updateShopSchema = z.object({
  externalShopCode: z.string().max(80).nullable().optional(),
  name: z.string().min(2).max(150).optional(),
  notes: z.string().max(5000).nullable().optional(),
  contactName: z.string().max(120).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  geofenceRadiusM: z.number().int().positive().max(500).optional(),
  locationSource: z.enum(["manual_pin", "gps_capture", "imported"]).optional(),
  locationVerified: z.boolean().optional(),
  locationAccuracyM: z.number().nonnegative().max(99999).nullable().optional(),
  arrivalPromptEnabled: z.boolean().optional(),
  minDwellSeconds: z.number().int().min(0).optional(),
  cooldownMinutes: z.number().int().min(0).optional(),
  timezone: z.string().max(64).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  const authResult = ensureRole(await getRequestSession(request), ["boss", "manager", "rep"]);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { shopId } = await context.params;
  const parseResult = updateShopSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid body");
  }

  const input = parseResult.data;
  const isRep = authResult.session.role === "rep";

  if (isRep) {
    const isAssigned = await getDb().query(
      `SELECT 1 FROM shop_assignments WHERE shop_id = $1 AND rep_company_user_id = $2 AND company_id = $3 LIMIT 1`,
      [shopId, authResult.session.companyUserId, authResult.session.companyId]
    );
    if (!isAssigned.rowCount) {
      return jsonError(403, "You can only update shops assigned to you");
    }

    // Reps can only update location-related fields, name, address, and notes
    const forbiddenForReps = [
      "externalShopCode", "isActive", "timezone",
      "geofenceRadiusM", "arrivalPromptEnabled", "minDwellSeconds", "cooldownMinutes"
    ];
    for (const field of forbiddenForReps) {
      if ((input as any)[field] !== undefined) {
        return jsonError(403, `Sales Reps are not permitted to change the shop's "${field}"`);
      }
    }
  }

  const updates: string[] = [];
  const values: Array<string | number | boolean | null> = [];
  let position = 1;

  setIfDefined(updates, values, "external_shop_code", input.externalShopCode, position++);
  setIfDefined(updates, values, "name", input.name, position++);
  setIfDefined(updates, values, "notes", input.notes, position++);
  setIfDefined(updates, values, "contact_name", input.contactName, position++);
  setIfDefined(updates, values, "phone", input.phone, position++);
  setIfDefined(updates, values, "address", input.address, position++);
  setIfDefined(updates, values, "latitude", input.latitude, position++);
  setIfDefined(updates, values, "longitude", input.longitude, position++);
  setIfDefined(updates, values, "geofence_radius_m", input.geofenceRadiusM, position++);
  setIfDefined(updates, values, "location_source", input.locationSource, position++);
  setIfDefined(updates, values, "location_verified", input.locationVerified, position++);
  setIfDefined(updates, values, "location_accuracy_m", input.locationAccuracyM, position++);
  setIfDefined(
    updates,
    values,
    "arrival_prompt_enabled",
    input.arrivalPromptEnabled,
    position++
  );
  setIfDefined(updates, values, "min_dwell_seconds", input.minDwellSeconds, position++);
  setIfDefined(updates, values, "cooldown_minutes", input.cooldownMinutes, position++);
  setIfDefined(updates, values, "timezone", input.timezone, position++);
  setIfDefined(updates, values, "is_active", input.isActive, position++);

  if (!updates.length) {
    return jsonError(400, "No fields provided to update");
  }

  values.push(shopId, authResult.session.companyId);

  try {
    const result = await getDb().query(
      `
      UPDATE shops
      SET ${updates.join(", ")}
      WHERE id = $${position++}
        AND company_id = $${position}
      RETURNING *
      `,
      values
    );

    if (!result.rowCount) {
      return jsonError(404, "Shop not found");
    }

    return jsonOk({ shop: result.rows[0] });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError(409, "Shop with this externalShopCode already exists");
    }

    return jsonError(500, error instanceof Error ? error.message : "Could not update shop");
  }
}

function setIfDefined(
  updates: string[],
  values: Array<string | number | boolean | null>,
  column: string,
  value: string | number | boolean | null | undefined,
  position: number
) {
  if (value !== undefined) {
    updates.push(`${column} = $${position}`);
    values.push(value);
  }
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}


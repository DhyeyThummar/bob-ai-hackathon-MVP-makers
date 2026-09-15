/**
 * Dining Table rules.
 * Inputs: seatingCapacity (number), material (plywood|pine|oak), finish (varnish|danish oil|stain|none)
 *
 * Table size logic:
 *   2-seat  → ~100×60cm  → needs 1 standard 8×4ft (244×122cm) sheet (cut to size)
 *   4-seat  → ~140×80cm  → needs 1 sheet
 *   6-seat  → ~180×90cm  → needs 1 sheet (or 2 for wide)
 *   8-seat  → ~240×100cm → needs 2 sheets
 *   10-seat → ~280×100cm → needs 2 sheets
 *   12-seat → ~320×110cm → needs 3 sheets
 */

import { getProductById } from '../../data/catalogUtils.js';

const SHEET_AREA_CM2 = 244 * 122; // 8×4 ft in cm

function sheetsNeeded(seating) {
  if (seating <= 4) return 1;
  if (seating <= 8) return 2;
  return 3;
}

function tableWidthLabel(seating) {
  if (seating <= 2) return '~100×60cm';
  if (seating <= 4) return '~140×80cm';
  if (seating <= 6) return '~180×90cm';
  if (seating <= 8) return '~240×100cm';
  if (seating <= 10) return '~280×100cm';
  return '~320×110cm';
}

function legSetsNeeded(seating) {
  // Always 1 set of 4 legs regardless of seating count (set = 4 legs)
  return 1;
}

function selectSheetProduct(material) {
  const map = { oak: 'wood_sheet_oak', pine: 'wood_sheet_pine' };
  return map[material] ?? 'wood_sheet_std';
}

function selectFinishProduct(finish, material) {
  if (finish === 'danish oil' || (!finish && material === 'oak')) return 'danish_oil';
  if (finish === 'stain') return 'wood_stain';
  if (finish === 'none') return null;
  return 'wood_polish';
}

export function diningTableRules(slots) {
  const seating = parseInt(slots.seatingCapacity, 10) || 4;
  const material = slots.material || 'plywood';
  const finish = slots.finish || 'varnish';

  const sheetId = selectSheetProduct(material);
  const sheetCount = sheetsNeeded(seating);
  const legSetCount = legSetsNeeded(seating);
  const dimensionLabel = tableWidthLabel(seating);
  const finishId = selectFinishProduct(finish, material);
  const legType = material === 'oak' ? 'table_leg_set_wood' : 'table_leg_set';

  const items = [];

  items.push({
    product: getProductById(sheetId),
    quantity: sheetCount,
    reason: `A ${seating}-seat table needs a top of ${dimensionLabel}. That requires ${sheetCount} standard 8×4ft sheet${sheetCount > 1 ? 's' : ''} — the sheet covers the top area and you cut it to size.`,
  });

  items.push({
    product: getProductById(legType),
    quantity: legSetCount,
    reason: `1 set of 4 legs is standard for any dining table — corners need one leg each for stability.`,
  });

  items.push({
    product: getProductById('nut_bolt_set'),
    quantity: 1,
    reason: `M8 bolts attach the leg plates to the table top — 1 box is enough for all 4 legs (8 bolts needed, 50 in box).`,
  });

  items.push({
    product: getProductById('wood_screws_box'),
    quantity: 1,
    reason: `Wood screws are used to reinforce joints and attach any crossbars. 1 assorted box covers the full build.`,
  });

  items.push({
    product: getProductById('wood_glue'),
    quantity: 1,
    reason: `PVA wood glue strengthens butt joints and edge joins. Recommended for all sheet joints.`,
  });

  items.push({
    product: getProductById('sandpaper_coarse'),
    quantity: 1,
    reason: `Coarse 80-grit sandpaper removes saw marks and rough edges before assembly.`,
  });

  items.push({
    product: getProductById('sandpaper_fine'),
    quantity: 1,
    reason: `Fine 220-grit sandpaper is the final sanding step before applying the finish — gives a silky smooth surface.`,
  });

  if (finishId) {
    items.push({
      product: getProductById(finishId),
      quantity: 1,
      reason: `${finish || 'varnish'} protects the ${material} surface. ${material === 'oak' && finishId === 'danish_oil' ? 'Danish oil is ideal for oak — penetrates the grain beautifully.' : 'One tin covers a full dining table top with two coats.'}`,
    });
  }

  items.push({
    product: getProductById('clamps'),
    quantity: 1,
    reason: `F-clamps hold the joints in place while the wood glue dries (minimum 1 hour). 4 clamps covers the 4 main joints.`,
  });

  items.push({
    product: getProductById('measuring_tape'),
    quantity: 1,
    reason: `Essential for marking cut lines on the sheet accurately before sawing.`,
  });

  const reasoning = `Based on ${seating} seats → table size ${dimensionLabel} → ${sheetCount} sheet${sheetCount > 1 ? 's' : ''} of ${material}, ${legType === 'table_leg_set_wood' ? 'solid wood tapered legs' : 'hairpin steel legs'}, standard fasteners, and a ${finish} finish.`;

  return { items: items.filter((i) => i.product), reasoning };
}

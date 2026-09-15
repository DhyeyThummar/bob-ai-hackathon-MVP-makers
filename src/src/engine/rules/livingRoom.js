/**
 * Living Room rules.
 * Inputs: roomSizeM2 (number), occupants (number), style (modern|scandinavian|classic|boho|industrial|minimalist), budget (number in £)
 */

import { getProductById } from '../../data/catalogUtils.js';

function selectSofa(roomSizeM2, occupants) {
  const size = parseFloat(roomSizeM2) || 16;
  const occ = parseInt(occupants, 10) || 2;
  if (size >= 20 && occ >= 4) return 'sofa_lshaped';
  if (size >= 14 || occ >= 3) return 'sofa_3seater';
  return 'sofa_2seater';
}

function selectCoffeeTable(sofaId) {
  if (sofaId === 'sofa_lshaped' || sofaId === 'sofa_3seater') return 'coffee_table_lg';
  return 'coffee_table_sm';
}

function selectTvUnit(roomSizeM2) {
  return parseFloat(roomSizeM2) >= 20 ? 'tv_unit_wide' : 'tv_unit';
}

function selectRug(sofaId) {
  if (sofaId === 'sofa_lshaped' || sofaId === 'sofa_3seater') return 'area_rug_lg';
  return 'area_rug_sm';
}

function selectCurtains(style) {
  const modernStyles = ['modern', 'minimalist', 'industrial'];
  if (modernStyles.includes(style)) return 'curtains_blackout';
  return 'curtains_sheer';
}

function withinBudget(items, budget) {
  if (!budget) return items;
  let running = 0;
  const result = [];
  for (const item of items) {
    const cost = (item.product?.price || 0) * (item.quantity || 1);
    if (running + cost <= budget * 1.1) { // 10% tolerance
      running += cost;
      result.push(item);
    }
  }
  return result;
}

export function livingRoomRules(slots) {
  const roomSizeM2 = parseFloat(slots.roomSizeM2) || 16;
  const occupants = parseInt(slots.occupants, 10) || 2;
  const style = slots.style || 'modern';
  const budget = slots.budget ? parseInt(slots.budget, 10) : null;

  const sofaId = selectSofa(roomSizeM2, occupants);
  const coffeeTableId = selectCoffeeTable(sofaId);
  const tvUnitId = selectTvUnit(roomSizeM2);
  const rugId = selectRug(sofaId);
  const curtainId = selectCurtains(style);

  const sofaProduct = getProductById(sofaId);

  const items = [
    {
      product: sofaProduct,
      quantity: 1,
      reason: `For a ${roomSizeM2}m² room with ${occupants} occupant${occupants > 1 ? 's' : ''} — ${sofaProduct?.name} provides the right seating capacity and fits the room dimensions comfortably.`,
    },
    {
      product: getProductById(coffeeTableId),
      quantity: 1,
      reason: `Paired with the ${sofaProduct?.name} — a ${coffeeTableId === 'coffee_table_lg' ? 'large' : 'small'} coffee table is proportional to the sofa and room size.`,
    },
    {
      product: getProductById(tvUnitId),
      quantity: 1,
      reason: `${roomSizeM2 >= 20 ? 'A wider 200cm media console suits the larger room and provides more storage.' : 'A 150cm TV unit is sufficient for this room size.'}`,
    },
    {
      product: getProductById(curtainId),
      quantity: 2,
      reason: `${style} style → ${curtainId === 'curtains_blackout' ? 'blackout curtains for a clean, minimal look and light control' : 'sheer curtains for a lighter, airy feel'}. 2 pairs for a standard living room window arrangement.`,
    },
    {
      product: getProductById(rugId),
      quantity: 1,
      reason: `A ${rugId === 'area_rug_lg' ? 'large 200×290cm' : 'compact 120×170cm'} rug anchors the seating arrangement and defines the living zone visually.`,
    },
    {
      product: getProductById('floor_lamp'),
      quantity: 1,
      reason: `An arc floor lamp beside the sofa provides warm task lighting for reading — a staple in any well-furnished living room.`,
    },
    {
      product: getProductById('wall_decor_set'),
      quantity: 1,
      reason: `3 coordinated art prints create a focal point on the main wall. Neutral tones work with ${style} style.`,
    },
    {
      product: getProductById('indoor_plant_set'),
      quantity: 1,
      reason: `3 indoor plants (pothos, snake plant, peace lily) add life and texture. Low-maintenance — suitable for any household.`,
    },
  ];

  const filteredItems = budget ? withinBudget(items, budget) : items;

  const totalEstimate = filteredItems.reduce(
    (sum, i) => sum + (i.product?.price || 0) * (i.quantity || 1),
    0
  );

  const reasoning = `${roomSizeM2}m² room, ${occupants} occupants, ${style} style${budget ? `, £${budget} budget` : ''} → ${sofaProduct?.name}, matching tables, rug, and soft furnishings. Estimated cost: ~£${totalEstimate}.${budget && filteredItems.length < items.length ? ` Some items removed to stay within £${budget} budget.` : ''}`;

  return { items: filteredItems.filter((i) => i.product), reasoning };
}

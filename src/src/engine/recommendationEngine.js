/**
 * Recommendation Engine v2 — hybrid: hardcoded template rules + tag-based matching.
 *
 * Strategy:
 * - For the 4 original fixed templates, run the hardcoded rule first (most accurate).
 *   Then supplement with tag-matched products the rules didn't include.
 * - For unknown/open-ended templates, use tag matching only.
 * - Shopkeeper-added products with the right tags become recommendable automatically
 *   through the tag engine — no code changes needed.
 */

import { diningTableRules } from './rules/diningTable.js';
import { tvMountRules } from './rules/tvMount.js';
import { livingRoomRules } from './rules/livingRoom.js';
import { gamingPcRules } from './rules/gamingPc.js';
import { computeTagRecommendations } from './tagEngine.js';
import { getAlternatives } from '../data/catalogUtils.js';

const RULE_HANDLERS = {
  dining_table: diningTableRules,
  tv_mount: tvMountRules,
  living_room: livingRoomRules,
  gaming_pc: gamingPcRules,
};

/**
 * Compute recommendations for a given template and filled slots.
 * @param {string} templateId
 * @param {object} slots
 * @returns {{ items: Array, reasoning: string, confidence: number }}
 */
export function computeRecommendations(templateId, slots) {
  const handler = RULE_HANDLERS[templateId];

  try {
    let items = [];
    let reasoning = '';

    if (handler) {
      // Run hardcoded rules first
      const result = handler(slots);
      items = result.items;
      reasoning = result.reasoning;

      // Supplement: find tag-matched products NOT already in the rule-based list
      const ruleIds = new Set(items.map((i) => i.product?.id).filter(Boolean));
      const tagResult = computeTagRecommendations(templateId, slots);
      const tagExtras = tagResult.items.filter(
        (i) => i.product && !ruleIds.has(i.product.id)
      );

      // Add up to 3 extra tag-matched products (e.g. a shopkeeper-added product)
      if (tagExtras.length > 0) {
        items = [...items, ...tagExtras.slice(0, 3)];
        reasoning += ` Additional tag-matched products: ${tagExtras.slice(0, 3).map((i) => i.product?.name).join(', ')}.`;
      }
    } else {
      // No hardcoded rule → pure tag matching
      const tagResult = computeTagRecommendations(templateId, slots);
      items = tagResult.items;
      reasoning = tagResult.reasoning;
    }

    // Attach alternatives to each item
    const enrichedItems = items.map((item) => ({
      ...item,
      alternatives: item.alternatives?.length
        ? item.alternatives // tag engine may already supply these
        : (item.product ? getAlternatives(item.product.id) : []),
    }));

    return { items: enrichedItems, reasoning, confidence: 1.0 };
  } catch (err) {
    console.error('[recommendationEngine] Error:', err);
    return { items: [], reasoning: 'Could not compute recommendations.', confidence: 0 };
  }
}

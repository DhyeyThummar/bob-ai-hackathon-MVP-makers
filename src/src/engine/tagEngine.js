/**
 * Tag-based recommendation engine.
 *
 * This replaces/supplements the hardcoded template rules for open-ended goals.
 * It works with ANY product in the catalog that has the right tags — including
 * products added by the shopkeeper admin. No code changes needed to make new products recommendable.
 *
 * How it works:
 * 1. Map the user's goal + slots into a set of "target tags"
 * 2. Collect all products matching at least one target tag
 * 3. Score products by tag overlap (more matching tags = higher score)
 * 4. If a budget is given, allocate it sensibly across categories
 * 5. Return the top-N products with per-item reasoning
 */

import { getAllProducts } from '../data/catalogUtils.js';

// ── Goal → tag mapping ────────────────────────────────────────────────────────

const GOAL_TAGS = {
  dining_table: ['dining-table-build', 'furniture-build', 'diy-wood'],
  tv_mount: ['tv-mount-install', 'wall-mounting', 'cable-management'],
  living_room: ['living-room-decor', 'seating', 'soft-furnishings', 'lighting', 'decor', 'tables', 'storage'],
  gaming_pc: ['gaming-pc-build', 'pc-components', 'gaming-setup', 'peripherals'],
  // Open-ended / free-form goals
  decorate: ['living-room-decor', 'decor', 'soft-furnishings', 'lighting'],
  furnish: ['seating', 'tables', 'storage', 'soft-furnishings', 'lighting'],
  bedroom: ['bedroom-decor', 'soft-furnishings', 'lighting'],
  gaming_setup: ['gaming-setup', 'peripherals', 'rgb-build'],
};

/** Style → tag suffixes added to boost style-matching products */
const STYLE_TAG_SUFFIXES = {
  modern: 'modern-style',
  scandinavian: 'scandinavian-style',
  classic: 'classic-style',
  boho: 'boho-style',
  industrial: 'industrial-style',
  minimalist: 'minimalist-style',
};

/** Category budget allocation (fraction of total budget) for living-room style goals */
const CATEGORY_BUDGET_FRACTIONS = {
  seating: 0.40,
  tables: 0.12,
  storage: 0.15,
  soft_furnishings: 0.15,
  lighting: 0.08,
  decor: 0.10,
};

/**
 * Compute tag-based recommendations for a template + slots.
 *
 * @param {string} template
 * @param {object} slots
 * @returns {{ items: Array, reasoning: string }}
 */
export function computeTagRecommendations(template, slots) {
  const products = getAllProducts();
  const budget = slots.budget ? parseInt(slots.budget, 10) : null;
  const style = slots.style || null;

  // Determine target tags
  const baseTags = GOAL_TAGS[template] ?? ['living-room-decor', 'seating', 'decor'];
  const targetTags = new Set(baseTags);
  if (style && STYLE_TAG_SUFFIXES[style]) targetTags.add(STYLE_TAG_SUFFIXES[style]);
  if (slots.rgb === true || slots.rgb === 'true') targetTags.add('rgb-build');

  // Score each product by tag overlap
  const scored = products
    .map((p) => {
      const pTags = p.tags ?? [];
      const matches = pTags.filter((t) => targetTags.has(t));
      return { product: p, score: matches.length, matchedTags: matches };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (budget && isMultiCategoryGoal(template)) {
    return allocateBudget(scored, budget, style, template);
  }

  // No budget or single-category goal: return top scored, deduplicated by category
  const items = deduplicateByCategory(scored, budget).map((x) => ({
    product: x.product,
    quantity: 1,
    reason: buildReason(x.product, x.matchedTags, template, slots),
    alternatives: [],
  }));

  const reasoning = `Tag-based match for "${template}" with tags: ${[...targetTags].join(', ')}. ${items.length} products found.`;
  return { items, reasoning };
}

function isMultiCategoryGoal(template) {
  return ['living_room', 'decorate', 'furnish'].includes(template);
}

/**
 * Budget allocation for multi-category goals.
 * Splits the budget across categories using CATEGORY_BUDGET_FRACTIONS,
 * then picks the best product per category that fits within its allocation.
 */
function allocateBudget(scored, budget, style, template) {
  const items = [];
  const allocations = CATEGORY_BUDGET_FRACTIONS;
  const selectedCategories = new Set();

  for (const [category, fraction] of Object.entries(allocations)) {
    const categoryBudget = Math.round(budget * fraction);
    const candidates = scored.filter(
      (x) => x.product.category === category && (x.product.price ?? 0) <= categoryBudget
    );
    if (candidates.length === 0) continue;

    // Pick highest-scored within budget
    const best = candidates[0];
    selectedCategories.add(category);
    items.push({
      product: best.product,
      quantity: 1,
      reason: `Best ${category} within your £${categoryBudget} allocation (${Math.round(fraction * 100)}% of £${budget} budget). ${buildReason(best.product, best.matchedTags, template, { style })}`,
      alternatives: candidates.slice(1, 3).map((c) => c.product),
    });
  }

  // If we have budget left, fill in additional tag-matched items not yet included
  const spent = items.reduce((sum, i) => sum + (i.product?.price ?? 0), 0);
  const remaining = budget - spent;
  const notYetSelected = scored.filter(
    (x) => !selectedCategories.has(x.product.category) && x.product.price <= remaining * 0.3
  ).slice(0, 3);
  notYetSelected.forEach((x) => {
    items.push({
      product: x.product,
      quantity: 1,
      reason: `Suggested addition — ${buildReason(x.product, x.matchedTags, template, { style })}`,
      alternatives: [],
    });
  });

  const totalEstimate = items.reduce((s, i) => s + (i.product?.price ?? 0), 0);
  const reasoning = `£${budget} budget allocated across ${selectedCategories.size} categories${style ? ` (${style} style)` : ''}. Total estimate: ~£${totalEstimate}.`;

  return { items: items.filter((i) => i.product), reasoning };
}

function deduplicateByCategory(scored, budget) {
  const seen = new Set();
  return scored.filter((x) => {
    if (seen.has(x.product.category)) return false;
    if (budget && x.product.price > budget) return false;
    seen.add(x.product.category);
    return true;
  });
}

function buildReason(product, matchedTags, template, slots) {
  const tagList = matchedTags.slice(0, 2).map((t) => t.replace(/-/g, ' ')).join(' and ');
  const styleNote = slots?.style ? ` Matches your ${slots.style} style preference.` : '';
  return `Tagged as "${tagList}" — fits your ${template?.replace(/_/g, ' ')} goal.${styleNote}`;
}

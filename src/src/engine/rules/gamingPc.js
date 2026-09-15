/**
 * Gaming PC rules.
 * Inputs: budget (£), useCase (gaming|streaming|content creation|general gaming), rgb (boolean), existingPeripherals (text)
 *
 * Budget tiers:
 *   Entry  < £800  → Ryzen 5 / RTX 3060, B650, 16GB, 1TB, 650W, air cooler
 *   Mid    £800-1400 → i5-14600K / RTX 4060, B760, 16GB, 1TB, 650W, air cooler
 *   High   > £1400 → Ryzen 7 7800X3D / RTX 4070, B650, 32GB, 1TB, 750W, AIO
 */

import { getProductById } from '../../data/catalogUtils.js';

function getBudgetTier(budget) {
  const b = parseInt(budget, 10) || 1000;
  if (b < 800) return 'entry';
  if (b <= 1400) return 'mid';
  return 'high';
}

const TIER_CONFIGS = {
  entry: {
    cpu: 'cpu_ryzen5',
    mobo: 'mobo_b650',
    ram: 'ram_16gb_ddr5',
    gpu: 'gpu_rx7600',
    ssd: 'ssd_1tb',
    psu: 'psu_650w',
    cooler: 'cooler_air',
    case: 'case_mid_tower',
  },
  mid: {
    cpu: 'cpu_i5',
    mobo: 'mobo_b760',
    ram: 'ram_16gb_ddr5',
    gpu: 'gpu_rtx4060',
    ssd: 'ssd_1tb',
    psu: 'psu_650w',
    cooler: 'cooler_air',
    case: 'case_mid_tower',
  },
  high: {
    cpu: 'cpu_ryzen7',
    mobo: 'mobo_b650',
    ram: 'ram_32gb_ddr5',
    gpu: 'gpu_rtx4070',
    ssd: 'ssd_1tb',
    psu: 'psu_750w',
    cooler: 'cooler_aio_240',
    case: 'case_mid_tower',
  },
};

function hasPeripheral(existingPeripherals, type) {
  if (!existingPeripherals) return false;
  const text = existingPeripherals.toLowerCase();
  return text.includes(type);
}

export function gamingPcRules(slots) {
  const budget = parseInt(slots.budget, 10) || 1000;
  const useCase = slots.useCase || 'gaming';
  const rgb = slots.rgb === true || slots.rgb === 'true';
  const existingPeripherals = slots.existingPeripherals || '';

  const tier = getBudgetTier(budget);
  const config = { ...TIER_CONFIGS[tier] };

  // Upgrade GPU for streaming/content creation if mid-tier
  if ((useCase === 'streaming' || useCase === 'content creation') && tier === 'mid') {
    config.ram = 'ram_32gb_ddr5';
    config.cpu = 'cpu_i7';
    config.mobo = 'mobo_z790';
    config.psu = 'psu_750w';
  }

  // RGB: upgrade case
  if (rgb) config.case = 'case_mid_tower_rgb';

  const items = [];

  items.push({
    product: getProductById(config.cpu),
    quantity: 1,
    reason: `${tier === 'entry' ? 'Best value CPU under £800' : tier === 'mid' ? 'Excellent mid-range gaming CPU' : 'Best gaming CPU available — 3D V-Cache gives the highest frame rates'}. Matches your £${budget} budget (${tier} tier).`,
  });

  items.push({
    product: getProductById(config.mobo),
    quantity: 1,
    reason: `Compatible motherboard for the selected CPU. ${useCase === 'content creation' ? 'Z790/B650 with extra M.2 slots supports faster storage expansion for creative work.' : 'Standard ATX form — fits mid-tower case, supports DDR5 and PCIe 5.0.'}`,
  });

  items.push({
    product: getProductById(config.ram),
    quantity: 1,
    reason: `${config.ram === 'ram_32gb_ddr5' ? '32GB DDR5 recommended for streaming/content creation to avoid memory bottlenecks.' : '16GB DDR5 is the sweet spot for gaming — plenty for modern titles.'}`,
  });

  items.push({
    product: getProductById(config.gpu),
    quantity: 1,
    reason: `${tier === 'entry' ? 'RX 7600 offers the best 1080p gaming per pound under £800.' : tier === 'mid' ? 'RTX 4060 is highly efficient (115W) and handles 1080p/1440p with DLSS 3.' : 'RTX 4070 handles 1440p/4K with ray tracing and DLSS 3. Best choice for high-end builds.'}`,
  });

  items.push({
    product: getProductById(config.ssd),
    quantity: 1,
    reason: `1TB NVMe SSD holds your OS + several large games. PCIe 4.0 speed (7000MB/s) means fast loading across all titles.`,
  });

  items.push({
    product: getProductById(config.psu),
    quantity: 1,
    reason: `${config.psu === 'psu_750w' ? '750W 80+ Gold provides headroom for CPU+GPU peak power with efficiency.' : '650W 80+ Bronze covers this build with ~100W headroom — safe and cost-effective.'}`,
  });

  items.push({
    product: getProductById(config.case),
    quantity: 1,
    reason: `${rgb ? 'RGB case with 3 pre-installed ARGB fans — matches your RGB preference without needing extra fans.' : 'Mesh-front mid-tower with 3 pre-installed fans provides excellent airflow out of the box.'}`,
  });

  items.push({
    product: getProductById(config.cooler),
    quantity: 1,
    reason: `${config.cooler === 'cooler_aio_240' ? '240mm AIO liquid cooler handles the high-TDP CPU silently. Includes RGB pump head.' : 'Dual-tower air cooler is quiet, reliable, and handles this CPU with no issues.'}`,
  });

  // Add RGB fans only if RGB and air-cooled case (AIO already has fans)
  if (rgb && config.cooler === 'cooler_air') {
    items.push({
      product: getProductById('rgb_fans'),
      quantity: 1,
      reason: `Extra ARGB 120mm fans (3-pack) improve airflow and complete the RGB aesthetic throughout the case.`,
    });
  }

  // Peripherals — skip if user already has them
  const hasKeyboard = hasPeripheral(existingPeripherals, 'keyboard');
  const hasMouse = hasPeripheral(existingPeripherals, 'mouse');

  if (!hasKeyboard) {
    items.push({
      product: getProductById(rgb ? 'keyboard_mech' : 'keyboard_membrane'),
      quantity: 1,
      reason: `${rgb ? 'Mechanical keyboard with RGB backlight — tactile switches and USB-C cable.' : 'Budget membrane gaming keyboard — reliable and affordable.'}${hasKeyboard ? '' : ' You indicated you don\'t already own one.'}`,
    });
  }

  if (!hasMouse) {
    items.push({
      product: getProductById('gaming_mouse'),
      quantity: 1,
      reason: `Gaming mouse with 16000 DPI sensor and programmable buttons. ${rgb ? 'RGB lighting included.' : ''}${hasMouse ? '' : ' You indicated you don\'t already own one.'}`,
    });
  }

  const gpuProduct = getProductById(config.gpu);
  const cpuProduct = getProductById(config.cpu);
  const reasoning = `£${budget} budget (${tier} tier)${useCase !== 'gaming' ? `, ${useCase} optimised` : ''} → ${cpuProduct?.name} + ${gpuProduct?.name}. ${rgb ? 'RGB build.' : ''} ${existingPeripherals ? `Skipped: ${existingPeripherals} (already owned).` : 'Full peripheral set included.'}`;

  return { items: items.filter((i) => i.product), reasoning };
}

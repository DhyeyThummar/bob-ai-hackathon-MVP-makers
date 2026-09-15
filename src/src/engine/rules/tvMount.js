/**
 * TV Wall Mount rules.
 * Inputs: tvSize (inches), wallType (brick|concrete|plasterboard|hollow), mountType (fixed|tilt|full-motion), cableManagement (boolean)
 */

import { getProductById } from '../../data/catalogUtils.js';

function selectMount(tvSize, mountType) {
  const size = parseInt(tvSize, 10) || 55;
  if (mountType === 'full-motion') return 'wall_mount_full_motion';
  if (mountType === 'tilt') return 'wall_mount_tilt';
  if (mountType === 'fixed') return 'wall_mount_fixed';
  // Auto-select based on TV size if not specified
  if (size > 65) return 'wall_mount_full_motion';
  if (size > 55) return 'wall_mount_tilt';
  return 'wall_mount_fixed';
}

function selectWallPlugs(wallType) {
  if (wallType === 'plasterboard' || wallType === 'hollow') return 'wall_plugs_heavy';
  return 'wall_plugs';
}

export function tvMountRules(slots) {
  const tvSize = parseInt(slots.tvSize, 10) || 55;
  const wallType = slots.wallType || 'brick';
  const mountType = slots.mountType || null;
  const cableManagement = slots.cableManagement !== false; // default: include

  const mountId = selectMount(tvSize, mountType);
  const plugId = selectWallPlugs(wallType);
  const selectedMount = getProductById(mountId);

  const items = [];

  items.push({
    product: selectedMount,
    quantity: 1,
    reason: `For a ${tvSize}" TV on a ${wallType} wall${mountType ? ` with a ${mountType} mount preference` : ''} — ${selectedMount?.name} is recommended. ${tvSize > 65 ? 'Larger TVs benefit from full-motion arms for flexible viewing angles.' : ''}`,
  });

  items.push({
    product: getProductById(plugId),
    quantity: 1,
    reason: wallType === 'plasterboard' || wallType === 'hollow'
      ? `${wallType === 'plasterboard' ? 'Plasterboard' : 'Hollow'} walls require heavy-duty cavity anchors rated to 25kg each — standard plugs will pull out.`
      : `${wallType === 'brick' || wallType === 'concrete' ? 'Brick/concrete' : 'Standard'} walls need plastic rawl plugs to accept the mount bolts securely.`,
  });

  items.push({
    product: getProductById('nut_bolt_set_m6'),
    quantity: 1,
    reason: `M6 bolts attach the mount bracket to the wall plugs — 1 box of 50 is more than enough for all mounting points.`,
  });

  items.push({
    product: getProductById('drill_bit_masonry'),
    quantity: 1,
    reason: `Masonry drill bits are required to drill pilot holes in ${wallType} before inserting wall plugs — without these you cannot drill the holes.`,
  });

  items.push({
    product: getProductById('spirit_level'),
    quantity: 1,
    reason: `A spirit level ensures the mount bracket is perfectly horizontal — even 1–2° tilt is very noticeable on a TV.`,
  });

  if (cableManagement) {
    const cableKitId = wallType === 'plasterboard' ? 'cable_management_kit' : 'cable_raceway';
    items.push({
      product: getProductById(cableKitId),
      quantity: 1,
      reason: wallType === 'plasterboard'
        ? `Plasterboard walls are ideal for in-wall cable routing — the kit provides clean wall plates to pass cables through.`
        : `Surface cable trunking hides cables along the wall without drilling through brick or concrete.`,
    });

    items.push({
      product: getProductById('hdmi_cable_2m'),
      quantity: 1,
      reason: `A 2m HDMI 2.1 cable connects your TV to the AV source — included because cable management was requested.`,
    });
  }

  const autoMountName = !slots.mountType ? ` (auto-selected for ${tvSize}" TV)` : '';
  const reasoning = `${tvSize}" TV on ${wallType} wall → ${selectedMount?.name}${autoMountName}. ${wallType === 'plasterboard' || wallType === 'hollow' ? 'Heavy-duty anchors required for hollow/plasterboard walls.' : 'Standard rawl plugs for solid wall.'} ${cableManagement ? 'Cable management included.' : ''}`;

  return { items: items.filter((i) => i.product), reasoning };
}

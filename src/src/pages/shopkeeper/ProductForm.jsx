import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById, saveProductOverride, getAllProducts, getAllTags } from '../../data/catalogUtils.js';
import styles from '../../styles/admin.module.css';

function makeId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)
    + '_' + Math.random().toString(36).slice(2, 6);
}

const EMPTY_PRODUCT = {
  id: '',
  name: '',
  category: '',
  unit: 'piece',
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
  specifications: {},
  tags: [],
  relatedTo: [],
  alternatives: [],
  usageGuide: [],
  troubleshooting: [],
  supportContact: '',
};

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [newTag, setNewTag] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const allProducts = getAllProducts();
  const allTags = getAllTags();

  useEffect(() => {
    if (isEdit) {
      const p = getProductById(id);
      if (p) {
        setForm({
          ...EMPTY_PRODUCT,
          ...p,
          price: String(p.price ?? ''),
          stock: String(p.stock ?? ''),
          specifications: p.specifications ?? {},
          tags: p.tags ?? [],
          relatedTo: p.relatedTo ?? [],
          alternatives: p.alternatives ?? [],
          usageGuide: p.usageGuide ?? [],
          troubleshooting: p.troubleshooting ?? [],
        });
      }
    }
  }, [id, isEdit]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Tags ─────────────────────────────────────────────────────────────────
  function addTag(t) {
    const tag = t.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || form.tags.includes(tag)) return;
    setField('tags', [...form.tags, tag]);
    setNewTag('');
  }

  function removeTag(t) {
    setField('tags', form.tags.filter((x) => x !== t));
  }

  // ── Specifications ────────────────────────────────────────────────────────
  function addSpec() {
    if (!newSpecKey.trim()) return;
    setField('specifications', { ...form.specifications, [newSpecKey.trim()]: newSpecVal.trim() });
    setNewSpecKey('');
    setNewSpecVal('');
  }

  function removeSpec(k) {
    const specs = { ...form.specifications };
    delete specs[k];
    setField('specifications', specs);
  }

  function updateSpec(k, newKey, newVal) {
    const specs = { ...form.specifications };
    if (newKey !== k) delete specs[k];
    specs[newKey] = newVal;
    setField('specifications', specs);
  }

  // ── Usage Guide ────────────────────────────────────────────────────────────
  function addStep() {
    setField('usageGuide', [...form.usageGuide, '']);
  }

  function updateStep(i, val) {
    const steps = [...form.usageGuide];
    steps[i] = val;
    setField('usageGuide', steps);
  }

  function removeStep(i) {
    setField('usageGuide', form.usageGuide.filter((_, idx) => idx !== i));
  }

  // ── Troubleshooting ────────────────────────────────────────────────────────
  function addTrouble() {
    setField('troubleshooting', [...form.troubleshooting, { issue: '', solution: '' }]);
  }

  function updateTrouble(i, field, val) {
    const items = [...form.troubleshooting];
    items[i] = { ...items[i], [field]: val };
    setField('troubleshooting', items);
  }

  function removeTrouble(i) {
    setField('troubleshooting', form.troubleshooting.filter((_, idx) => idx !== i));
  }

  // ── Multi-select product links ─────────────────────────────────────────────
  function toggleProductLink(field, pid) {
    const arr = form[field];
    if (arr.includes(pid)) {
      setField(field, arr.filter((x) => x !== pid));
    } else {
      setField(field, [...arr, pid]);
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave() {
    setError('');
    if (!form.name.trim()) { setError('Product name is required.'); return; }
    if (!form.category.trim()) { setError('Category is required.'); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { setError('Price must be a number.'); return; }

    const product = {
      ...form,
      id: form.id.trim() || makeId(form.name),
      price: parseFloat(form.price),
      stock: form.stock === '' ? undefined : parseInt(form.stock, 10),
    };

    saveProductOverride(product);
    setSaved(true);
    setTimeout(() => navigate('/shopkeeper/products'), 1200);
  }

  return (
    <div className={styles.adminPage}>
      <h1 className={styles.pageTitle}>{isEdit ? '✏️ Edit Product' : '➕ Add New Product'}</h1>
      <p className={styles.pageSubtitle}>
        {isEdit ? `Editing: ${form.name}` : 'New products become immediately recommendable once you add the right "fits for" tags.'}
      </p>

      {saved && <div className={styles.alertSuccess}>✅ Product saved! Redirecting…</div>}
      {error && <div className={styles.alertError}>❌ {error}</div>}

      <div className={styles.form}>
        {/* Basic info */}
        <div className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Product Name *</label>
            <input className={styles.fieldInput} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Oak Veneer Sheet (8×4 ft)" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>ID</label>
            <span className={styles.fieldHint}>Auto-generated from name if left blank</span>
            <input className={styles.fieldInput} value={form.id} onChange={(e) => setField('id', e.target.value)} placeholder="e.g. oak_sheet_premium" disabled={isEdit} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Category *</label>
            <input className={styles.fieldInput} value={form.category} onChange={(e) => setField('category', e.target.value)} placeholder="e.g. wood, hardware, seating" list="categoryList" />
            <datalist id="categoryList">
              {['wood','hardware','fasteners','tools','finishing','adhesives','tv_mounting','cable_management','cables','seating','tables','storage','soft_furnishings','lighting','decor','cpu','motherboard','ram','gpu','psu','case','cooling','peripherals'].map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Unit</label>
            <select className={styles.fieldSelect} value={form.unit} onChange={(e) => setField('unit', e.target.value)}>
              {['piece','sheet','set','kit','pack','box','bottle','tin','pair','roll'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Price (GBP) *</label>
            <input className={styles.fieldInput} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="e.g. 45.00" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Stock Quantity (mock)</label>
            <input className={styles.fieldInput} type="number" min="0" value={form.stock} onChange={(e) => setField('stock', e.target.value)} placeholder="e.g. 50" />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Description</label>
          <textarea className={styles.fieldTextarea} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Short description shown in catalog and recommendations" rows={3} />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Image URL (optional)</label>
          <span className={styles.fieldHint}>A direct image URL. Leave blank to use a category icon placeholder. Do not upload files — store images externally.</span>
          <input className={styles.fieldInput} type="url" value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>

        {/* Tags */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>🏷️ "Fits For" Tags</label>
          <span className={styles.fieldHint}>These tags drive the recommendation engine. Add any tag matching a use-case (e.g. dining-table-build, modern-style, budget-friendly). A product is recommended whenever the customer's goal matches one of its tags.</span>
          <div className={styles.tagsWrap}>
            {form.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
                <button className={styles.tagRemove} onClick={() => removeTag(t)}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              className={styles.fieldInput}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
              placeholder="Type a tag and press Enter…"
              list="tagSuggestions"
              style={{ flex: 1 }}
            />
            <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => addTag(newTag)}>Add</button>
          </div>
          <datalist id="tagSuggestions">
            {allTags.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>

        {/* Specifications */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>📋 Specifications (key–value)</label>
          <span className={styles.fieldHint}>Flexible key–value pairs shown on the product detail page. Works for any product type.</span>
          {Object.entries(form.specifications).map(([k, v]) => (
            <div key={k} className={styles.kvRow}>
              <input className={styles.kvKey} value={k} onChange={(e) => updateSpec(k, e.target.value, v)} placeholder="Key (e.g. weight)" />
              <input className={styles.kvVal} value={v} onChange={(e) => updateSpec(k, k, e.target.value)} placeholder="Value (e.g. 22kg)" />
              <button className={styles.kvRemove} onClick={() => removeSpec(k)}>×</button>
            </div>
          ))}
          <div className={styles.kvRow}>
            <input className={styles.kvKey} value={newSpecKey} onChange={(e) => setNewSpecKey(e.target.value)} placeholder="New key" />
            <input className={styles.kvVal} value={newSpecVal} onChange={(e) => setNewSpecVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpec())} placeholder="Value" />
            <button className={`${styles.btn} ${styles.btnSm}`} onClick={addSpec}>Add</button>
          </div>
        </div>

        {/* Usage Guide */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>📖 Usage Guide (ordered steps)</label>
          {form.usageGuide.map((step, i) => (
            <div key={i} className={styles.stepRow}>
              <span className={styles.stepNum}>{i + 1}.</span>
              <textarea className={styles.stepInput} value={step} onChange={(e) => updateStep(i, e.target.value)} rows={1} placeholder={`Step ${i + 1}`} />
              <button className={styles.kvRemove} onClick={() => removeStep(i)}>×</button>
            </div>
          ))}
          <button className={`${styles.btn} ${styles.btnSm}`} onClick={addStep} style={{ marginTop: 4 }}>+ Add step</button>
        </div>

        {/* Troubleshooting */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>🔧 Troubleshooting</label>
          {form.troubleshooting.map((item, i) => (
            <div key={i} className={styles.card} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Issue {i + 1}</span>
                <button className={styles.kvRemove} onClick={() => removeTrouble(i)}>×</button>
              </div>
              <input className={styles.fieldInput} value={item.issue} onChange={(e) => updateTrouble(i, 'issue', e.target.value)} placeholder="Issue (e.g. Table wobbles)" style={{ marginBottom: 6 }} />
              <textarea className={styles.fieldTextarea} value={item.solution} onChange={(e) => updateTrouble(i, 'solution', e.target.value)} placeholder="Solution steps" rows={2} />
            </div>
          ))}
          <button className={`${styles.btn} ${styles.btnSm}`} onClick={addTrouble}>+ Add issue</button>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Support Contact (email or URL)</label>
          <input className={styles.fieldInput} value={form.supportContact} onChange={(e) => setField('supportContact', e.target.value)} placeholder="support@yourstore.com" />
        </div>

        {/* Related + Alternatives */}
        <ProductLinkSection title="🔗 Related Products (often bought together)" field="relatedTo" form={form} allProducts={allProducts} onToggle={toggleProductLink} />
        <ProductLinkSection title="🔄 Alternative Products" field="alternatives" form={form} allProducts={allProducts} onToggle={toggleProductLink} />

        {/* Save / Cancel */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave}>
            {isEdit ? '💾 Save Changes' : '💾 Create Product'}
          </button>
          <button className={styles.btn} onClick={() => navigate('/shopkeeper/products')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ProductLinkSection({ title, field, form, allProducts, onToggle }) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? allProducts.filter((p) => p.id !== form.id && (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())))
    : allProducts.filter((p) => p.id !== form.id).slice(0, 12);

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{title}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {(form[field] || []).map((pid) => {
          const p = allProducts.find((x) => x.id === pid);
          return (
            <span key={pid} className={styles.tag}>
              {p?.name ?? pid}
              <button className={styles.tagRemove} onClick={() => onToggle(field, pid)}>×</button>
            </span>
          );
        })}
      </div>
      <input className={styles.fieldInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products to link…" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, maxHeight: 120, overflowY: 'auto' }}>
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onToggle(field, p.id)}
            style={{
              fontSize: 11, padding: '3px 8px',
              border: `1px solid ${(form[field] || []).includes(p.id) ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 99,
              background: (form[field] || []).includes(p.id) ? 'var(--color-assistant-bubble)' : 'var(--color-surface)',
              cursor: 'pointer',
              color: (form[field] || []).includes(p.id) ? 'var(--color-accent)' : 'var(--color-text)',
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

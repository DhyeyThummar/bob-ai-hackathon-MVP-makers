import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, getAlternatives, getRelated } from '../../data/catalogUtils.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { formatPrice } from '../../data/currency.js';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: prefs } = usePreferences();
  const product = getProductById(id);

  if (!product) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p>Product not found.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 12, cursor: 'pointer', color: 'var(--color-accent)', border: 'none', background: 'none', fontSize: 14 }}>← Go back</button>
      </div>
    );
  }

  const alternatives = getAlternatives(id);
  const related = getRelated(id);

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>

      <div className={styles.hero}>
        <div className={styles.heroImg}>
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} className={styles.img} />
            : <span className={styles.placeholder}>{categoryIcon(product.category)}</span>
          }
        </div>
        <div className={styles.heroInfo}>
          <span className={styles.category}>{product.category}</span>
          <h1 className={styles.name}>{product.name}</h1>
          <p className={styles.desc}>{product.description}</p>
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(product.price, prefs.currency)}</span>
            <span className={styles.unit}>per {product.unit}</span>
            {product.stock !== undefined && (
              <span className={product.stock > 0 ? styles.inStock : styles.outStock}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📋 Specifications</h2>
          <div className={styles.specGrid}>
            {Object.entries(product.specifications).map(([k, v]) => (
              <div key={k} className={styles.specRow}>
                <span className={styles.specKey}>{k}</span>
                <span className={styles.specVal}>{String(v)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🏷️ Suitable for</h2>
          <div className={styles.tagsRow}>
            {product.tags.map((t) => (
              <span key={t} className={styles.tagChip}>{t.replace(/-/g, ' ')}</span>
            ))}
          </div>
        </section>
      )}

      {/* Usage Guide */}
      {product.usageGuide && product.usageGuide.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📖 How to use</h2>
          <ol className={styles.stepList}>
            {product.usageGuide.map((step, i) => (
              <li key={i} className={styles.stepItem}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Troubleshooting */}
      {product.troubleshooting && product.troubleshooting.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔧 Troubleshooting</h2>
          {product.troubleshooting.map((item, i) => (
            <div key={i} className={styles.troubleCard}>
              <p className={styles.troubleIssue}>❗ {item.issue}</p>
              <p className={styles.troubleSolution}>✅ {item.solution}</p>
            </div>
          ))}
          {product.supportContact && (
            <p className={styles.supportContact}>
              Need more help? Contact: <a href={`mailto:${product.supportContact}`}>{product.supportContact}</a>
            </p>
          )}
        </section>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔄 Alternatives</h2>
          <div className={styles.productGrid}>
            {alternatives.map((p) => <MiniCard key={p.id} product={p} currency={prefs.currency} navigate={navigate} />)}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔗 Often bought together</h2>
          <div className={styles.productGrid}>
            {related.slice(0, 4).map((p) => <MiniCard key={p.id} product={p} currency={prefs.currency} navigate={navigate} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function MiniCard({ product, currency, navigate }) {
  return (
    <div className={styles.miniCard} onClick={() => navigate(`/customer/product/${product.id}`)}>
      <span className={styles.miniIcon}>{categoryIcon(product.category)}</span>
      <div>
        <p className={styles.miniName}>{product.name}</p>
        <p className={styles.miniPrice}>{formatPrice(product.price, currency)}</p>
      </div>
    </div>
  );
}

function categoryIcon(category) {
  const icons = {
    wood: '🪵', hardware: '🔩', fasteners: '🔧', tools: '🔨',
    finishing: '🖌️', adhesives: '🫙', tv_mounting: '📺', cable_management: '🔌',
    cables: '🔌', seating: '🛋️', tables: '🪑', storage: '📦',
    soft_furnishings: '🧶', lighting: '💡', decor: '🖼️', cpu: '🖥️',
    motherboard: '🔌', ram: '💾', gpu: '🎮', storage_drive: '💿',
    psu: '⚡', case: '🗃️', cooling: '❄️', peripherals: '🖱️',
  };
  return icons[category] ?? '📦';
}

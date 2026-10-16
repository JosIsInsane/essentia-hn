import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Product } from '../../shared/types';
import { lempiras } from '../../shared/money';
import { imageAttrs } from '../images';
import { cart, MAX_LINE_QTY } from '../cart';
import { Close } from './Icons';

interface Props { product: Product | null; onClose: () => void; onAdded: () => void }

export function ProductDialog({ product, onClose, onAdded }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [variantId, setVariantId] = useState(0);
  const [scent, setScent] = useState('');
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (product) {
      setVariantId(product.variants[0]?.id ?? 0);
      setScent(product.scents.length === 1 ? product.scents[0]! : '');
      setQty(1);
      setError('');
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [product]);

  const p = product;
  const variant = p?.variants.find((v) => v.id === variantId);

  function add() {
    if (!p || !variant) return;
    if (p.scents.length > 0 && !scent) {
      setError('Elige un aroma.');
      return;
    }
    cart.add({ productId: p.id, variantId: variant.id, scent, qty });
    onAdded();
    onClose();
  }

  return (
    <dialog
      ref={ref}
      className="product-dialog"
      aria-labelledby="pd-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={p ? ({ '--ink': p.labelColor } as CSSProperties) : undefined}
    >
      {p && (
        <div className="pd">
          <div className="pd-photo">
            <img {...imageAttrs(p.image)} sizes="(max-width: 860px) 100vw, 480px" alt={p.imageAlt} width={480} height={600} />
          </div>
          <div className="pd-body">
            <button type="button" className="icon-btn close" onClick={onClose} aria-label="Cerrar"><Close /></button>
            <div>
              <h2 id="pd-title">{p.name}</h2>
              {p.subtitle && <p className="sub-line">{p.subtitle}</p>}
            </div>
            {p.description && <p className="desc">{p.description}</p>}

            {p.variants.length > 1 && (
              <fieldset>
                <legend>Tamaño</legend>
                <div className="options">
                  {p.variants.map((v) => (
                    <label key={v.id} className="option">
                      <input type="radio" name="variant" checked={variantId === v.id} onChange={() => setVariantId(v.id)} />
                      <span>{v.label} · {lempiras(v.priceCents)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {p.scents.length > 0 && (
              <fieldset aria-describedby={error ? 'pd-err' : undefined}>
                <legend>Aroma</legend>
                <div className="options">
                  {p.scents.map((s) => (
                    <label key={s} className="option">
                      <input type="radio" name="scent" checked={scent === s} onChange={() => { setScent(s); setError(''); }} />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
                {error && <p id="pd-err" className="err-text" role="alert">{error}</p>}
              </fieldset>
            )}

            <div className="pd-buy">
              <div className="qty" role="group" aria-label="Cantidad">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Quitar uno">−</button>
                <output aria-live="polite">{qty}</output>
                <button type="button" onClick={() => setQty((q) => Math.min(MAX_LINE_QTY, q + 1))} aria-label="Agregar uno">+</button>
              </div>
              <button type="button" className="btn btn-wine" onClick={add} disabled={!variant}>
                Agregar · {variant ? lempiras(variant.priceCents * qty) : ''}
              </button>
            </div>
            {p.variants.length === 1 && variant && <p className="fine">{variant.label}</p>}
          </div>
        </div>
      )}
    </dialog>
  );
}

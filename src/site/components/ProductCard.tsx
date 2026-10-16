import type { CSSProperties } from 'react';
import type { Product } from '../../shared/types';
import { lempiras } from '../../shared/money';
import { imageAttrs } from '../images';

/** Foto del frasco con la etiqueta encima, como el empaque real. */
export function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const prices = product.variants.map((v) => v.priceCents);
  const min = Math.min(...prices);
  const many = product.variants.length > 1;
  const img = imageAttrs(product.image);
  const style = { '--ink': product.labelColor } as CSSProperties;
  return (
    <article className="card" style={style}>
      <button type="button" className="card-photo" onClick={() => onOpen(product)} tabIndex={-1} aria-hidden="true">
        <img {...img} sizes="(max-width: 600px) 92vw, 300px" alt="" loading="lazy" decoding="async" width={480} height={600} />
      </button>
      {product.featured && <span className="tag-featured">Temporada</span>}
      <div className="label">
        <span className="label-brand" aria-hidden="true">Essentia<small>Ash &amp; Aroma</small></span>
        <h4>
          <button type="button" onClick={() => onOpen(product)}>{product.name}</button>
        </h4>
        <p className="label-sub">{product.subtitle}</p>
        <div className="label-foot">
          <p className="price" style={{ margin: 0 }}>
            {many && <small>desde</small>}
            {lempiras(min)}
            {!many && <small>{product.variants[0]?.label}</small>}
          </p>
          <button type="button" className="add" onClick={() => onOpen(product)} aria-label={`Elegir ${product.name}`}>
            Elegir
          </button>
        </div>
      </div>
    </article>
  );
}

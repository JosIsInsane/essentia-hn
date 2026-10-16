import type { Product, Section } from '../../shared/types';
import { ProductCard } from './ProductCard';

export const secId = (s: Section, parent?: Section) => (parent ? `s-${parent.slug}-${s.slug}` : `s-${s.slug}`);

function Grid({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  return (
    <div className="grid">
      {products.map((p) => <ProductCard key={p.id} product={p} onOpen={onOpen} />)}
    </div>
  );
}

export function SectionView({ section, onOpen }: { section: Section; onOpen: (p: Product) => void }) {
  return (
    <section id={secId(section)} className="section" data-tone={section.tone} data-spy={section.slug} aria-labelledby={`h-${section.slug}`}>
      <div className="wrap">
        <header className="section-head">
          <h2 id={`h-${section.slug}`}>{section.name}</h2>
          {section.blurb && <p>{section.blurb}</p>}
        </header>
        {section.products.length > 0 && <Grid products={section.products} onOpen={onOpen} />}
        {section.children.map((c) => (
          <div key={c.id} id={secId(c, section)} className="sub" data-spy-sub={`${section.slug}/${c.slug}`}>
            <div className="sub-head">
              <h3>{c.name}</h3>
              {c.blurb && <p>{c.blurb}</p>}
            </div>
            <Grid products={c.products} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </section>
  );
}

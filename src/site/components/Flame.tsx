import { imageAttrs } from '../images';

// Forma de llama del logo: recorta la foto de portada y se dibuja como contorno.
const D = 'M150 2 C174 72 290 152 290 272 C290 348 228 398 150 398 C72 398 10 348 10 272 C10 152 126 72 150 2 Z';

export function FlameDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="flame-clip" clipPathUnits="objectBoundingBox">
          <path d="M0.5 0 C0.58 0.18 0.97 0.38 0.97 0.68 C0.97 0.87 0.76 1 0.5 1 C0.24 1 0.03 0.87 0.03 0.68 C0.03 0.38 0.42 0.18 0.5 0 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function FlameFrame({ image, alt, caption }: { image: string; alt: string; caption?: string }) {
  const a = imageAttrs(image);
  return (
    <figure style={{ margin: 0 }}>
      <div className="flame-frame">
        <img {...a} sizes="(max-width: 860px) 78vw, 440px" alt={alt} width={440} height={587} fetchPriority="high" />
        <svg className="outline" viewBox="0 0 300 400" aria-hidden="true" focusable="false">
          <path d={D} pathLength={1} />
        </svg>
      </div>
      {caption && <figcaption className="flame-caption">{caption}</figcaption>}
    </figure>
  );
}

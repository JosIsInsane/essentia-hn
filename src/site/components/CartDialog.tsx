import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Product, StoreSettings, Variant } from '../../shared/types';
import { lempiras } from '../../shared/money';
import { cart, useCart, MAX_LINE_QTY, type CartLine } from '../cart';
import { imageAttrs } from '../images';
import { ApiError, placeOrder, type OrderResult } from '../api';
import { Check, Close, WhatsApp } from './Icons';
import { Turnstile } from './Turnstile';

export interface Index {
  product: Map<number, Product>;
  variant: Map<number, { product: Product; variant: Variant }>;
}

interface Props { open: boolean; onClose: () => void; index: Index; settings: StoreSettings }
type Step = 'cart' | 'form' | 'done';

const empty = { name: '', phone: '', delivery: 'envio', city: '', address: '', payment: 'transferencia', notes: '', website: '' };

export function CartDialog({ open, onClose, index, settings }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const lines = useCart();
  const [step, setStep] = useState<Step>('cart');
  const [form, setForm] = useState(empty);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [token, setToken] = useState('');
  const onToken = useCallback((t: string) => setToken(t), []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      if (step === 'done') setStep('cart');
    } else if (!open && d.open) d.close();
  }, [open]);

  const rows = lines
    .map((l) => ({ line: l, hit: index.variant.get(l.variantId) }))
    .filter((r): r is { line: CartLine; hit: NonNullable<typeof r.hit> } => !!r.hit);
  const total = rows.reduce((t, r) => t + r.hit.variant.priceCents * r.line.qty, 0);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFields((x) => ({ ...x, [k]: '' }));
  };
  const needsToken = !!settings.turnstileSiteKey;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (needsToken && !token) {
      setError('Espera la verificación anti-robots y vuelve a intentar.');
      return;
    }
    setBusy(true);
    try {
      const res = await placeOrder({
        ...form,
        items: lines.map(({ productId, variantId, scent, qty }) => ({ productId, variantId, scent, qty })),
        ...(needsToken ? { turnstileToken: token } : {}),
      });
      setResult(res);
      setStep('done');
      cart.clear();
      setForm(empty);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFields(err.fields);
      } else setError('Algo falló. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  const fieldProps = (k: keyof typeof empty) => ({
    id: `f-${k}`,
    name: k,
    value: form[k],
    onChange: set(k),
    'aria-invalid': fields[k] ? true : undefined,
    'aria-describedby': fields[k] ? `e-${k}` : undefined,
  });
  const err = (k: string) => (fields[k] ? <span id={`e-${k}`} className="err">{fields[k]}</span> : null);
  const title = step === 'cart' ? 'Tu pedido' : step === 'form' ? 'Tus datos' : 'Pedido listo';

  return (
    <dialog ref={ref} className="cart-dialog" aria-labelledby="cart-title" onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cart-head">
        <h2 id="cart-title">{title}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar"><Close /></button>
      </div>

      {step === 'cart' && (
        <>
          <div className="cart-body">
            {rows.length === 0 ? (
              <div className="empty" style={{ padding: '48px 0' }}>
                <h2>Aún no has elegido nada</h2>
                <p>Abre una vela o aromatizante y agrégalo a tu pedido.</p>
                <button type="button" className="btn btn-line" onClick={onClose}>Ver el catálogo</button>
              </div>
            ) : (
              rows.map(({ line, hit }) => (
                <div className="line" key={`${line.variantId}|${line.scent}`}>
                  <img {...imageAttrs(hit.product.image)} sizes="64px" alt="" width={64} height={80} />
                  <div>
                    <h3>{hit.product.name}</h3>
                    <p>{[hit.variant.label, line.scent].filter(Boolean).join(' · ')}</p>
                    <div className="qty" role="group" aria-label={`Cantidad de ${hit.product.name}`}>
                      <button type="button" aria-label="Quitar uno" onClick={() => cart.setQty(line, line.qty - 1)}>−</button>
                      <output>{line.qty}</output>
                      <button type="button" aria-label="Agregar uno" disabled={line.qty >= MAX_LINE_QTY} onClick={() => cart.setQty(line, line.qty + 1)}>+</button>
                    </div>
                  </div>
                  <div className="line-price">
                    {lempiras(hit.variant.priceCents * line.qty)}
                    <br />
                    <button type="button" className="linkish" onClick={() => cart.remove(line)}>Quitar</button>
                  </div>
                </div>
              ))
            )}
          </div>
          {rows.length > 0 && (
            <div className="cart-foot">
              <div className="total"><span>Total</span><strong>{lempiras(total)}</strong></div>
              {settings.deliveryNote && <p className="fine">{settings.deliveryNote}</p>}
              {settings.ordersOpen ? (
                <button type="button" className="btn btn-wine btn-block" onClick={() => setStep('form')}>Continuar con mis datos</button>
              ) : (
                <a className="btn btn-wine btn-block" href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <WhatsApp /> Pedir por WhatsApp
                </a>
              )}
            </div>
          )}
        </>
      )}

      {step === 'form' && (
        <form className="cart-body form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="f-name">Nombre</label>
            <input {...fieldProps('name')} autoComplete="name" required maxLength={80} />
            {err('name')}
          </div>
          <div className="field">
            <label htmlFor="f-phone">WhatsApp o teléfono</label>
            <input {...fieldProps('phone')} type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} placeholder="9876-5432" />
            {err('phone')}
          </div>
          <fieldset>
            <legend>Entrega</legend>
            <div className="options">
              <label className="option"><input type="radio" name="delivery" value="envio" checked={form.delivery === 'envio'} onChange={set('delivery')} /><span>Envío</span></label>
              <label className="option"><input type="radio" name="delivery" value="retiro" checked={form.delivery === 'retiro'} onChange={set('delivery')} /><span>Paso a retirar</span></label>
            </div>
          </fieldset>
          {form.delivery === 'envio' && (
            <>
              <div className="field">
                <label htmlFor="f-city">Ciudad o colonia</label>
                <input {...fieldProps('city')} autoComplete="address-level2" maxLength={60} />
                {err('city')}
              </div>
              <div className="field">
                <label htmlFor="f-address">Dirección</label>
                <textarea {...fieldProps('address')} autoComplete="street-address" maxLength={240} rows={2} />
                {err('address')}
              </div>
            </>
          )}
          <fieldset>
            <legend>Forma de pago</legend>
            <div className="options">
              <label className="option"><input type="radio" name="payment" value="transferencia" checked={form.payment === 'transferencia'} onChange={set('payment')} /><span>Transferencia</span></label>
              <label className="option"><input type="radio" name="payment" value="efectivo" checked={form.payment === 'efectivo'} onChange={set('payment')} /><span>Efectivo</span></label>
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="f-notes">Notas <span className="hint">(opcional)</span></label>
            <textarea {...fieldProps('notes')} maxLength={500} rows={2} placeholder="Es para regalo, horario de entrega…" />
            {err('notes')}
          </div>
          <div className="hp" aria-hidden="true">
            <label htmlFor="f-website">No llenar</label>
            <input {...fieldProps('website')} tabIndex={-1} autoComplete="off" />
          </div>
          {needsToken && <Turnstile siteKey={settings.turnstileSiteKey} onToken={onToken} />}
          {error && <p className="alert" role="alert">{error}</p>}
          <div className="total"><span>Total</span><strong>{lempiras(total)}</strong></div>
          {settings.deliveryNote && <p className="fine">{settings.deliveryNote}</p>}
          <button type="submit" className="btn btn-wine btn-block" disabled={busy || rows.length === 0}>
            {busy ? 'Enviando pedido…' : 'Hacer pedido'}
          </button>
          <button type="button" className="linkish" onClick={() => setStep('cart')}>Volver al carrito</button>
        </form>
      )}

      {step === 'done' && result && (
        <div className="cart-body">
          <div className="done" role="status">
            <Check />
            <h3>Recibimos tu pedido</h3>
            <p style={{ margin: 0 }}>Tu código es <code>{result.code}</code></p>
            <p className="fine">Toca el botón para mandarnos el pedido por WhatsApp y confirmar el pago y la entrega.</p>
            <a className="btn btn-gold btn-block" href={result.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsApp /> Enviar por WhatsApp
            </a>
            <button type="button" className="linkish" onClick={onClose}>Seguir viendo el catálogo</button>
          </div>
        </div>
      )}
    </dialog>
  );
}

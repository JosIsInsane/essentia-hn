import type { Fn } from '../../../server/env';
import { json } from '../../../server/http';

// Si llega aquí, el middleware ya validó la sesión.
export const onRequestGet: Fn = async () => json({ ok: true });

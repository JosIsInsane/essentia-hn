import type { Fn } from '../../server/env';
import { json } from '../../server/http';

// Cualquier /api/* que no existe: 404 en JSON (no la página).
export const onRequest: Fn = async () => json({ error: 'No encontrado.' }, { status: 404 });

// Uso: npm run hash-password
// Pide la contraseña sin mostrarla y devuelve el hash para ADMIN_PASSWORD_HASH.
import { hashPassword } from '../server/password.ts';
import { createInterface } from 'node:readline';

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const out = rl as unknown as { _writeToOutput: (s: string) => void };
    out._writeToOutput = (s: string) => {
      if (s.includes(question)) process.stdout.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const fromArg = process.env.ADMIN_PASSWORD;
const password = fromArg ?? (await ask('Contraseña nueva del admin (mín. 12 caracteres): '));
if (password.length < 12) {
  console.error('Muy corta. Usa al menos 12 caracteres, mejor una frase.');
  process.exit(1);
}
console.log('\nGuarda esto como secreto ADMIN_PASSWORD_HASH (no en el código):\n');
console.log(await hashPassword(password));

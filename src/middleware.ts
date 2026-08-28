import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Pega o cabeçalho de autorização da requisição
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // Defina aqui o seu usuário e senha de acesso
    if (user === 'julio' && pwd === 'fatura123') {
      return NextResponse.next();
    }
  }

  // Se não tiver senha ou estiver errada, bloqueia e abre o popup do navegador
  return new NextResponse('Autenticação necessária', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Acesso Restrito"',
    },
  });
}

// Configura o middleware para rodar apenas na rota /admin e suas sub-rotas
export const config = {
  matcher: ['/admin/:path*'],
};
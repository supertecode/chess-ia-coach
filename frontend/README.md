# Chess AI Assistant — Frontend

🇧🇷 Frontend em React 19 + TypeScript (Vite) + Tailwind CSS v4.
Para a documentação completa do projeto (backend, Stockfish, variáveis de
ambiente, como rodar tudo), veja o [README principal](../README.md).

🇬🇧 React 19 + TypeScript (Vite) + Tailwind CSS v4 frontend.
For the full project docs (backend, Stockfish, env vars, how to run everything),
see the [main README](../README.md).

## Setup

```bash
npm install      # instala as dependências / install dependencies
npm run dev      # servidor de desenvolvimento (porta 5173) / dev server
npm run build    # build de produção / production build
npm run lint     # ESLint
```

O servidor de dev faz proxy de `/api` para o backend em `http://localhost:8000`
(veja [`vite.config.ts`](vite.config.ts)).
The dev server proxies `/api` to the backend at `http://localhost:8000`
(see [`vite.config.ts`](vite.config.ts)).

> Dependências e toolchain estão documentados em
> [`requirements.txt`](requirements.txt) (referência — a instalação real é via
> `npm install`). / Dependencies and toolchain are documented in
> [`requirements.txt`](requirements.txt) (reference only — actual install is via
> `npm install`).

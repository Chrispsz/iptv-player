# 📺 IPTV Brasil - Player Simplificado

Player IPTV HTML standalone simples e funcional.

## ✨ Características

- 🎨 Interface limpa e moderna
- 📱 100% Responsivo (mobile e desktop)
- 🚀 HLS.js para reprodução em todos os navegadores
- 🌐 Suporte a Web Video Caster
- 💾 Cache local de categorias (1 hora)
- 🇧🇷 Filtro automático de canais brasileiros
- 🔍 Busca de canais em tempo real
- 🎭 Dark mode elegante

## 🚀 Como Usar

### Opção 1: Acessar Diretamente (Mais Simples)

1. Acesse: **https://seu-dominio.vercel.app/iptv.html**
2. Cole suas credenciais no campo
3. Clique em "CONECTAR"
4. Pronto! 🎉

### Opção 2: Arquivo Local

1. Baixe o arquivo: `public/iptv.html`
2. Abra diretamente no navegador
3. Cole suas credenciais
4. Clique em "CONECTAR"

## 📋 Formato de Credenciais Aceito

```
Servidor: tv14s.xyz:8080
Usuário: KD3zn5
Senha: 468612
```

Ou M3U:
```
http://tv14s.xyz:8080/get.php?username=KD3zn5&password=468612&type=m3u_plus
```

## 🎯 Funcionalidades

### Conexão
- Parse automático de credenciais
- Suporte a múltiplos formatos
- Cache de credenciais (localStorage)
- Tentativa automática de portas (80, 8080)

### Categorias
- Carrega categorias do servidor
- Filtra automaticamente categorias brasileiras
- Exclui filmes, séries, rádios e adulto
- Cache de 1 hora

### Canais
- Busca em tempo real
- Lista com destaque do canal ativo
- Loading states elegantes

### Player
- HLS.js integrado via CDN
- Suporta Chrome, Firefox, Safari, Edge
- Autoplay com fallback
- Controles nativos do navegador
- Web Video Caster

## 🔧 Tecnologias

- **HLS.js** (via CDN): Reprodução de streams HLS
- **Vanilla JavaScript**: Sem frameworks pesados
- **LocalStorage**: Cache de categorias
- **CSS Moderno**: Flexbox, Grid, CSS Variables
- **CORS Proxy**: corsproxy.io para bypass

## 🌐 Deploy no Vercel

### Método Rápido (Via Dashboard)

1. Entre em: [vercel.com](https://vercel.com)
2. Importe: `Chrispsz/iptv-player`
3. Configure:
   - Framework Preset: **Other**
   - Root Directory: **public**
   - Build Command: *(deixe vazio)*
   - Output Directory: *(deixe vazio)*
4. Clique em **Deploy**

### Via Git

O repositório já tem o arquivo em `public/iptv.html`.

## 📱 Compatibilidade

✅ Chrome, Firefox, Safari, Edge (desktop)
✅ Chrome Mobile, Safari Mobile, Firefox Mobile
✅ Smart TVs com navegador moderno
✅ Web Video Caster

## 🎨 Design

- Dark mode elegante com gradientes
- Animações suaves
- Micro-interações responsivas
- Touch-friendly (mínimo 44px)
- Feedback visual instantâneo

## ⚙️ Filtros Brasileiros

Automatizando categorias que contenham:
- Brasil, Brazil, Brasileira, Brasileiro
- Globo, Record, SBT, Band, Rede
- Aberta, Aberto
- São Paulo, Rio, Minas, Bahia
- Paraná, Santa Catarina, Gaúcha
- Brasília, DF
- E mais...

## 🚫 Categorias Excluídas

Automaticamente remove:
- Filmes, Movies, Films, VOD
- Séries, Series, 4kseries
- Rádio, Música, Audio
- Adulto, XXX, Porn

## 📊 Cache

- Categories são cacheadas por 1 hora
- Cache armazenado em localStorage
- Atualiza automaticamente após TTL

## 🔒 Segurança

- Validação de URLs
- Prevenção de XSS
- No armazenamento de credenciais sensíveis

## 🎯 Web Video Caster

Integração simplificada:
1. Clique no botão "Web Video Caster"
2. Usa scheme `mobile://`
3. Fallback para `window.open`

## 💡 Dicas

- **Não está funcionando?** Verifique se o servidor está online
- **Sem áudio?** Aumente o volume do navegador
- **Carregando lento?** Verifique sua conexão
- **Sem categorias?** Verifique suas credenciais

## 📄 Arquivos

```
public/
└── iptv.html          # Player HTML standalone
```

---

**Desenvolvido com simplicidade e funcionalidade em mente!** 🚀

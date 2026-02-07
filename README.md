# Player IPTV

Player universal para streaming IPTV em dispositivos móveis, desktop e Smart TVs.

## Como usar

### 1. Acessar o player
Acesse [iplinks.vercel.app](https://iplinks.vercel.app) e insira suas credenciais do servidor Xtream Codes.

### 2. Parear TV (sem digitar na TV)
Para conectar a TV sem digitar credenciais:

1. **Na TV**: Acesse `iplinks.vercel.app/tv.html`
   - A TV mostrará um QR Code com código de sessão
   - A TV aguarda as credenciais via WebSocket

2. **No celular**: Escaneie o QR Code
   - Preencha suas credenciais IPTV
   - Clique em "Enviar para TV"

3. **Pronto!** A TV será conectada automaticamente

## Funcionalidades

- ✅ Pareamento TV-Celular via WebSocket (como Netflix/YouTube)
- ✅ Suporte a múltiplos dispositivos (Android, iOS, Desktop, Smart TV)
- ✅ Web Video Caster para Smart TV/Chromecast
- ✅ VLC (Android/iOS/Desktop)
- ✅ JustPlayer para Android TV
- ✅ Credenciais salvas localmente
- ✅ QR Code para compartilhar lista M3U

## Deploy

Hosted on Vercel

## Mini Serviços

### Serviço de Pareamento (porta 3003)
WebSocket server para comunicação em tempo real entre TV e celular:
- TV solicita sessão → recebe QR Code
- Celular escaneia QR → envia credenciais
- Servidor conecta os dois → TV recebe credenciais

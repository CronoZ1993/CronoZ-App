# 🕐 CronoZ App - Seu App de Vida Completo

![CronoZ Logo](assets/logo.png)

Um aplicativo web PWA completo para gerenciar contatos, chat, calendário, árvore genealógica e álbuns de fotos.

## ✨ Funcionalidades

### 🔐 Autenticação
- Login com Email/Senha
- Login com Google
- Sistema de registro
- Recuperação de senha

### 👥 Contatos
- Adicionar/editar/excluir contatos
- Importar contatos do dispositivo
- Categorizar (família, amigos, trabalho)
- Bloquear/desbloquear contatos
- Compartilhar informações

### 💬 Chat em Tempo Real
- Conversas 1:1
- Grupos de chat
- Mensagens com criptografia
- Emojis e figurinhas
- Anexos de arquivos

### 📅 Calendário Inteligente
- Eventos e aniversários
- Fases da lua
- Feriados automáticos
- Estações do ano
- Exportação para PDF/imagem

### 🌳 Árvore Genealógica
- Adicionar membros da família
- Visualização em diagrama
- Relacionamentos automáticos
- Exportação para PDF

### 📸 Álbuns de Fotos
- Upload de fotos
- Compartilhamento com contatos
- Privacidade configurável
- Download de imagens

### ⚙️ Configurações
- Temas claro/escuro
- Cores personalizáveis
- Sistema de backup
- Monetização (anúncios/premium)
- Multi-idioma

## 🚀 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Firebase v9 (Firestore, Auth, Storage)
- **PWA:** Service Worker, Manifest
- **UI/UX:** CSS Grid, Flexbox, Font Awesome
- **Hosting:** GitHub Pages / Firebase Hosting

## 📋 Pré-requisitos

1. **Conta Firebase** - [firebase.google.com](https://firebase.google.com)
2. **Conta GitHub** - [github.com](https://github.com)
3. **Editor de Código** - VS Code ou similar
4. **Git instalado** - Para versionamento

## 🔧 Configuração do Firebase

### Passo 1: Criar Projeto Firebase
1. Acesse [Console Firebase](https://console.firebase.google.com)
2. Clique em "Adicionar projeto"
3. Nome: `CronoZ-App`
4. Ative Google Analytics (opcional)
5. Criar projeto

### Passo 2: Ativar Serviços
No projeto criado, ative:

#### Authentication
- Métodos de login → Email/Senha ✅
- Métodos de login → Google ✅
- Configurar tela de login OAuth

#### Firestore Database
- Criar database em modo produção
- Localização: `southamerica-east1` (Brasil)
- Regras (temporárias):
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }


**Copie e cole no final do mesmo arquivo `README.md`**

---

## **16. `README.md` - PARTE 3/3 (FINAL)**

```markdown
## 🚀 Deploy no GitHub Pages

### Passo 1: Preparar Repositório
```bash
# Clonar repositório
git clone https://github.com/CronoZ1993/CronoZ-App.git
cd CronoZ-App

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "Initial commit: CronoZ App completo"

# Enviar para GitHub
git push origin main
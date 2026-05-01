# Estrutura de Segurança Firebase - EVn Chat

Este documento explica como funcionam os dois projetos Firebase que compõem o sistema do EVn Chat.

## 1. Projeto Principal (`ev-n-deploy`)
**Arquivo de Regras:** `FIREBASE_RULES_PRIMARY.rules`

Este projeto é o coração do aplicativo. Ele lida com tudo o que acontece em tempo real.
- **Coleção `users`**: Armazena o perfil do usuário, nome público e código único. Apenas o dono pode editar seu perfil.
- **Coleção `privateKeys`**: Armazena a chave privada RSA do usuário (usada para descriptografar mensagens). Apenas o dono tem acesso de leitura.
- **Coleção `chats`**: Contém as mensagens ativas. As regras garantem que apenas os dois participantes do chat possam ler ou escrever mensagens.
- **Coleção `typing`**: Controla o indicador de "digitando..." em tempo real.
- **Coleção `inviteTokens`**: Gerencia os links de convite que expiram em 1 hora.

## 2. Projeto de Backup (`testeeeee-12894`)
**Arquivo de Regras:** `FIREBASE_RULES_BACKUP.rules`

Este projeto funciona como um "cofre" de segurança e histórico. Ele é usado de forma invisível pelo app.
- **Coleção `history`**: Todas as mensagens enviadas no app principal são espelhadas aqui. Isso garante que, mesmo se o chat principal for limpo, as mensagens possam ser recuperadas pelo usuário.
- **Coleção `userBackups`**: Salva uma cópia do perfil do usuário vinculada ao seu `uniqueCode`. Isso facilita a restauração de conta.
- **Coleção `privateKeyBackups`**: Salva uma cópia da chave privada. Sem isso, se o usuário trocar de celular, ele perderia acesso às mensagens antigas (pois não conseguiria descriptografá-las).
- **Autenticação Anônima**: O app loga o usuário anonimamente neste servidor para realizar os backups sem exigir uma segunda senha.

---

### Como aplicar as regras:
1. Copie o conteúdo de `FIREBASE_RULES_PRIMARY.rules` e cole no console do Firebase do projeto principal (na aba Firestore -> Rules).
2. Copie o conteúdo de `FIREBASE_RULES_BACKUP.rules` e cole no console do Firebase do projeto de backup.

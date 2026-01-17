# Objetivo
Desenvolver software web para gerenciamento ponta a ponta de cinemas, incluindo funcionalidades como agendamento de filmes em cartaz, venda de ingressos (bilheteria online) e gerenciamento de salas.

# Tecnologias utilizadas
- **Backend**: Bun.js
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Frontend**: Angular, Material CDK e Tailwind CSS
- **Gateway de Pagamento**: Abacatepay

# Desafios a serem abordados
- Integrar o Bun.js com o Drizzle ORM para manipulação eficiente do banco de dados PostgreSQL bem como estruturação e uso de interfaces reutilizáveis.
- Integrar o gateway de pagamento Abacatepay para processar transações de venda de ingressos.
- Garantir uma ótima experiência de cadastro e gerenciamento de salas, cadeiras e filmes em cartaz.
- Estudar e implementar boas práticas de segurança para proteger dados sensíveis dos usuários e transações financeiras.
- Estudar e implementar estratégias de UX para facilitar a compra de ingressos online utilizando como referência plataformas como Ingresso.com, Cinemark, Ingressoplus, etc.
- Implementar testes automatizados para garantir a estabilidade e confiabilidade do sistema.
- Garantir coesão nos endpoints da API para facilitar a manutenção e escalabilidade do backend.
- Implementar autenticação e autorização para diferentes níveis de acesso (administradores, funcionários, clientes).
- Implementar funcionalidades de relatórios e análises.
- Implementar notificações por e-mail para confirmações de compra e envio de nota fiscal.

# Como rodar o projeto
1. Instale as dependências:

```bash
bun install
```

2. Configure as variáveis de ambiente conforme o arquivo `.env.example`.

3. Inicie o servidor de desenvolvimento:
```bash
bun dev
```

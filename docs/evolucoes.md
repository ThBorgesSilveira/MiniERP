# MiniERP — Evoluções futuras

Este arquivo descreve funcionalidades fora do escopo atual.
Elas não fazem parte dos módulos de `docs/modulos-do-backend.md`.
O andamento de cada uma fica em `docs/atividades.md`.

## Preço sugerido por fórmula configurável

Ideia: o usuário configura a fórmula de sugestão de preço. Na tela de Preços por canal, o sistema mostra um campo com o preço sugerido, calculado pela fórmula vigente.

### Ponto de partida: fórmula de markup

- PV = CMV × MKP
- MKP = 1 / (1 − (CV + DF + Inv + ML))

Legenda: PV é o preço de venda. CMV é o custo da mercadoria vendida (direto). CV são os custos variáveis (%). DF são as despesas fixas (%). Inv são os investimentos planejados (%). ML é a margem de lucro desejada (%).

### Adaptação ao modelo

- CMV: o custo médio dos lotes com saldo, com o frete de compra, pelo cálculo que o modelo já define.
- CV: a comissão do canal (`commission_pct`).
- A tarifa fixa por pedido não é percentual. Ela entra em reais junto com o CMV: PV = (CMV + tarifa) / (1 − (comissão + DF + Inv + ML)).
- DF: a % real do último fechamento do mês (despesas do mês ÷ receita do mês).
- Inv e ML: informados pelo usuário ou guardados na configuração da fórmula.
- O preço mínimo é o mesmo cálculo com DF, Inv e ML iguais a zero.

### Pontos a decidir

- Onde a fórmula fica guardada. A expressão "fórmula vigente" pede uma tabela de configuração com vigência.
- Como o usuário edita a fórmula: campos fixos com percentuais ou expressão livre.
- O modelo não tem regra de preço mínimo. A margem alvo do canal fica fora das tabelas, e esta evolução muda essa regra.

## Recuperação de senha por e-mail

Ideia: o usuário pede a recuperação na tela de login e informa o login. O sistema envia uma senha provisória ao e-mail do cadastro.

### Pontos a decidir

- O campo `email` em `users`: obrigatório ou opcional.
- A troca obrigatória da senha provisória no próximo login (campo `must_change_password`).
- O provedor SMTP e a configuração no `.env`.
- A resposta igual quando o login existe ou não, e o limite de tentativas.

# MiniERP — Modelo de dados

> **Status: proposta, ainda não confirmada.** Pontos em aberto no fim do arquivo.

## Regras do negócio

- O kit é sortido. A composição é livre a cada venda, sem receita fixa.
- O estoque é só dos produtos comprados. A venda baixa os itens do kit. O kit não tem estoque.
- As vendas ocorrem em vários canais, cada um com taxas diferentes.
- Custos indiretos: embalagem e material de montagem, frete de compra, taxas de plataforma e pagamento, despesas fixas mensais.

## Cadastros

- **Produtos:** nome, unidade, ativo e tipo (`mercadoria` ou `material`). O tipo `material` cobre embalagem e montagem. O produto guarda o custo médio atual.
- **Fornecedores** e **clientes.**
- **Canais de venda:** comissão em %, tarifa fixa por pedido e margem alvo em %.

## Compras e estoque

- **Compras:** fornecedor, data e valor do frete.
- **Itens da compra:** produto, quantidade e custo unitário. O frete é rateado entre os itens, proporcional ao valor.
- **Movimentações de estoque:** entrada por compra, saída por venda ou ajuste. O saldo é a soma das movimentações. O custo médio é recalculado a cada entrada.

## Vendas

- **Venda:** cliente, canal, data, status e valor cobrado.
- **Kits da venda:** nome e quantidade. Uma venda pode ter mais de um kit.
- **Itens do kit:** produto, quantidade e custo daquele momento. Gravar o custo preserva o histórico.

## Custos, preço e relatórios

- **Despesas fixas:** descrição, valor mensal e período de vigência.
- **Custo direto:** custo dos itens do tipo `mercadoria`.
- **Custo indireto:** materiais, frete rateado, taxas do canal e despesas fixas rateadas.
- **Preço e relatórios:** são cálculos sobre esses dados, sem tabela própria. A venda guarda o preço cobrado e os custos do momento.

## Pontos em aberto

- [ ] Confirmar a estrutura acima.
- [ ] Decidir o rateio das despesas fixas mensais.
- [ ] Decidir o idioma dos nomes das tabelas e campos.

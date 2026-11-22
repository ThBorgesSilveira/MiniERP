# MiniERP — Modelo de dados

> **Status: estrutura confirmada.** Os pontos em aberto ficam em `docs/atividades.md`, na seção 4.
>
> Os nomes das tabelas e dos campos no banco ficam em inglês. Este documento usa português para facilitar a leitura. O glossário no fim do arquivo traduz os nomes.

## Resumo

O negócio vende kits sortidos em vários canais, cada um com taxas diferentes. O kit é sortido: a composição é livre a cada venda, sem receita fixa. O estoque é por lotes, com consumo do mais antigo. As regras de cada parte estão nos blocos abaixo.

## Cadastros (bloco aprovado)

- **Produtos:** nome, unidade-base, categoria (opcional), ativo, tipo (`mercadoria` ou `material`) e composto (verdadeiro ou falso). O produto composto, como o kit, usa o tipo `mercadoria`. O produto não guarda custo: o custo vem do lote consumido. O custo usado nos filtros de consulta do produto segue o mesmo cálculo do ajuste de entrada. O nome é único entre os produtos ativos e não excluídos, e a reativação confere o nome. Depois do primeiro movimento de estoque, o tipo, o campo composto e a unidade-base não mudam. O produto inativo sai das novas compras e das novas vendas, e os registros antigos o mantêm.
- **Pessoas:** nome, papel de cliente e papel de fornecedor (verdadeiro ou falso). Pelo menos um dos dois papéis é verdadeiro. O nome é único, sem diferenciar maiúsculas de minúsculas, só entre as pessoas com o papel de fornecedor e não excluídas. Os clientes homônimos são permitidos. A venda aceita só uma pessoa com o papel de cliente. A compra aceita só uma pessoa com o papel de fornecedor. A pessoa excluída, ou sem o papel, sai das novas vendas e compras, e os registros antigos a mantêm. Excluir a pessoa ou desmarcar o papel de cliente é recusado se ela tem venda em rascunho.
- **Canais de venda:** comissão em %, tarifa fixa por pedido e base de cálculo da taxa (preço, ou preço mais frete). O nome é único entre os canais não excluídos, sem diferenciar maiúsculas de minúsculas. O canal excluído sai das novas vendas e dos novos preços, e as vendas e os preços antigos o mantêm. O canal com venda em rascunho não pode ser excluído.
- **Unidades do produto:** produto, unidade e fator de conversão para a unidade-base. A unidade-base serve ao estoque, aos lotes e aos movimentos. As outras unidades valem só na compra. A unidade-base não entra nesta tabela: ela tem fator 1 e serve em qualquer compra. Uma unidade desta tabela não pode ser igual à unidade-base, e cada unidade aparece uma vez por produto. A unidade usada em um item de compra não muda de fator e não se exclui.
- **Preços dos produtos:** produto, canal e preço. Cada produto vendido tem um preço em cada canal. A tabela de preços não varia a cada venda: o usuário edita o preço do item no rascunho da venda. Cada produto tem no máximo um preço por canal, entre os preços não excluídos. Só produtos do tipo `mercadoria` têm preço, o que inclui os kits.
- **Dicionário dos campos:** tabela que descreve cada tabela e cada campo, com uma breve explicação. Uma linha sem nome de campo descreve a tabela. O sistema a cria junto com todas as tabelas.
- **Usuários:** nome, login, hash da senha e ativo. O login é único e não diferencia maiúsculas de minúsculas. Sem permissões por enquanto. O primeiro usuário nasce por script, sem usuário de origem.
- **Listas:** tabela genérica de listas, com lista, descrição e ativo. O usuário mantém os valores. Os outros registros apontam para o item pelo `id`, com chave estrangeira. A unidade do produto, o motivo do ajuste e a categoria do produto usam essa tabela. Os valores que o código usa em regras ficam fora dela: tipo do produto, status da venda, tipos de movimento, direção e tipos de origem. As listas são fixas: `unit` (unidades), `adjustment_reason` (motivos do ajuste) e `product_category` (categorias do produto). O usuário mantém só os itens. A descrição é única dentro da lista, sem diferenciar maiúsculas de minúsculas. Item inativo não aparece para novos registros, e os registros antigos o mantêm. Item usado por algum registro não pode ser excluído. Não é possível inativar um item da lista `unit` que seja a unidade-base de um produto ativo. Uma migration cria o motivo "Saldo inicial".

## Compras, lotes e estoque (bloco aprovado)

- **Compras:** fornecedor, data, valor do frete, status (`pedida` ou `recebida`), data de recebimento e, só nas devoluções, a venda de origem. O frete é o valor real cobrado, informado em cada compra. Não há tabela de faixas por fornecedor. A compra pedida não move estoque e é livre para editar e excluir. Na conferência, o usuário adiciona, remove ou troca itens e altera quantidade, custo e frete. Depois ele confirma o recebimento, e o sistema grava os lotes e os movimentos. A data de recebimento é a data de entrada do lote e a data do movimento de estoque. A compra recebida fica fixa. Um erro em compra recebida se corrige com um ajuste de saída e uma compra nova. O fornecedor é obrigatório, exceto na compra de devolução, onde fica vazio.
- **Itens da compra:** produto, unidade, quantidade, custo unitário e frete rateado, proporcional ao valor. O item pode usar qualquer unidade do produto. O sistema converte a quantidade, o custo e o frete para a unidade-base. Dele saem o custo unitário e o frete unitário, guardados em campos separados no lote. O frete rateado é calculado na confirmação do recebimento, sobre os itens finais.
- **Lotes:** uma tabela única para mercadorias, materiais e produtos compostos. Nasce um lote por item da compra, por ajuste de entrada e por montagem de kit. Têm produto, data de entrada, quantidade inicial, custo unitário, frete unitário e saldo atual, tudo em unidade-base. O frete do lote é só frete de compra e compõe o custo. No lote do kit, o custo e o frete são a soma dos componentes. O frete cobrado do cliente nunca entra no lote. O lote zerado fica no histórico. O produto composto não aceita compra nem ajuste: o estoque do kit nasce só na montagem.
- **Movimentos de estoque:** o fato por produto. Tipos: entrada por compra, saída para montagem, entrada de montagem, saída por venda, entrada por ajuste e saída por ajuste. Têm produto, data, direção (`in` ou `out`), quantidade, tipo de origem e id da origem. Os tipos de origem são: item da compra, componente do item da venda, item da venda, material da venda e ajuste. No ajuste, o id da origem fica vazio e o motivo é obrigatório. A quantidade é sempre positiva. A direção combina com o tipo. O banco aceita só os tipos de origem da lista. Um serviço do backend cria os movimentos, dentro de uma transação, e confere se a origem existe antes de gravar. O serviço também recusa o movimento de um produto cuja unidade-base esteja inativa. Um índice no tipo e no id da origem acelera a busca dos movimentos de uma venda ou de uma compra.
- **Movimentos de lote:** registram quanto cada movimento de estoque pôs ou tirou de cada lote. Têm movimento de estoque, lote, direção (`in` ou `out`), quantidade, custo unitário e frete unitário do lote. A quantidade é sempre positiva. Uma entrada gera um movimento de lote. Uma saída gera um movimento de lote para cada lote consumido. O usuário da aplicação (`minierp_app`) não tem `UPDATE` nem `DELETE` em `stock_movements` e `batch_movements`.
- **Consumo:** do lote mais antigo ao mais novo, pela data de entrada. O saldo do produto é a soma dos saldos dos lotes. O saldo nunca fica negativo. Com a mesma data de entrada, o lote de menor `id` sai primeiro.
- **Ajuste de entrada:** não tem compra. O sistema sugere o custo (média ponderada dos lotes com saldo; sem saldo, custo do último lote). O usuário pode alterar o valor. O frete unitário do ajuste é zero. O produto inativo aceita ajuste de entrada e de saída, para o usuário zerar o saldo. O ajuste não se edita nem se exclui: o usuário corrige com outro ajuste.
- **Primeira carga:** os cadastros vêm primeiro. Depois, cada produto entra por ajuste de entrada (motivo "saldo inicial"), com um lote e um custo único informado. Não há histórico de compras.

## Vendas (bloco aprovado)

- **Venda:** cliente (obrigatório), canal, data, status (`rascunho`, `efetivada` ou `devolvida`), frete cobrado do cliente (informado a cada venda) e rateio das despesas (preenchido no fechamento do mês). O valor da venda é a soma dos itens. O frete cobrado do cliente fica fora da receita e do custo e serve só de base para a taxa do canal.
- **Taxas aplicadas:** a venda grava o valor das taxas do canal ao efetivar: comissão e tarifa fixa por pedido, calculadas sobre a base de cálculo do canal. No rascunho, as taxas aparecem como estimativa, sem gravar.
- **Itens da venda:** produto (simples ou composto), quantidade, preço unitário, e custo e frete unitários do momento (médias ponderadas dos lotes consumidos). O preço vem da tabela de preços ao entrar no rascunho. O usuário pode editá-lo, e ele precisa ser maior que zero. A efetivação não copia o preço de novo. O custo e o frete são gravados ao efetivar. Produto sem preço no canal não entra no rascunho. A troca de canal não altera os preços dos itens. A operação "Recalcular preços" copia a tabela do canal para todos os itens e apaga as edições. Se algum produto não tem preço no canal, a operação recusa e não altera nada. Kits com composição diferente viram itens separados.
- **Componentes do item da venda:** só para itens compostos. Têm produto (só mercadorias simples, nunca compostas) e quantidade por unidade de kit. É a composição daquele item naquela venda. Não há tabela de estrutura do produto. Cada tipo de kit (por exemplo, kit de 10 sortidos ou kit de 20 temáticos) é um produto composto próprio. O sistema não confere a quantidade de componentes de um kit. O item composto exige pelo menos um componente.
- **Materiais da venda:** produto do tipo `material`, quantidade, e custo e frete unitários do momento. Valem para a venda toda: uma embalagem pode servir a todos os itens. Na tela, uma marcação "precisa de materiais" abre a lista de produtos do tipo `material`.
- **Efetivar a venda:** só é possível com estoque de cada produto simples, de cada componente e de cada material. O item simples gera uma saída por venda. O item composto gera uma saída para montagem de cada componente, a entrada do kit em um lote novo (custo e frete somados dos componentes) e a saída do kit para o cliente. O estoque do kit termina em zero. Cada material gera uma saída por venda. A efetivação é tudo ou nada: se faltar estoque, a venda continua em rascunho, e a resposta lista cada produto, a quantidade necessária e o saldo. A necessidade por produto soma os itens simples, os componentes (quantidade do componente vezes a quantidade de kits) e os materiais. A data da venda não pode ser futura e é a data de todos os movimentos da venda. O sistema arredonda as taxas a duas casas decimais. A venda também pode ser criada e efetivada de uma vez, sem gravar o rascunho. Se a operação falhar, o sistema não grava nada.
- **Edição:** a venda é livre para editar no status `rascunho`, e o rascunho não move estoque. No rascunho, o custo e o frete unitários dos itens e dos materiais aparecem como estimativa, calculada a cada consulta e sem gravar. A estimativa usa o cálculo do custo do produto, aplicado ao custo e ao frete. No kit, ela soma os componentes. Ao efetivar, a venda fica fixa. Para corrigir uma venda efetivada, o caminho é a devolução total e uma venda nova.
- **Devolução:** não há cancelamento. A devolução é sempre total e entra como compra normal, ligada à venda de origem. A venda passa ao status `devolvida`. Uma venda tem no máximo uma devolução. Uma devolução parcial vira uma devolução total e uma venda nova. Voltam ao estoque os itens simples, com o custo e o frete unitários da venda, e os componentes dos kits. O custo e o frete de cada componente são a média dos lotes de onde ele saiu para a montagem. O kit em si não volta, porque o produto composto não aceita compra. Os materiais não voltam ao estoque. A compra de devolução nasce recebida e sem fornecedor. A data dela é a da devolução, que não é anterior à data da venda nem futura. O frete da compra é a soma dos fretes dos itens, sem frete real. A devolução aceita produto inativo, mas a regra da unidade-base inativa continua valendo. Um item devolvido com defeito entra no estoque, e o usuário o baixa depois com um ajuste de saída.

## Custos, preço e relatórios (bloco aprovado)

- **Despesas:** descrição, valor mensal e período de vigência. A tabela cobre as despesas recorrentes e as pontuais. Uma despesa pontual tem vigência de início e fim no mesmo mês. A mensalidade de um canal é uma despesa recorrente comum e entra no rateio de todas as vendas. O rateio é por faturamento e acontece só no fechamento do mês. O usuário executa o fechamento uma vez por mês. O sistema calcula a % real (despesas do mês ÷ receita do mês) e grava o rateio em cada venda do mês. A receita é a soma dos itens, sem frete, e exclui as vendas devolvidas. O rateio serve para estudar o reajuste da tabela de preços. A despesa sem data final vale por prazo indeterminado. Ela vale em um mês quando a vigência toca o mês, e entra com o valor mensal inteiro. O fechamento só vale para mês encerrado e com receita maior que zero. O rateio de cada venda é um valor em reais: a receita da venda vezes a % real. A soma dos rateios é igual às despesas do mês, e a última venda do mês absorve o arredondamento. O fechamento de um mês sem despesas grava rateio zero. O fechamento pode ser refeito: o novo cálculo substitui o rateio do mês, e o log de auditoria guarda o anterior. Não existe tabela de fechamento: a consulta deriva das vendas. Editar ou excluir uma despesa não altera fechamentos já feitos. Um mês está pendente quando é anterior ao mês atual e tem pelo menos uma venda efetivada sem rateio. O sistema avisa sobre os meses pendentes, e o aviso some quando o usuário fecha cada mês.
- **Custo direto:** custo unitário dos itens vendidos, vindo dos lotes consumidos.
- **Custo indireto:** material da venda, frete de compra (campo separado no lote), taxas do canal e despesas rateadas.
- **DRE e relatórios:** cálculos sem tabela própria. O DRE tem as linhas: receita, custo direto, margem bruta, custos indiretos e resultado. Os custos indiretos são os materiais da venda, o frete de compra, as taxas do canal e as despesas rateadas. O DRE considera só vendas efetivadas. As vendas devolvidas ficam fora da receita e do custo dos itens, que voltam ao estoque. O custo e o frete dos materiais delas entram como a linha "Perda de materiais em devoluções", nos custos indiretos. A linha de despesas rateadas usa o rateio gravado nas vendas. O DRE sinaliza os meses pendentes de fechamento, onde essa linha fica incompleta. A venda guarda o preço cobrado, o custo e o frete dos itens e dos materiais, e as taxas aplicadas.

## Auditoria (bloco aprovado)

- **Campos de auditoria:** `created_at`, `updated_at` e `deleted_at`, mais `created_by`, `updated_by` e `deleted_by`, ligados aos usuários. Cada tabela segue um de quatro perfis. Um trigger preenche `created_at`, `updated_at`, `created_by`, `updated_by` e `deleted_by` a partir de `app.user_id`. O backend não preenche esses campos e só marca `deleted_at`. Sem usuário na sessão, os campos `_by` ficam vazios. No `INSERT`, `updated_at` e `updated_by` recebem os valores de `created_at` e `created_by`. O `UPDATE` não altera `created_at` nem `created_by`. Quando `deleted_at` volta a vazio, `deleted_by` também volta a vazio.
- **Perfil completo** (os seis campos): produtos, pessoas, canais de venda, unidades do produto, preços dos produtos, despesas, listas, usuários, compras e vendas.
- **Perfil sem exclusão** (só criação e alteração): itens da compra, itens da venda, componentes do item da venda, materiais da venda e lotes. Os itens mudam só junto do pai. Um item removido de um rascunho é apagado de fato, e o log guarda o registro. O lote nunca se apaga, e `updated_at` registra a mudança do saldo.
- **Perfil só criação** (`created_at` e `created_by`): movimentos de estoque e movimentos de lote. Eles são um livro de registro e nunca mudam.
- **Perfil do sistema** (`created_at` e `updated_at`, sem usuário): dicionário dos campos, mantido pelas migrations.
- **Exclusão:** produto, compra ou venda com movimento de estoque não pode ser excluído. A exclusão marca `deleted_at`. No produto, `is_active` e `deleted_at` convivem. A venda efetivada se corrige pela devolução.
- **Log:** a tabela `audit_logs` guarda a versão anterior do registro. Os campos são: tabela, id do registro, ação (`update` ou `delete`), data, usuário e o registro inteiro em `jsonb`. O usuário e a data são os da mudança que substituiu aquela versão. Não há log de `insert`, porque a criação consta em `created_at` e `created_by`. Uma função no banco (trigger) grava o log na mesma transação da mudança. O usuário vem de `app.user_id`, que o backend define com `SET LOCAL` em cada transação. A ação é `delete` no `DELETE` de verdade e quando `deleted_at` passa de vazio a preenchido. Nos demais casos, a ação é `update`. Na tabela `users`, o log omite o `password_hash` e acrescenta `password_changed` em `data` quando a senha muda. Os movimentos, o próprio log, o dicionário dos campos e os lotes ficam fora. O dicionário só muda por migration. Os movimentos de lote já registram cada mudança de saldo dos lotes. O usuário da aplicação (`minierp_app`) não tem `UPDATE` nem `DELETE` em `audit_logs`.

## Glossário (aprovado)

Convenções: `snake_case`, tabelas no plural, chaves estrangeiras com `_id` e campos verdadeiro ou falso com `is_`. Toda chave primária se chama `id` e é um inteiro de geração automática.

| Português | Tabela |
|---|---|
| Produtos | `products` |
| Pessoas | `people` |
| Canais de venda | `sales_channels` |
| Unidades do produto | `product_units` |
| Preços dos produtos | `product_prices` |
| Usuários | `users` |
| Dicionário dos campos | `field_dictionary` |
| Listas | `list_items` |
| Compras | `purchases` |
| Itens da compra | `purchase_items` |
| Lotes | `batches` |
| Movimentos de estoque | `stock_movements` |
| Movimentos de lote | `batch_movements` |
| Vendas | `sales` |
| Itens da venda | `sale_items` |
| Componentes do item da venda | `sale_item_components` |
| Materiais da venda | `sale_materials` |
| Despesas | `expenses` |
| Log de auditoria | `audit_logs` |

Campos de cada tabela, sem o `id` e sem os de auditoria:

- `products`: nome `name`, unidade-base `base_unit_id`, categoria `category_id`, ativo `is_active`, tipo `type` (`merchandise` ou `material`), composto `is_composite`.
- `people`: nome `name`, papel de cliente `is_customer`, papel de fornecedor `is_supplier`.
- `sales_channels`: nome `name`, comissão em % `commission_pct`, tarifa fixa por pedido `order_fee`, base de cálculo da taxa `fee_base` (`price` ou `price_plus_freight`).
- `product_units`: produto `product_id`, unidade `unit_id`, fator de conversão `conversion_factor`.
- `product_prices`: produto `product_id`, canal `sales_channel_id`, preço `price`.
- `users`: nome `name`, login `login`, hash da senha `password_hash`, ativo `is_active`.
- `field_dictionary`: tabela `table_name`, campo `field_name` (vazio na linha que descreve a tabela), descrição `description`.
- `list_items`: lista `list_code`, descrição `description`, ativo `is_active`.
- `purchases`: fornecedor (pessoa) `supplier_id`, data `purchase_date`, valor do frete `freight_amount`, status `status` (`ordered`, `received`), data de recebimento `received_date`, venda de origem da devolução `returned_sale_id`.
- `purchase_items`: compra `purchase_id`, produto `product_id`, unidade `unit_id`, quantidade `quantity`, custo unitário `unit_cost`, frete rateado `allocated_freight`.
- `batches`: produto `product_id`, data de entrada `entry_date`, quantidade inicial `initial_quantity`, custo unitário `unit_cost`, frete unitário `unit_freight`, saldo atual `balance`.
- `stock_movements`: produto `product_id`, data `movement_date`, direção `direction` (`in` ou `out`), quantidade `quantity`, tipo `type` (`purchase_in`, `assembly_out`, `assembly_in`, `sale_out`, `adjustment_in`, `adjustment_out`), tipo de origem `origin_type` (`purchase_item`, `sale_item_component`, `sale_item`, `sale_material`, `adjustment`), id da origem `origin_id`, motivo do ajuste `reason_id`.
- `batch_movements`: movimento de estoque `stock_movement_id`, lote `batch_id`, direção `direction`, quantidade `quantity`, custo unitário `unit_cost`, frete unitário `unit_freight`.
- `sales`: cliente (pessoa) `customer_id`, canal `sales_channel_id`, data `sale_date`, status `status` (`draft`, `completed`, `returned`), frete cobrado do cliente `customer_freight`, rateio das despesas `expense_share`, valor da comissão `commission_amount`, valor da tarifa fixa `order_fee_amount`.
- `sale_items`: venda `sale_id`, produto `product_id`, quantidade `quantity`, preço unitário `unit_price`, custo unitário `unit_cost`, frete unitário `unit_freight`.
- `sale_item_components`: item da venda `sale_item_id`, produto `product_id`, quantidade por unidade de kit `quantity`.
- `sale_materials`: venda `sale_id`, produto `product_id`, quantidade `quantity`, custo unitário `unit_cost`, frete unitário `unit_freight`.
- `expenses`: descrição `description`, valor mensal `monthly_amount`, início da vigência `valid_from`, fim da vigência `valid_to`.
- `audit_logs`: tabela `table_name`, id do registro `record_id`, ação `action` (`update` ou `delete`), data `changed_at`, usuário `changed_by`, versão anterior `data` (`jsonb`).

Campos de auditoria, por perfil:

- Perfil completo: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`.
- Perfil sem exclusão: `created_at`, `created_by`, `updated_at`, `updated_by`.
- Perfil só criação: `created_at`, `created_by`.
- Perfil do sistema: `created_at`, `updated_at`.

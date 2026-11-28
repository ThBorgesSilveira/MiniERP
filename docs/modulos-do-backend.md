# MiniERP — Módulos do backend

Este arquivo define as operações e as validações de cada módulo, na ordem da trilha (`docs/atividades.md`, seção 5).
As regras de dados ficam em `docs/modelo-de-dados.md`. Este arquivo não as repete.

## Usuários

Tabela: `users`.

### Operações

- Entrar: recebe login e senha e devolve um token JWT com validade. Não há refresh token.
- Criar.
- Listar.
- Buscar um.
- Editar o nome e o login.
- Trocar a senha.
- Ativar ou desativar.
- Excluir.

O primeiro usuário nasce por script, não por uma operação do módulo.

### Validações

- A senha tem no mínimo 8 caracteres e fica gravada como hash (bcrypt).
- Nenhuma resposta devolve o `password_hash`.
- Usuário inativo ou excluído não entra.
- Ninguém desativa nem exclui a si mesmo, nem o último usuário ativo.
- A troca de senha exige a senha atual.

## Auditoria

Tabela: `audit_logs`. Triggers no banco gravam o log e preenchem os campos de auditoria (regras no modelo).

### Operações

- Listar o log, com filtros por tabela, registro, usuário, ação e período.
- Buscar uma entrada.
- Listar as tabelas que têm entradas no log.
- Listar os registros alterados de uma tabela.
- Consultar o histórico de um registro, por tabela e id.
- Consultar o dicionário dos campos: devolve a descrição de cada campo, por tabela.

O log é só de leitura. A API não cria, edita nem exclui entradas.

O módulo tem também um serviço interno. Ele roda cada escrita do backend em uma transação e define `app.user_id` com `SET LOCAL`. Uma escrita sem usuário, como o script do primeiro usuário, deixa o valor vazio.

### Validações

- O filtro de tabela aceita só as tabelas que o log cobre.

## Listas

Tabela: `list_items`.

### Operações

- Listar as listas existentes.
- Listar os itens de uma lista, com filtro por ativos.
- Buscar um item.
- Criar um item.
- Editar a descrição.
- Ativar ou desativar.
- Excluir.

O módulo tem também um serviço interno. Ele confere se um item pertence à lista esperada e se está ativo. Produtos, Compras e Estoque usam esse serviço.
O serviço confere o status só onde o usuário escolhe o item.

### Validações

- O `list_code` aceita só as listas fixas do modelo.
- A descrição é obrigatória.
- A inativação e a exclusão seguem as regras do modelo.

## Canais de venda

Tabela: `sales_channels`.

### Operações

- Listar.
- Buscar um.
- Criar.
- Editar nome, comissão, tarifa fixa e base de cálculo.
- Excluir.

### Validações

- O nome é obrigatório.
- A comissão fica entre 0 e 100.
- A tarifa fixa é maior ou igual a zero.
- A base de cálculo aceita só `price` ou `price_plus_freight`.
- A unicidade do nome e a exclusão seguem as regras do modelo.

## Pessoas

Tabela: `people`. O módulo substitui os antigos Clientes e Fornecedores.

### Operações

- Listar, com busca por nome e filtro por papel (cliente ou fornecedor).
- Buscar uma.
- Criar.
- Editar o nome e os papéis.
- Excluir.

### Validações

- O nome é obrigatório.
- Pelo menos um papel é verdadeiro.
- A unicidade do nome, a exclusão e a troca de papel seguem as regras do modelo.

## Produtos

Tabelas: `products` e `product_units`.

### Operações do produto

- Listar, com busca por nome e filtros de tipo, composto, ativo, unidade-base, categoria e custo ("de" e "até").
- Buscar um, com as unidades do produto.
- Criar.
- Criar com preço e saldo inicial. A operação recebe os dados do produto, o preço em um canal e o saldo inicial (quantidade e custo). O preço e o saldo são opcionais. A operação cria o produto, o preço e o ajuste de entrada com o motivo "Saldo inicial" em uma transação. Se falhar, o sistema não grava nada.
- Editar.
- Ativar ou desativar.
- Excluir.

### Operações das unidades do produto

- Listar as unidades de um produto.
- Adicionar.
- Editar o fator.
- Excluir.

### Validações

- O nome é obrigatório.
- O tipo aceita só `merchandise` ou `material`.
- O produto composto exige o tipo `merchandise`.
- A unidade-base e as unidades do produto vêm da lista `unit` e precisam estar ativas.
- A categoria, quando informada, vem da lista `product_category` e precisa estar ativa.
- O fator de conversão é maior que zero.
- Na criação com preço e saldo inicial, o preço segue as validações do módulo Preços e o saldo segue as validações do módulo Estoque.
- O filtro de custo segue o cálculo do modelo. Um produto sem lote não aparece quando o filtro de custo está ligado.
- A unicidade do nome, a reativação, a troca de campos, a exclusão e o uso da unidade em compra seguem as regras do modelo.

## Preços

Tabela: `product_prices`.

### Operações

- Listar, com filtro por produto e por canal.
- Buscar um.
- Criar.
- Editar o preço.
- Excluir.

### Validações

- O preço é maior que zero.
- O produto existe, está ativo e não foi excluído.
- O canal existe e não foi excluído.
- A unicidade por produto e canal e o tipo do produto seguem as regras do modelo.

## Estoque

Tabelas: `batches`, `stock_movements` e `batch_movements`.

### Operações pela API

- Consultar o saldo dos produtos (soma dos lotes), com filtro por produto, tipo e categoria.
- Listar lotes e buscar um lote.
- Listar movimentos de estoque, com filtro por produto, período, tipo e direção.
- Consultar os movimentos de um lote.
- Sugerir o custo do ajuste de entrada.
- Criar ajuste de entrada.
- Criar ajuste de saída.

### Operações internas

Compras e Vendas usam estas operações.

- Registrar entrada: cria o lote, o movimento de estoque e o movimento de lote.
- Registrar saída: consome os lotes do mais antigo ao mais novo e grava os movimentos.
- Calcular o custo e o frete unitários do produto. O módulo Produtos, o ajuste de entrada e a estimativa do rascunho de venda usam o mesmo cálculo.

Os lotes e os movimentos não têm criação direta pela API. Só os serviços do módulo os criam.

### Validações

- A quantidade é maior que zero.
- A saída recusa quando o saldo não basta.
- A saída trava os lotes do produto durante a transação. Assim, duas vendas simultâneas não consomem o mesmo saldo.
- O motivo do ajuste vem da lista `adjustment_reason` e precisa estar ativo.
- O custo do ajuste de entrada é maior ou igual a zero.
- As regras do produto composto, do produto inativo, da correção de ajuste e do desempate de lotes seguem o modelo.

## Compras

Tabelas: `purchases` e `purchase_items`.

### Operações

- Listar, com filtro por fornecedor, período, produto, status e devolução.
- Buscar uma, com os itens.
- Criar. A compra nasce pedida.
- Editar a compra pedida: cabeçalho e itens.
- Excluir a compra pedida.
- Confirmar o recebimento, com a data de recebimento. Para cada item, o módulo Estoque registra a entrada: o lote, o movimento de estoque e o movimento de lote.

A compra de devolução nasce no módulo Vendas, pelo serviço interno de Compras. A API de Compras não cria devolução.

### Validações

- A compra tem pelo menos um item.
- O fornecedor é uma pessoa com o papel de fornecedor, exceto na compra de devolução.
- O produto existe, está ativo e não é composto.
- A unidade do item é a unidade-base ou uma unidade do produto, e está ativa.
- A quantidade é maior que zero.
- O custo unitário e o frete são maiores ou iguais a zero.
- A soma dos fretes rateados é igual ao frete da compra. O último item absorve a diferença do arredondamento.
- A edição e a exclusão recusam a compra recebida.
- A confirmação recusa a compra já recebida e confere de novo todas as validações dos itens.
- As regras do status, do fornecedor e da correção de erro seguem o modelo.

## Vendas

Tabelas: `sales`, `sale_items`, `sale_item_components` e `sale_materials`.
O módulo tem três partes: o rascunho, a efetivação e a devolução. Este arquivo registra uma parte por vez.

### Rascunho: operações

- Listar vendas, com filtro por cliente, canal, período e status.
- Buscar uma, com itens, componentes, materiais e totais. No rascunho, a resposta traz o custo, o frete e as taxas como estimativa.
- Criar o rascunho. A operação recebe o cabeçalho, os itens, os componentes e os materiais, e grava tudo em uma transação. O cliente é opcional.
- Salvar o rascunho. A operação substitui o cabeçalho, os itens, os componentes e os materiais do rascunho, em uma transação.
- Excluir o rascunho.
- Recalcular preços.

### Rascunho: validações

- O canal existe e não foi excluído.
- O cliente, quando informado, é uma pessoa com o papel de cliente e não foi excluída.
- O frete cobrado do cliente é maior ou igual a zero.
- A quantidade é maior que zero.
- O preço do item é maior que zero.
- O item é um produto `merchandise` ativo e tem preço no canal.
- O material vem de um produto do tipo `material`.
- O item composto tem pelo menos um componente, e cada componente é uma mercadoria simples.
- O salvamento e a exclusão recusam a venda que não está em rascunho.
- O status só muda pelas operações de efetivar e devolver. O rateio das despesas só muda no fechamento do mês.
- As regras do preço, da troca de canal e da estimativa seguem o modelo.

### Efetivação: operações

- Conferir o estoque do rascunho. A operação só consulta e mostra, por produto, a quantidade necessária e o saldo.
- Efetivar a venda.
- Criar e efetivar a venda. A operação recebe os mesmos dados da criação do rascunho e usa uma única transação.

A efetivação grava os movimentos, os custos reais, as taxas e o status, como o modelo define. Os serviços do módulo Estoque fazem os movimentos e o consumo dos lotes.

### Efetivação: validações

- A venda está em rascunho e tem pelo menos um item.
- O cliente está informado.
- Todo item tem preço, e todo item composto tem componente.
- O estoque de cada produto cobre a necessidade total da venda.
- A unidade-base de cada produto está ativa.
- A data da venda não é futura.
- A operação "Criar e efetivar" aplica também as validações do rascunho.
- As regras do tudo ou nada, da necessidade por produto e do arredondamento seguem o modelo.

### Devolução: operações

- Devolver a venda. A operação recebe a data da devolução. Ela cria a compra de devolução pelo serviço interno de Compras, que registra as entradas pelo módulo Estoque, e muda o status da venda para `devolvida`. Tudo ocorre em uma transação.

A busca de uma venda mostra a devolução ligada a ela.

### Devolução: validações

- A venda está efetivada e não tem devolução.
- A data da devolução não é anterior à data da venda e não é futura.
- As entradas passam pelas validações do módulo Estoque, como a unidade-base ativa.
- As regras do que volta ao estoque, do custo e do frete seguem o modelo.

## Despesas

Tabela: `expenses`. O fechamento do mês grava o rateio em `sales`.

### Operações das despesas

- Listar, com filtro por mês de vigência e por descrição.
- Buscar uma.
- Criar.
- Editar.
- Excluir.

### Operações do fechamento

- Executar o fechamento de um mês. A mesma operação refaz um fechamento já feito.
- Consultar o fechamento de um mês: despesas, receita, % real e as vendas com o rateio.
- Listar os meses pendentes de fechamento. A lista alimenta o aviso no topo da tela, com o botão "Fechar o mês".

### Validações

- A descrição é obrigatória.
- O valor mensal é maior que zero.
- A data inicial é obrigatória, e a data final, quando informada, não é anterior à inicial.
- O mês do fechamento é anterior ao mês atual e tem receita maior que zero.
- As regras da vigência, do rateio, do refazer e da pendência seguem o modelo.

## Relatórios

O módulo só lê dados e não tem tabela própria.

### Operações

- Consultar o DRE, com filtro por período e por canal, e agrupamento por mês ou por canal.
- Listar as vendas do período, com receita, custos e resultado. Essa lista é o detalhe do DRE.

Os custos direto e indireto não têm relatório separado: o DRE os mostra.

### Validações

- O período é obrigatório, e a data final não é anterior à inicial.
- O canal do filtro existe, mesmo que esteja excluído.
- As linhas do DRE e as regras das vendas devolvidas e dos meses pendentes seguem o modelo.

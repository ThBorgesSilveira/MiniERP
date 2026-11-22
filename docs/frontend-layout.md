# MiniERP — Layout e navegação do frontend

Este arquivo define o layout e a navegação do frontend.
As telas de cada módulo ficam na seção 6 da trilha (`docs/atividades.md`).
O protótipo clicável está em `docs/prototipos/layout-navegacao.html`.

## Tecnologia

- Biblioteca de componentes: MUI (Material UI), com os temas da seção "Tema e modo".
- Roteamento: React Router.
- Os textos das telas ficam em português. Os nomes de pastas, arquivos e rotas ficam em inglês.

## Layout

- O nome do sistema na interface é MAESTRO. Ele aparece na marca da barra lateral, na tela de login e no título da página.
- Barra lateral fixa à esquerda, com o menu.
- Barra superior com o caminho da tela (grupo e tela), o nome do usuário e o botão "Sair".
- Faixa de aviso abaixo da barra superior. Ela lista os meses pendentes de fechamento e tem o botão "Fechar o mês", que abre o Fechamento do mês. A faixa some quando não há mês pendente.
- Área de conteúdo à direita, com rolagem própria.
- Em telas estreitas, a barra lateral vira uma gaveta, aberta pelo botão de menu.
- A tela de login ocupa a janela inteira, sem menu.

## Tema e modo

- Nenhuma tela usa cor fixa. Toda cor vem do tema (no MUI, `createTheme`).
- Temas: Padrão (azul, sem textura) e Fofo (rosa suave, cantos arredondados, fonte Nunito e textura de corações na barra superior).
- O tema vale para toda a instalação e vem do backend, inclusive na tela de login.
- Cada tema tem modo claro e modo escuro. O modo é de cada usuário e fica no navegador. O botão da barra superior alterna o modo. No primeiro acesso, o modo segue a preferência do sistema operacional.
- Os pares de texto e fundo seguem o contraste mínimo de 4,5:1 em todos os temas e modos.
- A tela Aparência, no grupo Sistema, escolhe o tema. Cada tema aparece em um cartão com uma prévia. Um clique no cartão aplica e salva o tema.

## Menu

Vendas e Compras ficam no topo, sem grupo. Os outros itens ficam em quatro grupos recolhíveis.

| Grupo | Tela | Rota | Módulo do backend |
|---|---|---|---|
| Topo | Vendas | `/sales` | Vendas |
| Topo | Compras | `/purchases` | Compras |
| Estoque | Saldo | `/stock/balance` | Estoque |
| Estoque | Lotes | `/stock/batches` | Estoque |
| Estoque | Movimentos | `/stock/movements` | Estoque |
| Estoque | Ajustes | `/stock/adjustments` | Estoque |
| Cadastros | Produtos | `/products` | Produtos |
| Cadastros | Preços | `/prices` | Preços |
| Cadastros | Pessoas | `/people` | Pessoas |
| Cadastros | Canais de venda | `/sales-channels` | Canais de venda |
| Cadastros | Listas | `/lists` | Listas |
| Financeiro | Despesas | `/expenses` | Despesas |
| Financeiro | Fechamento do mês | `/closing` | Despesas |
| Financeiro | Relatórios (DRE) | `/reports/dre` | Relatórios |
| Sistema | Usuários | `/users` | Usuários |
| Sistema | Auditoria | `/audit` | Auditoria |
| Sistema | Aparência | `/appearance` | A definir |

## Padrão das telas

- Tela de lista: título, busca, filtros do módulo, botão de criar e tabela com paginação. A linha abre o detalhe.
- Tela de detalhe: dados do registro, status em chip e as ações do status.
- Chips de status: verde para concluído (efetivada, recebida, ativo, fechado), cinza para rascunho e inativo, âmbar para devolvida e pendente, azul para pedida.
- Confirmações de ações em Snackbar. Confirmações de exclusão em diálogo.
- As listas de escolha usam um componente próprio, no lugar do seletor nativo do navegador. Ele mostra a opção atual com um visto, abre abaixo do campo (ou acima, quando falta espaço) e funciona pelo teclado: setas, Enter, Esc e a primeira letra da opção.
- Campos de valor em reais usam máscara pelos centavos: digitar 1234 mostra 12,34, e o ponto de milhar aparece sozinho. O campo seleciona o conteúdo ao receber o foco e alinha o valor à direita. O frete vazio volta a 0,00 ao sair do campo.

## Módulo Vendas

### Rotas

- `/sales`: lista de vendas.
- `/sales/new`: passo do canal. O vendedor escolhe só o canal e a tela do rascunho abre em seguida.
- `/sales/:id`: tela do rascunho, quando a venda está em rascunho. Detalhe somente leitura, quando a venda está efetivada ou devolvida.

### Lista de vendas

- Busca por cliente. Filtros de status, canal e período.
- Colunas: número, data, cliente, canal, itens, valor e status.
- A linha abre a venda. O botão "Nova venda" abre o passo do canal.

### Tela do rascunho

- Duas colunas. A coluna esquerda tem a lista de produtos. A coluna direita tem o pedido.
- Lista de produtos: busca por qualquer parte do nome, sem diferenciar acentos nem maiúsculas. Filtros de categoria e de faixa de preço. Cada linha mostra nome, categoria, preço no canal e saldo de estoque. O produto sem preço no canal aparece desabilitado. O botão "Novo produto" fica ao lado da busca.
- Teclado: Enter adiciona o item destacado. Com a busca sem resultado, Enter abre o cadastro de produto com o texto digitado. As setas sobem e descem na lista. O mesmo produto simples adicionado de novo aumenta a quantidade.
- Pedido: canal e botão "Recalcular preços" no topo. Cada item tem quantidade, preço editável, subtotal e botão remover. Os materiais ficam em uma seção recolhível, fechada ao abrir a tela. O cabeçalho é um botão com borda, contador de materiais, ação ("Adicionar", "Editar" ou "Recolher") e seta que gira. Fechada, a seção mostra abaixo do título os materiais do pedido com a quantidade. Aberta, ela tem uma busca por qualquer parte do nome e uma lista com rolagem, com uma caixa de marcação por material. A linha inteira é a área de clique, e a linha marcada ganha fundo colorido. Marcar inclui o material com quantidade 1 e mostra os botões de quantidade. Desmarcar remove o material.
- Totais: valor da venda, custo estimado, taxas estimadas e resultado parcial.
- Rodapé do pedido: cliente, frete cobrado do cliente e data. O cliente é obrigatório só para efetivar. O campo Cliente é digitável: a lista filtra por qualquer parte do nome, sem diferenciar acentos nem maiúsculas. Enter escolhe o cliente destacado. Sem resultado, Enter abre o cadastro com o texto digitado. O botão "Novo cliente" fica ao lado do campo.
- A troca de canal não altera os preços dos itens. O botão "Recalcular preços" copia a tabela do canal e recusa a operação se algum item não tem preço nele.
- Uma etiqueta ao lado do título mostra o estado: "Ainda não salvo", "Alterações não salvas" ou "Salvo".

### Botões do rascunho

- Venda nova: "Criar" salva o rascunho. "Criar e efetivar" salva e efetiva em um passo.
- Rascunho salvo: "Salvar" grava as alterações. "Efetivar" salva as alterações pendentes e efetiva em um passo.
- "Excluir rascunho" fica no topo da tela e abre um diálogo de confirmação.
- O botão "Voltar para as vendas" fica à esquerda do título. Com alterações não salvas, qualquer saída da tela (o botão, o menu lateral ou o botão voltar do navegador) abre o diálogo "Sair sem salvar?", com as opções "Continuar editando", "Sair sem salvar" e "Salvar e sair". A venda nova ainda vazia sai sem diálogo.

### Kit

- Ao escolher um produto composto, abre o diálogo "Montar o kit". A busca e os filtros da lista servem aos componentes: um clique adiciona o componente.
- Cada componente tem quantidade, "Trocar" e remover. "Trocar" liga o modo de troca: o próximo item clicado na lista entra no mesmo lugar, com a mesma quantidade.
- O valor do kit é o preço do kit na tabela do canal. O preço dos componentes é só referência.
- O diálogo mostra três valores, atualizados a cada alteração: a soma dos preços avulsos dos componentes (referência), o custo dos componentes e o preço de venda do kit no canal.
- Quando a soma dos preços avulsos ultrapassa o preço do kit, o diálogo mostra um alerta com o valor excedido e destaca a soma em vermelho. O alerta não bloqueia o botão "Concluir kit".
- O botão "Editar kit" reabre o diálogo com os componentes do item.
- Cada kit com composição diferente é uma linha do pedido.

### Cadastro rápido

Os botões "Novo cliente" e "Novo produto" abrem um popup sobre a tela do rascunho. O pedido não perde nenhum dado. Os campos seguem os formulários dos módulos Pessoas e Produtos.

- Novo cliente: nome (obrigatório) e papéis (Cliente já marcado, Fornecedor opcional). Ao salvar, o cliente fica selecionado no pedido. O fornecedor com nome repetido é recusado.
- Novo produto: nome, tipo, composto (só para mercadoria), categoria opcional e unidade-base. O preço de venda vale para o canal do pedido. O saldo inicial pede quantidade e custo unitário, e o sistema o grava como ajuste de entrada com o motivo "Saldo inicial".
- Material não tem preço. Produto composto não tem saldo inicial.
- Ao salvar o produto simples, ele entra no pedido. O material entra na lista de materiais. O produto composto abre o diálogo "Montar o kit".
- Na lista de produtos sem resultado, o botão "Cadastrar produto" traz o texto da busca no nome.
- O produto novo não tem preço nos outros canais. O usuário cadastra esses preços no módulo Preços.

### Diálogos

- Estoque insuficiente: aparece quando a efetivação falha. Lista cada produto com a quantidade necessária e o saldo. A venda continua em rascunho.
- Devolução: pede a data da devolução, que fica entre a data da venda e hoje.
- Exclusão do rascunho: pede a confirmação.

### Venda efetivada ou devolvida

- Detalhe somente leitura: dados, itens com componentes, materiais e totais.
- O botão "Voltar para as vendas" fica à esquerda do título e abre a lista de vendas.
- Venda efetivada: botão "Devolver venda". Venda devolvida: aviso com a data da devolução.

## Acesso

- As rotas ficam protegidas pelo token JWT. O token vencido leva à rota `/login`.
- A tela de login faz parte dos itens de "Telas" do módulo Usuários.

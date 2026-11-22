import { MigrationInterface, QueryRunner } from "typeorm";

// Preenche o dicionário dos campos: uma linha por tabela e uma linha por campo.
// O id e os campos de auditoria usam textos comuns, escolhidos pelo perfil da tabela.

type Profile = "full" | "no_delete" | "create_only" | "system" | "none";

interface TableDoc {
    table: string;
    description: string;
    profile: Profile;
    fields: Record<string, string>;
}

const ID_DESCRIPTION = "Identificador do registro.";

const AUDIT_DESCRIPTIONS: Record<string, string> = {
    created_at: "Data e hora da criação.",
    created_by: "Usuário que criou o registro.",
    updated_at: "Data e hora da última alteração.",
    updated_by: "Usuário da última alteração.",
    deleted_at: "Data e hora da exclusão.",
    deleted_by: "Usuário que excluiu o registro.",
};

const AUDIT_FIELDS: Record<Profile, string[]> = {
    full: ["created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"],
    no_delete: ["created_at", "created_by", "updated_at", "updated_by"],
    create_only: ["created_at", "created_by"],
    system: ["created_at", "updated_at"],
    none: [],
};

const TABLES: TableDoc[] = [
    {
        table: "field_dictionary",
        description: "Descrição das tabelas e dos campos do banco.",
        profile: "system",
        fields: {
            table_name: "Nome da tabela descrita.",
            field_name: "Nome do campo descrito.",
            description: "Texto que explica a tabela ou o campo.",
        },
    },
    {
        table: "audit_logs",
        description: "Versões anteriores dos registros alterados ou excluídos.",
        profile: "none",
        fields: {
            table_name: "Tabela do registro alterado.",
            record_id: "Identificador do registro alterado.",
            action: "Tipo da mudança.",
            changed_at: "Data e hora da mudança.",
            changed_by: "Usuário que fez a mudança.",
            data: "Versão anterior do registro.",
        },
    },
    {
        table: "list_items",
        description: "Itens das listas de valores mantidas pelo usuário.",
        profile: "full",
        fields: {
            list_code: "Código da lista a que o item pertence.",
            description: "Texto do item.",
            is_active: "Indica se o item está ativo.",
        },
    },
    {
        table: "people",
        description: "Clientes e fornecedores.",
        profile: "full",
        fields: {
            name: "Nome da pessoa.",
            is_customer: "Indica se a pessoa é cliente.",
            is_supplier: "Indica se a pessoa é fornecedora.",
        },
    },
    {
        table: "product_units",
        description: "Unidades de compra de cada produto, além da unidade-base.",
        profile: "full",
        fields: {
            product_id: "Produto da unidade.",
            unit_id: "Unidade, da lista de unidades.",
            conversion_factor: "Fator de conversão para a unidade-base.",
        },
    },
    {
        table: "products",
        description: "Mercadorias e materiais, simples ou compostos.",
        profile: "full",
        fields: {
            name: "Nome do produto.",
            base_unit_id: "Unidade-base do produto.",
            category_id: "Categoria do produto.",
            is_active: "Indica se o produto está ativo.",
            type: "Tipo do produto.",
            is_composite: "Indica se o produto é composto.",
        },
    },
    {
        table: "sales_channels",
        description: "Canais de venda e suas taxas.",
        profile: "full",
        fields: {
            name: "Nome do canal.",
            commission_pct: "Comissão do canal, em percentual.",
            order_fee: "Tarifa fixa cobrada por pedido.",
            fee_base: "Base de cálculo das taxas do canal.",
        },
    },
    {
        table: "product_prices",
        description: "Preço de cada produto em cada canal.",
        profile: "full",
        fields: {
            product_id: "Produto do preço.",
            sales_channel_id: "Canal do preço.",
            price: "Preço unitário de venda.",
        },
    },
    {
        table: "expenses",
        description: "Despesas recorrentes e pontuais.",
        profile: "full",
        fields: {
            description: "Descrição da despesa.",
            monthly_amount: "Valor mensal da despesa.",
            valid_from: "Início da vigência.",
            valid_to: "Fim da vigência.",
        },
    },
    {
        table: "sale_item_components",
        description: "Componentes de um item composto da venda.",
        profile: "no_delete",
        fields: {
            sale_item_id: "Item da venda a que o componente pertence.",
            product_id: "Produto do componente.",
            quantity: "Quantidade do componente por unidade do item.",
        },
    },
    {
        table: "sale_items",
        description: "Itens de cada venda.",
        profile: "no_delete",
        fields: {
            sale_id: "Venda do item.",
            product_id: "Produto vendido.",
            quantity: "Quantidade vendida.",
            unit_price: "Preço unitário de venda.",
            unit_cost: "Custo unitário do item na efetivação da venda.",
            unit_freight: "Frete de compra unitário do item na efetivação da venda.",
        },
    },
    {
        table: "sale_materials",
        description: "Materiais consumidos em cada venda.",
        profile: "no_delete",
        fields: {
            sale_id: "Venda do material.",
            product_id: "Produto usado como material.",
            quantity: "Quantidade consumida.",
            unit_cost: "Custo unitário do material na efetivação da venda.",
            unit_freight: "Frete de compra unitário do material na efetivação da venda.",
        },
    },
    {
        table: "sales",
        description: "Vendas aos clientes.",
        profile: "full",
        fields: {
            customer_id: "Cliente da venda.",
            sales_channel_id: "Canal da venda.",
            sale_date: "Data da venda.",
            status: "Situação da venda.",
            customer_freight: "Frete cobrado do cliente.",
            expense_share: "Rateio das despesas do mês, em reais.",
            commission_amount: "Valor da comissão do canal.",
            order_fee_amount: "Valor da tarifa fixa do canal.",
        },
    },
    {
        table: "purchases",
        description: "Compras de fornecedores e devoluções de vendas.",
        profile: "full",
        fields: {
            supplier_id: "Fornecedor da compra.",
            purchase_date: "Data da compra.",
            freight_amount: "Valor do frete da compra.",
            status: "Situação da compra.",
            received_date: "Data de recebimento.",
            returned_sale_id: "Venda de origem da devolução.",
        },
    },
    {
        table: "purchase_items",
        description: "Itens de cada compra.",
        profile: "no_delete",
        fields: {
            purchase_id: "Compra do item.",
            product_id: "Produto comprado.",
            unit_id: "Unidade da quantidade comprada.",
            quantity: "Quantidade comprada.",
            unit_cost: "Custo unitário do item.",
            allocated_freight: "Frete da compra rateado ao item.",
        },
    },
    {
        table: "batches",
        description: "Lotes de estoque dos produtos.",
        profile: "no_delete",
        fields: {
            product_id: "Produto do lote.",
            entry_date: "Data de entrada do lote.",
            initial_quantity: "Quantidade inicial do lote.",
            unit_cost: "Custo unitário do lote.",
            unit_freight: "Frete de compra unitário do lote.",
            balance: "Saldo atual do lote.",
        },
    },
    {
        table: "stock_movements",
        description: "Movimentos de estoque por produto.",
        profile: "create_only",
        fields: {
            product_id: "Produto do movimento.",
            movement_date: "Data do movimento.",
            direction: "Direção do movimento.",
            quantity: "Quantidade movimentada.",
            type: "Tipo do movimento.",
            origin_type: "Tipo do registro de origem.",
            origin_id: "Identificador do registro de origem.",
            reason_id: "Motivo do ajuste, da lista de motivos.",
        },
    },
    {
        table: "batch_movements",
        description: "Movimentos de estoque por lote.",
        profile: "create_only",
        fields: {
            stock_movement_id: "Movimento de estoque de origem.",
            batch_id: "Lote movimentado.",
            direction: "Direção do movimento.",
            quantity: "Quantidade movimentada no lote.",
            unit_cost: "Custo unitário do lote no movimento.",
            unit_freight: "Frete unitário do lote no movimento.",
        },
    },
    {
        table: "users",
        description: "Usuários do sistema.",
        profile: "full",
        fields: {
            name: "Nome do usuário.",
            login: "Login de acesso.",
            password_hash: "Hash da senha.",
            is_active: "Indica se o usuário está ativo.",
        },
    },
];

const INSERT = `INSERT INTO "field_dictionary" ("table_name", "field_name", "description") VALUES ($1, $2, $3)`;

export class PopulateFieldDictionary1795369128920 implements MigrationInterface {
    name = 'PopulateFieldDictionary1795369128920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const doc of TABLES) {
            await queryRunner.query(INSERT, [doc.table, null, doc.description]);
            await queryRunner.query(INSERT, [doc.table, "id", ID_DESCRIPTION]);
            for (const [field, description] of Object.entries(doc.fields)) {
                await queryRunner.query(INSERT, [doc.table, field, description]);
            }
            for (const field of AUDIT_FIELDS[doc.profile]) {
                await queryRunner.query(INSERT, [doc.table, field, AUDIT_DESCRIPTIONS[field]]);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "field_dictionary" WHERE "table_name" = ANY($1)`, [
            TABLES.map((doc) => doc.table),
        ]);
    }

}

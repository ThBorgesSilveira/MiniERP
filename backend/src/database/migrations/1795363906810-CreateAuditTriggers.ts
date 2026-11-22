import { MigrationInterface, QueryRunner } from "typeorm";

// Funções e triggers de auditoria, escritos à mão (o migration:generate não cria funções).
// O backend define app.user_id com SET LOCAL em cada transação. Valor vazio vira nulo.

// Tabelas por perfil de campos de auditoria (regras em docs/modelo-de-dados.md).
const FULL_TABLES = [
    "list_items",
    "people",
    "product_units",
    "products",
    "sales_channels",
    "product_prices",
    "expenses",
    "sales",
    "purchases",
    "users",
];
const NO_DELETE_TABLES = [
    "sale_item_components",
    "sale_items",
    "sale_materials",
    "purchase_items",
    "batches",
];
const CREATE_ONLY_TABLES = ["stock_movements", "batch_movements"];
const SYSTEM_TABLES = ["field_dictionary"];

// Tabelas com log. A tabela users usa a função de log própria.
const LOG_TABLES = [...FULL_TABLES, "sale_item_components", "sale_items", "sale_materials", "purchase_items"];

// Livros de registro: a aplicação só lê e insere.
const INSERT_ONLY_TABLES = ["audit_logs", "stock_movements", "batch_movements"];

const FUNCTIONS = [
    "audit_fields_full",
    "audit_fields_no_delete",
    "audit_fields_create_only",
    "audit_fields_system",
    "audit_log_changes",
    "audit_log_users",
];

const ROLE_NAME = /^[a-z_][a-z0-9_]*$/;

function appUser(): string {
    const name = process.env.DB_APP_USER;
    if (!name || !ROLE_NAME.test(name)) {
        throw new Error("DB_APP_USER ausente ou inválido no .env.");
    }
    return name;
}

export class CreateAuditTriggers1795363906810 implements MigrationInterface {
    name = 'CreateAuditTriggers1795363906810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const app = appUser();

        // Campos de auditoria: perfil completo
        await queryRunner.query(`
CREATE FUNCTION audit_fields_full() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_user integer := NULLIF(current_setting('app.user_id', true), '')::integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := now();
        NEW.created_by := v_user;
        NEW.updated_at := NEW.created_at;
        NEW.updated_by := v_user;
    ELSE
        NEW.created_at := OLD.created_at;
        NEW.created_by := OLD.created_by;
        NEW.updated_at := now();
        NEW.updated_by := v_user;
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            NEW.deleted_by := v_user;
        ELSIF NEW.deleted_at IS NULL THEN
            NEW.deleted_by := NULL;
        ELSE
            NEW.deleted_by := OLD.deleted_by;
        END IF;
    END IF;
    RETURN NEW;
END;
$$`);

        // Campos de auditoria: perfil sem exclusão
        await queryRunner.query(`
CREATE FUNCTION audit_fields_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_user integer := NULLIF(current_setting('app.user_id', true), '')::integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := now();
        NEW.created_by := v_user;
        NEW.updated_at := NEW.created_at;
        NEW.updated_by := v_user;
    ELSE
        NEW.created_at := OLD.created_at;
        NEW.created_by := OLD.created_by;
        NEW.updated_at := now();
        NEW.updated_by := v_user;
    END IF;
    RETURN NEW;
END;
$$`);

        // Campos de auditoria: perfil só criação
        await queryRunner.query(`
CREATE FUNCTION audit_fields_create_only() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_user integer := NULLIF(current_setting('app.user_id', true), '')::integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := now();
        NEW.created_by := v_user;
    ELSE
        NEW.created_at := OLD.created_at;
        NEW.created_by := OLD.created_by;
    END IF;
    RETURN NEW;
END;
$$`);

        // Campos de auditoria: perfil do sistema (sem usuário)
        await queryRunner.query(`
CREATE FUNCTION audit_fields_system() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := now();
        NEW.updated_at := NEW.created_at;
    ELSE
        NEW.created_at := OLD.created_at;
        NEW.updated_at := now();
    END IF;
    RETURN NEW;
END;
$$`);

        // Log: grava a versão anterior do registro
        await queryRunner.query(`
CREATE FUNCTION audit_log_changes() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_action varchar;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_action := 'delete';
    ELSIF to_jsonb(OLD)->>'deleted_at' IS NULL AND to_jsonb(NEW)->>'deleted_at' IS NOT NULL THEN
        v_action := 'delete';
    ELSE
        v_action := 'update';
    END IF;

    INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, data)
    VALUES (TG_TABLE_NAME, OLD.id, v_action, NULLIF(current_setting('app.user_id', true), '')::integer, to_jsonb(OLD));
    RETURN NULL;
END;
$$`);

        // Log da tabela users: omite o hash da senha e sinaliza a troca de senha
        await queryRunner.query(`
CREATE FUNCTION audit_log_users() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_action varchar;
    v_data jsonb := to_jsonb(OLD) - 'password_hash';
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_action := 'delete';
    ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        v_action := 'delete';
    ELSE
        v_action := 'update';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
            v_data := v_data || '{"password_changed": true}'::jsonb;
        END IF;
    END IF;

    INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, data)
    VALUES (TG_TABLE_NAME, OLD.id, v_action, NULLIF(current_setting('app.user_id', true), '')::integer, v_data);
    RETURN NULL;
END;
$$`);

        const fieldTriggers: [string[], string][] = [
            [FULL_TABLES, "audit_fields_full"],
            [NO_DELETE_TABLES, "audit_fields_no_delete"],
            [CREATE_ONLY_TABLES, "audit_fields_create_only"],
            [SYSTEM_TABLES, "audit_fields_system"],
        ];
        for (const [tables, fn] of fieldTriggers) {
            for (const table of tables) {
                await queryRunner.query(
                    `CREATE TRIGGER "trg_${table}_audit_fields" BEFORE INSERT OR UPDATE ON "${table}" FOR EACH ROW EXECUTE FUNCTION ${fn}()`,
                );
            }
        }

        for (const table of LOG_TABLES) {
            const fn = table === "users" ? "audit_log_users" : "audit_log_changes";
            await queryRunner.query(
                `CREATE TRIGGER "trg_${table}_audit_log" AFTER UPDATE OR DELETE ON "${table}" FOR EACH ROW EXECUTE FUNCTION ${fn}()`,
            );
        }

        const tables = INSERT_ONLY_TABLES.map((t) => `"${t}"`).join(", ");
        await queryRunner.query(`REVOKE UPDATE, DELETE ON ${tables} FROM "${app}"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const app = appUser();

        const tables = INSERT_ONLY_TABLES.map((t) => `"${t}"`).join(", ");
        await queryRunner.query(`GRANT UPDATE, DELETE ON ${tables} TO "${app}"`);

        for (const table of LOG_TABLES) {
            await queryRunner.query(`DROP TRIGGER "trg_${table}_audit_log" ON "${table}"`);
        }

        for (const table of [...FULL_TABLES, ...NO_DELETE_TABLES, ...CREATE_ONLY_TABLES, ...SYSTEM_TABLES]) {
            await queryRunner.query(`DROP TRIGGER "trg_${table}_audit_fields" ON "${table}"`);
        }

        for (const fn of FUNCTIONS) {
            await queryRunner.query(`DROP FUNCTION ${fn}()`);
        }
    }

}

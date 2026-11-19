import {
  Column,
  DeleteDateColumn,
  ForeignKey,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Classes-base com os campos de auditoria, uma por perfil do modelo.
// O trigger do banco preenche as datas e os campos _by.

// Perfil só criação: movimentos de estoque e movimentos de lote.
export abstract class CreateOnlyAuditEntity {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'integer', nullable: true })
  @ForeignKey('User')
  createdBy: number | null;
}

// Perfil sem exclusão: itens, componentes, materiais e lotes.
export abstract class NoDeleteAuditEntity extends CreateOnlyAuditEntity {
  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;

  @Column({ type: 'integer', nullable: true })
  @ForeignKey('User')
  updatedBy: number | null;
}

// Perfil completo: os seis campos de auditoria.
export abstract class FullAuditEntity extends NoDeleteAuditEntity {
  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  @ForeignKey('User')
  deletedBy: number | null;
}

// Perfil do sistema: dicionário dos campos, mantido pelas migrations.
export abstract class SystemAuditEntity {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}

import { DefaultNamingStrategy } from 'typeorm';

// Converte os nomes das propriedades das entidades para snake_case no banco.
// O data-source.ts e o app.module.ts usam esta mesma classe.

function toSnakeCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

export class SnakeCaseNamingStrategy extends DefaultNamingStrategy {
  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    if (customName) {
      return customName;
    }
    const prefix = embeddedPrefixes.length
      ? `${embeddedPrefixes.join('_')}_`
      : '';
    return toSnakeCase(prefix + propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnakeCase(`${relationName}_${referencedColumnName}`);
  }
}

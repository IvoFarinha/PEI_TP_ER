# TP ER PEI – Incêndios Florestais

Trabalho prático da unidade curricular **Processamento de Informação Empresarial (PEI)**.

## Estrutura do projeto
- **API/** – API REST (Express) para submissão e validação de documentos XML e acesso às queries em JSON.
- **schemas/** – Esquemas XSD para validação dos documentos XML.
- **mongo-scripts/** – Scripts nativos MongoDB (JavaScript) para integração, transformação e queries analíticas.
- **dados/** – Dados históricos fornecidos (CSV).

## Funcionalidades
- Submissão de documentos XML com validação XSD obrigatória.
- Integração e transformação de dados em MongoDB através de scripts nativos.
- Modelação com aplicação do **Subset Pattern** (sem uso de `$lookup` nas queries).
- Queries analíticas executáveis via REST API ou diretamente em `mongosh`.

## Execução
1. Iniciar MongoDB.
2. Executar os scripts em `mongo-scripts/` com `mongosh`.
3. Iniciar a API com:
   ```bash
   node app.js

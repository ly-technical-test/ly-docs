# API Documentation (ly-docs)

Repositório centralizado contendo os contratos de serviço, especificações de endpoints e fluxos de domínio do ecossistema Lytex.

---

## 1. Arquitetura e Tecnologias

- **Especificação**: OpenAPI 3.0
- **Formato**: YAML
- **Visualizador Web**: Swagger UI / Redoc (no deployment)

---

## 2. Estrutura

Toda a infraestrutura de comunicação (criação de clientes, auth, emissão de cobranças) do `ly-services` foi documentada, provendo:
- Tipagens estritas de payload e response.
- Status HTTP corretos e comportamentos de erro.
- Modelos de dados completos.

---

## 3. Variáveis de Ambiente

As configurações da documentação devem ser salvas no arquivo `.env`. As chaves necessárias são:

- `APP_NAME`: Identificador da documentação (`ly-docs`).
- `EXTERNAL_PORT`: Porta pública de acesso ao Swagger UI.
- `API_PORT`: Porta interna do contêiner.
- `ENVIRONMENT`: Ambiente de execução (`development` ou `production`).
- `DOCKER_SUFFIX`: Sufixo para identificação dos contêineres Docker (`dev` ou `deploy`).

---

## 4. Acesso à Documentação

A documentação está disponibilizada aqui:
- **Interface Swagger**: [https://ly-api.gabs.com.br/ly-docs/docs](https://ly-api.gabs.com.br/ly-docs/docs)
- **Raw API Spec**: [ly-services.yaml](https://raw.githubusercontent.com/ly-technical-test/ly-docs/refs/heads/production/microservices/ly-services.yaml)

# FleetMoto - Sistema de Gestão e Logística Eleitoral

Este projeto utiliza a infraestrutura do **Google Firebase** para persistência durável em nuvem, controle de acesso e auditoria.

## 🚀 Tecnologias Integradas

- **Firebase Authentication**: Login, registro de operadores, gestores, fiscais e motoboys.
- **Cloud Firestore**: Banco de dados NoSQL com suporte a sincronização offline, transações atômicas e subscrições em tempo real (`onSnapshot`).
- **Firebase Storage**: Armazenamento seguro de fotos de adesivagem de frotas, comprovantes de entrega (POD) e documentação digital.
- **Logs de Auditoria**: Registro imutável de todas as ações de criação, atualização e exclusão lógica.

---

## 🗄️ Coleções do Firestore

1. `usuarios`: Contas de acesso, perfis (`administrador`, `gestor`, `atendente`, `cliente`, `motoboy`) e status.
2. `clientes`: Comitês e clientes da campanha, dados cadastrais, CEP, materiais selecionados e modelo do carro.
3. `motoboys`: Entregadores, dados de CNH, taxa de pontualidade, diárias e status de disponibilidade.
4. `veiculos`: Frotas de motocicletas, placas, revisões de quilometragem e adesivagens vinculadas.
5. `entregas`: Pedidos de entrega, rastreio, endereços, geolocalização e comprovantes de entrega (POD).
6. `rotas`: Agrupamento de entregas em rotas otimizadas com estimativas de distância e tempo.
7. `pagamentos`: Faturamento de comitês, repasses de diárias a motoboys e histórico de transações.
8. `adesivos`: Validação fotográfica de adesivagem de baús e veículos.
9. `documentos`: Gestão documental (CNH, CRLV, Autorizações TSE, Notas Fiscais).
10. `ocorrencias`: Registro e resolução de incidentes em trânsito.
11. `notificacoes`: Alertas em tempo real para os operadores do sistema.
12. `configuracoes`: Parâmetros globais de quilometragem, diárias e regras de negócio.
13. `logs_auditoria`: Registro detalhado de auditoria com dados anteriores e novos.

---

## 🔒 Segurança e Validação

- Regras de segurança em `firestore.rules` impedindo exclusão ou adulteração indevida de logs de auditoria.
- Exclusão lógica (`isDeleted: true`, `deletedAt`, `deletedBy`) para garantir preservação histórica de dados.
- Validação no frontend e na camada de repositórios para unicidade de CPF, Telefone, E-mail e Placas de veículos.
- Modo offline com persistência IndexedDB multiguia habilitada.

# Sistema de Vendas para Microempresas

## Descrição
Mini protótipo web para registo e visualização de vendas em microempresas, desenvolvido como trabalho individual conforme especificações do TFC.

## Funcionalidades Implementadas

### 1. Dashboard Interativo
- Visualização de métricas principais (total de vendas, número de vendas, média por venda)
- Lista das 5 vendas mais recentes
- Atualização automática dos dados

### 2. Sistema de Registo de Vendas
- Formulário completo para registo de vendas
- Validação de dados em tempo real
- Cálculo automático do total
- Persistência local dos dados

### 3. Visualização e Gestão de Vendas
- Tabela com todas as vendas registadas
- Filtros por cliente e data
- Exportação de dados em formato CSV
- Remoção individual ou completa de vendas

## Tecnologias Utilizadas
- **HTML5**: Estrutura semântica da aplicação
- **CSS3**: Estilização moderna e responsiva
- **JavaScript ES6+**: Lógica de negócio e interatividade
- **Local Storage**: Persistência de dados no navegador

## Como Utilizar

### Instalação
1. Descarregue todos os ficheiros para uma pasta local
2. Abra o ficheiro `index.html` num navegador web moderno

### Utilização
1. **Dashboard**: Página inicial com resumo das vendas
2. **Registar Venda**: Preencha o formulário e clique em "Registar Venda"
3. **Ver Vendas**: Visualize, filtre e gere as vendas registadas

## Estrutura de Ficheiros
```
sistema_vendas/
├── index.html          # Página principal da aplicação
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
├── relatorio_tecnico.md # Relatório técnico em Markdown
├── relatorio_tecnico.pdf # Relatório técnico em PDF
└── README.md           # Este ficheiro
```

## Compatibilidade
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Dispositivos desktop e móveis
- Não requer ligação à internet após carregamento inicial

## Limitações
- Dados armazenados apenas localmente (localStorage)
- Sem sincronização entre dispositivos
- Sem backup automático

## Desenvolvimento Futuro
- Integração com base de dados
- Sincronização em nuvem
- Funcionalidades avançadas de relatórios
- Gestão de clientes e inventário

## Autor
Desenvolvido por Manus AI como protótipo educacional para microempresas.

## Data
Janeiro 2024


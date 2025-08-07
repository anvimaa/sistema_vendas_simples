// Main JavaScript file for Sistema de Vendas para Microempresas
document.addEventListener('DOMContentLoaded', function () {
    console.log('Sistema de Vendas inicializado!');

    // Inicialização do Sistema
    initNavigation();
    initSalesForm();
    initSalesView();
    updateDashboard();
});

// Modelo de dados para uma venda
class Venda {
    constructor(cliente, nif, data, produtos, total, metodoPagamento) {
        this.id = Date.now().toString(); // Timestamp como ID único
        this.cliente = cliente;
        this.nif = nif;
        this.data = data;
        this.produtos = produtos;
        this.total = total;
        this.metodoPagamento = metodoPagamento;
    }
}

// Gerenciador de armazenamento local
const StorageManager = {
    // Chave para armazenamento no localStorage
    STORAGE_KEY: 'sistema_vendas_data',

    // Recuperar todas as vendas
    getVendas() {
        const vendas = localStorage.getItem(this.STORAGE_KEY);
        return vendas ? JSON.parse(vendas) : [];
    },

    // Salvar uma nova venda
    saveVenda(venda) {
        const vendas = this.getVendas();
        vendas.push(venda);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vendas));
    },

    // Remover uma venda específica
    removeVenda(id) {
        let vendas = this.getVendas();
        vendas = vendas.filter(v => v.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vendas));
    },

    // Limpar todas as vendas
    clearAllVendas() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};

// Gerenciamento de navegação
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Desativa todos os itens de menu e páginas
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

            // Ativa o item de menu e página atual
            this.classList.add('active');
            const pageId = this.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');

            // Atualiza os dados se necessário
            if (pageId === 'dashboard') {
                updateDashboard();
            } else if (pageId === 'ver-vendas') {
                renderVendas();
            }
        });
    });
}

// Inicialização do formulário de vendas
function initSalesForm() {
    const form = document.getElementById('venda-form');
    const addProdutoBtn = document.getElementById('adicionar-produto');
    const produtosContainer = document.getElementById('produtos-container');

    // Define a data atual no formulário
    document.getElementById('data').valueAsDate = new Date();

    // Adiciona evento para calcular subtotal quando os valores são alterados
    produtosContainer.addEventListener('input', function (e) {
        if (e.target.classList.contains('quantidade') || e.target.classList.contains('preco')) {
            updateSubtotalAndTotal();
        }
    });

    // Adiciona evento para adicionar novo produto
    addProdutoBtn.addEventListener('click', function () {
        const produtoItems = document.querySelectorAll('.produto-item');
        const novoIndex = produtoItems.length;

        const novoProduto = document.createElement('div');
        novoProduto.className = 'produto-item';
        novoProduto.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="produto-${novoIndex}">Produto:</label>
                    <input type="text" id="produto-${novoIndex}" class="produto-nome" required>
                </div>
                <div class="form-group">
                    <label for="quantidade-${novoIndex}">Quantidade:</label>
                    <input type="number" id="quantidade-${novoIndex}" class="quantidade" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label for="preco-${novoIndex}">Preço Unitário (€):</label>
                    <input type="number" id="preco-${novoIndex}" class="preco" min="0.01" step="0.01" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="imposto-${novoIndex}">Imposto (%):</label>
                    <input type="number" id="imposto-${novoIndex}" class="imposto" min="0" max="100" step="0.1" value="23" required>
                </div>
                <div class="form-group">
                    <label for="desconto-${novoIndex}">Desconto (%):</label>
                    <input type="number" id="desconto-${novoIndex}" class="desconto" min="0" max="100" step="0.1" value="0" required>
                </div>
                <div class="form-group">
                    <label for="subtotal-${novoIndex}">Subtotal (€):</label>
                    <input type="text" id="subtotal-${novoIndex}" class="subtotal" readonly value="0.00">
                </div>
                <div class="form-group" style="flex: 0 0 auto; align-self: end; margin-bottom: 10px;">
                    <button type="button" class="btn btn-danger remover-produto">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;

        produtosContainer.appendChild(novoProduto);

        // Adiciona evento para remover produto
        novoProduto.querySelector('.remover-produto').addEventListener('click', function () {
            novoProduto.remove();
            updateSubtotalAndTotal();
        });
    });

    // Validação e envio do formulário
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validação básica
        const cliente = document.getElementById('cliente').value.trim();
        if (cliente === '') {
            document.getElementById('cliente-validation').textContent = 'Nome do cliente é obrigatório';
            return;
        }

        const nif = document.getElementById('nif').value.trim();
        if (nif === '') {
            document.getElementById('nif-validation').textContent = 'NIF é obrigatório';
            return;
        }

        const data = document.getElementById('data').value;
        if (data === '') {
            document.getElementById('data-validation').textContent = 'Data é obrigatória';
            return;
        }

        const metodoPagamento = document.getElementById('metodo-pagamento').value;
        if (metodoPagamento === '') {
            document.getElementById('pagamento-validation').textContent = 'Método de pagamento é obrigatório';
            return;
        }

        // Coleta dados dos produtos
        const produtos = [];
        const produtoItems = document.querySelectorAll('.produto-item');
        let isValid = true;

        produtoItems.forEach((item, index) => {
            const nomeProduto = item.querySelector('.produto-nome').value.trim();
            const quantidade = parseInt(item.querySelector('.quantidade').value);
            const preco = parseFloat(item.querySelector('.preco').value);
            const imposto = parseFloat(item.querySelector('.imposto').value) || 0;
            const desconto = parseFloat(item.querySelector('.desconto').value) || 0;

            if (nomeProduto === '' || isNaN(quantidade) || isNaN(preco) || quantidade < 1 || preco <= 0) {
                isValid = false;
                alert(`Por favor, preencha corretamente todos os campos do produto ${index + 1}`);
                return;
            }

            // Cálculo com imposto e desconto
            let valorBase = quantidade * preco;
            let valorComImposto = valorBase * (1 + imposto / 100);
            let subtotal = valorComImposto * (1 - desconto / 100);

            produtos.push({
                nome: nomeProduto,
                quantidade: quantidade,
                preco: preco,
                imposto: imposto,
                desconto: desconto,
                subtotal: subtotal
            });
        });

        if (!isValid || produtos.length === 0) {
            alert('Por favor, adicione pelo menos um produto válido');
            return;
        }

        // Calcula o total da venda
        const total = produtos.reduce((sum, produto) => sum + produto.subtotal, 0);

        // Cria e salva a nova venda
        const novaVenda = new Venda(cliente, nif, data, produtos, total, metodoPagamento);
        StorageManager.saveVenda(novaVenda);

        // Reset do formulário e notificação
        form.reset();
        document.getElementById('data').valueAsDate = new Date();

        // Remove todos os produtos exceto o primeiro
        const produtoElements = document.querySelectorAll('.produto-item');
        for (let i = 1; i < produtoElements.length; i++) {
            produtoElements[i].remove();
        }

        // Limpa os campos do primeiro produto
        document.querySelector('.produto-nome').value = '';
        document.querySelector('.preco').value = '';
        document.querySelector('.quantidade').value = 1;
        document.querySelector('.imposto').value = 23; // Mantém o valor padrão de 23% para imposto
        document.querySelector('.desconto').value = 0; // Mantém o valor padrão de 0% para desconto
        document.querySelector('.subtotal').value = '0.00';
        document.getElementById('total-value').textContent = '0.00';

        // Limpa as mensagens de validação
        document.getElementById('nif-validation').textContent = '';
        document.getElementById('pagamento-validation').textContent = '';

        alert('Venda registrada com sucesso!');

        // Atualiza o dashboard
        updateDashboard();

        // Vai para o dashboard
        document.querySelector('[data-page="dashboard"]').click();
    });

    // Reset da validação quando o usuário começa a digitar
    document.getElementById('cliente').addEventListener('input', function () {
        document.getElementById('cliente-validation').textContent = '';
    });

    document.getElementById('nif').addEventListener('input', function () {
        document.getElementById('nif-validation').textContent = '';
    });

    document.getElementById('data').addEventListener('input', function () {
        document.getElementById('data-validation').textContent = '';
    });

    document.getElementById('metodo-pagamento').addEventListener('change', function () {
        document.getElementById('pagamento-validation').textContent = '';
    });

    // Adiciona evento para recalcular quando imposto ou desconto são alterados
    produtosContainer.addEventListener('input', function (e) {
        if (e.target.classList.contains('imposto') || e.target.classList.contains('desconto')) {
            updateSubtotalAndTotal();
        }
    });
}

// Atualiza subtotais e total no formulário
function updateSubtotalAndTotal() {
    let total = 0;
    const produtoItems = document.querySelectorAll('.produto-item');

    produtoItems.forEach((item, index) => {
        const quantidade = parseInt(item.querySelector('.quantidade').value) || 0;
        const preco = parseFloat(item.querySelector('.preco').value) || 0;
        const imposto = parseFloat(item.querySelector('.imposto').value) || 0;
        const desconto = parseFloat(item.querySelector('.desconto').value) || 0;

        // Cálculo com imposto e desconto
        let valorBase = quantidade * preco;
        let valorComImposto = valorBase * (1 + imposto / 100);
        let subtotal = valorComImposto * (1 - desconto / 100);

        item.querySelector('.subtotal').value = subtotal.toFixed(2);
        total += subtotal;
    });

    document.getElementById('total-value').textContent = total.toFixed(2);
}

// Formata o método de pagamento para exibição
function formatarMetodoPagamento(metodoPagamento) {
    const metodos = {
        'dinheiro': 'Dinheiro',
        'cartao': 'Cartão de Débito/Crédito',
        'transferencia': 'Transferência Bancária',
        'mbway': 'MB WAY'
    };

    return metodos[metodoPagamento] || metodoPagamento;
}

// Inicialização da visualização de vendas
function initSalesView() {
    const aplicarFiltrosBtn = document.getElementById('aplicar-filtros');
    const limparFiltrosBtn = document.getElementById('limpar-filtros');
    const exportarCsvBtn = document.getElementById('exportar-csv');
    const limparTodasVendasBtn = document.getElementById('limpar-todas-vendas');

    // Renderiza todas as vendas ao iniciar
    renderVendas();

    // Aplicar filtros
    aplicarFiltrosBtn.addEventListener('click', function () {
        renderVendas(true);
    });

    // Limpar filtros
    limparFiltrosBtn.addEventListener('click', function () {
        document.getElementById('filtro-cliente').value = '';
        document.getElementById('filtro-data-inicio').value = '';
        document.getElementById('filtro-data-fim').value = '';
        renderVendas();
    });

    // Exportar CSV
    exportarCsvBtn.addEventListener('click', function () {
        exportToCSV();
    });

    // Limpar todas as vendas
    limparTodasVendasBtn.addEventListener('click', function () {
        if (confirm('Tem certeza que deseja remover TODAS as vendas? Esta ação não pode ser desfeita.')) {
            StorageManager.clearAllVendas();
            renderVendas();
            updateDashboard();
        }
    });
}

// Renderiza as vendas na tabela de acordo com os filtros
function renderVendas(applyFilters = false) {
    const vendasTbody = document.getElementById('vendas-tbody');
    const noDataDiv = document.getElementById('no-data');
    let vendas = StorageManager.getVendas();

    // Aplicar filtros se solicitado
    if (applyFilters) {
        const filtroCliente = document.getElementById('filtro-cliente').value.toLowerCase();
        const filtroDataInicio = document.getElementById('filtro-data-inicio').value;
        const filtroDataFim = document.getElementById('filtro-data-fim').value;

        if (filtroCliente) {
            vendas = vendas.filter(v => v.cliente.toLowerCase().includes(filtroCliente));
        }

        if (filtroDataInicio) {
            vendas = vendas.filter(v => v.data >= filtroDataInicio);
        }

        if (filtroDataFim) {
            vendas = vendas.filter(v => v.data <= filtroDataFim);
        }
    }

    // Ordena as vendas por data (mais recente primeiro)
    vendas.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Limpa a tabela
    vendasTbody.innerHTML = '';

    // Exibe mensagem quando não há dados
    if (vendas.length === 0) {
        noDataDiv.classList.remove('hidden');
        return;
    } else {
        noDataDiv.classList.add('hidden');
    }

    // Preenche a tabela com os dados
    vendas.forEach(venda => {
        const tr = document.createElement('tr');

        // Formata a data para exibição (de YYYY-MM-DD para DD/MM/YYYY)
        const dataPartes = venda.data.split('-');
        const dataFormatada = `${dataPartes[2]}/${dataPartes[1]}/${dataPartes[0]}`;

        // Formata os produtos para exibição
        const produtosTexto = venda.produtos.map(p => {
            let impostoText = p.imposto ? ` (Imp: ${p.imposto}%)` : '';
            let descontoText = p.desconto > 0 ? ` (Desc: ${p.desconto}%)` : '';
            return `${p.nome} (${p.quantidade}x €${p.preco.toFixed(2)}${impostoText}${descontoText})`;
        }).join('<br>');

        // Formata o método de pagamento para exibição
        const metodoPagamentoFormatado = venda.metodoPagamento ? formatarMetodoPagamento(venda.metodoPagamento) : 'Não especificado';

        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${venda.cliente}${venda.nif ? '<br><small>NIF: ' + venda.nif + '</small>' : ''}</td>
            <td>${produtosTexto}</td>
            <td>€${venda.total.toFixed(2)}<br><small>${metodoPagamentoFormatado}</small></td>
            <td>
                <button class="btn btn-danger btn-sm remover-venda" data-id="${venda.id}">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        `;

        vendasTbody.appendChild(tr);
    });

    // Adiciona eventos para os botões de remover
    document.querySelectorAll('.remover-venda').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            if (confirm('Deseja realmente remover esta venda?')) {
                StorageManager.removeVenda(id);
                renderVendas(applyFilters);
                updateDashboard();
            }
        });
    });
}

// Atualiza o dashboard com métricas atuais
function updateDashboard() {
    const vendas = StorageManager.getVendas();
    const totalVendas = vendas.reduce((sum, venda) => sum + venda.total, 0);
    const numeroVendas = vendas.length;
    const mediaVendas = numeroVendas > 0 ? totalVendas / numeroVendas : 0;

    // Atualiza os cards
    document.getElementById('total-vendas').textContent = totalVendas.toFixed(2);
    document.getElementById('numero-vendas').textContent = numeroVendas;
    document.getElementById('media-vendas').textContent = mediaVendas.toFixed(2);

    // Atualiza vendas recentes (últimas 5)
    const vendasRecentes = document.getElementById('vendas-recentes');
    vendasRecentes.innerHTML = '';

    // Ordena as vendas por data (mais recente primeiro) e pega as 5 primeiras
    const recentes = [...vendas].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

    recentes.forEach(venda => {
        // Formata a data para exibição (de YYYY-MM-DD para DD/MM/YYYY)
        const dataPartes = venda.data.split('-');
        const dataFormatada = `${dataPartes[2]}/${dataPartes[1]}/${dataPartes[0]}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${venda.cliente}${venda.nif ? '<br><small>NIF: ' + venda.nif + '</small>' : ''}</td>
            <td>${venda.produtos[0].nome}${venda.produtos.length > 1 ? ' +' + (venda.produtos.length - 1) : ''}</td>
            <td>€${venda.total.toFixed(2)}</td>
        `;
        vendasRecentes.appendChild(tr);
    });

    // Exibe mensagem quando não há dados
    if (recentes.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="text-align: center;">Nenhuma venda registrada</td>';
        vendasRecentes.appendChild(tr);
    }
}

// Exporta os dados para CSV
function exportToCSV() {
    const vendas = StorageManager.getVendas();

    if (vendas.length === 0) {
        alert('Não há dados para exportar');
        return;
    }

    // Cria o cabeçalho do CSV
    let csvContent = 'Data,Cliente,NIF,Produtos,Total,Método de Pagamento\n';

    // Adiciona os dados
    vendas.forEach(venda => {
        const dataFormatada = venda.data;
        const produtosTexto = venda.produtos.map(p => {
            let impostoText = p.imposto ? ` (Imposto: ${p.imposto}%)` : '';
            let descontoText = p.desconto > 0 ? ` (Desconto: ${p.desconto}%)` : '';
            return `${p.nome} (${p.quantidade}x €${p.preco.toFixed(2)}${impostoText}${descontoText})`;
        }).join(' | ');

        // Escapa vírgulas e quebras de linha nos campos de texto
        const cliente = `"${venda.cliente.replace(/"/g, '""')}"`;
        const nif = `"${venda.nif ? venda.nif.replace(/"/g, '""') : ''}"`;
        const produtos = `"${produtosTexto.replace(/"/g, '""')}"`;
        const metodoPagamento = `"${venda.metodoPagamento ? formatarMetodoPagamento(venda.metodoPagamento).replace(/"/g, '""') : ''}"`;

        csvContent += `${dataFormatada},${cliente},${nif},${produtos},€${venda.total.toFixed(2)},${metodoPagamento}\n`;
    });

    // Cria um elemento para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', 'vendas_' + new Date().toISOString().slice(0, 10) + '.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
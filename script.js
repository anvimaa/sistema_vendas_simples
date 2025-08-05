// Sistema de Vendas Avançado - JavaScript
class SistemaVendas {
    constructor() {
        this.vendas = this.carregarVendas();
        this.itemCounter = 0;
        this.inicializar();
    }

    inicializar() {
        this.configurarEventos();
        this.configurarDataAtual();
        this.atualizarDashboard();
        this.atualizarTabelaVendas();
        this.calcularTotais();
    }

    configurarEventos() {
        // Navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navegarPara(e.target.dataset.section);
            });
        });

        // Formulário de venda
        const form = document.getElementById('vendaForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.registarVenda();
        });

        // Adicionar/remover itens
        document.getElementById('addItemBtn').addEventListener('click', () => this.adicionarItem());

        // Event delegation para botões de remoção de itens
        document.getElementById('itensContainer').addEventListener('click', (e) => {
            if (e.target.closest('.btn-remove-item')) {
                const itemIndex = e.target.closest('.btn-remove-item').dataset.item;
                this.removerItem(itemIndex);
            }
        });

        // Cálculo automático dos totais
        document.getElementById('itensContainer').addEventListener('input', (e) => {
            if (e.target.classList.contains('calc-field')) {
                this.calcularTotais();
            }
        });

        // Filtros
        document.getElementById('filtroCliente').addEventListener('input', () => this.filtrarVendas());
        document.getElementById('filtroData').addEventListener('change', () => this.filtrarVendas());
        document.getElementById('limparFiltros').addEventListener('click', () => this.limparFiltros());

        // Botões de ação
        document.getElementById('exportBtn').addEventListener('click', () => this.exportarVendas());
        document.getElementById('clearBtn').addEventListener('click', () => this.confirmarLimpeza());

        // Modal
        this.configurarModal();

        // Reset form
        form.addEventListener('reset', () => {
            setTimeout(() => {
                this.resetarFormulario();
            }, 10);
        });
    }

    configurarModal() {
        const modal = document.getElementById('confirmModal');
        const closeBtn = modal.querySelector('.close');
        const noBtn = document.getElementById('confirmNo');

        [closeBtn, noBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    configurarDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('data').value = hoje;
    }

    navegarPara(secao) {
        // Atualizar botões de navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${secao}"]`).classList.add('active');

        // Mostrar seção
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(secao).classList.add('active');

        // Atualizar dados se necessário
        if (secao === 'dashboard') {
            this.atualizarDashboard();
        } else if (secao === 'vendas') {
            this.atualizarTabelaVendas();
        }
    }

    adicionarItem() {
        this.itemCounter++;
        const container = document.getElementById('itensContainer');
        const itemIndex = this.itemCounter;

        const itemHtml = `
            <div class="item-row new-item" data-item="${itemIndex}">
                <div class="item-header">
                    <span>Item ${itemIndex + 1}</span>
                    <button type="button" class="btn-remove-item" data-item="${itemIndex}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="form-group">
                    <label>
                        <i class="fas fa-box"></i> Produto/Serviço
                    </label>
                    <input type="text" name="produto_${itemIndex}" required 
                           placeholder="Digite o nome do produto ou serviço">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>
                            <i class="fas fa-hashtag"></i> Quantidade
                        </label>
                        <input type="number" name="quantidade_${itemIndex}" 
                               min="1" value="1" required class="calc-field">
                    </div>

                    <div class="form-group">
                        <label>
                            <i class="fas fa-euro-sign"></i> Preço Unitário (AOA)
                        </label>
                        <input type="number" name="preco_${itemIndex}" 
                               step="0.01" min="0" required 
                               placeholder="0,00" class="calc-field">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>
                            <i class="fas fa-percentage"></i> Imposto (%)
                        </label>
                        <input type="number" name="imposto_${itemIndex}" 
                               step="0.01" min="0" max="100" value="14" 
                               placeholder="14,00" class="calc-field">
                    </div>

                    <div class="form-group">
                        <label>
                            <i class="fas fa-tag"></i> Desconto (%)
                        </label>
                        <input type="number" name="desconto_${itemIndex}" 
                               step="0.01" min="0" max="100" value="0" 
                               placeholder="0,00" class="calc-field">
                    </div>
                </div>

                <div class="item-total">
                    <strong>Subtotal: AOA<span class="item-subtotal">0,00</span></strong>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', itemHtml);
        this.calcularTotais();
    }

    removerItem(itemIndex) {
        const itemRow = document.querySelector(`[data-item="${itemIndex}"]`);
        if (itemRow) {
            // Verificar se é o último item
            const totalItems = document.querySelectorAll('.item-row').length;
            if (totalItems <= 1) {
                this.mostrarToast('Deve existir pelo menos um item na venda', 'error');
                return;
            }

            itemRow.remove();
            this.calcularTotais();
            this.renumerarItens();
        }
    }

    renumerarItens() {
        const items = document.querySelectorAll('.item-row');
        items.forEach((item, index) => {
            const span = item.querySelector('.item-header span');
            span.textContent = `Item ${index + 1}`;
        });
    }

    calcularTotais() {
        let subtotalSemImpostos = 0;
        let totalImpostos = 0;
        let totalDescontos = 0;

        // Calcular para cada item
        document.querySelectorAll('.item-row').forEach(item => {
            const itemIndex = item.dataset.item;
            const quantidade = parseFloat(item.querySelector(`[name="quantidade_${itemIndex}"]`)?.value) || 0;
            const preco = parseFloat(item.querySelector(`[name="preco_${itemIndex}"]`)?.value) || 0;
            const imposto = parseFloat(item.querySelector(`[name="imposto_${itemIndex}"]`)?.value) || 0;
            const desconto = parseFloat(item.querySelector(`[name="desconto_${itemIndex}"]`)?.value) || 0;

            const subtotalItem = quantidade * preco;
            const valorDesconto = subtotalItem * (desconto / 100);
            const subtotalComDesconto = subtotalItem - valorDesconto;
            const valorImposto = subtotalComDesconto * (imposto / 100);
            const totalItem = subtotalComDesconto + valorImposto;

            // Atualizar subtotal do item
            const subtotalSpan = item.querySelector('.item-subtotal');
            if (subtotalSpan) {
                subtotalSpan.textContent = this.formatarMoeda(totalItem, false);
            }

            // Somar aos totais gerais
            subtotalSemImpostos += subtotalItem - valorDesconto;
            totalImpostos += valorImposto;
            totalDescontos += valorDesconto;
        });

        const totalFinal = subtotalSemImpostos + totalImpostos;

        // Atualizar interface
        document.getElementById('subtotalSemImpostos').textContent = this.formatarMoeda(subtotalSemImpostos, false);
        document.getElementById('totalImpostos').textContent = this.formatarMoeda(totalImpostos, false);
        document.getElementById('totalDescontos').textContent = this.formatarMoeda(totalDescontos, false);
        document.getElementById('totalFinal').textContent = this.formatarMoeda(totalFinal, false);
    }

    resetarFormulario() {
        // Manter apenas o primeiro item
        const container = document.getElementById('itensContainer');
        const items = container.querySelectorAll('.item-row');

        // Remover todos os itens exceto o primeiro
        for (let i = 1; i < items.length; i++) {
            items[i].remove();
        }

        // Resetar contador
        this.itemCounter = 0;

        // Limpar campos do primeiro item
        const firstItem = container.querySelector('.item-row');
        if (firstItem) {
            firstItem.dataset.item = '0';
            firstItem.querySelector('.item-header span').textContent = 'Item 1';
            firstItem.querySelector('.btn-remove-item').dataset.item = '0';

            // Renomear campos
            firstItem.querySelectorAll('input').forEach(input => {
                const name = input.name;
                if (name && name.includes('_')) {
                    const baseName = name.split('_')[0];
                    input.name = `${baseName}_0`;
                }
            });
        }

        this.configurarDataAtual();
        this.calcularTotais();
    }

    registarVenda() {
        const formData = new FormData(document.getElementById('vendaForm'));

        // Recolher dados do cliente
        const cliente = formData.get('cliente').trim();
        const nif = formData.get('nif').trim();
        const data = formData.get('data');
        const formaPagamento = formData.get('formaPagamento');
        const observacoes = formData.get('observacoes').trim();

        // Validações básicas
        if (!this.validarDadosCliente(cliente, nif, data, formaPagamento)) {
            return;
        }

        // Recolher itens
        const itens = this.recolherItens(formData);
        if (itens.length === 0) {
            this.mostrarToast('Deve adicionar pelo menos um item à venda', 'error');
            return;
        }

        // Calcular totais
        const totais = this.calcularTotaisVenda(itens);

        const venda = {
            id: Date.now(),
            cliente,
            nif,
            data,
            formaPagamento,
            observacoes,
            itens,
            subtotalSemImpostos: totais.subtotalSemImpostos,
            totalImpostos: totais.totalImpostos,
            totalDescontos: totais.totalDescontos,
            totalFinal: totais.totalFinal,
            dataRegistro: new Date().toISOString()
        };

        // Adicionar à lista
        this.vendas.push(venda);
        this.salvarVendas();

        // Limpar formulário
        document.getElementById('vendaForm').reset();
        this.resetarFormulario();

        // Atualizar interface
        this.atualizarDashboard();
        this.atualizarTabelaVendas();

        // Mostrar confirmação
        this.mostrarToast('Venda registada com sucesso!', 'success');

        // Navegar para dashboard
        this.navegarPara('dashboard');
    }

    validarDadosCliente(cliente, nif, data, formaPagamento) {
        if (!cliente) {
            this.mostrarToast('Nome do cliente é obrigatório', 'error');
            return false;
        }

        if (!nif || !/^[0-9]{9}$/.test(nif)) {
            this.mostrarToast('NIF deve ter exatamente 9 dígitos', 'error');
            return false;
        }

        if (!data) {
            this.mostrarToast('Data da venda é obrigatória', 'error');
            return false;
        }

        if (!formaPagamento) {
            this.mostrarToast('Forma de pagamento é obrigatória', 'error');
            return false;
        }

        return true;
    }

    recolherItens(formData) {
        const itens = [];
        const items = document.querySelectorAll('.item-row');

        items.forEach(item => {
            const itemIndex = item.dataset.item;
            const produto = formData.get(`produto_${itemIndex}`)?.trim();
            const quantidade = parseFloat(formData.get(`quantidade_${itemIndex}`)) || 0;
            const preco = parseFloat(formData.get(`preco_${itemIndex}`)) || 0;
            const imposto = parseFloat(formData.get(`imposto_${itemIndex}`)) || 0;
            const desconto = parseFloat(formData.get(`desconto_${itemIndex}`)) || 0;

            if (produto && quantidade > 0 && preco > 0) {
                itens.push({
                    produto,
                    quantidade,
                    preco,
                    imposto,
                    desconto
                });
            }
        });

        return itens;
    }

    calcularTotaisVenda(itens) {
        let subtotalSemImpostos = 0;
        let totalImpostos = 0;
        let totalDescontos = 0;

        itens.forEach(item => {
            const subtotalItem = item.quantidade * item.preco;
            const valorDesconto = subtotalItem * (item.desconto / 100);
            const subtotalComDesconto = subtotalItem - valorDesconto;
            const valorImposto = subtotalComDesconto * (item.imposto / 100);

            subtotalSemImpostos += subtotalComDesconto;
            totalImpostos += valorImposto;
            totalDescontos += valorDesconto;
        });

        return {
            subtotalSemImpostos,
            totalImpostos,
            totalDescontos,
            totalFinal: subtotalSemImpostos + totalImpostos
        };
    }

    atualizarDashboard() {
        const totalVendas = this.vendas.reduce((sum, venda) => sum + venda.totalFinal, 0);
        const numeroVendas = this.vendas.length;
        const mediaVenda = numeroVendas > 0 ? totalVendas / numeroVendas : 0;

        document.getElementById('totalVendas').textContent = this.formatarMoeda(totalVendas);
        document.getElementById('numeroVendas').textContent = numeroVendas;
        document.getElementById('mediaVenda').textContent = this.formatarMoeda(mediaVenda);

        this.atualizarVendasRecentes();
    }

    atualizarVendasRecentes() {
        const container = document.getElementById('vendasRecentes');
        const vendasRecentes = this.vendas
            .sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro))
            .slice(0, 5);

        if (vendasRecentes.length === 0) {
            container.innerHTML = '<p class="no-data">Nenhuma venda registada ainda</p>';
            return;
        }

        const html = vendasRecentes.map(venda => `
            <div class="recent-sale-item" style="
                padding: 1rem;
                border-left: 4px solid #667eea;
                margin-bottom: 1rem;
                background: #f7fafc;
                border-radius: 0 8px 8px 0;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${venda.cliente}</strong> (NIF: ${venda.nif})
                        <br>
                        <small style="color: #718096;">
                            ${this.formatarData(venda.data)} • ${venda.itens.length} item(s) • ${this.formatarFormaPagamento(venda.formaPagamento)}
                        </small>
                    </div>
                    <div style="text-align: right; color: #667eea; font-weight: bold;">
                        ${this.formatarMoeda(venda.totalFinal)}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    atualizarTabelaVendas() {
        const tbody = document.getElementById('vendasTableBody');

        if (this.vendas.length === 0) {
            tbody.innerHTML = '<tr class="no-data"><td colspan="7">Nenhuma venda registada ainda</td></tr>';
            return;
        }

        const vendasOrdenadas = this.vendas.sort((a, b) => new Date(b.data) - new Date(a.data));

        const html = vendasOrdenadas.map(venda => `
            <tr>
                <td>${this.formatarData(venda.data)}</td>
                <td>${venda.cliente}</td>
                <td>${venda.nif}</td>
                <td>
                    <div class="item-summary">${venda.itens.length} item(s)</div>
                    <div class="item-details">${venda.itens.map(item => item.produto).join(', ')}</div>
                </td>
                <td>
                    <span class="payment-method">${this.formatarFormaPagamento(venda.formaPagamento)}</span>
                </td>
                <td><strong>${this.formatarMoeda(venda.totalFinal)}</strong></td>
                <td>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" 
                            onclick="sistemaVendas.removerVenda(${venda.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    }

    filtrarVendas() {
        const filtroCliente = document.getElementById('filtroCliente').value.toLowerCase();
        const filtroData = document.getElementById('filtroData').value;

        let vendasFiltradas = this.vendas;

        if (filtroCliente) {
            vendasFiltradas = vendasFiltradas.filter(venda =>
                venda.cliente.toLowerCase().includes(filtroCliente) ||
                venda.nif.includes(filtroCliente)
            );
        }

        if (filtroData) {
            vendasFiltradas = vendasFiltradas.filter(venda =>
                venda.data === filtroData
            );
        }

        this.renderizarVendasFiltradas(vendasFiltradas);
    }

    renderizarVendasFiltradas(vendas) {
        const tbody = document.getElementById('vendasTableBody');

        if (vendas.length === 0) {
            tbody.innerHTML = '<tr class="no-data"><td colspan="7">Nenhuma venda encontrada com os filtros aplicados</td></tr>';
            return;
        }

        const vendasOrdenadas = vendas.sort((a, b) => new Date(b.data) - new Date(a.data));

        const html = vendasOrdenadas.map(venda => `
            <tr>
                <td>${this.formatarData(venda.data)}</td>
                <td>${venda.cliente}</td>
                <td>${venda.nif}</td>
                <td>
                    <div class="item-summary">${venda.itens.length} item(s)</div>
                    <div class="item-details">${venda.itens.map(item => item.produto).join(', ')}</div>
                </td>
                <td>
                    <span class="payment-method">${this.formatarFormaPagamento(venda.formaPagamento)}</span>
                </td>
                <td><strong>${this.formatarMoeda(venda.totalFinal)}</strong></td>
                <td>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" 
                            onclick="sistemaVendas.removerVenda(${venda.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    }

    limparFiltros() {
        document.getElementById('filtroCliente').value = '';
        document.getElementById('filtroData').value = '';
        this.atualizarTabelaVendas();
    }

    removerVenda(id) {
        const venda = this.vendas.find(v => v.id === id);
        if (!venda) return;

        this.mostrarConfirmacao(
            `Tem certeza que deseja remover a venda de "${venda.cliente}" (NIF: ${venda.nif})?`,
            () => {
                this.vendas = this.vendas.filter(v => v.id !== id);
                this.salvarVendas();
                this.atualizarDashboard();
                this.atualizarTabelaVendas();
                this.mostrarToast('Venda removida com sucesso!', 'success');
            }
        );
    }

    confirmarLimpeza() {
        if (this.vendas.length === 0) {
            this.mostrarToast('Não há vendas para remover', 'error');
            return;
        }

        this.mostrarConfirmacao(
            'Tem certeza que deseja remover TODAS as vendas? Esta ação não pode ser desfeita.',
            () => {
                this.vendas = [];
                this.salvarVendas();
                this.atualizarDashboard();
                this.atualizarTabelaVendas();
                this.mostrarToast('Todas as vendas foram removidas', 'success');
            }
        );
    }

    exportarVendas() {
        if (this.vendas.length === 0) {
            this.mostrarToast('Não há vendas para exportar', 'error');
            return;
        }

        const csv = this.gerarCSV();
        this.downloadCSV(csv, 'vendas_export.csv');
        this.mostrarToast('Vendas exportadas com sucesso!', 'success');
    }

    gerarCSV() {
        const headers = ['Data', 'Cliente', 'NIF', 'Forma Pagamento', 'Produto', 'Quantidade', 'Preço Unit.', 'Imposto %', 'Desconto %', 'Subtotal Item', 'Total Venda', 'Observações'];
        const rows = [];

        this.vendas.forEach(venda => {
            venda.itens.forEach((item, index) => {
                const subtotalItem = item.quantidade * item.preco;
                const valorDesconto = subtotalItem * (item.desconto / 100);
                const subtotalComDesconto = subtotalItem - valorDesconto;
                const valorImposto = subtotalComDesconto * (item.imposto / 100);
                const totalItem = subtotalComDesconto + valorImposto;

                rows.push([
                    venda.data,
                    venda.cliente,
                    venda.nif,
                    this.formatarFormaPagamento(venda.formaPagamento),
                    item.produto,
                    item.quantidade,
                    item.preco.toFixed(2),
                    item.imposto.toFixed(2),
                    item.desconto.toFixed(2),
                    totalItem.toFixed(2),
                    index === 0 ? venda.totalFinal.toFixed(2) : '', // Mostrar total apenas na primeira linha
                    index === 0 ? venda.observacoes || '' : ''
                ]);
            });
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    mostrarConfirmacao(mensagem, callback) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const yesBtn = document.getElementById('confirmYes');

        messageEl.textContent = mensagem;
        modal.style.display = 'block';

        // Remover listeners anteriores
        const newYesBtn = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

        // Adicionar novo listener
        newYesBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            callback();
        });
    }

    mostrarToast(mensagem, tipo = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = mensagem;
        toast.className = `toast ${tipo}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    formatarMoeda(valor, incluirSimbolo = true) {
        if (incluirSimbolo) {
            return new Intl.NumberFormat('pt-PT', {
                style: 'currency',
                currency: 'AOA'
            }).format(valor);
        } else {
            return new Intl.NumberFormat('pt-PT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(valor);
        }
    }

    formatarData(data) {
        return new Date(data + 'T00:00:00').toLocaleDateString('pt-PT');
    }

    formatarFormaPagamento(forma) {
        const formas = {
            'dinheiro': 'Dinheiro',
            'cartao_debito': 'Cartão Débito',
            'cartao_credito': 'Cartão Crédito',
            'transferencia': 'Transferência',
            'multibanco': 'Multibanco',
            'cheque': 'Cheque'
        };
        return formas[forma] || forma;
    }

    carregarVendas() {
        try {
            const vendas = localStorage.getItem('sistemaVendasAvancado');
            return vendas ? JSON.parse(vendas) : [];
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            return [];
        }
    }

    salvarVendas() {
        try {
            localStorage.setItem('sistemaVendasAvancado', JSON.stringify(this.vendas));
        } catch (error) {
            console.error('Erro ao salvar vendas:', error);
            this.mostrarToast('Erro ao salvar dados', 'error');
        }
    }

    // Método para adicionar dados de exemplo (para demonstração)
    adicionarDadosExemplo() {
        const exemplos = [
            {
                id: Date.now() - 1000000,
                cliente: 'João Silva',
                nif: '123456789',
                data: '2024-01-15',
                formaPagamento: 'cartao_credito',
                observacoes: 'Primeira venda do ano',
                itens: [
                    {
                        produto: 'Consulta de Marketing',
                        quantidade: 1,
                        preco: 150.00,
                        imposto: 14,
                        desconto: 0
                    }
                ],
                subtotalSemImpostos: 150.00,
                totalImpostos: 34.50,
                totalDescontos: 0,
                totalFinal: 184.50,
                dataRegistro: new Date(Date.now() - 1000000).toISOString()
            },
            {
                id: Date.now() - 2000000,
                cliente: 'Maria Santos',
                nif: '987654321',
                data: '2024-01-10',
                formaPagamento: 'transferencia',
                observacoes: 'Projeto completo',
                itens: [
                    {
                        produto: 'Website Corporativo',
                        quantidade: 1,
                        preco: 800.00,
                        imposto: 14,
                        desconto: 10
                    },
                    {
                        produto: 'Hosting Anual',
                        quantidade: 1,
                        preco: 120.00,
                        imposto: 14,
                        desconto: 0
                    }
                ],
                subtotalSemImpostos: 840.00,
                totalImpostos: 193.20,
                totalDescontos: 80.00,
                totalFinal: 1033.20,
                dataRegistro: new Date(Date.now() - 2000000).toISOString()
            }
        ];

        this.vendas = [...this.vendas, ...exemplos];
        this.salvarVendas();
        this.atualizarDashboard();
        this.atualizarTabelaVendas();
        this.mostrarToast('Dados de exemplo adicionados!', 'success');
    }
}

// Inicializar o sistema quando a página carregar
let sistemaVendas;

document.addEventListener('DOMContentLoaded', () => {
    sistemaVendas = new SistemaVendas();

    // Adicionar dados de exemplo se não houver vendas (apenas para demonstração)
    if (sistemaVendas.vendas.length === 0) {
        // Descomente a linha abaixo para adicionar dados de exemplo automaticamente
        // sistemaVendas.adicionarDadosExemplo();
    }
});

// Função global para adicionar dados de exemplo (pode ser chamada no console)
function adicionarExemplos() {
    sistemaVendas.adicionarDadosExemplo();
}


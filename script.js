// Seleção dos elementos DOM
const form = document.getElementById('form-transacao');
const descricaoInput = document.getElementById('descricao');
const valorInput = document.getElementById('valor');
const tipoSelect = document.getElementById('tipo');

const limiteCartaoInput = document.getElementById('limite-cartao-input');
const btnSalvarLimite = document.getElementById('btn-salvar-limite');

const dataHoraAtualEl = document.getElementById('data-hora-atual');
const totalEntradasEl = document.getElementById('total-entradas');
const totalSaidasEl = document.getElementById('total-saidas');
const totalCartaoEl = document.getElementById('total-cartao');
const saldoTotalEl = document.getElementById('saldo-total');
const limiteDisponivelEl = document.getElementById('limite-disponivel');
const listaTransacoesEl = document.getElementById('lista-transacoes');
const alertaStatusEl = document.getElementById('alerta-status');

// Botões de Backup e Reset
const btnExportar = document.getElementById('btn-exportar');
const btnImportar = document.getElementById('btn-importar');
const inputImportar = document.getElementById('input-importar');

// LocalStorage
let transacoes = JSON.parse(localStorage.getItem('transacoes_financeiras')) || [];
let limiteCartao = parseFloat(localStorage.getItem('limite_cartao')) || 0;

limiteCartaoInput.value = limiteCartao ? limiteCartao : '';

// --- RELÓGIO EM TEMPO REAL ---
function atualizarRelogio() {
  const agora = new Date();
  const opcoes = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  const textoDataHora = agora.toLocaleDateString('pt-BR', opcoes);
  dataHoraAtualEl.textContent = textoDataHora.charAt(0).toUpperCase() + textoDataHora.slice(1);
}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// Formatar valor para Moeda Brasileira (R$)
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Obter string formatada de data e hora para salvar na transação
function obterDataHoraFormatada() {
  const agora = new Date();
  const diaSemana = agora.toLocaleDateString('pt-BR', { weekday: 'short' });
  const data = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return `${diaSemana.toUpperCase()} - ${data} às ${hora}`;
}

// Atualizar Totais da Tela
function atualizarTotais() {
  const entradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const saidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + t.valor, 0);

  const cartao = transacoes
    .filter(t => t.tipo === 'cartao')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoEmConta = entradas - saidas;
  const limiteDisponivel = limiteCartao - cartao;

  totalEntradasEl.textContent = formatarMoeda(entradas);
  totalSaidasEl.textContent = formatarMoeda(saidas);
  totalCartaoEl.textContent = formatarMoeda(cartao);
  saldoTotalEl.textContent = formatarMoeda(saldoEmConta);
  limiteDisponivelEl.textContent = formatarMoeda(limiteDisponivel);

  saldoTotalEl.className = 'valor ' + (saldoEmConta >= 0 ? 'entrada' : 'saida');

  gerarAlertaFinanceiro(entradas, saidas, cartao, saldoEmConta, limiteDisponivel);
}

// Salvar limite de cartão
btnSalvarLimite.addEventListener('click', () => {
  const novoLimite = parseFloat(limiteCartaoInput.value);
  if (!isNaN(novoLimite) && novoLimite >= 0) {
    limiteCartao = novoLimite;
    localStorage.setItem('limite_cartao', limiteCartao);
    atualizarTotais();
    alert('Limite do cartão atualizado com sucesso!');
  } else {
    alert('Insira um valor válido para o limite.');
  }
});

// Gerar Alertas
function gerarAlertaFinanceiro(entradas, saidas, cartao, saldo, limiteDisponivel) {
  if (transacoes.length === 0 && limiteCartao === 0) {
    alertaStatusEl.classList.add('oculto');
    return;
  }

  alertaStatusEl.classList.remove('oculto');
  let mensagens = [];

  if (limiteDisponivel < 0) {
    mensagens.push(`💳 <strong>Atenção! Você estourou o limite do cartão</strong> em <strong>${formatarMoeda(Math.abs(limiteDisponivel))}</strong>.`);
  }

  if (cartao > saldo) {
    mensagens.push(`⚠️ <strong>Risco de Endividamento:</strong> A sua fatura acumulada do cartão (<strong>${formatarMoeda(cartao)}</strong>) é maior do que o seu saldo atual (<strong>${formatarMoeda(saldo)}</strong>).`);
  } else if (saldo < 0) {
    mensagens.push(`🚨 <strong>Atenção:</strong> Seu saldo em conta está negativo em <strong>${formatarMoeda(Math.abs(saldo))}</strong>.`);
  }

  if (mensagens.length > 0) {
    alertaStatusEl.className = 'alerta alerta-perigo';
    alertaStatusEl.innerHTML = mensagens.join('<br><br>');
  } else {
    alertaStatusEl.className = 'alerta alerta-sucesso';
    alertaStatusEl.innerHTML = `✅ <strong>Finanças sob controle!</strong> Seu saldo atual cobre suas despesas e sua fatura do cartão está dentro do limite.`;
  }
}

// Renderizar Transações na Lista
function renderizarTransacoes() {
  listaTransacoesEl.innerHTML = '';

  // Pega apenas as primeiras 14 transações da lista
  const transacoesExibidas = transacoes.slice(0, 14);

  transacoes.forEach((transacao, index) => {
    const li = document.createElement('li');
    li.classList.add(transacao.tipo);

    let sinal = '-';
    let tagTipo = 'Gasto';

    if (transacao.tipo === 'entrada') {
      sinal = '+';
      tagTipo = 'Ganho';
    } else if (transacao.tipo === 'cartao') {
      sinal = '💳';
      tagTipo = 'Cartão';
    }

    const dataExibicao = transacao.dataHora ? transacao.dataHora : 'Data não registrada';

    li.innerHTML = `
      <div class="info-transacao">
        <span><strong>${transacao.descricao}</strong> <small>(${tagTipo})</small></span>
        <span class="data-transacao">🕒 ${dataExibicao}</span>
      </div>
      <div>
        <span style="margin-right: 10px;"><strong>${sinal} ${formatarMoeda(transacao.valor)}</strong></span>
        <button class="btn-deletar" onclick="removerTransacao(${index})">X</button>
      </div>
    `;

    listaTransacoesEl.appendChild(li);
  });

  localStorage.setItem('transacoes_financeiras', JSON.stringify(transacoes));
  atualizarTotais();
}

// Adicionar Transação (agora usando unshift para colocar a mais nova no topo)
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const descricao = descricaoInput.value.trim();
  const valor = parseFloat(valorInput.value);
  const tipo = tipoSelect.value;

  if (descricao === '' || isNaN(valor) || valor <= 0) {
    alert('Preencha um valor válido!');
    return;
  }

  const novaTransacao = {
    descricao,
    valor,
    tipo,
    dataHora: obterDataHoraFormatada()
  };

  transacoes.unshift(novaTransacao);
  renderizarTransacoes();

  descricaoInput.value = '';
  valorInput.value = '';
});

// Remover Transação
function removerTransacao(index) {
  transacoes.splice(index, 1);
  renderizarTransacoes();
}

// --- SISTEMA DE BACKUP ---
btnExportar.addEventListener('click', () => {
  const dados = {
    transacoes: transacoes,
    limiteCartao: limiteCartao
  };
  
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_financeiro_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
});

btnImportar.addEventListener('click', () => inputImportar.click());

inputImportar.addEventListener('change', (e) => {
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = (event) => {
    try {
      const dados = JSON.parse(event.target.result);
      if (dados.transacoes) {
        transacoes = dados.transacoes;
        limiteCartao = dados.limiteCartao || 0;
        
        localStorage.setItem('transacoes_financeiras', JSON.stringify(transacoes));
        localStorage.setItem('limite_cartao', limiteCartao);
        
        limiteCartaoInput.value = limiteCartao ? limiteCartao : '';
        renderizarTransacoes();
        alert('Backup restaurado com sucesso!');
      }
    } catch (err) {
      alert('Arquivo de backup inválido!');
    }
  };
  leitor.readAsText(arquivo);
});

// Inicialização
renderizarTransacoes();
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, getDoc, deleteDoc, getDocs, writeBatch, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Ícones em SVG para a UI ---
const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2.5 3A1.5 1.5 0 001 4.5v11A1.5 1.5 0 002.5 17h15a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0017.5 3h-15zm5.793 3.793a1 1 0 011.414 0L12 9.086l2.293-2.293a1 1 0 011.414 1.414L13.414 10.5l2.293 2.293a1 1 0 01-1.414 1.414L12 11.914l-2.293 2.293a1 1 0 01-1.414-1.414L10.586 10.5 8.293 8.207a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm4.5 5.5a.5.5 0 01.5.5v2.5a.5.5 0 01-1 0V8a.5.5 0 01.5-.5zM9 11a1 1 0 100-2 1 1 0 000 2zm2.854-3.146a.5.5 0 01.708 0l2 2a.5.5 0 010 .708l-2 2a.5.5 0 11-.708-.708L12.293 11H7.5a.5.5 0 010-1h4.793l-1.147-1.146a.5.5 0 010-.708z" clipRule="evenodd" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const HomeIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M11.25 6.083V18m-3.75-3.75h7.5" /></svg>;
const PlusCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChartBarIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const UserPlusIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>;


// --- Configuração do Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { projectId: "YOUR_PROJECT_ID_FALLBACK" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constantes ---
const supplierCategories = ['Materia Prima', 'Folha de pagamento', 'Gasto operacional', 'Gasto de produção', 'Impostos', 'Despesas finaceiras'];
const allPaymentMethods = ['dinheiro', 'credito', 'debito', 'pix', 'vr', 'ifoodAiqfome', 'contaAssinada'];
const paymentMethodLabels = { dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito', pix: 'Pix', vr: 'Vale Refeição', ifoodAiqfome: 'iFood/Aiqfome', contaAssinada: 'Conta Assinada' };

// --- Dados Iniciais das Empresas ---
const initialCompanies = [
  { id: 'remo_brotas', name: 'Remo Brotas', password: '7410' },
  { id: 'jack_pepira', name: 'Jack Pepira', password: '8522' },
  { id: 'o_forno', name: 'O Forno', password: '9633' },
  { id: 'cafe_catharina', name: 'Café Catharina', password: '1010' },
  { id: 'emporio_peixaria_brotas', name: 'Empório e Peixaria Brotas', password: '2020' },
  { id: 'jackburguers', name: 'Jackburguers', password: '3030' },
];
const configDocPath = `artifacts/${appId}/public/data/app_config/companies`;


// --- Estrutura de dados inicial para o formulário de fechamento ---
const initialClosingData = {
    date: new Date().toISOString().slice(0, 10),
    aberturaCaixa: 0,
    almoco: { 
        pax: { salao: 0, balcao: 0, delivery: 0 }, 
        dinheiro: { salao: 0, balcao: 0, delivery: 0 }, 
        credito: { salao: 0, balcao: 0, delivery: 0 }, 
        debito: { salao: 0, balcao: 0, delivery: 0 }, 
        pix: { salao: 0, balcao: 0, delivery: 0 }, 
        vr: { salao: 0, balcao: 0, delivery: 0 }, 
        ifoodAiqfome: { salao: 0, balcao: 0, delivery: 0 }, 
        contaAssinada: { salao: 0, balcao: 0, delivery: 0 } 
    },
    jantar: { 
        pax: { salao: 0, balcao: 0, delivery: 0 }, 
        dinheiro: { salao: 0, balcao: 0, delivery: 0 }, 
        credito: { salao: 0, balcao: 0, delivery: 0 }, 
        debito: { salao: 0, balcao: 0, delivery: 0 }, 
        pix: { salao: 0, balcao: 0, delivery: 0 }, 
        vr: { salao: 0, balcao: 0, delivery: 0 }, 
        ifoodAiqfome: { salao: 0, balcao: 0, delivery: 0 }, 
        contaAssinada: { salao: 0, balcao: 0, delivery: 0 } 
    },
    pagamentosCaixa: [{ referente: '', valor: 0, categoria: supplierCategories[0] }],
    contasAssinadas: [{ beneficiarioId: '', observacao: '', valor: 0 }],
    recebimentosContasAssinadas: [{ beneficiarioId: '', valorRecebido: 0, formaPagamento: 'dinheiro' }],
    deliveryRates: { brotas: 0, torrinha: 0, retorno: 0, outras: 0 },
    entregadores: [{ nome: '', diaria: 0, brotas: 0, torrinha: 0, retorno: 0, outras: 0 }],
    sangria: [{ responsavel: '', valor: 0 }],
    suprimento: [{ responsavel: '', valor: 0 }],
};

// --- Componente de Input com Calculadora ---
const CalculatorInput = ({ value, onChange, className }) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    const format = (num) => {
        if (isNaN(num)) num = 0;
        return `R$ ${(num || 0).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
    };

    const evaluateExpression = (str) => {
        try {
            if (!str) return 0;
            const sanitizedStr = str.replace(/[^0-9.,+\-*/]/g, '').replace(/,/g, '.');
            if (!sanitizedStr) return 0;
            const result = new Function('return ' + sanitizedStr)();
            return typeof result === 'number' && isFinite(result) ? result : 0;
        } catch (e) {
            const singleNumber = parseFloat(str.replace(/[^0-9.,]/g, '').replace(',', '.'));
            return isNaN(singleNumber) ? 0 : singleNumber;
        }
    };

    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setInputValue(format(value));
        }
    }, [value]);

    const handleFocus = () => {
        setInputValue(value === 0 ? '' : String(value).replace('.', ','));
    };

    const handleChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleBlur = () => {
        const evaluatedValue = evaluateExpression(inputValue);
        onChange(evaluatedValue);
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
            e.target.blur();
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onFocus={handleFocus}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`p-2 border rounded-md w-full text-center font-accounting ${className}`}
        />
    );
};


// --- Componente de Tela de Login ---
function LoginScreen({ companies, onLoginSuccess }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError('');

        setTimeout(() => {
            const company = companies.find(c => c.password === password);
            if (company) {
                onLoginSuccess(company);
            } else {
                setError('Senha incorreta. Tente novamente.');
                setIsLoggingIn(false);
            }
        }, 500); 
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center p-4" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <div className="relative z-10 text-center max-w-sm w-full">
                <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">Controle Financeiro</h1>
                <p className="text-gray-300 mb-8 drop-shadow-md">Acesse o painel do seu restaurante.</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Input de usuário escondido para acessibilidade */}
                    <input type="text" name="username" autoComplete="username" className="hidden" />
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite a senha"
                        className="w-full p-3 text-center bg-white/10 text-white rounded-lg border border-white/30 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all"
                    />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isLoggingIn ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --- Componente de Tela de Carregamento ---
const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Carregando dados...</p>
        </div>
    </div>
);

// --- Componente Modal ---
const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
                {message && <p className="text-gray-600 mb-6">{message}</p>}
                {children}
                <div className="flex justify-center gap-4 mt-6">
                    {onConfirm && (
                         <button onClick={onConfirm} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                            {confirmText}
                        </button>
                    )}
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold">
                        {onConfirm ? cancelText : "Fechar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Componentes das Telas ---

function HistoryScreen({ closings, onEdit, onDelete, onAddNew }) {
    const [searchDate, setSearchDate] = useState('');
    const formatCurrencyDisplay = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const filteredClosings = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

        if (searchDate) {
            return closings.filter(c => c.date === searchDate);
        }
        return closings
            .filter(c => c.date >= thirtyDaysAgoStr)
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [closings, searchDate]);

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-white mb-4">Histórico de Fechamentos</h2>
            
            <div className="bg-white/20 p-3 rounded-lg mb-4 flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-grow">
                    <label htmlFor="searchDate" className="text-white text-sm font-medium">Pesquisar por data:</label>
                    <input id="searchDate" type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="p-2 border rounded-md w-full mt-1" />
                </div>
                <button onClick={() => setSearchDate('')} className="w-full sm:w-auto bg-gray-500 text-white py-2 px-4 rounded-lg shadow hover:bg-gray-600 transition mt-2 sm:mt-6">
                    Limpar Filtro
                </button>
            </div>

            <div className="bg-white/90 p-2 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-200">
                            <tr className="border-b">
                                <th className="p-2">Data</th>
                                <th className="p-2 text-right">Receita Total</th>
                                <th className="p-2 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClosings.length > 0 ? (filteredClosings.map(c => {
                                const sumPeriod = (period) => {
                                    if (!period) return 0;
                                    return allPaymentMethods.reduce((sum, method) => {
                                        const methodValue = period[method];
                                        if (typeof methodValue === 'object' && methodValue !== null) {
                                            return sum + Object.values(methodValue).reduce((a, b) => a + b, 0);
                                        }
                                        return sum + (methodValue || 0);
                                    }, 0);
                                };
                                const totalReceita = sumPeriod(c.almoco) + sumPeriod(c.jantar);
                                return (
                                <tr key={c.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-semibold">{new Date(c.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                    <td className="p-2 text-right text-green-600 font-accounting">{formatCurrencyDisplay(totalReceita)}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => onEdit(c)} className="text-gray-500 hover:text-blue-600 p-1"><EditIcon/></button>
                                        <button onClick={() => onDelete(c.id, c.date)} className="text-gray-500 hover:text-red-600 p-1"><TrashIcon/></button>
                                    </td>
                                </tr>
                                )
                            })) : (<tr><td colSpan="3" className="text-center p-8 text-gray-500">Nenhum fechamento encontrado para o período.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Componente: Tabela de Recebimentos ---
const ReceiptsTable = ({ period, data, onChange }) => {
    const channels = ['salao', 'balcao', 'delivery'];
    const formatCurrencyDisplay = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const periodTotal = useMemo(() => {
        return allPaymentMethods.reduce((sum, method) => {
            const methodValue = data[method];
            if (typeof methodValue === 'object' && methodValue !== null) {
                return sum + Object.values(methodValue).reduce((a, b) => a + b, 0);
            }
            return sum + (methodValue || 0);
        }, 0);
    }, [data]);

    return (
        <div className="border bg-white rounded-lg p-4">
            <h3 className="text-xl font-bold capitalize mb-4">{period}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-center">
                    <thead className="bg-gray-50">
                        <tr className="border-b">
                            <th className="p-2 text-left font-semibold">Forma</th>
                            {channels.map(ch => <th key={ch} className="p-2 capitalize font-semibold">{ch}</th>)}
                            <th className="p-2 text-right font-semibold">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-2 text-left font-medium">Nº de Pessoas</td>
                            {channels.map(ch => (
                                <td key={ch} className="p-1">
                                    <input type="number" value={data.pax[ch] || 0} onChange={e => onChange(parseFloat(e.target.value) || 0, period, 'pax', ch)} className="p-2 border rounded-md w-full text-center" />
                                </td>
                            ))}
                            <td className="p-2 text-right font-bold">{Object.values(data.pax).reduce((a, b) => a + b, 0)}</td>
                        </tr>
                        {allPaymentMethods.map(method => (
                            <tr key={method} className="border-b">
                                <td className="p-2 text-left font-medium capitalize">{paymentMethodLabels[method]}</td>
                                {channels.map(ch => (
                                    <td key={ch} className="p-1">
                                        <CalculatorInput value={data[method]?.[ch] || 0} onChange={val => onChange(val, period, method, ch)} />
                                    </td>
                                ))}
                                <td className="p-2 text-right font-bold font-accounting">{formatCurrencyDisplay(Object.values(data[method] || {}).reduce((a, b) => a + b, 0))}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100">
                            <td className="p-2 text-left font-bold">Total</td>
                            {channels.map(ch => (
                                <td key={ch} className="p-2 text-center font-bold font-accounting">
                                    {formatCurrencyDisplay(allPaymentMethods.reduce((acc, method) => acc + (data[method]?.[ch] || 0), 0))}
                                </td>
                            ))}
                            <td className="p-2 text-right font-extrabold text-lg text-blue-600 font-accounting">{formatCurrencyDisplay(periodTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


// --- Componente: Tabela de Custos de Entregadores ---
const DeliverersCostsTable = ({ data, rates, onChange, onAdd, onRemove }) => {
    const costColumns = ['brotas', 'torrinha', 'retorno', 'outras'];
    const formatCurrencyDisplay = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const grandTotal = useMemo(() => (data || []).reduce((total, d) => total + (d.diaria || 0) + costColumns.reduce((subtotal, col) => subtotal + ((d[col] || 0) * (rates[col] || 0)), 0), 0), [data, rates]);

    return (
        <div className="bg-white rounded-lg p-4 shadow-md"><h3 className="text-xl font-bold mb-4">Entregadores</h3><div className="overflow-x-auto"><table className="w-full text-center">
            <thead className="bg-gray-50"><tr className="border-b">
                <th className="p-2 text-left font-semibold">Nome</th>
                <th className="p-2 font-semibold">Diária</th>
                <th className="p-2 font-semibold">Qtd. Brotas</th>
                <th className="p-2 font-semibold">Qtd. Torrinha</th>
                <th className="p-2 font-semibold">Qtd. Retorno</th>
                <th className="p-2 font-semibold">Qtd. Outras</th>
                <th className="p-2 text-right font-semibold">Total</th>
                <th className="p-2"></th>
            </tr></thead>
            <tbody>
                {(data || []).map((deliverer, index) => {
                    const rowTotal = (deliverer.diaria || 0) + costColumns.reduce((sum, col) => sum + ((deliverer[col] || 0) * (rates[col] || 0)), 0);
                    return (
                        <tr key={index} className="border-b">
                            <td className="p-1"><input type="text" placeholder="Nome" value={deliverer.nome} onChange={(e) => onChange(e.target.value, 'entregadores', index, 'nome')} className="p-2 border rounded-md w-full"/></td>
                            <td className="p-1"><CalculatorInput value={deliverer.diaria || 0} onChange={val => onChange(val, 'entregadores', index, 'diaria')} /></td>
                            {costColumns.map(col => (
                                <td key={col} className="p-1"><input type="number" value={deliverer[col] || 0} onChange={e => onChange(parseFloat(e.target.value) || 0, 'entregadores', index, col)} className="p-2 border rounded-md w-full text-center" /></td>
                            ))}
                            <td className="p-2 text-right font-bold font-accounting">{formatCurrencyDisplay(rowTotal)}</td>
                            <td className="p-1"><button type="button" onClick={() => onRemove('entregadores', index)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon/></button></td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot><tr className="bg-gray-100">
                <td colSpan="6" className="p-2 text-left font-bold">Total Geral</td>
                <td className="p-2 text-right font-extrabold text-lg text-red-600 font-accounting">{formatCurrencyDisplay(grandTotal)}</td>
                <td></td>
            </tr></tfoot>
        </table></div><button type="button" onClick={() => onAdd('entregadores')} className="text-blue-600 hover:text-blue-800 text-sm mt-4 font-medium">Adicionar Entregador</button></div>
    );
};

// --- Componente: Tabela de Contas Assinadas ---
const SignedAccountsTable = ({ data, beneficiaries, onChange, onAdd, onRemove, onAddBeneficiary }) => {
    const formatCurrencyDisplay = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const grandTotal = useMemo(() => (data || []).reduce((total, item) => total + (item.valor || 0), 0), [data]);

    return (
        <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Contas Assinadas (Vendas a Prazo)</h3>
                <button type="button" onClick={onAddBeneficiary} className="flex items-center text-sm bg-blue-500 text-white py-1 px-3 rounded-lg hover:bg-blue-600">
                    <UserPlusIcon className="h-5 w-5 mr-1" />
                    Cadastrar Beneficiário
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr className="border-b">
                            <th className="p-2 font-semibold">Beneficiário</th>
                            <th className="p-2 font-semibold">Observação</th>
                            <th className="p-2 font-semibold">Valor</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data || []).map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-1 w-1/3">
                                    <select value={item.beneficiarioId} onChange={(e) => onChange(e.target.value, 'contasAssinadas', index, 'beneficiarioId')} className="p-2 border rounded-md w-full">
                                        <option value="">Selecione</option>
                                        {beneficiaries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </td>
                                <td className="p-1 w-1/3">
                                    <input type="text" placeholder="Observação" value={item.observacao} onChange={(e) => onChange(e.target.value, 'contasAssinadas', index, 'observacao')} className="p-2 border rounded-md w-full" />
                                </td>
                                <td className="p-1 w-1/4">
                                    <CalculatorInput value={item.valor || 0} onChange={val => onChange(val, 'contasAssinadas', index, 'valor')} />
                                </td>
                                <td className="p-1 text-center">
                                    <button type="button" onClick={() => onRemove('contasAssinadas', index)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                     <tfoot>
                        <tr className="bg-gray-100">
                           <td colSpan="2" className="p-2 text-left font-bold">Total</td>
                           <td className="p-2 text-left font-extrabold text-lg text-green-600 font-accounting">{formatCurrencyDisplay(grandTotal)}</td>
                           <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <button type="button" onClick={() => onAdd('contasAssinadas')} className="text-blue-600 hover:text-blue-800 text-sm mt-4 font-medium">Adicionar Lançamento</button>
        </div>
    );
};


function AddClosingScreen({ onSave, onCancel, companyId, initialDate, beneficiaries, closings, onAddBeneficiary, showModal }) {
    const defaultDate = initialDate || new Date().toISOString().slice(0, 10);
    const [formData, setFormData] = useState({...initialClosingData, date: defaultDate });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const formatCurrencyDisplay = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const beneficiaryDebts = useMemo(() => {
        const debts = new Map();
        beneficiaries.forEach(b => debts.set(b.id, 0));

        const closingsBeforeThisDate = closings.filter(c => c.date < formData.date)
                                               .sort((a,b) => a.date.localeCompare(b.date));

        closingsBeforeThisDate.forEach(closing => {
            (closing.contasAssinadas || []).forEach(debt => {
                if (debts.has(debt.beneficiarioId)) {
                    debts.set(debt.beneficiarioId, (debts.get(debt.beneficiarioId) || 0) + debt.valor);
                }
            });
            (closing.recebimentosContasAssinadas || []).forEach(receipt => {
                 if (debts.has(receipt.beneficiarioId)) {
                    debts.set(receipt.beneficiarioId, (debts.get(receipt.beneficiarioId) || 0) - receipt.valorRecebido);
                }
            });
        });
        return debts;
    }, [closings, beneficiaries, formData.date]);

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setFormData({ ...JSON.parse(JSON.stringify(initialClosingData)), date: newDate });
        setIsEditing(false); // Assume new date is not an edit until data is fetched
    };

    useEffect(() => {
        const fetchClosingData = async () => {
            if (!formData.date || !companyId) {
                setFormData(prev => ({ ...JSON.parse(JSON.stringify(initialClosingData)), date: prev.date }));
                setIsEditing(false);
                return;
            }

            if (isEditing && formData.date === initialDate) return;

            setIsLoading(true);
            try {
                const docRef = doc(db, `artifacts/${appId}/public/data/companies/${companyId}/daily_closings`, formData.date);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const completeData = { ...JSON.parse(JSON.stringify(initialClosingData)), ...data, date: formData.date };
                    setFormData(completeData);
                    setIsEditing(true);
                } else {
                    setFormData(prev => ({...JSON.parse(JSON.stringify(initialClosingData)), date: prev.date }));
                    setIsEditing(false);
                }
            } catch (error) {
                console.error("Erro ao buscar fechamento:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClosingData();
    }, [formData.date, companyId, initialDate, isEditing]);
    
    const handleReceiptChange = (value, period, field, channel) => {
        setFormData(prev => {
            const newPeriodData = { ...prev[period] };
            if (channel) {
                newPeriodData[field] = { ...newPeriodData[field], [channel]: value };
            } else {
                newPeriodData[field] = value;
            }
            return { ...prev, [period]: newPeriodData };
        });
    };

    const handleListChange = (value, section, index, field) => { 
        const newList = [...(formData[section] || [])];
        newList[index] = {...newList[index], [field]: value};

        if(section === 'recebimentosContasAssinadas' && field === 'beneficiarioId'){
            const totalDebt = beneficiaryDebts.get(value) || 0;
            newList[index]['valorRecebido'] = totalDebt > 0 ? totalDebt : 0;
        }

        setFormData({ ...formData, [section]: newList }); 
    };
    
    const addListItem = (section) => {
        const newItem = {
            pagamentosCaixa: { referente: '', valor: 0, categoria: supplierCategories[0] },
            entregadores: { nome: '', diaria: 0, brotas: 0, torrinha: 0, retorno: 0, outras: 0 },
            sangria: { responsavel: '', valor: 0 },
            suprimento: { responsavel: '', valor: 0 },
            contasAssinadas: { beneficiarioId: '', observacao: '', valor: 0 },
            recebimentosContasAssinadas: { beneficiarioId: '', valorRecebido: 0, formaPagamento: 'dinheiro' },
        }[section];
        setFormData({ ...formData, [section]: [...(formData[section] || []), newItem] });
    };

    const removeListItem = (section, index) => { if (formData[section] && formData[section].length > 0) setFormData({ ...formData, [section]: formData[section].filter((_, i) => i !== index) }); };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        showModal(
            "Confirmar Salvamento",
            "Deseja salvar este fechamento?",
            () => onSave(formData)
        );
    };
    
    const summaryTotals = useMemo(() => {
        const totals = {};
        allPaymentMethods.forEach(method => totals[method] = 0);

        // Sum receipts from lunch and dinner
        for(const period of ['almoco', 'jantar']) {
            for(const method of allPaymentMethods) {
                totals[method] += Object.values(formData[period][method] || {}).reduce((a, b) => a + b, 0);
            }
        }
        
        // Add receipts from paying off old debts to their respective payment methods
        (formData.recebimentosContasAssinadas || []).forEach(receipt => {
            if (totals[receipt.formaPagamento] !== undefined) {
                totals[receipt.formaPagamento] += receipt.valorRecebido;
            }
        });

        const totalPagamentosCaixa = (formData.pagamentosCaixa || []).reduce((acc, f) => acc + f.valor, 0);
        const totalEntregadores = (formData.entregadores || []).reduce((acc, e) => acc + e.diaria + (e.brotas * formData.deliveryRates.brotas) + (e.torrinha * formData.deliveryRates.torrinha) + (e.retorno * formData.deliveryRates.retorno) + (e.outras * formData.deliveryRates.outras), 0);
        
        const totalDespesas = totalPagamentosCaixa + totalEntregadores;
        
        const totalNovasContasAssinadas = (formData.contasAssinadas || []).reduce((acc, c) => acc + c.valor, 0);
        const totalBruto = allPaymentMethods.reduce((sum, method) => sum + totals[method], 0) + totalNovasContasAssinadas;
        
        const resultadoLiquido = totalBruto - totalDespesas;
        
        const totalSangria = (formData.sangria || []).reduce((acc, s) => acc + s.valor, 0);
        const totalSuprimento = (formData.suprimento || []).reduce((acc, s) => acc + s.valor, 0);
        
        const recebimentosDinheiro = (formData.recebimentosContasAssinadas || []).filter(r => r.formaPagamento === 'dinheiro').reduce((sum, r) => sum + r.valorRecebido, 0);
        const dinheiroVendas = Object.values(formData.almoco.dinheiro).reduce((a,b) => a+b, 0) + Object.values(formData.jantar.dinheiro).reduce((a,b) => a+b, 0);

        const caixaFinal = formData.aberturaCaixa + dinheiroVendas + recebimentosDinheiro + totalSuprimento - totalSangria - totalDespesas;

        return { ...totals, totalBruto, totalDespesas, resultadoLiquido, caixaFinal };
    }, [formData]);

    return (
        <div className="p-4 pb-20">
            <h2 className="text-2xl font-bold text-white mb-4">{isEditing ? 'Editar Fechamento' : 'Novo Fechamento'}</h2>
            <div className="space-y-6"><form onSubmit={handleSubmit}>
            <div className="bg-white p-4 rounded-lg shadow-md"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-600">Data do Fechamento</label><input type="date" value={formData.date} onChange={handleDateChange} className="p-2 border rounded-md w-full mt-1" required/></div><div><label className="block text-sm font-medium text-gray-600">Abertura de Caixa (R$)</label><CalculatorInput value={formData.aberturaCaixa} onChange={val => setFormData({...formData, aberturaCaixa: val})} /></div></div></div>
            {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner/></div> : (
            <>
            <div className="mt-4"><h3 className="text-xl font-bold mb-2 text-white drop-shadow-md">Recebimentos</h3><div className="grid md:grid-cols-2 gap-4"><ReceiptsTable period="almoco" data={formData.almoco} onChange={handleReceiptChange} /><ReceiptsTable period="jantar" data={formData.jantar} onChange={handleReceiptChange} /></div></div>
            
            <div className="mt-4 bg-white p-4 rounded-lg shadow-md"><h3 className="text-xl font-bold mb-4">Movimentações de Caixa</h3><div className="space-y-4">
                 <div>
                    <h4 className="text-lg font-semibold mb-2 text-green-700">Recebimento de Contas Assinadas</h4>
                    {(formData.recebimentosContasAssinadas || []).map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-center">
                            <div className="md:col-span-1"><label className="text-xs text-gray-500">Beneficiário</label><select value={item.beneficiarioId} onChange={(e) => handleListChange(e.target.value, 'recebimentosContasAssinadas', index, 'beneficiarioId')} className="p-2 border rounded-md w-full"><option value="">Selecione</option>{beneficiaries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                            <div><label className="text-xs text-gray-500">Dívida Total</label><input type="text" readOnly value={formatCurrencyDisplay(beneficiaryDebts.get(item.beneficiarioId) || 0)} className="p-2 border rounded-md w-full bg-gray-100 text-center" /></div>
                            <div><label className="text-xs text-gray-500">Valor Recebido</label><CalculatorInput value={item.valorRecebido || 0} onChange={val => handleListChange(val, 'recebimentosContasAssinadas', index, 'valorRecebido')} /></div>
                            <div className="flex items-end gap-2"><div className="flex-grow"><label className="text-xs text-gray-500">Forma Pag.</label><select value={item.formaPagamento} onChange={(e) => handleListChange(e.target.value, 'recebimentosContasAssinadas', index, 'formaPagamento')} className="p-2 border rounded-md w-full">{allPaymentMethods.map(m => <option key={m} value={m} className="capitalize">{paymentMethodLabels[m]}</option>)}</select></div><button type="button" onClick={() => removeListItem('recebimentosContasAssinadas', index)} className="text-red-500 hover:text-red-700 p-2 mb-1"><TrashIcon/></button></div>
                        </div>
                    ))}
                    <button type="button" onClick={() => addListItem('recebimentosContasAssinadas')} className="text-blue-600 hover:text-blue-800 text-sm mt-2 font-medium">Adicionar Recebimento</button>
                </div>
                <hr/>
                <div><h4 className="text-lg font-semibold mb-2 text-red-600">Sangria (Saídas)</h4>{formData.sangria.map((item, index) => (<div key={index} className="flex gap-2 mb-2 items-center"><input type="text" placeholder="Responsável" value={item.responsavel} onChange={(e) => handleListChange(e.target.value, 'sangria', index, 'responsavel')} className="p-2 border rounded-md flex-grow"/><CalculatorInput value={item.valor} onChange={val => handleListChange(val, 'sangria', index, 'valor')} className="w-32" /><button type="button" onClick={() => removeListItem('sangria', index)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon/></button></div>))}<button type="button" onClick={() => addListItem('sangria')} className="text-blue-600 hover:text-blue-800 text-sm mt-2 font-medium">Adicionar Sangria</button></div>
                <hr/>
                <div><h4 className="text-lg font-semibold mb-2 text-green-600">Suprimento (Entradas)</h4>{formData.suprimento.map((item, index) => (<div key={index} className="flex gap-2 mb-2 items-center"><input type="text" placeholder="Responsável" value={item.responsavel} onChange={(e) => handleListChange(e.target.value, 'suprimento', index, 'responsavel')} className="p-2 border rounded-md flex-grow"/><CalculatorInput value={item.valor} onChange={val => handleListChange(val, 'suprimento', index, 'valor')} className="w-32" /><button type="button" onClick={() => removeListItem('suprimento', index)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon/></button></div>))}<button type="button" onClick={() => addListItem('suprimento')} className="text-blue-600 hover:text-blue-800 text-sm mt-2 font-medium">Adicionar Suprimento</button></div>
            </div></div>

            <div className="mt-4"><h3 className="text-xl font-bold mb-2 text-white drop-shadow-md">Custos e Despesas</h3><div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-md"><h4 className="text-lg font-bold mb-4">Pagamentos Diretos do Caixa</h4>{(formData.pagamentosCaixa || []).map((item, index) => (<div key={index} className="grid grid-cols-1 gap-2 mb-2"><select value={item.categoria} onChange={(e) => handleListChange(e.target.value, 'pagamentosCaixa', index, 'categoria')} className="p-2 border rounded-md w-full"><option disabled>Selecione a Categoria</option>{supplierCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><input type="text" placeholder="Descrição do Pagamento" value={item.referente} onChange={(e) => handleListChange(e.target.value, 'pagamentosCaixa', index, 'referente')} className="p-2 border rounded-md w-full"/><div className="flex items-center gap-2"><CalculatorInput value={item.valor} onChange={val => handleListChange(val, 'pagamentosCaixa', index, 'valor')} className="flex-grow" /><button type="button" onClick={() => removeListItem('pagamentosCaixa', index)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon/></button></div></div>))}<button type="button" onClick={() => addListItem('pagamentosCaixa')} className="text-blue-600 hover:text-blue-800 text-sm mt-2 font-medium">Adicionar Pagamento</button></div>
                <div><div className="bg-white p-4 rounded-lg shadow-md mb-4"><h4 className="text-lg font-bold mb-4">Valores por Entrega</h4><div className="grid grid-cols-2 gap-4">
                    {Object.keys(formData.deliveryRates).map(rateKey => (<div key={rateKey}><label className="block text-sm font-medium text-gray-600 capitalize">Valor {rateKey}</label><CalculatorInput value={formData.deliveryRates[rateKey]} onChange={val => setFormData({...formData, deliveryRates: {...formData.deliveryRates, [rateKey]: val}})} /></div>))}
                </div></div><DeliverersCostsTable data={formData.entregadores || []} rates={formData.deliveryRates} onChange={handleListChange} onAdd={addListItem} onRemove={removeListItem} /></div>
                <SignedAccountsTable data={formData.contasAssinadas || []} beneficiaries={beneficiaries} onChange={handleListChange} onAdd={addListItem} onRemove={removeListItem} onAddBeneficiary={onAddBeneficiary} />
            </div></div>
            <div className="mt-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg"><h3 className="text-xl font-bold mb-4">Resumo do Dia</h3>
                <div className="grid grid-cols-2 gap-2 text-center">
                    {allPaymentMethods.map(method => (
                         <div key={method} className="p-2 bg-gray-700 rounded-lg"><h4 className="text-xs font-semibold text-gray-300 capitalize">{paymentMethodLabels[method]}</h4><p className="text-md font-bold font-accounting">{formatCurrencyDisplay(summaryTotals[method])}</p></div>
                    ))}
                </div>
                <div className="mt-4 border-t border-gray-600 pt-4 grid grid-cols-2 gap-2 text-center">
                     <div className="p-2 bg-blue-900/50 rounded-lg"><h4 className="text-xs font-semibold text-blue-200">Total Bruto</h4><p className="text-lg font-bold font-accounting">{formatCurrencyDisplay(summaryTotals.totalBruto)}</p></div>
                     <div className="p-2 bg-red-900/50 rounded-lg"><h4 className="text-xs font-semibold text-red-200">Total Despesas</h4><p className="text-lg font-bold font-accounting">{formatCurrencyDisplay(summaryTotals.totalDespesas)}</p></div>
                     <div className="p-2 bg-green-900/50 rounded-lg"><h4 className="text-xs font-semibold text-green-200">Resultado Líquido</h4><p className="text-lg font-bold font-accounting">{formatCurrencyDisplay(summaryTotals.resultadoLiquido)}</p></div>
                     <div className="p-2 bg-yellow-900/50 rounded-lg"><h4 className="text-xs font-semibold text-yellow-200">Caixa Final</h4><p className="text-lg font-bold font-accounting">{formatCurrencyDisplay(summaryTotals.caixaFinal)}</p></div>
                </div>
            </div>
            </>
            )}
            <div className="mt-6 flex justify-end gap-4"><button type="submit" className="py-3 px-6 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md font-semibold w-full">{isEditing ? "Atualizar Fechamento" : "Salvar Fechamento"}</button></div>
        </form></div>
        </div>
    );
}

// --- Componentes Geradores de Relatório ---

function SalesReportGenerator({ closings, companyName, onShowMessage, exportToPdf, scriptsReady }) {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);

    const { salesData, grandTotal } = useMemo(() => {
        const sales = {};
        allPaymentMethods.forEach(m => sales[m] = 0);
        
        const filtered = closings.filter(c => c.date >= startDate && c.date <= endDate);
        filtered.forEach(c => {
            ['almoco', 'jantar'].forEach(period => {
                allPaymentMethods.forEach(method => {
                    sales[method] += Object.values(c[period]?.[method] || {}).reduce((a, b) => a + b, 0);
                });
            });
        });

        const grandTotal = Object.values(sales).reduce((a, b) => a + b, 0);
        return { salesData: sales, grandTotal };
    }, [startDate, endDate, closings]);

    const handleExport = (format) => {
        if (!scriptsReady.pdf || !scriptsReady.xlsx) {
            onShowMessage("Aguarde", "As bibliotecas de exportação ainda estão carregando.");
            return;
        }

        const title = `Relatório de Vendas - ${companyName}`;
        const fileName = `relatorio_vendas_${companyName}_${startDate}_a_${endDate}`;
        const head = [['Forma de Pagamento', 'Total (R$)']];
        const body = Object.entries(salesData).map(([key, value]) => [
            paymentMethodLabels[key], 
            value.toFixed(2)
        ]);
        const foot = [['Total Geral', grandTotal.toFixed(2)]];

        if (format === 'pdf') {
            exportToPdf(title, head, body, foot, `${fileName}.pdf`);
        } else {
            const ws = window.XLSX.utils.json_to_sheet([
                ...Object.entries(salesData).map(([key, value]) => ({ 'Forma de Pagamento': paymentMethodLabels[key], 'Total (R$)': value })),
                { 'Forma de Pagamento': 'Total Geral', 'Total (R$)': grandTotal }
            ]);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, "Vendas");
            window.XLSX.utils.writeFile(wb, `${fileName}.xlsx`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row flex-wrap gap-4 items-center">
                <div className="flex-grow"><label htmlFor="startDateSales" className="text-sm font-medium text-gray-700">De:</label><input id="startDateSales" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md w-full" /></div>
                <div className="flex-grow"><label htmlFor="endDateSales" className="text-sm font-medium text-gray-700">Até:</label><input id="endDateSales" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md w-full" /></div>
                <div className="w-full sm:w-auto pt-5 flex gap-2">
                    <button onClick={() => handleExport('csv')} className="w-full sm:w-auto flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition"><ExcelIcon /> CSV</button>
                    <button onClick={() => handleExport('pdf')} className="w-full sm:w-auto flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-lg shadow hover:bg-red-700 transition"><PdfIcon /> PDF</button>
                </div>
            </div>
        </div>
    );
}

function ExpensesReportGenerator({ closings, companyName, onShowMessage, exportToPdf, scriptsReady }) {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);

    const { expensesByCategory, grandTotal } = useMemo(() => {
        const expenses = {};
        supplierCategories.forEach(c => expenses[c] = 0);
        expenses['Entregadores'] = 0;

        const filtered = closings.filter(c => c.date >= startDate && c.date <= endDate);
        filtered.forEach(c => {
            (c.pagamentosCaixa || []).forEach(p => {
                if (expenses[p.categoria] !== undefined) {
                    expenses[p.categoria] += p.valor;
                }
            });
            const totalEntregadores = (c.entregadores || []).reduce((sum, d) => sum + d.diaria + (d.brotas * c.deliveryRates.brotas) + (d.torrinha * c.deliveryRates.torrinha) + (d.retorno * c.deliveryRates.retorno) + (d.outras * c.deliveryRates.outras), 0);
            expenses['Entregadores'] += totalEntregadores;
        });
        const grandTotal = Object.values(expenses).reduce((a, b) => a + b, 0);
        return { expensesByCategory: expenses, grandTotal };
    }, [startDate, endDate, closings]);
    
    const handleExport = (format) => {
        if (!scriptsReady.pdf || !scriptsReady.xlsx) {
            onShowMessage("Aguarde", "As bibliotecas de exportação ainda estão carregando.");
            return;
        }

        const title = `Relatório de Despesas - ${companyName}`;
        const fileName = `relatorio_despesas_${companyName}_${startDate}_a_${endDate}`;
        const head = [['Categoria', 'Total (R$)']];
        const body = Object.entries(expensesByCategory).map(([key, value]) => [key, value.toFixed(2)]);
        const foot = [['Total Geral', grandTotal.toFixed(2)]];

        if (format === 'pdf') {
            exportToPdf(title, head, body, foot, `${fileName}.pdf`);
        } else {
             const ws = window.XLSX.utils.json_to_sheet([
                ...Object.entries(expensesByCategory).map(([key, value]) => ({ 'Categoria': key, 'Total (R$)': value })),
                { 'Categoria': 'Total Geral', 'Total (R$)': grandTotal }
            ]);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, "Despesas");
            window.XLSX.utils.writeFile(wb, `${fileName}.xlsx`);
        }
    };

     return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row flex-wrap gap-4 items-center">
                <div className="flex-grow"><label htmlFor="startDateExp" className="text-sm font-medium text-gray-700">De:</label><input id="startDateExp" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md w-full" /></div>
                <div className="flex-grow"><label htmlFor="endDateExp" className="text-sm font-medium text-gray-700">Até:</label><input id="endDateExp" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md w-full" /></div>
                <div className="w-full sm:w-auto pt-5 flex gap-2">
                    <button onClick={() => handleExport('csv')} className="w-full sm:w-auto flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition"><ExcelIcon /> CSV</button>
                    <button onClick={() => handleExport('pdf')} className="w-full sm:w-auto flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-lg shadow hover:bg-red-700 transition"><PdfIcon /> PDF</button>
                </div>
            </div>
        </div>
    );
}

function SignedAccountsReportGenerator({ closings, beneficiaries, companyName, onShowMessage, exportToPdf, scriptsReady }) {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);

    const reportData = useMemo(() => {
        const data = new Map();
        beneficiaries.forEach(b => data.set(b.id, { name: b.name, startBalance: 0, newDebts: 0, payments: 0, endBalance: 0 }));

        const allClosingsSorted = [...closings].sort((a, b) => a.date.localeCompare(b.date));

        allClosingsSorted.forEach(c => {
            const isBeforePeriod = c.date < startDate;
            const isInPeriod = c.date >= startDate && c.date <= endDate;

            (c.contasAssinadas || []).forEach(debt => {
                if (data.has(debt.beneficiarioId)) {
                    if (isBeforePeriod) data.get(debt.beneficiarioId).startBalance += debt.valor;
                    if (isInPeriod) data.get(debt.beneficiarioId).newDebts += debt.valor;
                }
            });
            (c.recebimentosContasAssinadas || []).forEach(receipt => {
                if (data.has(receipt.beneficiarioId)) {
                    if (isBeforePeriod) data.get(receipt.beneficiarioId).startBalance -= receipt.valorRecebido;
                    if (isInPeriod) data.get(receipt.beneficiarioId).payments += receipt.valorRecebido;
                }
            });
        });

        let totalStart = 0, totalDebts = 0, totalPayments = 0, totalEnd = 0;
        const result = [];
        data.forEach((value, key) => {
            value.endBalance = value.startBalance + value.newDebts - value.payments;
            if (value.startBalance !== 0 || value.newDebts !== 0 || value.payments !== 0 || value.endBalance !== 0) {
                result.push(value);
                totalStart += value.startBalance;
                totalDebts += value.newDebts;
                totalPayments += value.payments;
                totalEnd += value.endBalance;
            }
        });

        return { data: result, totals: { totalStart, totalDebts, totalPayments, totalEnd } };
    }, [startDate, endDate, closings, beneficiaries]);

    const handleExport = (format) => {
        if (!scriptsReady.pdf || !scriptsReady.xlsx) {
            onShowMessage("Aguarde", "As bibliotecas de exportação ainda estão carregando.");
            return;
        }
        
        const title = `Relatório de Contas Assinadas - ${companyName}`;
        const fileName = `relatorio_contas_${companyName}_${startDate}_a_${endDate}`;
        const head = [['Beneficiário', 'Saldo Inicial', 'Novas Dívidas', 'Pagamentos', 'Saldo Final']];
        const body = reportData.data.map(d => [d.name, d.startBalance.toFixed(2), d.newDebts.toFixed(2), d.payments.toFixed(2), d.endBalance.toFixed(2)]);
        const foot = [['Total', reportData.totals.totalStart.toFixed(2), reportData.totals.totalDebts.toFixed(2), reportData.totals.totalPayments.toFixed(2), reportData.totals.totalEnd.toFixed(2)]];

        if (format === 'pdf') {
            exportToPdf(title, head, body, foot, `${fileName}.pdf`);
        } else {
            const wsData = reportData.data.map(d => ({
                'Beneficiário': d.name,
                'Saldo Inicial': d.startBalance,
                'Novas Dívidas': d.newDebts,
                'Pagamentos': d.payments,
                'Saldo Final': d.endBalance
            }));
            wsData.push({
                'Beneficiário': 'Total',
                'Saldo Inicial': reportData.totals.totalStart,
                'Novas Dívidas': reportData.totals.totalDebts,
                'Pagamentos': reportData.totals.totalPayments,
                'Saldo Final': reportData.totals.totalEnd
            });
            const ws = window.XLSX.utils.json_to_sheet(wsData);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, "Contas Assinadas");
            window.XLSX.utils.writeFile(wb, `${fileName}.xlsx`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row flex-wrap gap-4 items-center">
                <div className="flex-grow"><label htmlFor="startDateSigned" className="text-sm font-medium text-gray-700">De:</label><input id="startDateSigned" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md w-full" /></div>
                <div className="flex-grow"><label htmlFor="endDateSigned" className="text-sm font-medium text-gray-700">Até:</label><input id="endDateSigned" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md w-full" /></div>
                <div className="w-full sm:w-auto pt-5 flex gap-2">
                    <button onClick={() => handleExport('csv')} className="w-full sm:w-auto flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition"><ExcelIcon /> CSV</button>
                    <button onClick={() => handleExport('pdf')} className="w-full sm:w-auto flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-lg shadow hover:bg-red-700 transition"><PdfIcon /> PDF</button>
                </div>
            </div>
        </div>
    );
}

function DailyCashFlowReport({ closings, companyName, onShowMessage, scriptsReady }) {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);

    const reportData = useMemo(() => {
        const transactions = [];
        const filteredClosings = closings.filter(c => c.date >= startDate && c.date <= endDate);

        for (const c of filteredClosings) {
            const totalDinheiroVendas = Object.values(c.almoco?.dinheiro || {}).reduce((a, b) => a + b, 0) + Object.values(c.jantar?.dinheiro || {}).reduce((a, b) => a + b, 0);
            if (totalDinheiroVendas > 0) transactions.push({ date: c.date, description: 'Vendas em Dinheiro', value: totalDinheiroVendas });

            (c.recebimentosContasAssinadas || []).forEach(r => {
                if (r.formaPagamento === 'dinheiro' && r.valorRecebido > 0) {
                    transactions.push({ date: c.date, description: `Recebimento Conta Assinada`, value: r.valorRecebido });
                }
            });

            (c.suprimento || []).forEach(s => {
                if (s.valor > 0) transactions.push({ date: c.date, description: `Suprimento (${s.responsavel})`, value: s.valor });
            });

            (c.pagamentosCaixa || []).forEach(f => {
                if (f.valor > 0) transactions.push({ date: c.date, description: `Pag. Direto: ${f.referente}`, value: -f.valor });
            });

            const totalEntregadores = (c.entregadores || []).reduce((sum, d) => sum + d.diaria + (d.brotas * c.deliveryRates.brotas) + (d.torrinha * c.deliveryRates.torrinha) + (d.retorno * c.deliveryRates.retorno) + (d.outras * c.deliveryRates.outras), 0);
            if (totalEntregadores > 0) transactions.push({ date: c.date, description: 'Pagamento Entregadores', value: -totalEntregadores });

            (c.sangria || []).forEach(s => {
                if (s.valor > 0) transactions.push({ date: c.date, description: `Sangria (${s.responsavel})`, value: -s.valor });
            });
        }
        return transactions.sort((a, b) => a.date.localeCompare(b.date));
    }, [startDate, endDate, closings]);

    const handleExportCsv = () => {
        if (!scriptsReady.xlsx) {
            onShowMessage("Aguarde", "A biblioteca de exportação ainda está carregando.");
            return;
        }
        if (!reportData) return;
        
        const wsData = reportData.map(row => ({
            'Data': row.date,
            'Descrição': row.description,
            'Valor': row.value
        }));
        const ws = window.XLSX.utils.json_to_sheet(wsData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Movimentacao Caixa");
        window.XLSX.utils.writeFile(wb, `movimentacao_caixa_${companyName}_${startDate}_a_${endDate}.xlsx`);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row flex-wrap gap-4 items-center">
                <div className="flex-grow">
                    <label htmlFor="startDateCash" className="text-sm font-medium text-gray-700">De:</label>
                    <input id="startDateCash" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md w-full" />
                </div>
                <div className="flex-grow">
                    <label htmlFor="endDateCash" className="text-sm font-medium text-gray-700">Até:</label>
                    <input id="endDateCash" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md w-full" />
                </div>
                <div className="w-full sm:w-auto pt-5">
                    <button onClick={handleExportCsv} className="w-full sm:w-auto flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition">
                        <ExcelIcon /> Exportar CSV
                    </button>
                </div>
            </div>
        </div>
    );
}


function ReportsScreen({ closings, beneficiaries, companyName, onLogout, onShowMessage, exportToPdf, scriptsReady }) {
    const [reportType, setReportType] = useState('sales'); // 'sales', 'expenses', 'signedAccounts', 'cashFlow'

    return (
        <div className="p-4 pb-20">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white">Relatórios</h1>
            </div>
            <div className="flex justify-center bg-white/20 rounded-lg p-1 mb-4 flex-wrap">
                <button onClick={() => setReportType('sales')} className={`flex-1 py-2 rounded-md font-semibold transition-colors ${reportType === 'sales' ? 'bg-white text-blue-600' : 'text-white'}`}>Vendas</button>
                <button onClick={() => setReportType('expenses')} className={`flex-1 py-2 rounded-md font-semibold transition-colors ${reportType === 'expenses' ? 'bg-white text-blue-600' : 'text-white'}`}>Despesas</button>
                <button onClick={() => setReportType('signedAccounts')} className={`flex-1 py-2 rounded-md font-semibold transition-colors ${reportType === 'signedAccounts' ? 'bg-white text-blue-600' : 'text-white'}`}>Contas</button>
                <button onClick={() => setReportType('cashFlow')} className={`flex-1 py-2 rounded-md font-semibold transition-colors ${reportType === 'cashFlow' ? 'bg-white text-blue-600' : 'text-white'}`}>Caixa</button>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm">
                {reportType === 'sales' && <SalesReportGenerator closings={closings} companyName={companyName} onShowMessage={onShowMessage} exportToPdf={exportToPdf} scriptsReady={scriptsReady} />}
                {reportType === 'expenses' && <ExpensesReportGenerator closings={closings} beneficiaries={beneficiaries} companyName={companyName} onShowMessage={onShowMessage} exportToPdf={exportToPdf} scriptsReady={scriptsReady} />}
                {reportType === 'signedAccounts' && <SignedAccountsReportGenerator closings={closings} beneficiaries={beneficiaries} companyName={companyName} onShowMessage={onShowMessage} exportToPdf={exportToPdf} scriptsReady={scriptsReady} />}
                {reportType === 'cashFlow' && <DailyCashFlowReport closings={closings} companyName={companyName} onShowMessage={onShowMessage} scriptsReady={scriptsReady} />}
            </div>
        </div>
    );
}

// --- Componente para cadastrar Beneficiário ---
const BeneficiaryModal = ({ isOpen, onSave, onCancel, showMessage }) => {
    const [name, setName] = useState('');
    const handleSave = () => {
        if (!name.trim()) {
            showMessage("Erro", "O nome do beneficiário não pode estar em branco.");
            return;
        }
        onSave(name);
        setName('');
    };

    return (
        <Modal isOpen={isOpen} title="Cadastrar Novo Beneficiário" onConfirm={handleSave} onCancel={onCancel} confirmText="Salvar">
            <div className="text-left">
                <label htmlFor="beneficiaryName" className="block text-sm font-medium text-gray-700">Nome do Beneficiário</label>
                <input type="text" id="beneficiaryName" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Ex: João da Silva"/>
            </div>
        </Modal>
    );
};

const Header = ({ companyName, onLogout }) => {
    return (
        <header className="p-4 bg-black/30 backdrop-blur-lg sticky top-0 z-20 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">{companyName}</h1>
            <button onClick={onLogout} className="flex items-center justify-center bg-red-500/80 text-white py-2 px-3 rounded-lg shadow hover:bg-red-600/80 transition">
                <LogoutIcon />
            </button>
        </header>
    );
};


// --- Componente Principal ---
export default function App() {
  const [authenticatedCompany, setAuthenticatedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [activeView, setActiveView] = useState('history'); // history, add, reports
  const [editingDate, setEditingDate] = useState(null);
  const [closings, setClosings] = useState([]);
  const [loadingClosings, setLoadingClosings] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, children: null });
  const [isBeneficiaryModalOpen, setIsBeneficiaryModalOpen] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [scriptsReady, setScriptsReady] = useState({ pdf: false, xlsx: false });


  const showModal = (title, message, onConfirm = null) => {
    setModalState({ isOpen: true, title, message, onConfirm: onConfirm ? () => { hideModal(); onConfirm(); } : null });
  };
  const hideModal = () => setModalState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    const loadScript = (id, src) => {
        return new Promise((resolve, reject) => {
            if (document.getElementById(id)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    };

    const loadExportScripts = async () => {
        try {
            await loadScript('xlsx-script', "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js");
            setScriptsReady(prev => ({ ...prev, xlsx: true }));

            await loadScript('jspdf-script', "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
            await loadScript('jspdf-autotable-script', "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
            setScriptsReady(prev => ({ ...prev, pdf: true }));

        } catch (error) {
            console.error(error);
        }
    };

    loadExportScripts();
  }, []);

  const exportToPdf = (title, head, body, foot, fileName, showSummary = false) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    doc.autoTable({
        head: head,
        body: body,
        foot: showSummary ? undefined : foot,
        startY: 20,
        theme: 'grid',
        footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' }
    });
    if(showSummary && foot){
        doc.autoTable({
            body: foot,
            startY: doc.lastAutoTable.finalY + 5,
            theme: 'plain',
            styles: { fontStyle: 'bold' }
        })
    }
    doc.save(fileName);
  };

  useEffect(() => {
    const authAndListen = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
            else { await signInAnonymously(auth); }
        } catch (error) { console.error("Firebase auth failed:", error); }
        onAuthStateChanged(auth, (user) => setIsAuthReady(true));
    };
    authAndListen();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    const docRef = doc(db, configDocPath);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) { setCompanies(docSnap.data().list); } 
      else { setDoc(docRef, { list: initialCompanies }); setCompanies(initialCompanies); }
      setLoadingConfig(false);
    }, (error) => { console.error("Error fetching companies config:", error); setCompanies(initialCompanies); setLoadingConfig(false); });
    return () => unsubscribe();
  }, [isAuthReady]);

  useEffect(() => {
    if (!authenticatedCompany) return;
    setLoadingClosings(true);
    
    const closingsCollectionPath = `artifacts/${appId}/public/data/companies/${authenticatedCompany.id}/daily_closings`;
    const qClosings = query(collection(db, closingsCollectionPath));
    
    const unsubClosings = onSnapshot(qClosings, (snapshot) => {
      const closingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClosings(closingsData);
      setLoadingClosings(false);
    }, (error) => { console.error("Erro ao buscar fechamentos:", error); setLoadingClosings(false); });

    const beneficiariesCollectionPath = `artifacts/${appId}/public/data/companies/${authenticatedCompany.id}/beneficiaries`;
    const qBeneficiaries = query(collection(db, beneficiariesCollectionPath), orderBy('name'));
    const unsubBeneficiaries = onSnapshot(qBeneficiaries, (snapshot) => {
        const beneficiariesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBeneficiaries(beneficiariesData);
    }, (error) => { console.error("Erro ao buscar beneficiários:", error); });

    return () => { unsubClosings(); unsubBeneficiaries(); };
  }, [authenticatedCompany, appId]);


  const handleLoginSuccess = (company) => { setAuthenticatedCompany(company); };
  const handleLogout = () => { setAuthenticatedCompany(null); setActiveView('history'); };

  const handleSave = async (data) => {
    showModal(
        "Confirmar Salvamento",
        "Deseja salvar este fechamento?",
        async () => {
            try {
                const docId = data.date;
                const docRef = doc(db, `artifacts/${appId}/public/data/companies/${authenticatedCompany.id}/daily_closings`, docId);
                await setDoc(docRef, data, { merge: true });
                showModal("Sucesso!", `Fechamento de ${new Date(data.date + 'T12:00:00').toLocaleDateString('pt-BR')} salvo com sucesso!`);
                setActiveView('history');
            } catch (error) { 
                console.error("Erro ao salvar: ", error); 
                showModal('Erro', 'Ocorreu um erro ao salvar o fechamento.'); 
            }
        }
    );
  };
 
  const handleDelete = async (id, date) => {
      const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR');
      showModal("Confirmar Exclusão", `Tem certeza que deseja excluir o fechamento do dia ${formattedDate}?`,
          async () => {
              try { 
                  await deleteDoc(doc(db, `artifacts/${appId}/public/data/companies/${authenticatedCompany.id}/daily_closings`, id)); 
                  showModal('Sucesso', 'O fechamento foi excluído.'); 
              }
              catch(error) { console.error("Erro ao excluir:", error); showModal('Erro', 'Falha ao excluir.'); }
          }
      );
  }

  const handleSaveBeneficiary = async (name) => {
    try {
        const beneficiariesCollectionPath = `artifacts/${appId}/public/data/companies/${authenticatedCompany.id}/beneficiaries`;
        await addDoc(collection(db, beneficiariesCollectionPath), { name });
        showModal("Sucesso", `Beneficiário "${name}" cadastrado.`);
        setIsBeneficiaryModalOpen(false);
    } catch (error) { console.error("Erro ao salvar beneficiário:", error); showModal("Erro", "Não foi possível salvar o beneficiário."); }
  };

  const handleEdit = (closing) => { setEditingDate(closing.date); setActiveView('add'); }
  const handleAddNew = () => { setEditingDate(null); setActiveView('add'); }

  const renderPage = () => {
      if (!isAuthReady || loadingConfig) { return <LoadingScreen />; }
      if (!authenticatedCompany) { return <LoginScreen companies={companies} onLoginSuccess={handleLoginSuccess} />; }

      let currentView;
      switch (activeView) {
        case 'add':
            currentView = <AddClosingScreen onSave={handleSave} onCancel={() => setActiveView('history')} companyId={authenticatedCompany.id} initialDate={editingDate} beneficiaries={beneficiaries} closings={closings} onAddBeneficiary={() => setIsBeneficiaryModalOpen(true)} showModal={showModal} />;
            break;
        case 'reports':
            currentView = <ReportsScreen closings={closings} beneficiaries={beneficiaries} companyName={authenticatedCompany.name} onLogout={handleLogout} onShowMessage={showModal} exportToPdf={exportToPdf} scriptsReady={scriptsReady} />;
            break;
        case 'history':
        default:
            currentView = <HistoryScreen closings={closings} onEdit={handleEdit} onDelete={handleDelete} onAddNew={handleAddNew} />;
            break;
      }

      return (
        <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')" }}>
             <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
             <div className="relative z-10">
                 <Header companyName={authenticatedCompany.name} onLogout={handleLogout} />
                 <div className="pb-16">{currentView}</div>
                 <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/10 backdrop-blur-lg border-t border-white/20 flex justify-around items-center">
                     <button onClick={() => setActiveView('history')} className={`flex flex-col items-center transition-colors ${activeView === 'history' ? 'text-blue-400' : 'text-gray-300'}`}><HomeIcon className="h-6 w-6" /><span className="text-xs">Histórico</span></button>
                     <button onClick={handleAddNew} className={`flex flex-col items-center transition-colors ${activeView === 'add' ? 'text-blue-400' : 'text-gray-300'}`}><PlusCircleIcon className="h-6 w-6" /><span className="text-xs">Adicionar</span></button>
                     <button onClick={() => setActiveView('reports')} className={`flex flex-col items-center transition-colors ${activeView === 'reports' ? 'text-blue-400' : 'text-gray-300'}`}><ChartBarIcon className="h-6 w-6" /><span className="text-xs">Relatórios</span></button>
                 </div>
             </div>
        </div>
      )
  }

  return (
    <div className="App">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap'); .font-accounting { font-family: 'Roboto Mono', monospace; }`}</style>
        <Modal isOpen={modalState.isOpen} title={modalState.title} message={modalState.message} onConfirm={modalState.onConfirm} onCancel={hideModal} />
        <BeneficiaryModal isOpen={isBeneficiaryModalOpen} onCancel={() => setIsBeneficiaryModalOpen(false)} onSave={handleSaveBeneficiary} showMessage={showModal} />
        {renderPage()}
    </div>
  );
}

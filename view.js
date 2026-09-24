
//IMPEDE QUE OUTROS CARACTERES SEJAM INSERIDOS NOS INPUTS
function apenasNumeros(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
}


// Evitar que a URL seja alterada após algum evento
history.replaceState(null, "", "index.html");  // Isso vai limpar a URL sem recarregar a página

	//PARTE VIEW	
        // Seleciona todos os links de navegação e as seções
        const links = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        // Função para mudar a seção ativa
        function activateSection(targetId) {
            sections.forEach(section => {
                section.classList.remove('active'); // Remove 'active' de todas
                if (section.id === targetId) {
                    section.classList.add('active'); // Adiciona na selecionada
                }
            });
        }

        // Configura os cliques nos links de navegação
        links.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Evita o comportamento padrão do link
                const targetId = link.getAttribute('data-target'); // Pega o alvo
                activateSection(targetId);
                window.location.hash = targetId; // Atualiza o hash na URL
            });
        });

        // Verifica o hash inicial na URL e ativa a seção correspondente
        const initialHash = window.location.hash.substring(1);
        if (initialHash) {
            activateSection(initialHash);
        }
		
		
		
		
		
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// Função para exibir todos os dados do paciente e o último salvo
function mostrarHistorico(CPF) {
    // Pega o histórico do localStorage baseado no CPF (caso tenha sido salvo com a chave CPF)
    const existingData = JSON.parse(localStorage.getItem(CPF)) || [];  // Evita erro caso o item não exista

    // Verificando se tem algum dado no histórico
    if (existingData.length > 0) {
        console.log("Histórico completo de pacientes:");
        existingData.forEach((paciente, index) => {
            console.log(`Paciente ${index + 1}:`, paciente);
        });

        // Pegando o último item do histórico
        const ultimoPaciente = existingData[existingData.length - 1];
        console.log("Último paciente salvo:", ultimoPaciente);
    } else {
        console.log("Não há pacientes registrados.");
    }
}

// Exemplo de uso
mostrarHistorico('123456789');  // Passando o CPF como exemplo
// Método para obter o histórico completo do paciente e exibir os dados dos objetos
static history(numRegistro) {
    const CPF = `paciente_${numRegistro}`;
    const existingData = JSON.parse(localStorage.getItem(CPF));

    if (existingData && existingData.length > 0) {
        console.log(`Histórico completo do Paciente ${numRegistro} carregado.`);
        
        // Exibe os dados de cada objeto dentro do histórico
        existingData.forEach((paciente, index) => {
            console.log(`Paciente ${index + 1}:`);
            console.log(`Número de Registro: ${paciente.numRegistro}`);
            console.log(`Nome: ${paciente.nome}`);
            console.log(`Data de Nascimento: ${paciente.dataNascimento}`);
            // Aqui você pode adicionar qualquer outra propriedade do objeto paciente que quiser mostrar
            console.log('---');
        });

        return existingData; // Retorna o histórico completo (se necessário)
    } else {
        console.warn(`Histórico do Paciente ${numRegistro} não encontrado!`);
        return [];
    }
}
// Método para obter e exibir o último dado do paciente
static lastRecord(numRegistro) {
    const CPF = `paciente_${numRegistro}`;
    const existingData = JSON.parse(localStorage.getItem(CPF));

    if (existingData && existingData.length > 0) {
        const ultimoPaciente = existingData[existingData.length - 1]; // Pega o último registro

        console.log(`Último paciente registrado:`);
        console.log(`Número de Registro: ${ultimoPaciente.numRegistro}`);
        console.log(`Nome: ${ultimoPaciente.nome}`);
        console.log(`Data de Nascimento: ${ultimoPaciente.dataNascimento}`);
        // Adicione outras propriedades que você queira exibir

        return ultimoPaciente; // Retorna o último paciente
    } else {
        console.warn(`Nenhum histórico encontrado para o Paciente ${numRegistro}!`);
        return null; // Retorna null caso não tenha dados
    }
}
// Suponha que você tenha um elemento de tabela com id "tabelaPacientes"
const tabela = document.getElementById('tabelaPacientes');
const ultimoPaciente = lastRecord(123456789);

// Se encontrou o último paciente, exibe na tabela
if (ultimoPaciente) {
    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td>${ultimoPaciente.numRegistro}</td>
        <td>${ultimoPaciente.nome}</td>
        <td>${ultimoPaciente.dataNascimento}</td>
        <!-- Adicione outras colunas aqui conforme necessário -->
    `;
    tabela.appendChild(novaLinha);
}


//IMPEDE QUE OUTROS CARACTERES SEJAM INSERIDOS NOS INPUTS
function apenasNumeros(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
}
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


function apenasNumeros(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
}


// Evitar que a URL seja alterada após algum evento
history.replaceState(null, "", "index.html");  // Isso vai limpar a URL sem recarregar a página

		

document.getElementById("save-data").addEventListener("click", () => {
    try {
        const paciente = new Paciente();
        paciente.coletarRespostas();
        paciente.save();
        alert("Dados salvos com sucesso!");
        atualizarSavedData();
    } catch (error) {
        alert(error.message);
    }
});
//PARTE CONTROLLER

document.getElementById("export-data").addEventListener("click", () => {
    const pacientes = [];
    for (let key in localStorage) {
        if (key.startsWith("paciente_")) {
            pacientes.push(...JSON.parse(localStorage.getItem(key)));
        }
    }
    const blob = new Blob([JSON.stringify(pacientes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pacientes.json";
    link.click();
    URL.revokeObjectURL(url);
});

document.getElementById("import-data").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const text = await file.text();
            const importedData = JSON.parse(text);

            if (!Array.isArray(importedData)) {
                throw new Error("O arquivo importado deve conter uma lista de pacientes.");
            }

            importedData.forEach((paciente) => {
                if (!paciente.numRegistro) {
                    throw new Error("Cada paciente deve conter um número de registro válido.");
                }
                const key = `paciente_${paciente.numRegistro}`;
                localStorage.setItem(key, JSON.stringify([paciente]));
            });

            alert("Dados importados com sucesso!");
            atualizarSavedData();
        } catch (error) {
            alert(`Erro ao importar dados: ${error.message}`);
        }
    }
});

document.getElementById("reset-data").addEventListener("click", () => {
    if (confirm("Tem certeza de que deseja **APAGAR** todos os dados? Esta ação é irreversível.")) {
        if (confirm("Esta Ação é **IRREVERSÍVEL** Todos os dados serão **APAGADOS** permanentemente!!! Tem certeza que deseja Continuar?")) {
            localStorage.clear();
            alert("Todos os dados foram apagados.");
            atualizarSavedData();
        } else {
            alert("Ação cancelada. Nenhum dado foi apagado.");
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    atualizarSavedData();
});
//PARTE VIEW
function atualizarSavedData() {
    const savedDataDiv = document.getElementById("saved-data");
    savedDataDiv.innerHTML = ""; // Limpa a div antes de atualizar

    const pacientes = [];
    for (let key in localStorage) {
        if (key.startsWith("paciente_")) {
            pacientes.push(...JSON.parse(localStorage.getItem(key)));
        }
    }

    if (pacientes.length === 0) {
        savedDataDiv.innerHTML = "<p>Nenhum dado salvo.</p>";
        return;
    }

    // Cria uma tabela para exibir os dados
    const table = document.createElement("table");
    table.border = "1";
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Número de Registro</th>
            <th>Idade</th>
            <th>Gênero</th>
            <th>Escolaridade</th>
            <th>Polifarmácia</th>
            <th>Comorbidades</th>
            <th>Última Atualização</th>
            <th>Ações</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    pacientes.forEach((paciente) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${paciente.numRegistro}</td>
            <td>${paciente.idade}</td>
            <td>${paciente.genero === "0" ? "Feminino" : "Masculino"}</td>
            <td>${["Fundamental", "Médio", "Superior"][paciente.escolaridade - 1]}</td>
            <td>${paciente.polifarmacia[0] === "1" ? "Sim" : "Não"}</td>
            <td>${paciente.comorbidades[0]}</td>
            <td>${new Date(paciente.data_hora).toLocaleString()}</td>
        `;

        // Adiciona a funcionalidade de pop-up ao clicar na linha
        tr.addEventListener("click", () => {
            // Criação do pop-up
            const popup = document.createElement("div");
            popup.classList.add("popup");
            popup.style.position = "fixed";
            popup.style.top = "0";
            popup.style.left = "0";
            popup.style.width = "100%";
            popup.style.height = "100%";
            popup.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            popup.style.display = "flex";
            popup.style.justifyContent = "center";
            popup.style.alignItems = "center";

            const popupContent = document.createElement("div");
            popupContent.style.backgroundColor = "#fff";
            popupContent.style.padding = "20px";
            popupContent.style.borderRadius = "5px";
            popupContent.style.position = "relative";
            popupContent.innerHTML = `
                <h3>Detalhes do Paciente</h3>
                <p><strong>Número de Registro:</strong> ${paciente.numRegistro}</p>
                <p><strong>Idade:</strong> ${paciente.idade}</p>
                <p><strong>Gênero:</strong> ${paciente.genero === "0" ? "Feminino" : "Masculino"}</p>
                <p><strong>Escolaridade:</strong> ${["Fundamental", "Médio", "Superior"][paciente.escolaridade - 1]}</p>
                <p><strong>Polifarmácia:</strong> ${paciente.polifarmacia[0] === "1" ? "Sim" : "Não"}</p>
                <p><strong>Comorbidades:</strong> ${paciente.comorbidades.join(", ")}</p>
                <p><strong>Última Atualização:</strong> ${new Date(paciente.data_hora).toLocaleString()}</p>
            `;
            
            // Criando o botão de fechar (X)
            const closeBtn = document.createElement("button");
            closeBtn.textContent = "X";
            closeBtn.style.position = "absolute";
            closeBtn.style.top = "10px";
            closeBtn.style.right = "10px";
            closeBtn.addEventListener("click", () => {
                popup.style.display = "none"; // Fecha o pop-up
            });

            popupContent.appendChild(closeBtn);
            popup.appendChild(popupContent);
            document.body.appendChild(popup);
        });

        // Botão de excluir
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Apagar";
        deleteBtn.addEventListener("click", (event) => {
            event.stopPropagation(); // Impede o clique de propagar para o evento de exibir o pop-up
            if (confirm(`Tem certeza que deseja apagar o registro ${paciente.numRegistro}?`)) {
                localStorage.removeItem(`paciente_${paciente.numRegistro}`);
                alert(`Registro ${paciente.numRegistro} apagado com sucesso!`);
                atualizarSavedData();
            }
        });

        // Botão de editar
        const editBtn = document.createElement("button");
        editBtn.textContent = "Editar";
        editBtn.addEventListener("click", (event) => {
            event.stopPropagation(); // Impede o clique de propagar para o evento de exibir o pop-up
            // Criação do modal para editar
            const modal = document.createElement("div");
            modal.classList.add("modal");
            modal.style.position = "fixed";
            modal.style.top = "0";
            modal.style.left = "0";
            modal.style.width = "100%";
            modal.style.height = "100%";
            modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            modal.style.display = "flex";
            modal.style.justifyContent = "center";
            modal.style.alignItems = "center";

            const modalContent = document.createElement("div");
            modalContent.style.backgroundColor = "#fff";
            modalContent.style.padding = "20px";
            modalContent.style.borderRadius = "5px";
            modalContent.style.position = "relative";

            const closeBtn = document.createElement("button");
            closeBtn.textContent = "X";
            closeBtn.style.position = "absolute";
            closeBtn.style.top = "10px";
            closeBtn.style.right = "10px";
            closeBtn.addEventListener("click", () => {
                modal.style.display = "none"; // Fecha o modal
            });

            modalContent.appendChild(closeBtn);

            const form = document.createElement("form");
            form.innerHTML = `
                <label for="numRegistro">Número de Registro:</label>
                <input type="text" id="numRegistro" name="numRegistro" value="${paciente.numRegistro}" readonly /><br><br>
                <label for="idade">Idade:</label>
                <input type="text" id="idade" name="idade" value="${paciente.idade}" /><br><br>
                <label for="genero">Gênero:</label>
                <select id="genero" name="genero">
                    <option value="0" ${paciente.genero === "0" ? "selected" : ""}>Feminino</option>
                    <option value="1" ${paciente.genero === "1" ? "selected" : ""}>Masculino</option>
                </select><br><br>
                <label for="escolaridade">Escolaridade:</label>
                <select id="escolaridade" name="escolaridade">
                    <option value="1" ${paciente.escolaridade === 1 ? "selected" : ""}>Fundamental</option>
                    <option value="2" ${paciente.escolaridade === 2 ? "selected" : ""}>Médio</option>
                    <option value="3" ${paciente.escolaridade === 3 ? "selected" : ""}>Superior</option>
                </select><br><br>
                <label for="polifarmacia">Polifarmácia:</label>
                <select id="polifarmacia" name="polifarmacia">
                    <option value="1" ${paciente.polifarmacia[0] === "1" ? "selected" : ""}>Sim</option>
                    <option value="0" ${paciente.polifarmacia[0] === "0" ? "selected" : ""}>Não</option>
                </select><br><br>
                <label for="comorbidades">Comorbidades:</label>
                <input type="text" id="comorbidades" name="comorbidades" value="${paciente.comorbidades.join(", ")}" /><br><br>
                <button type="submit">Salvar Alterações</button>
            `;
            modalContent.appendChild(form);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        });

        const actionsTd = document.createElement("td");
        actionsTd.appendChild(deleteBtn);
        actionsTd.appendChild(editBtn);
        tr.appendChild(actionsTd);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    savedDataDiv.appendChild(table);
}
	//PARTE MODEL
	class Paciente {
	
		//Criação de novo registro
		constructor() {  
        
		const numRegistro 	= document.getElementById("num-registro").value;
        const idade 		= parseInt(document.getElementById("idade").value, 10);
		const comorbidades 	= parseInt(document.getElementById("comorbidades").value, 10);
		const polifarmacia 	= document.getElementById("polifarmacia").value;
        
		if (!numRegistro) {
            throw new Error("Número de Registro é obrigatório.");
        }
        if (isNaN(idade) || idade < 1) {
            throw new Error("Idade deve ser um número positivo maior que zero.");
        }
		if (isNaN(comorbidades) || comorbidades < 0) {
            throw new Error("Comorbidades deve ser um número positivo.");
        }

        this.numRegistro 	= numRegistro;
        this.idade 			= idade;
        this.genero 		= document.getElementById("genero").value || null;
        this.escolaridade 	= document.getElementById("escolaridade").value || null;
        this.polifarmacia 	= [polifarmacia];
        this.comorbidades 	= [comorbidades];
        this.rp 			= [];
        this.ra 			= [];
        this.data_hora 		= new Date().toISOString(); // Timestamp automático
    }
	coletarRespostas() {
        for (let i = 1; i <= 16; i++) {
		
            const respostaPaciente = document.querySelector(`input[name=paciente_q${i}]:checked`);
            this.rp.push(respostaPaciente ? respostaPaciente.value : null);

            const respostaAcomp = document.querySelector(`input[name=acomp_q${i}]:checked`);
            this.ra.push(respostaAcomp ? respostaAcomp.value : null);
        }
    }
    // Método para salvar
    save() {
        const CPF = `paciente_${this.numRegistro}`;

        // Verificar se o CPF já existe
        const existingData = JSON.parse(localStorage.getItem(CPF)) || [];
        
		if (existingData.length > 0) {
            throw new Error(`Paciente com o número de registro ${this.numRegistro} já existe!`);
        }
        existingData.push(this);
        localStorage.setItem(CPF, JSON.stringify(existingData));
        console.log(`Paciente ${this.numRegistro} salvo com sucesso!`);
    }

    // Método para obter os dados mais recentes do paciente
    static read(numRegistro) {
        const CPF = `paciente_${numRegistro}`;
        const existingData = JSON.parse(localStorage.getItem(CPF));

        if (existingData && existingData.length > 0) {
            console.log(`Última versão do Paciente ${numRegistro} carregada.`);
            return existingData[existingData.length - 1]; // Retorna a última versão
        } else {
            console.warn(`Paciente ${numRegistro} não encontrado!`);
            return null;
        }
    }

    // Método para obter o histórico completo do paciente
    static history(numRegistro) {
        
		const CPF = `paciente_${numRegistro}`;
        const existingData = JSON.parse(localStorage.getItem(CPF));

        if (existingData && existingData.length > 0) {
            console.log(`Histórico completo do Paciente ${numRegistro} carregado.`);
            return existingData; // Retorna o histórico completo
        } else {
            console.warn(`Histórico do Paciente ${numRegistro} não encontrado!`);
            return [];
        }
    }

    // Método estático para remover o paciente do localStorage
    static remove(numRegistro) {
        
		const CPF = `paciente_${numRegistro}`;
        localStorage.removeItem(CPF);
        console.log(`Paciente ${numRegistro} e seu histórico foram removidos.`);
    }
}



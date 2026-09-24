class Paciente {
    constructor() {
        const numRegistro = document.getElementById("num-registro").value;
        const idade = parseInt(document.getElementById("idade").value, 10);

        if (!numRegistro) {
            throw new Error("Número de Registro é obrigatório.");
        }
        if (isNaN(idade) || idade < 1) {
            throw new Error("Idade deve ser um número positivo.");
        }

        this.numRegistro = numRegistro;
        this.idade = idade;
        this.genero = document.getElementById("genero").value || null;
        this.escolaridade = document.getElementById("escolaridade").value || null;
        this.polifarmacia = document.getElementById("polifarmacia").value || null;
        this.comorbidades = document.getElementById("comorbidades").value || null;
        this.rp = [];
        this.ra = [];
        this.data_hora = new Date().toISOString(); // Timestamp automático
    }

    // Método para salvar ou atualizar o paciente no localStorage
    save() {
        const CPF = `paciente_${this.numRegistro}`;

        // Verificar se o CPF já existe
        const existingData = JSON.parse(localStorage.getItem(CPF)) || [];
        if (existingData.length > 0) {
            throw new Error(`Paciente com o número de registro ${this.numRegistro} já existe!`);
        }

        // Adiciona a nova versão do paciente ao histórico
        existingData.push(this);

        // Salva o histórico completo
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

// Botão para salvar dados
document.getElementById("save-data").addEventListener("click", () => {
    try {
        const paciente = new Paciente();
        paciente.save();
        alert("Dados salvos com sucesso!");
    } catch (error) {
        alert(error.message);
    }
});

// Botão para exportar JSON
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

// Botão para importar JSON
document.getElementById("import-data").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
        const text = await file.text();
        const importedData = JSON.parse(text);
        importedData.forEach((paciente) => {
            const key = `paciente_${paciente.numRegistro}`;
            localStorage.setItem(key, JSON.stringify([paciente]));
        });
        alert("Dados importados com sucesso!");
    }
});

// Botão para resetar dados
document.getElementById("reset-data").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja apagar todos os dados?")) {
        localStorage.clear();
        alert("Todos os dados foram apagados.");
    }
});
// Atualiza o conteúdo da div saved-data
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
            <td>${paciente.polifarmacia === "1" ? "Sim" : "Não"}</td>
            <td>${paciente.comorbidades}</td>
            <td>${new Date(paciente.data_hora).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    savedDataDiv.appendChild(table);
}
document.getElementById("save-data").addEventListener("click", () => {
    try {
        const paciente = new Paciente();
        paciente.save();
        alert("Dados salvos com sucesso!");
        atualizarSavedData(); // Atualiza a div
    } catch (error) {
        alert(error.message);
    }
});
document.getElementById("import-data").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
        const text = await file.text();
        const importedData = JSON.parse(text);
        importedData.forEach((paciente) => {
            const key = `paciente_${paciente.numRegistro}`;
            localStorage.setItem(key, JSON.stringify([paciente]));
        });
        alert("Dados importados com sucesso!");
        atualizarSavedData(); // Atualiza a div
    }
});
document.getElementById("reset-data").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja apagar todos os dados?")) {
        localStorage.clear();
        alert("Todos os dados foram apagados.");
        atualizarSavedData(); // Atualiza a div
    }
});
document.addEventListener("DOMContentLoaded", () => {
    atualizarSavedData();
});

    function apenasNumeros(event) {
        const inpult = event.target;
        inpult.value = inpult.value.replace(/[^0-9]/g, '');
    }


// ******************** Função para permitir apenas números no input ********************
function apenasNumeros(event) {
  const input = event.target;
  input.value = input.value.replace(/[^0-9]/g, '');
}

// ******************** Navegação ********************
const links = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

function activateSection(targetId) {
  sections.forEach(section => {
    section.classList.remove('active');
    if (section.id === targetId) {
      section.classList.add('active');
    }
  });
}

links.forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const targetId = link.getAttribute('data-target');
    activateSection(targetId);
    window.location.hash = targetId;
  });
});

const initialHash = window.location.hash.substring(1);
if (initialHash) {
  activateSection(initialHash);
}

// Limpa o hash da URL sem recarregar a página
history.replaceState(null, "", "index.html");

// ******************** Persistence Adapter com IndexedDB ********************
class IndexedDBPersistenceAdapter {
  constructor(storageKey = 'pacientes') {
    this.storageKey = storageKey;
    this.dbName = 'pacientesDB';
    this.storeName = 'store';
    this.dbPromise = this._initDB();
  }

  _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = event => {
        const db = event.target.result;
        // Certifica-se de que a chave existe
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const getRequest = store.get(this.storageKey);
        getRequest.onsuccess = () => {
          if (getRequest.result === undefined) {
            store.put([], this.storageKey);
          }
        };
        transaction.oncomplete = () => resolve(db);
      };
      request.onerror = event => {
        reject(event.target.error);
      };
    });
  }

  async getData() {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(this.storageKey);
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async setData(data) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(data, this.storageKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async exportJSON() {
    const data = await this.getData();
    return JSON.stringify(data);
  }

  async importJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (Array.isArray(data)) {
        await this.setData(data);
        return true;
      } else {
        throw new Error("Dados importados não são um array.");
      }
    } catch (e) {
      console.error("Erro ao importar JSON:", e);
      return false;
    }
  }
}

// ******************** Paciente Entity ********************
class Paciente {
  constructor({ numRegistro, idade, genero, escolaridade, polifarmacia, comorbidades, rp, ra, data_hora }) {
    if (!numRegistro) {
      throw new Error("Número de Registro é obrigatório.");
    }
    if (isNaN(idade) || idade < 1) {
      throw new Error("Idade deve ser um número positivo maior que zero.");
    }
    if (isNaN(comorbidades) || comorbidades < 0) {
      throw new Error("Comorbidades deve ser um número positivo.");
    }

    this.numRegistro = numRegistro;
    this.idade = idade;
    this.genero = genero || null;
    this.escolaridade = escolaridade || null;
    this.polifarmacia = polifarmacia !== undefined ? [polifarmacia] : [];
    this.comorbidades = comorbidades !== undefined ? [comorbidades] : [];
    this.rp = Array.isArray(rp) ? rp : new Array(16).fill(null);
    this.ra = Array.isArray(ra) ? ra : new Array(16).fill(null);
    this.data_hora = data_hora || new Date().toISOString();
  }
}

// ******************** Paciente Model (adaptado para async) ********************
class PacienteModel {
  constructor(adapter) {
    this.adapter = adapter;
  }

  async getPacientes() {
    return await this.adapter.getData();
  }

  async create(data) {
    const pacientes = await this.getPacientes();
    const paciente = new Paciente(data);
    // Impede duplicação do número de registro
    if (pacientes.some(p => p.numRegistro === paciente.numRegistro)) {
      throw new Error("Paciente com este Número de Registro já existe.");
    }
    pacientes.push(paciente);
    await this.adapter.setData(pacientes);
    return paciente;
  }

  async update(data) {
    const pacientes = await this.getPacientes();
    const index = pacientes.findIndex(p => p.numRegistro === data.numRegistro);
    if (index !== -1) {
      const paciente = new Paciente(data);
      pacientes[index] = paciente;
      await this.adapter.setData(pacientes);
      return paciente;
    }
    throw new Error("Paciente não encontrado para atualização.");
  }

  async delete(numRegistro) {
    let pacientes = await this.getPacientes();
    pacientes = pacientes.filter(p => p.numRegistro !== numRegistro);
    await this.adapter.setData(pacientes);
  }

  async getByNumRegistro(numRegistro) {
    const pacientes = await this.getPacientes();
    return pacientes.find(p => p.numRegistro === numRegistro);
  }

  async exportData() {
    return await this.adapter.exportJSON();
  }

  async importData(jsonData) {
    return await this.adapter.importJSON(jsonData);
  }
}

// ******************** Paciente View (permanece praticamente inalterada) ********************
class PacienteView {
  constructor() {
    // Formulário de cadastro (presente na seção "Cadastrar")
    this.form = document.getElementById('registro');
    this.inputNumRegistro = document.getElementById('num-registro');
    this.inputIdade = document.getElementById('idade');
    this.inputGenero = document.getElementById('genero');
    this.inputEscolaridade = document.getElementById('escolaridade');
    this.inputPolifarmacia = document.getElementById('polifarmacia');
    this.inputComorbidades = document.getElementById('comorbidades');
    // Área para exibir os pacientes (div "saved-data" na seção Buscar)
    this.savedDataDiv = document.getElementById('saved-data');
    this.tableBody = null;
    // Array de perguntas para ambos os modais
    this.perguntas = [
      "Dores no corpo?",
      "Quedas?",
      "Não sentir sede?",
      "Esquecimento que prejudica as atividades do dia a dia?",
      "Não ter vontade de sair de casa?",
      "Pele seca?",
      "Ter hipertensão arterial?",
      "Sentir tontura?",
      "Perde urina com facilidade?",
      "Ter muitas doenças e tomar muitos remédios?",
      "Ter dificuldade para andar?",
      "Dormir pouco?",
      "Não escutar bem?",
      "Ter dificuldade para enxergar?",
      "Não sentir gosto dos alimentos?",
      "Redução da estatura?",
    ];
  }

  clearForm() {
    this.inputNumRegistro.value = '';
    this.inputIdade.value = '';
    this.inputGenero.value = this.inputGenero.options[0].value;
    this.inputEscolaridade.value = this.inputEscolaridade.options[0].value;
    this.inputPolifarmacia.value = this.inputPolifarmacia.options[0].value;
    this.inputComorbidades.value = '';
    this.inputNumRegistro.readOnly = false;

    for (let i = 1; i <= 16; i++) {
      const rpRadios = document.getElementsByName(`paciente_q${i}`);
      rpRadios.forEach(radio => radio.checked = false);
      const raRadios = document.getElementsByName(`acomp_q${i}`);
      raRadios.forEach(radio => radio.checked = false);
    }
  }

  fillForm(paciente) {
    this.inputNumRegistro.value = paciente.numRegistro;
    this.inputIdade.value = paciente.idade;
    this.inputGenero.value = paciente.genero;
    this.inputEscolaridade.value = paciente.escolaridade;
    this.inputPolifarmacia.value = paciente.polifarmacia[0] || '';
    this.inputComorbidades.value = paciente.comorbidades[0] || '';
    this.inputNumRegistro.readOnly = true;

    for (let i = 1; i <= 16; i++) {
      const rpValue = paciente.rp[i - 1];
      if (rpValue !== null) {
        const rpRadio = document.querySelector(`input[name="paciente_q${i}"][value="${rpValue}"]`);
        if (rpRadio) rpRadio.checked = true;
      }
      const raValue = paciente.ra[i - 1];
      if (raValue !== null) {
        const raRadio = document.querySelector(`input[name="acomp_q${i}"][value="${raValue}"]`);
        if (raRadio) raRadio.checked = true;
      }
    }
  }

  convertValue(field, value) {
    if (field === 'genero') return (value === "0" || value === 0) ? 'Feminino' : 'Masculino';
    if (field === 'polifarmacia') return (value === "1" || value === 1) ? 'Sim' : 'Não';
    if (field === 'escolaridade') {
      if (value === "1" || value === 1) return 'Fundamental';
      if (value === "2" || value === 2) return 'Médio';
      if (value === "3" || value === 3) return 'Superior';
    }
    return value;
  }

  renderPacientes(pacientes) {
    this.savedDataDiv.innerHTML = '';
    const table = document.createElement('table');
    table.id = 'paciente-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>
      <th>Número de Registro</th>
      <th>Idade</th>
      <th>Gênero</th>
      <th>Escolaridade</th>
      <th>Polifarmácia</th>
      <th>Comorbidades</th>
      <th>Data/Hora</th>
      <th>Ações</th>
    </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    pacientes.forEach(paciente => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="#" class="view-paciente" data-num="${paciente.numRegistro}">${paciente.numRegistro}</a></td>
        <td>${paciente.idade}</td>
        <td>${this.convertValue('genero', paciente.genero)}</td>
        <td>${this.convertValue('escolaridade', paciente.escolaridade)}</td>
        <td>${this.convertValue('polifarmacia', paciente.polifarmacia[0] || '')}</td>
        <td>${paciente.comorbidades.join(', ')}</td>
        <td>${paciente.data_hora}</td>
        <td class="actions">
          <button data-num="${paciente.numRegistro}" class="edit-btn">Editar</button>
          <button data-num="${paciente.numRegistro}" class="delete-btn">Excluir</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    this.savedDataDiv.appendChild(table);
    this.tableBody = tbody;
  }

  renderPacienteModal(paciente) {
    document.body.style.overflow = 'hidden';
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal');
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.position = 'relative';
    modalContent.style.paddingTop = '40px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '24px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.color = '#333';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '1001';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    });

    modalContent.innerHTML += `
      <h2>Detalhes do Paciente</h2>
      <table>
        <tr><td>Número de Registro</td><td>${paciente.numRegistro}</td></tr>
        <tr><td>Idade</td><td>${paciente.idade}</td></tr>
        <tr><td>Gênero</td><td>${this.convertValue('genero', paciente.genero)}</td></tr>
        <tr><td>Escolaridade</td><td>${this.convertValue('escolaridade', paciente.escolaridade)}</td></tr>
        <tr><td>Polifarmácia</td><td>${this.convertValue('polifarmacia', paciente.polifarmacia[0] || '')}</td></tr>
        <tr><td>Comorbidades</td><td>${paciente.comorbidades.join(', ')}</td></tr>
        <tr><td>Data/Hora</td><td>${paciente.data_hora}</td></tr>
      </table>
      <h3>Respostas do Paciente (RP)</h3>
      <table>
        <thead>
          <tr><th>Pergunta</th><th>Resposta</th></tr>
        </thead>
        <tbody>
          ${paciente.rp.map((res, i) => `<tr><td>Q${i+1}</td><td>${res !== null ? (res === "1" ? "SIM" : "NÃO") : '-'}</td></tr>`).join('')}
        </tbody>
      </table>
      <h3>Respostas do Acompanhante (RA)</h3>
      <table>
        <thead>
          <tr><th>Pergunta</th><th>Resposta</th></tr>
        </thead>
        <tbody>
          ${paciente.ra.map((res, i) => `<tr><td>Q${i+1}</td><td>${res !== null ? (res === "1" ? "SIM" : "NÃO") : '-'}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    modalContent.prepend(closeButton);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);
  }

  renderEditPacienteModal(paciente, onSaveCallback) {
    document.body.style.overflow = 'hidden';
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal');
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.position = 'relative';
    modalContent.style.paddingTop = '40px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '24px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.color = '#333';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '1001';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    });

    const form = document.createElement('form');
    form.id = 'edit-registro';
    form.innerHTML = `
      <label for="edit-num-registro">Número de Registro</label>
      <input type="text" id="edit-num-registro" name="num-registro" maxlength="18" oninput="apenasNumeros(event)" required>
      <br><br>
      <label for="edit-idade">Idade</label>
      <input type="number" id="edit-idade" name="idade" min="1" required>
      <br><br>
      <label for="edit-genero">Gênero</label>
      <select id="edit-genero" name="genero" required>
          <option value="0">Feminino</option>
          <option value="1">Masculino</option>
      </select>
      <br><br>
      <label for="edit-escolaridade">Escolaridade</label>
      <select id="edit-escolaridade" name="escolaridade" required>
          <option value="1">Fundamental</option>
          <option value="2">Médio</option>
          <option value="3">Superior</option>
      </select>
      <br><br>
      <label for="edit-polifarmacia">Polifarmácia</label>
      <select id="edit-polifarmacia" name="polifarmacia" required>
          <option value="1">Sim</option>
          <option value="0">Não</option>
      </select>
      <br><br>
      <label for="edit-comorbidades">Comorbidades</label>
      <input type="number" id="edit-comorbidades" name="comorbidades" min="0" value="0" required>
      <br><br>
    `;
    let tableHTML = `
      <div id="edit-perguntasDiv">
      <table>
        <thead>
          <tr>
            <th rowspan="2">Perguntas</th>
            <th colspan="2">Pacientes</th>
            <th colspan="2">Acompanhante</th>
          </tr>
          <tr>
            <th>SIM</th>
            <th>NÃO</th>
            <th>SIM</th>
            <th>NÃO</th>
          </tr>
        </thead>
        <tbody>
    `;
    this.perguntas.forEach((pergunta, index) => {
      tableHTML += `
        <tr>
          <td>${pergunta}</td>
          <td><input type="radio" name="paciente_q${index + 1}" value="1"></td>
          <td><input type="radio" name="paciente_q${index + 1}" value="0"></td>
          <td><input type="radio" name="acomp_q${index + 1}" value="1"></td>
          <td><input type="radio" name="acomp_q${index + 1}" value="0"></td>
        </tr>
      `;
    });
    tableHTML += `
        </tbody>
      </table>
      <button type="reset" style="background-color: #aaa">Limpar Seleção</button>
      </div>
      <br>
      <button type="button" id="edit-save-data">Salvar Dados</button>
    `;
    form.innerHTML += tableHTML;

    form.querySelector('#edit-num-registro').value = paciente.numRegistro;
    form.querySelector('#edit-num-registro').readOnly = true;
    form.querySelector('#edit-idade').value = paciente.idade;
    form.querySelector('#edit-genero').value = paciente.genero;
    form.querySelector('#edit-escolaridade').value = paciente.escolaridade;
    form.querySelector('#edit-polifarmacia').value = paciente.polifarmacia[0] || '';
    form.querySelector('#edit-comorbidades').value = paciente.comorbidades[0] || 0;
    
    for (let i = 1; i <= 16; i++) {
      const rpValue = paciente.rp[i - 1];
      if (rpValue !== null) {
        const rpRadio = form.querySelector(`input[name="paciente_q${i}"][value="${rpValue}"]`);
        if (rpRadio) rpRadio.checked = true;
      }
      const raValue = paciente.ra[i - 1];
      if (raValue !== null) {
        const raRadio = form.querySelector(`input[name="acomp_q${i}"][value="${raValue}"]`);
        if (raRadio) raRadio.checked = true;
      }
    }

    modalContent.appendChild(form);
    modalContent.prepend(closeButton);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    form.querySelector('#edit-save-data').addEventListener('click', () => {
      const updatedData = {
        numRegistro: form.querySelector('#edit-num-registro').value,
        idade: parseInt(form.querySelector('#edit-idade').value, 10),
        genero: form.querySelector('#edit-genero').value,
        escolaridade: form.querySelector('#edit-escolaridade').value,
        polifarmacia: form.querySelector('#edit-polifarmacia').value,
        comorbidades: parseInt(form.querySelector('#edit-comorbidades').value, 10),
        rp: [],
        ra: [],
        data_hora: new Date().toISOString()
      };
      for (let i = 1; i <= 16; i++) {
        const rpRadio = form.querySelector(`input[name="paciente_q${i}"]:checked`);
        updatedData.rp.push(rpRadio ? rpRadio.value : null);
        const raRadio = form.querySelector(`input[name="acomp_q${i}"]:checked`);
        updatedData.ra.push(raRadio ? raRadio.value : null);
      }
      onSaveCallback(updatedData);
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    });
  }
}

// ******************** Paciente Controller (adaptado para async) ********************
class PacienteController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.editing = false;

    // Renderiza os pacientes após carregá-los do IndexedDB
    this.model.getPacientes().then(pacientes => {
      this.view.renderPacientes(pacientes);
    });

    const saveButton = document.getElementById('save-data');
    saveButton.addEventListener('click', (e) => this.handleFormSubmit(e));

    this.view.savedDataDiv.addEventListener('click', (e) => this.handleTableClick(e));
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    try {
      // Coleta os dados do formulário de cadastro
      const formData = {
        numRegistro: document.getElementById('num-registro').value,
        idade: parseInt(document.getElementById('idade').value, 10),
        genero: document.getElementById('genero').value,
        escolaridade: document.getElementById('escolaridade').value,
        polifarmacia: document.getElementById('polifarmacia').value,
        comorbidades: parseInt(document.getElementById('comorbidades').value, 10),
        rp: [],
        ra: [],
        data_hora: new Date().toISOString()
      };
      for (let i = 1; i <= 16; i++) {
        const rpRadio = document.querySelector(`input[name="paciente_q${i}"]:checked`);
        formData.rp.push(rpRadio ? rpRadio.value : null);
        const raRadio = document.querySelector(`input[name="acomp_q${i}"]:checked`);
        formData.ra.push(raRadio ? raRadio.value : null);
      }
      
      if (this.editing) {
        await this.model.update(formData);
        this.editing = false;
        this.view.inputNumRegistro.readOnly = false;
      } else {
        const existingPaciente = await this.model.getByNumRegistro(formData.numRegistro);
        if (existingPaciente) {
          throw new Error("Paciente com este Número de Registro já existe. Utilize a opção de editar.");
        }
        await this.model.create(formData);
      }
      this.view.clearForm();
      const pacientes = await this.model.getPacientes();
      this.view.renderPacientes(pacientes);
      alert("Dados salvos com sucesso!");
    } catch (error) {
      alert(error.message);
    }
  }

  async handleTableClick(e) {
    const target = e.target;
    const numRegistro = target.getAttribute('data-num');
    if (target.classList.contains('view-paciente')) {
      e.preventDefault();
      const paciente = await this.model.getByNumRegistro(numRegistro);
      if (paciente) {
        this.view.renderPacienteModal(paciente);
      }
    } else if (target.classList.contains('edit-btn')) {
      const paciente = await this.model.getByNumRegistro(numRegistro);
      if (paciente) {
        this.view.renderEditPacienteModal(paciente, async (updatedData) => {
          try {
            await this.model.update(updatedData);
            const pacientes = await this.model.getPacientes();
            this.view.renderPacientes(pacientes);
            alert("Dados atualizados com sucesso!");
          } catch (error) {
            alert(error.message);
          }
        });
      }
    } else if (target.classList.contains('delete-btn')) {
      if (confirm('Deseja excluir este paciente?')) {
        await this.model.delete(numRegistro);
        const pacientes = await this.model.getPacientes();
        this.view.renderPacientes(pacientes);
      }
    }
  }
}

// ******************** Inicialização e Funcionalidades de Backup ********************
document.addEventListener('DOMContentLoaded', async () => {
  // Utiliza o adapter com IndexedDB em vez de localStorage
  const adapter = new IndexedDBPersistenceAdapter('pacientes');
  const model = new PacienteModel(adapter);
  const view = new PacienteView();
  new PacienteController(model, view);

  const exportButton = document.getElementById('export-data');
  exportButton.addEventListener('click', async () => {
    const jsonData = await model.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pacientes_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const importInput = document.getElementById('import-data');
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const result = await model.importData(e.target.result);
        if (result) {
          alert('Dados importados com sucesso!');
          const pacientes = await model.getPacientes();
          view.renderPacientes(pacientes);
        } else {
          alert('Erro ao importar os dados.');
        }
      } catch (err) {
        alert('Arquivo inválido ou erro ao importar.');
      }
    };
    reader.readAsText(file);
  });
});

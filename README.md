# 💻 Modelador de AFD Interativo

> Um editor e simulador visual moderno, interativo e de alta fidelidade para **Autômatos Finitos Determinísticos (AFD)**.

Este projeto foi desenvolvido com foco em acessibilidade pedagógica, riqueza estética e robustez técnica para auxiliar estudantes e professores nas disciplinas de **Teoria da Computação**, **Linguagens Formais e Autômatos** e **Compiladores**. 

O sistema funciona inteiramente no lado do cliente (*client-side*), dispensando instalações complexas, servidores ou dependências externas — basta abrir o arquivo no seu navegador!

---

## ✨ Principais Funcionalidades

### 🎨 1. Design Visual Premium & Acessível
*   **Tema Híbrido Dinâmico**: Alternância instantânea entre **Modo Claro** e **Modo Escuro** adaptativos.
*   **Aparência Moderna**: Baseada em paletas de cores equilibradas e técnicas de *glassmorphism* (efeito de vidro translúcido).
*   **Tipografia Refinada**: Utilização das fontes *Outfit* (títulos), *Inter* (interface) e *Fira Code* (fontes monoespaçadas acadêmicas para o autômato).
*   **Interface Responsiva**: Layout flexível adaptado para telas de computadores, tablets e dispositivos móveis.

### 🕹️ 2. Edição Totalmente Visual & Gestos no Canvas
*   **Criação Rápida de Estados**: Dê um duplo clique no espaço vazio do canvas para posicionar um novo estado onde desejar.
*   **Conexão de Transições por Arraste**: Segure a tecla **Shift** (ou ative o botão "Criar Transições" na barra de ferramentas) e arraste de um estado de origem até o de destino para criar conexões elásticas interativas.
*   **Menu de Contexto Customizado (Botão Direito)**: Clique com o botão direito sobre um estado para marcá-lo como inicial, alternar seu status de aceitação ou excluí-lo.
*   **Auto-Organização Geométrica**: Um motor matemático integrado permite alinhar e organizar todos os nós do autômato em uma circunferência perfeita com apenas um clique.
*   **Evitação de Sobreposição**: Transições bidirecionais entre os mesmos estados são desenhadas automaticamente em formato curvo e arqueado para manter o diagrama limpo.

### 💾 3. Salvamento Automático & Persistência de Dados
*   **LocalStorage Integrado**: Todo o seu progresso (estados, posições no canvas, alfabeto e tabela) é salvo automaticamente a cada interação. Se você recarregar a página, o autômato continuará exatamente onde você parou.
*   **Importação e Exportação JSON**: Salve seus diagramas e regras estruturadas em arquivos locais e compartilhe com colegas ou envie como tarefas acadêmicas.
*   **Exportação PNG em Alta Definição**: Gere imagens em alta resolução (com fator DPR = 2) com fundo transparente, claro ou escuro, perfeitamente otimizadas para inclusão em relatórios acadêmicos e artigos escritos em LaTeX.

### ⚡ 4. Simulador Integrado de Cadeias (Passo a Passo e Lote)
O painel de simulação conta com duas abas avançadas de computação:
*   **Aba "Única Cadeia" (Simulação Interativa)**:
    *   Validação em tempo real.
    *   Execução **passo a passo** com destaque visual do símbolo atualmente processado e animação luminosa no grafo, mostrando exatamente qual estado e transição estão ativos.
*   **Aba "Testar Lote" (Simulação em Lote)**:
    *   Permite inserir dezenas de cadeias simultaneamente (uma por linha) para rodar testes rápidos.
    *   Apresenta uma tabela de resultados limpa com badges visuais coloridos e detalhes sobre estados de parada e falhas.

---

## 🎮 Guia de Atalhos & Interação no Canvas

| Ação | Atalho / Gesto | Descrição |
| :--- | :--- | :--- |
| **Criar Estado** | Clique duplo no vazio | Cria um novo estado no local exato do cursor. |
| **Mover Estado** | Clique simples e arraste | Reposiciona o estado de forma livre pelo canvas. |
| **Alternar Aceitação** | Clique duplo no estado | Define se o estado é final (círculo duplo) ou não. |
| **Abrir Opções** | Botão direito no estado | Abre o menu de contexto moderno para o estado selecionado. |
| **Criar Transição** | Shift + Arraste entre nós | Cria uma nova ligação e abre o modal de seleção de símbolos. |
| **Modo Criação** | Botão "Mover Nós / Criar Transições" | Permite desenhar transições no touch-screen/mobile sem usar o teclado. |

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias web puras (*vanilla*) para garantir longevidade, máxima performance e portabilidade:
*   **HTML5** (Estrutura semântica)
*   **CSS3** (Estilização responsiva personalizada, variáveis de cor dinâmicas e transições fluidas)
*   **JavaScript ES6** (Manipulação de canvas bidimensional, lógica de autômatos formais e persistência offline)

---

## 🚀 Como Executar Localmente

Não há processos de build ou instalação necessários.

1.  Clone este repositório:
    ```bash
    git clone https://github.com/seu-usuario/modelador-afd-interativo.git
    ```
2.  Navegue até a pasta do projeto:
    ```bash
    cd modelador-afd-interativo
    ```
3.  Abra o arquivo `Modelador_AFD_Interativo.html` em qualquer navegador (Chrome, Firefox, Safari, Edge):
    *   No Windows/macOS/Linux: Clique duas vezes sobre o arquivo no explorador de arquivos.
    *   Ou execute a página localmente via terminal se possuir o Python instalado:
        ```bash
        python -m http.server 8000
        ```
        Em seguida, acesse `http://localhost:8000/Modelador_AFD_Interativo.html`.

---

## 📄 Licença

Este projeto está licenciado sob a licença **MIT** — sinta-se livre para usar, estudar, modificar e distribuir em suas próprias salas de aula ou projetos pessoais. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.

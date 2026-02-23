# Revisor de Planilhas de Micro Provas

App web simples para:

1. Enviar uma planilha de micro prova (`.xlsx`/`.xls`);
2. Ler cada aba e limpar tags HTML do conteúdo textual (ex.: `<br>`, `<strong>`, `<p>`);
3. Exportar uma nova planilha com o mesmo conteúdo, mas em texto puro (com quebras de linha padrão);
4. Baixar com o mesmo nome base, adicionando sufixo `-revisada`.

## Como testar agora (rápido)

1. No terminal, rode:
   ```bash
   python3 -m http.server 4173
   ```
2. Abra no navegador: `http://localhost:4173`
3. Selecione uma planilha no campo **Arquivo de entrada**.
4. Clique em **Processar planilha**.
5. Veja o resumo e a prévia das células alteradas.
6. Clique em **Exportar planilha revisada** para baixar o arquivo final.

## Exemplo de validação manual

- Se uma célula tiver: `Texto A<br><strong>Texto B</strong>`
- O arquivo exportado deve ficar com texto puro, como:
  - `Texto A`
  - `Texto B`

## Observações

- A estrutura de abas e células é preservada.
- O foco do ajuste é transformar HTML em texto puro para evitar que tags sejam salvas literalmente no banco de dados.

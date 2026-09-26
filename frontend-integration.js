// URL de implantação do Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwj0L7SouhMZ0O-DBY19e3JY_Y4cijjs3McGkLEiUbjkTbERIGDKHQb7IvqRfmdALJZ/exec';

/**
 * Envia uma ou mais fotos para o Drive via Apps Script.
 * @param {string} remetente - nome de quem está enviando (campo "Quem está enviando")
 * @param {string} legenda - legenda opcional da foto
 * @param {FileList|File[]} arquivos - arquivos escolhidos no input de upload
 */
async function enviarFotos(remetente, legenda, arquivos) {
  const fotosBase64 = await Promise.all(
    Array.from(arquivos).map((file) => converterParaBase64(file))
  );

  const payload = {
    remetente: remetente,
    fotos: fotosBase64.map((base64, i) => ({
      nome: remetente,
      legenda: legenda,
      base64: base64.split(',')[1], // remove o prefixo "data:image/...;base64,"
      mimeType: arquivos[i].type
    }))
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    // text/plain evita o preflight de CORS, que o Apps Script não trata bem
    headers: { 'Content-Type': 'text/plain' }
  });

  const resultado = await response.json();
  if (!resultado.sucesso) {
    throw new Error(resultado.erro || 'Falha ao enviar fotos');
  }
  return resultado.arquivos;
}

function converterParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Apps Script que recebe fotos em base64 e salva numa pasta do Google Drive.
 * Publique como "App da Web" com acesso "Qualquer pessoa".
 */

// pasta criada pelo próprio script no Drive de quem é dono dele
var NOME_PASTA = 'Fotos Jean Pierre 1 ano';

function pegarPasta() {
  var pastas = DriveApp.getFoldersByName(NOME_PASTA);
  if (!pastas.hasNext()) {
    throw new Error('Pasta "' + NOME_PASTA + '" não encontrada no Drive');
  }
  return pastas.next();
}

function doPost(e) {
  try {
    var folder = pegarPasta();
    var data = JSON.parse(e.postData.contents);

    var fotos = data.fotos; // array de { nome, legenda, base64, mimeType }
    var resultados = [];

    fotos.forEach(function (foto) {
      var blob = Utilities.newBlob(
        Utilities.base64Decode(foto.base64),
        foto.mimeType,
        foto.nome + '_' + new Date().getTime() + '.jpg'
      );
      var file = folder.createFile(blob);
      /* o arquivo herda da pasta o acesso "qualquer pessoa com o link", que é o que
         deixa a galeria do site mostrar a foto. Não dá para redefinir isso aqui: o
         Drive recusa sobrescrever no arquivo uma permissão herdada do pai, com
         "Access denied". Quem controla o acesso é a pasta. */
      file.setDescription('Enviado por: ' + data.remetente + ' | Legenda: ' + foto.legenda);

      resultados.push({
        id: file.getId(),
        url: file.getUrl(),
        nomeArquivo: file.getName()
      });
    });

    return responder({ sucesso: true, arquivos: resultados });

  } catch (error) {
    return responder({ sucesso: false, erro: error.toString() });
  }
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * O site chama isto ao abrir, para montar a galeria com tudo que já foi
 * enviado. É o que faz o álbum ser o mesmo para todos os convidados, em vez
 * de cada um ver só o que mandou do próprio aparelho.
 */
function doGet(e) {
  try {
    var folder = pegarPasta();
    var arquivos = folder.getFiles();
    var fotos = [];

    while (arquivos.hasNext()) {
      var file = arquivos.next();
      /* a pasta pode ter outros arquivos (um teste, algo arrastado sem querer) */
      if (file.getMimeType().indexOf('image/') !== 0) continue;

      /* o doPost grava "Enviado por: X | Legenda: Y" na descrição */
      var partes = (file.getDescription() || '')
        .match(/^Enviado por:\s*([\s\S]*?)\s*\|\s*Legenda:\s*([\s\S]*)$/);

      fotos.push({
        id: file.getId(),
        url: file.getUrl(),
        autor: partes ? partes[1] : '',
        legenda: partes ? partes[2] : '',
        quando: file.getDateCreated().getTime()
      });
    }

    /* mais recentes primeiro, que é a ordem em que a galeria mostra */
    fotos.sort(function (a, b) { return b.quando - a.quando; });

    return responder({ sucesso: true, fotos: fotos });

  } catch (error) {
    return responder({ sucesso: false, erro: error.toString() });
  }
}

/**
 * Rode esta função pelo editor (botão "Executar") para conferir se o script
 * consegue gravar na pasta. O arquivo de teste vai para a lixeira no final.
 */
function testarDrive() {
  var folder = pegarPasta();
  var file = folder.createFile('teste_autorizacao.txt', 'ok');
  Logger.log('Pasta OK: ' + folder.getName() + ' | id: ' + folder.getId());
  Logger.log('Acesso herdado pelo arquivo: ' + file.getSharingAccess());
  file.setTrashed(true);
}

/**
 * Rode uma vez pelo editor para deixar a pasta como "qualquer pessoa com o
 * link pode ver". Os arquivos criados dentro herdam esse acesso, que é o que
 * a galeria do site precisa para exibir a foto. Com acesso de leitura (e não
 * de edição), ninguém de fora consegue apagar as fotos dos convidados; o
 * envio continua funcionando porque o script grava como o dono da pasta.
 */
function ajustarAcessoDaPasta() {
  var folder = pegarPasta();
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  Logger.log('Acesso da pasta: ' + folder.getSharingAccess() +
             ' | permissão: ' + folder.getSharingPermission());
}

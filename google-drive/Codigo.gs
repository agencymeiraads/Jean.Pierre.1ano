/**
 * Apps Script que recebe fotos em base64 e salva numa pasta do Google Drive.
 * Publique como "App da Web" com acesso "Qualquer pessoa".
 */

function doPost(e) {
  try {
    var folder = DriveApp.getFolderById('1YnEDcMlgFZfZOivTP5slYvqeNFRQSuVK');
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
      // qualquer pessoa com o link pode ver (é o que deixa a galeria do site mostrar a foto)
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      file.setDescription('Enviado por: ' + data.remetente + ' | Legenda: ' + foto.legenda);

      resultados.push({
        id: file.getId(),
        url: file.getUrl(),
        nomeArquivo: file.getName()
      });
    });

    return ContentService
      .createTextOutput(JSON.stringify({ sucesso: true, arquivos: resultados }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ sucesso: false, erro: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('API ativa. Use POST para enviar fotos.');
}

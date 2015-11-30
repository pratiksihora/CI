
var contentfile = require('../controller/contentfile.controller');
module.exports = function (app) {
    app.route('/getcontentfile')
      .post(contentfile.getcontentfile);
    app.route('/checkmetadata')
      .post(contentfile.checkmetadata);
    app.route('/uploadWallpaper')
      .post(contentfile.uploadwallpaper);
    app.route('/uploadVideo')
      .post(contentfile.uploadvideo);
    app.route('/uploadAudio')
      .post(contentfile.uploadaudio);
    app.route('/uploadAudiozip')
      .post(contentfile.uploadaudiozip);
    app.route('/uploadAppsGames')
      .post(contentfile.uploadappsgame);
    app.route('/uploadText')
      .post(contentfile.uploadtext);
    app.route('/uploadThumb')
      .post(contentfile.uploadthumb);
    app.route('/uploadotherfiles')
     .post(contentfile.uploadotherfiles);
    app.route('/replaceFile')
    .post(contentfile.replaceFile);

}


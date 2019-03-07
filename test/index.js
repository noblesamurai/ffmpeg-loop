const expect = require('chai').expect;
const ffmpegLoop = require('..');
const path = require('path');

describe('ffmpeg loop', function () {
  it('should return an ffmpeg proc', function () {
    const opts = { height: 100, width: 100, fps: 30 };
    const command = ffmpegLoop('asdf', opts);
    expect(command).to.be.ok();
    expect(command.pipe).to.be.ok();
    command.kill();
  });

  it('should apply a crop filter', function (done) {
    this.timeout(5000); // this takes a long time on travis for some reason?
    const opts = { height: 720, width: 720, fps: 30, cropWidth: 1080, cropHeight: 1080, cropX: 400, cropY: 0 };
    const command = ffmpegLoop(path.join(__dirname, 'fixtures/user_video-30.mp4'), opts);
    command.once('start', cmd => {
      try {
        expect(cmd).to.match(/crop=1080:1080:400:0/);
      } catch (err) {
        done(err);
      }
    });
    command.once('error', done);
    const stream = command.pipe();
    stream.on('data', function (data) {
      try {
        expect(data).to.be.ok();
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});

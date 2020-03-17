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
    const opts = {
      height: 28,
      width: 50,
      fps: 30,
      cropWidth: 12,
      cropHeight: 24,
      cropX: 0,
      cropY: 0
    };
    const command = ffmpegLoop(
      path.join(__dirname, 'fixtures/user_video-30.mp4'),
      opts
    );
    command.once('start', cmd => {
      try {
        console.log(cmd);
        expect(cmd).to.match(/crop=12:24:0:0/);
      } catch (err) {
        done(err);
      }
    });
    const stream = command.pipe();
    stream.once('data', function (data) {
      try {
        expect(data).to.be.ok();
        command.kill();
        done();
      } catch (err) {
        done(err);
        command.kill();
      }
    });
  });
});

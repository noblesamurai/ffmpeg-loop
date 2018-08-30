const expect = require('chai').expect;
const { PassThrough } = require('stream');
const ffmpegLoop = require('..');

describe('ffmpeg loop', function () {
  it('should return an ffmpeg proc', function () {
    const opts = { height: 100, width: 100, fps: 30 };
    const command = ffmpegLoop('asdf', opts);
    expect(command).to.be.ok();
    expect(command.pipe).to.be.ok();
    command.kill();
  });

  it('should apply a crop filter', done => {
    const opts = { height: 720, width: 720, fps: 30, cropWidth: 1080, cropHeight: 1080, cropX: 400, cropY: 0 };
    const command = ffmpegLoop('asdf', opts);
    command.on('start', cmd => {
      command.kill();
      expect(cmd).to.match(/crop=1080:1080:400:0/);
      done();
    });
    command.pipe(new PassThrough());
    expect(command).to.be.ok();
    expect(command.pipe).to.be.ok();
  });
});

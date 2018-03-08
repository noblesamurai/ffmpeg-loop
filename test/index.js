const expect = require('chai').expect;
const ffmpegLoop = require('..');

describe('ffmpeg loop', function () {
  it('should return an ffmpeg proc', function () {
    const opts = { height: 100, width: 100, fps: 30 };
    const command = ffmpegLoop('asdf', opts);
    expect(command).to.be.ok();
    expect(command.pipe).to.be.ok();
    command.kill();
  });
});

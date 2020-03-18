const expect = require('chai').expect;
const ffmpegLoop = require('..');
const path = require('path');
const pEvent = require('p-event');

async function start (command) {
  return new Promise((resolve, reject) => {
    let cmd;
    command.once('start', _cmd => {
      // We use setImmediate() here in case the 'start' event is already waiting
      // to process (in which case the callback will run straight away). We need
      // command.pipe() to run below so we can resolve the promise including the
      // stream. This seems to happen in the second test case as somehow
      // fluent-ffmpeg is already hot and doesn't wait for the command.pipe()
      // before the 'start' happens.
      setImmediate(() => {
        cmd = _cmd;
        console.log(cmd);
        command.removeAllListeners('error');
        resolve({ cmd, stream });
      });
    });
    command.once('error', reject);
    const stream = command.pipe();
  });
}

describe('ffmpeg loop', function () {
  it('should return an ffmpeg proc', function () {
    const opts = { height: 100, width: 100, fps: 30 };
    const command = ffmpegLoop('asdf', opts);
    expect(command).to.be.ok();
    expect(command.pipe).to.be.ok();
    command.kill();
  });

  it('should apply a crop filter', async function () {
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
    const { cmd, stream } = await start(command);
    expect(cmd).to.match(/crop=12:24:0:0/);
    expect(cmd).to.match(/stream_loop/);

    const data = await pEvent(stream, 'data');
    expect(data).to.be.ok();
    command.kill();
    await pEvent(command, 'error');
  });

  it('allows you to not loop if you so desire', async function () {
    this.timeout(5000);
    const opts = {
      fps: 30,
      height: 28,
      loop: false,
      width: 50
    };
    const command = ffmpegLoop(
      path.join(__dirname, 'fixtures/user_video-30.mp4'),
      opts
    );

    const { cmd, stream } = await start(command);
    expect(cmd).to.not.match(/stream_loop/);

    const data = await pEvent(stream, 'data');
    expect(data).to.be.ok();
    command.kill();
    await pEvent(command, 'error');
  });
});

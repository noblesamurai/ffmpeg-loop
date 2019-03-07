/**
 * @module ffmpeg-loop
 */

const ffmpeg = require('fluent-ffmpeg');
const assert = require('assert');
ffmpeg.setFfmpegPath(require('ffmpeg-static').path);

/**
 * Creates an ffmpeg command to loop a video.
 * Note: All crop dimensions are for the original video size (not the output
 * size).
 *
 * @param {string} filename - path to video
 * @param {integer} opts.fps
 * @param {integer} opts.width - output width
 * @param {integer} opts.height - output height
 * @param {integer} opts.cropWidth - crop width (width and height are required).
 * @param {integer} opts.cropHeight - crop height
 * @param {integer} opts.cropX - crop x (x and y are optional. If not set, the
 *   default is the center position of the video).
 * @param {integer} opts.cropY - crop y
 * @param {float} opts.start - seek to this time before starting. Must be less
 * than video length.
 * @returns A fluent ffmpeg process - has pipe() method.
 */
module.exports = function (filename, opts) {
  ['height', 'width', 'fps'].forEach((key) => {
    assert(!isNaN(opts[key]), `${key} should be number - got ${opts[key]}`);
  });
  const { start = 0 } = opts;
  const command = ffmpeg()
    // Using -ss and -stream_loop together does not work well, so we have a
    // single non-looped version first to seek on.
    .input(filename)
    .inputOption('-ss', start)
    .input(filename)
    .inputOption('-stream_loop', -1)
    .videoFilter('setpts=N/(FRAME_RATE*TB)')
    .noAudio()
    .complexFilter(['[0:v:0][1:v:0]concat=n=2:v=1:a=0[outv]'], 'outv')
    .outputFormat('rawvideo')
    .outputOption('-vcodec', 'rawvideo')
    .outputOption('-pix_fmt', 'rgba')
    .outputOption('-s', `${opts.width}x${opts.height}`)
    .outputOption('-r', opts.fps);
  return applyCrop(command, opts);
};

/**
 * Apply a crop filter (if required) to the ffmpeg command based on provided opts.
 * All crop dimensions are for the original video size (not the output size).
 *
 * @private
 * @param ffmpeg process
 * @param {integer} opts.cropWidth - crop width (width and height are required).
 * @param {integer} opts.cropHeight - crop height
 * @param {integer} opts.cropX - crop x (x and y are optional. If not set, the
 *   default is the center position of the video).
 * @param {integer} opts.cropY - crop y
 * @returns modified fluent ffmpeg process
 */
function applyCrop (command, opts) {
  const { cropWidth, cropHeight, cropX, cropY } = opts;
  if (!cropWidth || isNaN(cropWidth) || !cropHeight || isNaN(cropHeight)) return command;
  const crop = [ cropWidth, cropHeight ];
  if (!isNaN(cropX) && !isNaN(cropY)) crop.push(cropX, cropY);
  return command.videoFilter(`crop=${crop.join(':')}`);
}

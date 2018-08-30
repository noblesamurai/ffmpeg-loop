/**
 * @module ffmpeg-loop
 */

const ffmpeg = require('fluent-ffmpeg');
const assert = require('assert');
ffmpeg.setFfmpegPath(require('ffmpeg-static').path);

/**
 * Creates an infinitely looping readable stream from a video.
 * Note: All crop dimensions are for the original video size (not the output size).
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
 * @returns A fluent ffmpeg process - has pipe() method.
 */
module.exports = function (filename, opts) {
  ['height', 'width', 'fps'].forEach((key) => {
    assert(!isNaN(opts[key]), `${key} should be number - got ${opts[key]}`);
  });
  const command = ffmpeg(filename)
    .inputOption('-stream_loop', -1)
    .videoFilter('setpts=N/(FRAME_RATE*TB)')
    .noAudio()
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

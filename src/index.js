/**
 * @module ffmpeg-loop
 */

const ffmpeg = require('fluent-ffmpeg');
const assert = require('assert');
ffmpeg.setFfmpegPath(require('ffmpeg-static').path);

/**
 * Creates an infinitely looping readable stream from a video.
 * @param {string} filename - path to video
 * @param {integer} opts.fps
 * @param {integer} opts.width
 * @param {integer} opts.height
 * @returns A fluent ffmpeg process - has pipe() method.
 */
module.exports = function (filename, opts) {
  ['height', 'width', 'fps'].forEach((key) => {
    assert(!isNaN(opts[key]), `${key} should be number - got ${opts[key]}`);
  });
  return ffmpeg(filename)
    .inputOption('-stream_loop', -1)
    .videoFilter('setpts=PTS-STARTPTS')
    .outputFormat('rawvideo')
    .outputOption('-vcodec', 'rawvideo')
    .outputOption('-pix_fmt', 'rgba')
    .outputOption('-s', `${opts.width}x${opts.height}`)
    .outputOption('-r', opts.fps);
};

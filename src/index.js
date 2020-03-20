/**
 * @module ffmpeg-loop
 */

const cropFilter = require('./crop');
const debug = require('debug')('ffmpeg-loop');
const ffmpeg = require('fluent-ffmpeg');
const last = require('lodash.last');
const ow = require('ow');

ffmpeg.setFfmpegPath(require('ffmpeg-static'));

/**
 * In place update filters to append filter.
 * @param {Array<object>} filters
 * @param {object} filter
 */
function appendFilter (filters, filter) {
  const length = filters.length;
  if (length > 0) {
    const lastPad = `f${length - 1}`;
    last(filters).outputs = lastPad;
    filter.inputs = lastPad;
  }
  filters.push(filter);
}

/**
 * Creates an ffmpeg command to loop a video.
 * Note: All crop dimensions are for the original video size (not the output
 * size).
 *
 * @param {string} filename - path to video
 * @param {integer} opts.cropHeight - crop height
 * @param {integer} opts.cropWidth - crop width (width and height are required).
 * @param {integer} opts.cropX - crop x (x and y are optional. If not set, the
 *   default is the center position of the video).
 * @param {integer} opts.cropY - crop y
 * @param {integer} opts.fps
 * @param {integer} opts.height - output height
 * @param {boolean} opts.loop - whether to loop the source clip (defaults to true)
 * @param {float} opts.start - seek to this time before starting. Must be less
 * @param {integer} opts.width - output width
 * than video length.
 * @returns A fluent ffmpeg process - has pipe() method.
 */
module.exports = function (filename, opts) {
  ow(opts, ow.object.partialShape({
    fps: ow.number,
    height: ow.number.integer,
    width: ow.number.integer
  }));
  const { fps, height, loop = true, start = 0, width } = opts;
  const filters = [];

  if (loop) {
    appendFilter(filters, { filter: 'concat', options: { n: 2, v: 1, a: 0 } });
    appendFilter(filters, {
      filter: 'setpts',
      options: 'N/(FRAME_RATE*TB)'
    });
  // repeat last frame forever if not looping
  } else appendFilter(filters, { filter: 'tpad', options: { stop: -1, stop_mode: 'clone' } });

  const command = ffmpeg()
    // Using -ss and -stream_loop together does not work well, so we have a
    // single non-looped version first to seek on.
    .input(filename)
    .inputOption('-ss', start);
  if (loop) command.input(filename).inputOption('-stream_loop', -1);
  command
    .noAudio()
    .outputFormat('rawvideo')
    .outputOption('-vcodec', 'rawvideo')
    .outputOption('-pix_fmt', 'rgba')
    .outputOption('-s', `${width}x${height}`)
    .outputOption('-r', fps);
  const crop = cropFilter(opts);
  if (crop) appendFilter(filters, crop);
  if (filters.length) command.complexFilter(filters);
  command.once('start', debug);
  return command;
};

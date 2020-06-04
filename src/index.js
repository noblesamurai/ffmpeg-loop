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
 * @param {string} [name]
 */
function appendFilter (filters, filter, name) {
  const length = filters.length;
  if (length > 0) {
    const lastPad = `${name || filter.filter}${length - 1}`;
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
 * @param {float} opts.inputDuration - if set we can use this to make sure we
 *   don't attempt to start after the end of the input file (ie. we can loop or
 *   repeat the last frame correctly rather than seg faulting).
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
  const { fps, height, loop = true, start = 0, inputDuration = -1, width } = opts;
  const filters = [];

  const command = ffmpeg().input(filename);

  if (loop) {
    appendFilter(filters, { filter: 'concat', options: { n: 2, v: 1, a: 0 } }, 'concat-inputs');
    appendFilter(filters, {
      filter: 'setpts',
      options: 'N/(FRAME_RATE*TB)'
    }, 'redo-timecodes');
    // Using -ss and -stream_loop together does not work well, so we have a
    // single non-looped version first to seek on.
    command.input(filename); // then a second looped version.
    command.inputOption('-ss', inputDuration > 0 ? start % inputDuration : start);
    command.inputOption('-stream_loop', -1);
  } else {
    // Input start time must be less than the file duration otherwise we segfault. We could just
    // set the output start time but that requires going through the entire input video which is
    // slow. Instead we make sure we start at least 1s before the end of the video and set the
    // output start time to somewhere between 0 and 1. <1 for where start is before the input
    // duration but only just up to 1 where we can just repeat the last frame until we are done.
    const startBeforeEnd = inputDuration > 0 ? Math.max(0, Math.min(start, inputDuration - 1)) : start;
    command.inputOption('-ss', startBeforeEnd);
    if (startBeforeEnd < start) command.outputOption('-ss', Math.min(1, start - startBeforeEnd));

    // repeat last frame forever if not looping
    appendFilter(filters, { filter: 'tpad', options: { stop: -1, stop_mode: 'clone' } }, 'pad-at-end');
  }

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

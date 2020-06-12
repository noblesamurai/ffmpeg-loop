/**
 * @module ffmpeg-loop
 */

const cropFilter = require('./crop');
const debug = require('debug')('ffmpeg-loop');
const ffmpeg = require('fluent-ffmpeg');
const last = require('lodash.last');
const ow = require('ow');
const round = require('lodash.round');

ffmpeg.setFfmpegPath(require('ffmpeg-static'));

/**
 * In place update filters to append filter.
 * @param {Array<object>} filters
 * @param {object} filter
 * @param {string} [name]
 */
function appendFilter (filters, filter, name) {
  if (!filter) return;
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
function ffmpegLoop (filename, opts) {
  checkInputs(filename, opts);
  const { fps, height, width } = opts;
  const { command, filters } = loopInput(filename, opts) || repeatLastFrame(filename, opts);
  appendFilter(filters, cropFilter(opts));
  if (filters.length) command.complexFilter(filters);
  command
    .noAudio()
    .outputFormat('rawvideo')
    .outputOption('-vcodec', 'rawvideo')
    .outputOption('-pix_fmt', 'rgba')
    .outputOption('-s', `${width}x${height}`)
    .outputOption('-r', fps);
  command.once('start', debug);
  return command;
}

/**
 * Validate inputs.
 *
 * @param {string} filename
 * @param {object} opts
 * @throws
 */
function checkInputs (filename, opts) {
  ow(opts, ow.object.partialShape({
    fps: ow.number,
    height: ow.number.integer,
    width: ow.number.integer
  }));
  const { start = 0, inputDuration } = opts;
  if (start > 0 && !inputDuration) {
    throw new Error('opts.inputDuration required if start value is non 0');
  }
}

/**
 * Create a video looping ffmpeg command.
 *
 * @param {string} filename - path to video
 * @param {boolean} opts.loop - whether to loop the source clip (defaults to true)
 * @param {float} opts.start - seek to this time before starting. Must be less
 * @param {float} opts.inputDuration - if opts.start is non-zero then this must
 *   also be set so that we don't attempt to start after the input file has ended.
 *   Starting after the input file has ended results in ffmpeg throwing a seg fault.
 * @return {object|false} - will return an object with { command, filters } or
 *   false if opts.loop is set to false.
 */
function loopInput (filename, opts) {
  const { loop = true, start = 0, inputDuration = -1 } = opts;
  if (!loop) return false;

  const command = ffmpeg().input(filename);
  const filters = [];

  const inputStart = inputDuration > 0 ? start % inputDuration : start;
  // Using -ss and -stream_loop together does not work well, so we have a
  // single non-looped version first to seek on.
  command.inputOption('-ss', round(inputStart, 6)); // round so we don't get any e-X values.
  // then a second looped version.
  command.input(filename).inputOption('-stream_loop', -1);

  appendFilter(filters, { filter: 'concat', options: { n: 2, v: 1, a: 0 } }, 'concat-inputs');
  appendFilter(filters, {
    filter: 'setpts',
    options: 'N/(FRAME_RATE*TB)'
  }, 'redo-timecodes');

  return { command, filters };
}

/**
 * Create a video ffmpeg command that repeats the last frame.
 *
 * @param {string} filename - path to video
 * @param {boolean} opts.loop - whether to loop the source clip (defaults to true)
 * @param {float} opts.start - seek to this time before starting. Must be less
 * @param {float} opts.inputDuration - if opts.start is non-zero then this must
 *   also be set so that we don't attempt to start after the input file has ended.
 *   Starting after the input file has ended results in ffmpeg throwing a seg fault.
 * @return {object} - contains { command, filters }
 */
function repeatLastFrame (filename, opts) {
  const { start = 0, inputDuration = -1 } = opts;
  const command = ffmpeg().input(filename);
  const filters = [];

  // Input start time must be less than the file duration otherwise we segfault. We could just
  // set the output start time but that requires going through the entire input video which is
  // slow. Instead we make sure we start at least 1s before the end of the video and set the
  // output start time to somewhere between 0 and 1. <1 for where start is before the input
  // duration but only just up to 1 where we can just repeat the last frame until we are done.
  const startBeforeEnd = inputDuration > 0 ? Math.max(0, Math.min(start, inputDuration - 1)) : start;
  command.inputOption('-ss', round(startBeforeEnd, 6));
  if (startBeforeEnd < start) {
    const outputStart = Math.min(1, start - startBeforeEnd);
    command.outputOption('-ss', round(outputStart, 6));
  }

  // repeat last frame forever if not looping
  appendFilter(filters, { filter: 'tpad', options: { stop: -1, stop_mode: 'clone' } }, 'pad-at-end');

  return { command, filters };
}

module.exports = ffmpegLoop;

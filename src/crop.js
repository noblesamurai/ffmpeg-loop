/**
 * Generate a crop filter (if required) to the ffmpeg command based on provided opts.
 * All crop dimensions are for the original video size (not the output size).
 *
 * @param {Array<string>} filters  The filters array - will be modified in place if applicable
 * @param {integer} opts.cropWidth - crop width (width and height are required).
 * @param {integer} opts.cropHeight - crop height
 * @param {integer} opts.cropX - crop x (x and y are optional. If not set, the
 *   default is the center position of the video).
 * @param {integer} opts.cropY - crop y
 * @return {object|false} The crop filter.
 */
function cropFilter (opts) {
  const { cropWidth, cropHeight, cropX, cropY } = opts;
  if (!cropWidth || isNaN(cropWidth) || !cropHeight || isNaN(cropHeight)) {
    return false;
  }
  const crop = [cropWidth, cropHeight];
  if (!isNaN(cropX) && !isNaN(cropY)) crop.push(cropX, cropY);
  return {
    filter: 'crop',
    options: crop.join(':')
  };
}

module.exports = cropFilter;

# Ffmpeg-loop [![Build Status](https://secure.travis-ci.org/noblesamurai/ffmpeg-loop.png?branch=master)](http://travis-ci.org/noblesamurai/ffmpeg-loop) [![NPM version](https://badge-me.herokuapp.com/api/npm/ffmpeg-loop.png)](http://badges.enytc.com/for/npm/ffmpeg-loop)

> Instantiate ffmpeg in looping mode.

## Purpose
Uses fluent-ffmpeg to instantiate an ffmpeg proc in looping mode

## Usage

```js
const expect = require('expect.js');
const opts = { height: 100, width: 100, fps: 30 };
const command = ffmpegLoop('path/to/file', opts);
expect(command).to.be.ok();
expect(command.pipe).to.be.ok();
command.pipe(fs.createReadableStream(/*..*/));
/*..*/
command.kill();

```

## API

<a name="exp_module_ffmpeg-loop--module.exports"></a>

### module.exports(filename) ⇒ ⏏
Creates an ffmpeg command to loop a video.
Note: All crop dimensions are for the original video size (not the output
size).

**Kind**: Exported function
**Returns**: A fluent ffmpeg process - has pipe() method.

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | path to video |
| opts.cropHeight | <code>integer</code> | crop height |
| opts.cropWidth | <code>integer</code> | crop width (width and height are required). |
| opts.cropX | <code>integer</code> | crop x (x and y are optional. If not set, the   default is the center position of the video). |
| opts.cropY | <code>integer</code> | crop y |
| opts.fps | <code>integer</code> |  |
| opts.height | <code>integer</code> | output height |
| opts.loop | <code>boolean</code> | whether to loop the source clip (defaults to true) |
| opts.start | <code>float</code> | seek to this time before starting. Must be less |
| opts.inputDuration | <code>float</code> | if set we can use this to make sure we don't attempt to start after the end of the input file (ie. we can loop or repeat the last frame correctly rather than seg faulting). |
| opts.width | <code>integer</code> | output width than video length. |

Note: To regenerate this section from the jsdoc run `npm run docs` and paste
the output above.

## Installation

This module is installed via npm:

``` bash
$ npm install ffmpeg-loop
```

## Contributing

### Prerequisites

```
$ pip install pre-commit
```

### Installation

```
$ pre-commit install --install-hooks
```

## License

The BSD License

Copyright (c) 2018, Tim Allen

All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this
  list of conditions and the following disclaimer in the documentation and/or
  other materials provided with the distribution.

* Neither the name of the Tim Allen nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


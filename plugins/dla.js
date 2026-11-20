
// dla.js - AHMED-MD Media Downloader
// Original author: Weskerty
// License: AGPLv3

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { execFile } = require('child_process');
const { bot, isUrl } = require('../lib');

const execFileAsync = promisify(execFile);
const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

let dependenciesReady = false;
let dependencyError = null;
let ffmpegPath = 'ffmpeg';

const log = {
  info: (...a) => console.log('[DLA]', ...a),
  error: (...a) => console.error('[DLA]', ...a),
};

const QUALITY_PRESETS = new Map([
  ['360', { height: 360, label: '360p' }],
  ['480', { height: 480, label: '480p (SD)' }],
  ['sd', { height: 480, label: '480p (SD)' }],
  ['720', { height: 720, label: '720p (HD)' }],
  ['hd', { height: 720, label: '720p (HD)' }],
  ['1080', { height: 1080, label: '1080p (FHD)' }],
  ['fhd', { height: 1080, label: '1080p (FHD)' }],
  ['1440', { height: 1440, label: '1440p (2K)' }],
  ['2k', { height: 1440, label: '1440p (2K)' }],
  ['2160', { height: 2160, label: '2160p (4K)' }],
  ['4k', { height: 2160, label: '2160p (4K)' }],
  ['best', { height: null, label: 'Best available' }],
]);

const parseQuality = token =>
  token ? QUALITY_PRESETS.get(token.toLowerCase()) || null : null;

const FILE_TYPES = {
  video: {
    extensions: new Set(['mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'm4v']),
    mimetype: 'video/mp4',
  },
  image: {
    extensions: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg']),
    mimetype: 'image/jpeg',
  },
  document: {
    extensions: new Set([
      'pdf', 'epub', 'docx', 'txt', 'apk', 'apks', 'zip', 'rar',
      'iso', 'ini', 'cbr', 'cbz', 'torrent', 'json', 'xml', 'html',
      'css', 'js', 'csv', 'xls', 'xlsx', 'ppt', 'pptx',
    ]),
    mimetypes: new Map([
      ['pdf', 'application/pdf'],
      ['epub', 'application/epub+zip'],
      ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      ['txt', 'text/plain'],
      ['apk', 'application/vnd.android.package-archive'],
      ['apks', 'application/vnd.android.package-archive'],
      ['zip', 'application/zip'],
      ['rar', 'application/x-rar-compressed'],
      ['iso', 'application/x-iso9660-image'],
      ['ini', 'text/plain'],
      ['cbr', 'application/x-cbr'],
      ['cbz', 'application/x-cbz'],
      ['torrent', 'application/x-bittorrent'],
      ['json', 'application/json'],
      ['xml', 'application/xml'],
      ['html', 'text/html'],
      ['css', 'text/css'],
      ['js', 'application/javascript'],
      ['csv', 'text/csv'],
      ['xls', 'application/vnd.ms-excel'],
      ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      ['ppt', 'application/vnd.ms-powerpoint'],
      ['pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ]),
    defaultMimetype: 'application/octet-stream',
  },
  audio: {
    extensions: new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma']),
    mimetype: 'audio/mpeg',
  },
};

const TIMEOUT_MS = 500000;

function withTimeout(promise, ms = TIMEOUT_MS, errorMsg = 'Operation timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    ),
  ]);
}

function getFileDetails(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();

  for (const [category, typeInfo] of Object.entries(FILE_TYPES)) {
    if (typeInfo.extensions.has(ext)) {
      return {
        category,
        mimetype: category === 'document'
          ? typeInfo.mimetypes.get(ext) || typeInfo.defaultMimetype
          : typeInfo.mimetype,
      };
    }
  }

  return {
    category: 'document',
    mimetype: FILE_TYPES.document.defaultMimetype,
  };
}

function getYtDlpBinaryName() {
  const p = os.platform();
  const a = os.arch();

  const m = new Map([
    ['win32-x64', 'yt-dlp.exe'],
    ['win32-ia32', 'yt-dlp_x86.exe'],
    ['darwin', 'yt-dlp_macos'],
    ['linux-x64', 'yt-dlp_linux'],
    ['linux-arm64', 'yt-dlp_linux_aarch64'],
    ['linux-arm', 'yt-dlp_linux_armv7l'],
  ]);

  return m.get(`${p}-${a}`) || m.get(p) || 'yt-dlp';
}

function getFfmpegBinaryName() {
  const a = os.arch();
  return ({ x64: 'amd64', arm64: 'arm64', arm: 'armhf' })[a] || null;
}

async function checkBinaryAvailable(name, flag = '--version') {
  try {
    await execFileAsync(name, [flag], { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

async function downloadStaticFfmpeg(binDir) {
  if (os.platform() !== 'linux') return null;

  const arch = getFfmpegBinaryName();
  if (!arch) return null;

  const url = `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-${arch}-static.tar.xz`;
  const tarPath = path.join(binDir, 'ffmpeg-static.tar.xz');

  try {
    log.info('Downloading static ffmpeg...');

    const fetch = (await import('node-fetch')).default;
    const res = await withTimeout(
      fetch(url),
      120000,
      'Timeout downloading ffmpeg'
    );

    if (!res.ok) throw new Error(`FFmpeg download failed: ${res.statusText}`);

    await fs.writeFile(
      tarPath,
      Buffer.from(
        await withTimeout(
          res.arrayBuffer(),
          120000,
          'Timeout reading ffmpeg'
        )
      )
    );

    const { stdout } = await execFileAsync(
      'tar',
      ['tf', tarPath],
      { timeout: 30000, maxBuffer: 1024 * 1024 }
    );

    const entry = stdout
      .split('\n')
      .find(e => e.endsWith('/ffmpeg') || e === 'ffmpeg');

    if (!entry) throw new Error('ffmpeg not found in tarball');

    const strip = entry.split('/').length - 1;

    await execFileAsync(
      'tar',
      ['xf', tarPath, '-C', binDir, `--strip-components=${strip}`, entry],
      { timeout: 60000, cwd: binDir }
    );

    const bin = path.join(binDir, 'ffmpeg');

    await fs.chmod(bin, '755');
    await fs.unlink(tarPath).catch(() => {});
    await execFileAsync(bin, ['-version'], { timeout: 15000 });

    log.info('Static ffmpeg installed');
    return bin;
  } catch (err) {
    log.error('Static ffmpeg failed:', err.message);
    await fs.unlink(tarPath).catch(() => {});
    return null;
  }
}

async function initDependencies() {
  const binDir = path.join(process.cwd(), 'media', 'bin');

  await fs.mkdir(binDir, { recursive: true });

  const errors = [];

  log.info('Checking dependencies...');

  let ytOk = await checkBinaryAvailable('yt-dlp');

  if (ytOk) {
    log.info('yt-dlp found on PATH');
  } else {
    const local = path.join(binDir, getYtDlpBinaryName());

    try {
      await fs.access(local);
      await execFileAsync(local, ['--version'], { timeout: 15000 });

      ytOk = true;
      log.info(`yt-dlp found locally: ${local}`);
    } catch {
      try {
        log.info('Downloading yt-dlp...');

        const fetch = (await import('node-fetch')).default;

        const res = await withTimeout(
          fetch(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${getYtDlpBinaryName()}`),
          TIMEOUT_MS,
          'Timeout'
        );

        if (!res.ok) throw new Error(res.statusText);

        await fs.writeFile(
          local,
          Buffer.from(
            await withTimeout(res.arrayBuffer(), TIMEOUT_MS, 'Timeout')
          )
        );

        if (os.platform() !== 'win32') {
          await fs.chmod(local, '755');
        }

        await execFileAsync(local, ['--version'], { timeout: 15000 });

        ytOk = true;
        log.info('yt-dlp downloaded');
      } catch (err) {
        errors.push(`*yt-dlp:* Could not install — ${err.message}`);
        log.error('yt-dlp install failed:', err.message);
      }
    }
  }

  let ffOk = await checkBinaryAvailable('ffmpeg', '-version');

  if (ffOk) {
    ffmpegPath = 'ffmpeg';
    log.info('ffmpeg found on PATH');
  } else {
    const local = path.join(binDir, 'ffmpeg');

    try {
      await fs.access(local);
      await execFileAsync(local, ['-version'], { timeout: 15000 });

      ffOk = true;
      ffmpegPath = local;

      log.info(`ffmpeg found locally: ${local}`);
    } catch {
      const staticPath = await downloadStaticFfmpeg(binDir);

      if (staticPath) {
        ffOk = true;
        ffmpegPath = staticPath;
        log.info(`ffmpeg static installed: ${staticPath}`);
      } else {
        errors.push('*ffmpeg:* Could not install — static binary download failed.');
        log.error('ffmpeg install failed');
      }
    }
  }

  if (errors.length > 0) {
    dependenciesReady = false;
    dependencyError = errors.join('\n');
    log.error('Dependencies INCOMPLETE\n' + errors.join('\n'));
  } else {
    dependenciesReady = true;
    log.info(
      `All dependencies ready (ffmpeg: ${ffmpegPath === 'ffmpeg' ? 'system' : 'local'})`
    );
  }
}

function getUnavailableMessage() {
  return '⚠️ *DLA Unavailable*\n\n' +
    'Required dependencies could not be installed:\n' +
    `${dependencyError}\n\n` +
    '> Check network connectivity or install manually:\n' +
    '> `apt-get install -y ffmpeg yt-dlp`' +
    FOOTER;
}

initDependencies().catch(err => {
  dependenciesReady = false;
  dependencyError = `Unexpected error during setup: ${err.message}`;
  log.error('initDependencies crashed:', err);
});

class DownloadQueue {
  constructor(maxConcurrent = 2) {
    this.queue = [];
    this.activeDownloads = 0;
    this.maxConcurrent = maxConcurrent;
    this.isProcessing = false;
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (
        this.activeDownloads < this.maxConcurrent &&
        this.queue.length > 0
      ) {
        const { task, resolve, reject } = this.queue.shift();

        this.activeDownloads++;

        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.activeDownloads--;
            setImmediate(() => this.processNext());
          });
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

class MediaDownloader {
  constructor() {
    this.ctx = null;
    this.ytDlpBinaryPath = null;
    this.presetFormats = null;

    this.defaultFormats = {
      video: [
        '-f',
        'sd/18/bestvideo[height<=720][vcodec*=h264]+bestaudio[acodec*=aac]/bestvideo[height<=720][vcodec*=h264]+bestaudio[acodec*=mp4a]/bestvideo[height<=720][vcodec*=h264]+bestaudio/bestvideo[height<=720]+bestaudio/bestvideo[vcodec*=h264]+bestaudio[acodec*=aac]/bestvideo[vcodec*=h264]+bestaudio[acodec*=mp4a]/bestvideo[vcodec*=h264]+bestaudio/bestvideo+bestaudio/best',
        '--sponsorblock-remove',
        'all',
        '--embed-chapters',
        '--add-metadata',
      ],
      audio: [
        '-f',
        'ba/best',
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        '0',
        '--sponsorblock-remove',
        'all',
        '--embed-thumbnail',
        '--add-metadata',
        '--postprocessor-args',
        'ffmpeg:-id3v2_version 3',
      ],
      playlist: ['--yes-playlist'],
      noPlaylist: ['--no-playlist'],
    };
  }

  setContext(ctx) {
    this.ctx = ctx;
    this.presetFormats = null;

    this.config = {
      tempDir: ctx.TEMP_DOWNLOAD_DIR || path.join(process.cwd(), 'temp'),
      maxFileSize: (parseInt(ctx.MAX_UPLOAD, 10) * 1048576) || 1500000000,
      ytDlpPath: path.join(process.cwd(), 'media', 'bin'),
      maxConcurrent: parseInt(ctx.MAXSOLICITUD, 10) || 2,
      playlistLimit: parseInt(ctx.PLAYLIST_LIMIT, 10) || 20,
      cookies: ctx.COOKIES || null,
      maxPreviewSize: (parseInt(ctx.DLA_MAX_PREVIEW, 10) || 30) * 1024 * 1024,
      enableMp3Zip: ctx.DLAMP3ZIP === undefined ||
        ctx.DLAMP3ZIP === 'TRUE' ||
        ctx.DLAMP3ZIP === 'true',
      dlaVideo: ctx.DLA_VIDEO || null,
      dlaAudio: ctx.DLA_AUDIO || null,
      dlaYtCmd: ctx.DLA_YTCMD || null,
      dlaExtDown: ctx.DLA_EXTDOWN || null,
    };

    this.downloadQueue = new DownloadQueue(this.config.maxConcurrent);
  }

  getFormats() {
    if (this.presetFormats) return this.presetFormats;

    this.presetFormats = {
      video: this.config.dlaVideo
        ? this.config.dlaVideo.trim().split(/\s+/)
        : this.defaultFormats.video,
      audio: this.config.dlaAudio
        ? this.config.dlaAudio.trim().split(/\s+/)
        : this.defaultFormats.audio,
      playlist: this.defaultFormats.playlist,
      noPlaylist: this.defaultFormats.noPlaylist,
    };

    return this.presetFormats;
  }

  getVideoFormatArgs(quality) {
    if (this.config.dlaVideo) {
      return this.config.dlaVideo.trim().split(/\s+/);
    }

    if (!quality || !quality.height) {
      return [
        '-f',
        'bv*+ba/b',
        '-S',
        'codec:h264',
        '--sponsorblock-remove',
        'all',
        '--embed-chapters',
        '--add-metadata',
      ];
    }

    const h = quality.height;

    return [
      '-f',
      `bv*[height<=${h}][vcodec*=h264]+ba[acodec*=aac]/bv*[height<=${h}][vcodec*=h264]+ba/bv*[height<=${h}]+ba/bv*+ba/b`,
      '-S',
      `res:${h},codec:h264`,
      '--sponsorblock-remove',
      'all',
      '--embed-chapters',
      '--add-metadata',
    ];
  }

  getCommonArgs() {
    if (this.config.dlaYtCmd) {
      return this.config.dlaYtCmd
        .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
        .map(s => s.replace(/^["']|["']$/g, ''));
    }

    return [
      '--cache-dir',
      path.join(this.config.ytDlpPath, 'cache'),
      '--no-part',
      '--no-mtime',
      '--min-sleep-interval',
      '5',
      '--max-sleep-interval',
      '20',
    ];
  }

  getFfmpegLocationArgs() {
    return ffmpegPath !== 'ffmpeg'
      ? ['--ffmpeg-location', path.dirname(ffmpegPath)]
      : [];
  }

  getAria2Args() {
    if (this.config.dlaExtDown) {
      return this.config.dlaExtDown
        .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
        .map(s => s.replace(/^["']|["']$/g, ''));
    }

    return [
      '--external-downloader',
      'aria2c',
      '--external-downloader-args',
      'aria2c:-x 16 -k 1M -j 16 --file-allocation=none --async-dns=false --optimize-concurrent-downloads=true --max-tries=5 --retry-wait=3',
    ];
  }

  normalizeTimeSegment(segment) {
    const parts = segment.split(':');

    if (parts.length === 2) {
      const [min, sec] = parts;
      return `00:${min.padStart(2, '0')}:${sec.padStart(2, '0')}`;
    } else if (parts.length === 3) {
      const [h, m, s] = parts;
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
    }

    return segment;
  }

  parseTimeRanges(timeString) {
    if (!timeString?.trim()) return null;

    const ranges = timeString.split(/\s+|,/).filter(r => r.trim());
    const normalized = [];

    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-');

        normalized.push(
          `*${this.normalizeTimeSegment(start.trim())}-${this.normalizeTimeSegment(end.trim())}`
        );
      }
    }

    return normalized.length > 0 ? normalized.join(',') : null;
  }

  buildCookiesArgs() {
    const cookiesPath = path.join(
      this.config.ytDlpPath,
      'yt-dlp.cookies.txt'
    );

    try {
      require('fs').accessSync(
        cookiesPath,
        require('fs').constants.F_OK
      );

      return ['--cookies', cookiesPath];
    } catch {
      return this.config.cookies
        ? ['--cookies', this.config.cookies]
        : [];
    }
  }

  async checkZipAvailable() {
    try {
      await execFileAsync('which', ['zip'], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async compressWithZip(outputDir) {
    const outputZip = path.join(
      this.config.tempDir,
      `playlist_${Date.now()}.zip`
    );

    const files = await withTimeout(
      fs.readdir(outputDir),
      TIMEOUT_MS,
      'Timeout reading directory for zip'
    );

    await withTimeout(
      execFileAsync(
        'zip',
        ['-r', outputZip, ...files],
        {
          cwd: outputDir,
          maxBuffer: 1024 * 1024 * 100,
        }
      ),
      TIMEOUT_MS,
      'Timeout creating zip file'
    );

    return outputZip;
  }

  async safeExecuteYtDlp(args) {
    return await execFileAsync(
      this.ytDlpBinaryPath,
      [...this.getFfmpegLocationArgs(), ...args],
      {
        maxBuffer: 1024 * 1024 * 100,
        timeout: TIMEOUT_MS,
      }
    );
  }

  async isYtDlpAvailable() {
    try {
      await withTimeout(
        execFileAsync('yt-dlp', ['--version']),
        TIMEOUT_MS,
        'Timeout'
      );

      return true;
    } catch {
      return false;
    }
  }

  async ensureDirectories() {
    await Promise.all([
      withTimeout(
        fs.mkdir(this.config.tempDir, { recursive: true }),
        TIMEOUT_MS,
        'Timeout creating temp directory'
      ),
      withTimeout(
        fs.mkdir(this.config.ytDlpPath, { recursive: true }),
        TIMEOUT_MS,
        'Timeout creating yt-dlp directory'
      ),
    ]);
  }

  async detectYtDlpBinary(message) {
    if (this.ytDlpBinaryPath) return this.ytDlpBinaryPath;

    if (await this.isYtDlpAvailable()) {
      this.ytDlpBinaryPath = 'yt-dlp';
      return this.ytDlpBinaryPath;
    }

    const filePath = path.join(
      this.config.ytDlpPath,
      getYtDlpBinaryName()
    );

    try {
      await withTimeout(
        fs.access(filePath),
        TIMEOUT_MS,
        'Timeout'
      );

      this.ytDlpBinaryPath = filePath;
      return this.ytDlpBinaryPath;
    } catch {
      return null;
    }
  }

  async loadInfoJson(outputDir) {
    const files = await withTimeout(
      fs.readdir(outputDir),
      TIMEOUT_MS,
      'Timeout reading directory for info.json'
    );

    const jsonFiles = files.filter(f => f.endsWith('.info.json'));
    const infoMap = new Map();
    let genericInfo = null;

    for (const jsonFile of jsonFiles) {
      try {
        const data = JSON.parse(
          await withTimeout(
            fs.readFile(path.join(outputDir, jsonFile), 'utf8'),
            TIMEOUT_MS,
            'Timeout'
          )
        );

        const baseName = jsonFile.replace('.info.json', '');

        const mediaFiles = files.filter(
          f =>
            f.substring(0, f.lastIndexOf('.')) === baseName &&
            !f.endsWith('.info.json')
        );

        if (mediaFiles.length > 0) {
          for (const mf of mediaFiles) {
            infoMap.set(mf, {
              title: data.title || '',
              description: data.description || '',
              uploader: data.uploader || '',
            });
          }
        } else if (!genericInfo) {
          genericInfo = {
            title: data.title || '',
            description: data.description || '',
            uploader: data.uploader || '',
          };
        }
      } catch {
        continue;
      }
    }

    return { infoMap, genericInfo };
  }

  formatCaption(info) {
    if (!info) return null;

    const titleLine = info.uploader
      ? `> ${info.title} - ${info.uploader}`
      : info.title;

    return info.description
      ? `${titleLine}\n${info.description}`
      : titleLine;
  }

  async fixExtension(filePath) {
    const ext = path.extname(filePath).slice(1).toLowerCase();

    for (const typeInfo of Object.values(FILE_TYPES)) {
      if (typeInfo.extensions?.has(ext)) return filePath;
    }

    try {
      const { stdout } = await execFileAsync(
        'file',
        ['-b', '--extension', filePath]
      );

      const detectedExt = stdout.trim().split('/')[0];

      if (detectedExt && detectedExt !== '???') {
        const newPath = ext
          ? filePath.replace(/\.[^.]*$/, `.${detectedExt}`)
          : `${filePath}.${detectedExt}`;

        await fs.rename(filePath, newPath);
        return newPath;
      }
    } catch {}

    return filePath;
  }

  async processDownloadedFile(
    message,
    filePath,
    originalFileName,
    quotedMessage,
    caption = null
  ) {
    filePath = await this.fixExtension(filePath);

    let { mimetype, category } = getFileDetails(filePath);

    if (category !== 'document') {
      const { size } = await fs.stat(filePath);

      if (size > this.config.maxPreviewSize) {
        category = 'document';
      }
    }

    const fileBuffer = await withTimeout(
      fs.readFile(filePath),
      TIMEOUT_MS,
      'Timeout reading file for upload'
    );

    const options = {
      fileName: path.basename(filePath),
      mimetype,
      quoted: quotedMessage,
    };

    if (caption) options.caption = caption + FOOTER;

    await message.send(fileBuffer, options, category);

    await this.safeCleanup(filePath);
  }

  async safeCleanup(target, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const stats = await fs.stat(target);

        if (stats.isDirectory()) {
          await withTimeout(
            fs.rm(target, { recursive: true, force: true }),
            TIMEOUT_MS,
            'Timeout cleaning directory'
          );
        } else {
          await withTimeout(
            fs.unlink(target),
            TIMEOUT_MS,
            'Timeout cleaning file'
          );
        }

        return;
      } catch (err) {
        if (err.code === 'ENOENT') return;

        if (i === retries - 1) {
          log.error(`Failed to cleanup ${target}:`, err.message);
          return;
        }

        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  async updateYtDlp() {
    try {
      const result = await this.safeExecuteYtDlp([
        '--update-to',
        'master',
      ]);

      return `> 🔄UpdateBin \n${result.stdout || result.stderr || 'yt-dlp actualizado exitosamente'}`;
    } catch {
      return null;
    }
  }

  async uploadCookies(message, cookieText = null) {
    const quotedMessage = message.reply_message;
    let cookieContent = null;

    if (cookieText) {
      cookieContent = cookieText;
    } else if (quotedMessage) {
      const buf = await quotedMessage.downloadMediaMessage();

      if (!buf) {
        throw new Error('Error al descargar el archivo de cookies');
      }

      cookieContent = buf.toString();
    } else {
      throw new Error(
        'Las cookies deben ser texto o citar un archivo de cookies'
      );
    }

    await this.ensureDirectories();

    await withTimeout(
      fs.writeFile(
        path.join(this.config.ytDlpPath, 'yt-dlp.cookies.txt'),
        cookieContent
      ),
      TIMEOUT_MS,
      'Timeout writing cookies'
    );

    await message.send(
      'Cookies subida' + FOOTER,
      { quoted: message.quoted }
    );
  }

  async downloadWithYtDlp(
    message,
    urls,
    formatType = 'video',
    enablePlaylist = false,
    timeRanges = null,
    quality = null
  ) {
    return this.downloadQueue.add(async () => {
      await this.detectYtDlpBinary(message);

      const sessionId = `yt-dlp_${Date.now()}`;
      const outputDir = path.join(this.config.tempDir, sessionId);
      const cookiesArgs = this.buildCookiesArgs();

      await this.ensureDirectories();

      await withTimeout(
        fs.mkdir(outputDir, { recursive: true }),
        TIMEOUT_MS,
        'Timeout creating session directory'
      );

      const isMp3Playlist = formatType === 'audio' && enablePlaylist;
      const isDirectLink = formatType === 'video' && !enablePlaylist;

      let lastError = null;

      try {
        for (const url of urls) {
          const outputTemplate = path.join(
            outputDir,
            '%(title).70s.%(ext)s'
          );

          const playlistArgs = enablePlaylist
            ? this.getFormats().playlist
            : this.getFormats().noPlaylist;

          const playlistItemsArgs = enablePlaylist
            ? ['--playlist-items', `1:${this.config.playlistLimit}`]
            : [];

          const timeRangeArgs =
            timeRanges && !enablePlaylist
              ? ['--download-sections', timeRanges]
              : [];

          const infoJsonArgs = isDirectLink
            ? ['--write-info-json']
            : [];

          const formatArgs =
            formatType === 'video' && quality
              ? this.getVideoFormatArgs(quality)
              : this.getFormats()[formatType];

          const args = [
            '--restrict-filenames',
            '--extractor-retries',
            '3',
            '--fragment-retries',
            '3',
            '--compat-options',
            'no-youtube-unavailable-videos',
            '--ignore-errors',
            '--no-abort-on-error',
            '--max-filesize',
            this.config.maxFileSize.toString(),
            ...this.getCommonArgs(),
            ...playlistArgs,
            ...playlistItemsArgs,
            ...cookiesArgs,
            ...timeRangeArgs,
            ...infoJsonArgs,
            ...formatArgs,
            '-o',
            outputTemplate,
            url,
          ];

          try {
            await this.safeExecuteYtDlp(args);
          } catch (err) {
            lastError = err;
          }
        }

        const allFiles = await withTimeout(
          fs.readdir(outputDir),
          TIMEOUT_MS,
          'Timeout reading output directory'
        );

        const files = allFiles.filter(f => !f.endsWith('.info.json'));

        if (files.length === 0 && isDirectLink) {
          for (const url of urls) {
            const outputTemplate = path.join(
              outputDir,
              '%(title).70s.%(ext)s'
            );

            const timeRangeArgs = timeRanges
              ? ['--download-sections', timeRanges]
              : [];

            const ariaArgs = [
              '--restrict-filenames',
              '--extractor-retries',
              '3',
              '--fragment-retries',
              '3',
              '--compat-options',
              'no-youtube-unavailable-videos',
              '--ignore-errors',
              '--no-abort-on-error',
              '--max-filesize',
              this.config.maxFileSize.toString(),
              ...this.getCommonArgs(),
              ...this.getFormats().noPlaylist,
              ...cookiesArgs,
              ...timeRangeArgs,
              ...this.getAria2Args(),
              ...this.getFormats()[formatType],
              '-o',
              outputTemplate,
              url,
            ];

            try {
              await this.safeExecuteYtDlp(ariaArgs);
            } catch (err) {
              lastError = err;
            }
          }

          const ariaFiles = (
            await withTimeout(
              fs.readdir(outputDir),
              TIMEOUT_MS,
              'Timeout'
            )
          ).filter(f => !f.endsWith('.info.json'));

          if (ariaFiles.length === 0) {
            await this.safeCleanup(outputDir);

            const errorMessage =
              lastError?.stderr ||
              lastError?.message ||
              'Error desconocido';

            const updateMessage = await this.updateYtDlp();

            throw new Error(
              updateMessage
                ? `${errorMessage}\n\n${updateMessage}`
                : errorMessage
            );
          }

          for (const file of ariaFiles) {
            await this.processDownloadedFile(
              message,
              path.join(outputDir, file),
              file,
              message.quoted
            );
          }

          await this.safeCleanup(outputDir);
          return;
        }

        if (files.length === 0) {
          await this.safeCleanup(outputDir);

          const errorMessage =
            lastError?.stderr ||
            lastError?.message ||
            'Error desconocido';

          const updateMessage = await this.updateYtDlp();

          throw new Error(
            updateMessage
              ? `${errorMessage}\n\n${updateMessage}`
              : errorMessage || 'No se descargaron archivos'
          );
        }

        let infoMap = new Map();
        let genericInfo = null;

        if (isDirectLink) {
          const d = await this.loadInfoJson(outputDir);
          infoMap = d.infoMap;
          genericInfo = d.genericInfo;
        }

        if (
          isMp3Playlist &&
          this.config.enableMp3Zip &&
          files.length > 1
        ) {
          if (await this.checkZipAvailable()) {
            try {
              const zipPath = await this.compressWithZip(outputDir);

              await message.send(
                await withTimeout(
                  fs.readFile(zipPath),
                  TIMEOUT_MS,
                  'Timeout reading zip'
                ),
                {
                  fileName: path.basename(zipPath),
                  mimetype: getFileDetails(zipPath).mimetype,
                  caption: 'Usa 7zip para descomprimir' + FOOTER,
                  quoted: message.quoted,
                },
                'document'
              );

              await this.safeCleanup(zipPath);
            } catch {
              for (const file of files) {
                await this.processDownloadedFile(
                  message,
                  path.join(outputDir, file),
                  file,
                  message.quoted
                );
              }
            }
          } else {
            for (const file of files) {
              await this.processDownloadedFile(
                message,
                path.join(outputDir, file),
                file,
                message.quoted
              );
            }
          }
        } else {
          let firstFileSent = false;

          for (const file of files) {
            let caption = null;

            if (isDirectLink) {
              caption = infoMap.has(file)
                ? this.formatCaption(infoMap.get(file))
                : !firstFileSent && genericInfo
                  ? this.formatCaption(genericInfo)
                  : null;
            }

            await this.processDownloadedFile(
              message,
              path.join(outputDir, file),
              file,
              message.quoted,
              caption
            );

            firstFileSent = true;
          }
        }

        if (lastError) {
          const errorMessage =
            lastError.stderr ||
            lastError.message ||
            'Error desconocido';

          const updateMessage = await this.updateYtDlp();

          throw new Error(
            updateMessage
              ? `${errorMessage}\n\n${updateMessage}`
              : errorMessage
          );
        }
      } finally {
        await this.safeCleanup(outputDir);
      }
    });
  }

  async searchAndDownload(
    message,
    searchQuery,
    isVideo = false,
    quality = null
  ) {
    return this.downloadQueue.add(async () => {
      const sessionId = `yt-dlp_${Date.now()}`;
      const outputDir = path.join(this.config.tempDir, sessionId);
      const cookiesArgs = this.buildCookiesArgs();

      await this.ensureDirectories();

      await withTimeout(
        fs.mkdir(outputDir, { recursive: true }),
        TIMEOUT_MS,
        'Timeout creating session directory'
      );

      const outputTemplate = path.join(
        outputDir,
        '%(title).70s.%(ext)s'
      );

      await this.detectYtDlpBinary(message);

      const formatArgs = isVideo
        ? quality
          ? this.getVideoFormatArgs(quality)
          : this.getFormats().video
        : this.getFormats().audio;

      const searchSources = [
        { prefix: '', useDefaultSearch: true },
        ...(isVideo
          ? [
              { prefix: 'ytsearch10:' },
              { prefix: 'gvsearch10:' },
              { prefix: 'yvsearch10:' },
              { prefix: 'dailymotionsearch:' },
            ]
          : [
              { prefix: 'ytsearch10:' },
              { prefix: 'scsearch10:' },
              { prefix: 'mailrusearch10:' },
              { prefix: 'nicosearch10:' },
            ]),
      ];

      let lastError = null;

      try {
        for (const { prefix, useDefaultSearch } of searchSources) {
          const searchUrl = useDefaultSearch
            ? searchQuery
            : `${prefix}${searchQuery}`;

          const searchArgs = useDefaultSearch
            ? ['--default-search', 'auto']
            : [];

          const args = [
            '--restrict-filenames',
            '--extractor-retries',
            '3',
            '--fragment-retries',
            '3',
            '--compat-options',
            'no-youtube-unavailable-videos',
            '--ignore-errors',
            '--no-abort-on-error',
            ...searchArgs,
            '--max-filesize',
            this.config.maxFileSize.toString(),
            ...this.getCommonArgs(),
            '--playlist-items',
            '1',
            ...formatArgs,
            ...cookiesArgs,
            '-o',
            outputTemplate,
            searchUrl,
          ];

          try {
            await this.safeExecuteYtDlp(args);

            const files = await withTimeout(
              fs.readdir(outputDir),
              TIMEOUT_MS,
              'Timeout'
            );

            if (files.length > 0) {
              await Promise.all(
                files.map(f =>
                  this.processDownloadedFile(
                    message,
                    path.join(outputDir, f),
                    f,
                    message.quoted
                  )
                )
              );

              await this.safeCleanup(outputDir);
              return;
            }
          } catch (error) {
            lastError = error;

            const currentFiles = await withTimeout(
              fs.readdir(outputDir),
              TIMEOUT_MS,
              'Timeout'
            );

            if (currentFiles.length > 0) {
              await Promise.all(
                currentFiles.map(f =>
                  this.processDownloadedFile(
                    message,
                    path.join(outputDir, f),
                    f,
                    message.quoted
                  )
                )
              );

              await this.safeCleanup(outputDir);
              return;
            }
          }
        }

        await this.safeCleanup(outputDir);

        const errorMessage =
          lastError?.stderr ||
          lastError?.message ||
          'Error desconocido';

        const updateMessage = await this.updateYtDlp();

        throw new Error(
          updateMessage
            ? `${errorMessage}\n\n${updateMessage}`
            : errorMessage || `No se pudo descargar: ${searchQuery}`
        );
      } catch (error) {
        await this.safeCleanup(outputDir);
        throw error;
      }
    });
  }
}

const mediaDownloader = new MediaDownloader();

bot(
  {
    pattern: 'dla ?(.*)',
    fromMe: true,
    desc: 'Download All Media Web Site.',
    type: 'AHMII',
  },
  async (message, match, ctx) => {
    if (!dependenciesReady) {
      return await message.send(
        getUnavailableMessage(),
        { quoted: message.quoted }
      );
    }

    mediaDownloader.setContext(ctx);

    const input = match.trim() || message.reply_message?.text || '';

    if (!input) {
      await message.send(
        '> 🎶Search and Download Song:\n`dla` <query>\n' +
        '> 🎥Search and Download Video:\n`dla vd` <query>\n' +
        '`dla vd 1080` <query>\n' +
        '> ⬇️Download Media:\n' +
        '`dla` <url>\n' +
        '`dla 1080` <url>\n' +
        '`dla best` <url>\n' +
        '`dla 4k` <url>\n' +
        '> ✂️Download Segment:\n' +
        '`dla` <url> `--t` <time>\n' +
        '> 🎵Download Audio from Playlist:\n' +
        '`dla mp3` <url>\n' +
        '> 📊Quality: `360` `480/sd` `720/hd` `1080/fhd` `1440/2k` `2160/4k` `best`\n' +
        '> 🍪Cookies: `dla cookies` <cookie_text>\n' +
        '> 📖Help: github.com/yt-dlp/yt-dlp' +
        FOOTER,
        { quoted: message.quoted }
      );

      return;
    }

    if (input.toLowerCase().startsWith('cookies')) {
      await mediaDownloader.uploadCookies(
        message,
        input.substring('cookies'.length).trim() || null
      );

      return;
    }

    const urls = (input.match(/(https?:\/\/[^\s]+)/g) || [])
      .filter(url => isUrl(url));

    if (urls.length > 0) {
      let commandPart = input;

      urls.forEach(url => {
        commandPart = commandPart.replace(url, '').trim();
      });

      const parts = commandPart.split(/\s+/).filter(p => p);

      if (parts.includes('mp3')) {
        await mediaDownloader.downloadWithYtDlp(
          message,
          urls,
          'audio',
          true,
          null
        );

        return;
      }

      let quality = null;
      const remainingParts = [];

      for (const p of parts) {
        const q = parseQuality(p);

        if (q && !quality) {
          quality = q;
        } else {
          remainingParts.push(p);
        }
      }

      let timeRanges = null;
      const timeIndex = remainingParts.indexOf('--t');

      if (
        timeIndex !== -1 &&
        remainingParts[timeIndex + 1]
      ) {
        timeRanges = mediaDownloader.parseTimeRanges(
          remainingParts.slice(timeIndex + 1).join(' ')
        );
      }

      await mediaDownloader.downloadWithYtDlp(
        message,
        urls,
        'video',
        false,
        timeRanges,
        quality
      );

      return;
    }

    const args = input.trim().split(/\s+/);
    const command = args[0];
    let remainingArgs = args.slice(1);

    if (command === 'vd') {
      let quality = null;

      if (remainingArgs.length > 0) {
        const q = parseQuality(remainingArgs[0]);

        if (q) {
          quality = q;
          remainingArgs = remainingArgs.slice(1);
        }
      }

      await mediaDownloader.searchAndDownload(
        message,
        remainingArgs.join(' '),
        true,
        quality
      );
    } else {
      await mediaDownloader.searchAndDownload(
        message,
        input,
        false
      );
    }
  }
);

module.exports = { mediaDownloader };

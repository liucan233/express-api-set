import require$$0 from 'node:fs';
import require$$1 from 'node:path';
import require$$2 from 'node:os';
import require$$3 from 'node:crypto';
import winston from 'winston';
import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bf from 'node:buffer';
import nodeFetch from 'node-fetch';
import { JSDOM, CookieJar } from 'jsdom';
import jwt from 'jsonwebtoken';

var main$1 = {exports: {}};

var name = "dotenv";
var version$1 = "16.3.1";
var description = "Loads environment variables from .env file";
var main = "lib/main.js";
var types = "lib/main.d.ts";
var exports = {
	".": {
		types: "./lib/main.d.ts",
		require: "./lib/main.js",
		"default": "./lib/main.js"
	},
	"./config": "./config.js",
	"./config.js": "./config.js",
	"./lib/env-options": "./lib/env-options.js",
	"./lib/env-options.js": "./lib/env-options.js",
	"./lib/cli-options": "./lib/cli-options.js",
	"./lib/cli-options.js": "./lib/cli-options.js",
	"./package.json": "./package.json"
};
var scripts = {
	"dts-check": "tsc --project tests/types/tsconfig.json",
	lint: "standard",
	"lint-readme": "standard-markdown",
	pretest: "npm run lint && npm run dts-check",
	test: "tap tests/*.js --100 -Rspec",
	prerelease: "npm test",
	release: "standard-version"
};
var repository = {
	type: "git",
	url: "git://github.com/motdotla/dotenv.git"
};
var funding = "https://github.com/motdotla/dotenv?sponsor=1";
var keywords = [
	"dotenv",
	"env",
	".env",
	"environment",
	"variables",
	"config",
	"settings"
];
var readmeFilename = "README.md";
var license = "BSD-2-Clause";
var devDependencies = {
	"@definitelytyped/dtslint": "^0.0.133",
	"@types/node": "^18.11.3",
	decache: "^4.6.1",
	sinon: "^14.0.1",
	standard: "^17.0.0",
	"standard-markdown": "^7.1.0",
	"standard-version": "^9.5.0",
	tap: "^16.3.0",
	tar: "^6.1.11",
	typescript: "^4.8.4"
};
var engines = {
	node: ">=12"
};
var browser = {
	fs: false
};
var require$$4 = {
	name: name,
	version: version$1,
	description: description,
	main: main,
	types: types,
	exports: exports,
	scripts: scripts,
	repository: repository,
	funding: funding,
	keywords: keywords,
	readmeFilename: readmeFilename,
	license: license,
	devDependencies: devDependencies,
	engines: engines,
	browser: browser
};

const fs = require$$0;
const path = require$$1;
const os = require$$2;
const crypto = require$$3;
const packageJson = require$$4;

const version = packageJson.version;

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;

// Parse src into an Object
function parse (src) {
  const obj = {};

  // Convert buffer to string
  let lines = src.toString();

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n');

  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1];

    // Default undefined or null to empty string
    let value = (match[2] || '');

    // Remove whitespace
    value = value.trim();

    // Check if double quoted
    const maybeQuote = value[0];

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2');

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\r/g, '\r');
    }

    // Add to object
    obj[key] = value;
  }

  return obj
}

function _parseVault (options) {
  const vaultPath = _vaultPath(options);

  // Parse .env.vault
  const result = DotenvModule.configDotenv({ path: vaultPath });
  if (!result.parsed) {
    throw new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenv.org/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenv.org/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',');
  const length = keys.length;

  let decrypted;
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim();

      // Get instructions for decrypt
      const attrs = _instructions(result, key);

      // Decrypt
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);

      break
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return DotenvModule.parse(decrypted)
}

function _log (message) {
  console.log(`[dotenv@${version}][INFO] ${message}`);
}

function _warn (message) {
  console.log(`[dotenv@${version}][WARN] ${message}`);
}

function _debug (message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`);
}

function _dotenvKey (options) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY
  }

  // fallback to empty string
  return ''
}

function _instructions (result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri;
  try {
    uri = new URL(dotenvKey);
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      throw new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenv.org/vault/.env.vault?environment=development')
    }

    throw error
  }

  // Get decrypt key
  const key = uri.password;
  if (!key) {
    throw new Error('INVALID_DOTENV_KEY: Missing key part')
  }

  // Get environment
  const environment = uri.searchParams.get('environment');
  if (!environment) {
    throw new Error('INVALID_DOTENV_KEY: Missing environment part')
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
  const ciphertext = result.parsed[environmentKey]; // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    throw new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`)
  }

  return { ciphertext, key }
}

function _vaultPath (options) {
  let dotenvPath = path.resolve(process.cwd(), '.env');

  if (options && options.path && options.path.length > 0) {
    dotenvPath = options.path;
  }

  // Locate .env.vault
  return dotenvPath.endsWith('.vault') ? dotenvPath : `${dotenvPath}.vault`
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _configVault (options) {
  _log('Loading env from encrypted .env.vault');

  const parsed = DotenvModule._parseVault(options);

  let processEnv = process.env;
  if (options && options.processEnv != null) {
    processEnv = options.processEnv;
  }

  DotenvModule.populate(processEnv, parsed, options);

  return { parsed }
}

function configDotenv (options) {
  let dotenvPath = path.resolve(process.cwd(), '.env');
  let encoding = 'utf8';
  const debug = Boolean(options && options.debug);

  if (options) {
    if (options.path != null) {
      dotenvPath = _resolveHome(options.path);
    }
    if (options.encoding != null) {
      encoding = options.encoding;
    }
  }

  try {
    // Specifying an encoding returns a string instead of a buffer
    const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, { encoding }));

    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }

    DotenvModule.populate(processEnv, parsed, options);

    return { parsed }
  } catch (e) {
    if (debug) {
      _debug(`Failed to load ${dotenvPath} ${e.message}`);
    }

    return { error: e }
  }
}

// Populates process.env from .env file
function config (options) {
  const vaultPath = _vaultPath(options);

  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options)
  }

  // dotenvKey exists but .env.vault file does not exist
  if (!fs.existsSync(vaultPath)) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);

    return DotenvModule.configDotenv(options)
  }

  return DotenvModule._configVault(options)
}

function decrypt (encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex');
  let ciphertext = Buffer.from(encrypted, 'base64');

  const nonce = ciphertext.slice(0, 12);
  const authTag = ciphertext.slice(-16);
  ciphertext = ciphertext.slice(12, -16);

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    aesgcm.setAuthTag(authTag);
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
  } catch (error) {
    const isRange = error instanceof RangeError;
    const invalidKeyLength = error.message === 'Invalid key length';
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data';

    if (isRange || invalidKeyLength) {
      const msg = 'INVALID_DOTENV_KEY: It must be 64 characters long (or more)';
      throw new Error(msg)
    } else if (decryptionFailed) {
      const msg = 'DECRYPTION_FAILED: Please check your DOTENV_KEY';
      throw new Error(msg)
    } else {
      console.error('Error: ', error.code);
      console.error('Error: ', error.message);
      throw error
    }
  }
}

// Populate process.env with parsed values
function populate (processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug);
  const override = Boolean(options && options.override);

  if (typeof parsed !== 'object') {
    throw new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate')
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key];
      }

      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`);
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`);
        }
      }
    } else {
      processEnv[key] = parsed[key];
    }
  }
}

const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
};

var configDotenv_1 = main$1.exports.configDotenv = DotenvModule.configDotenv;
main$1.exports._configVault = DotenvModule._configVault;
main$1.exports._parseVault = DotenvModule._parseVault;
main$1.exports.config = DotenvModule.config;
main$1.exports.decrypt = DotenvModule.decrypt;
main$1.exports.parse = DotenvModule.parse;
main$1.exports.populate = DotenvModule.populate;

main$1.exports = DotenvModule;

const logger = winston.createLogger({
    format: winston.format.timestamp({
        format: 'YYYY-MM-DD hh:mm:ss',
    }),
});
const logError = (err) => {
    if (err instanceof Error && err.stack) {
        logger.error(err.stack);
    }
    else {
        logger.error(JSON.stringify(err));
    }
};
logger.add(new winston.transports.Console({
    format: winston.format.printf(info => {
        return `[${info.level} ${info.timestamp}] ${info.message}`;
    }),
}));

if (!process.env.NODE_ENV) {
    const result = configDotenv_1({ debug: true, path: require$$1.resolve('env/app.env') });
    if (result.error) {
        logger.error('本地环境变量初始化失败');
    }
}
logger.info(`${process.env.NODE_ENV}环境`);
if (!process.env.hash_salt || !process.env.wx_appid || !process.env.wx_secret) {
    throw new Error('未设置环境变量');
}
const appPort = 3000;
process.env.wx_appid;
process.env.wx_secret;
const hashSalt = process.env.hash_salt;

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const prismaClient = new PrismaClient();

const commentRouter = Router();
commentRouter.post('/newComment', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    try {
        const { id } = res.locals.userInfo;
        let findRes = yield prismaClient.commentSource.findFirst({
            where: {
                externalId: body.id,
            },
        });
        if (!findRes) {
            findRes = yield prismaClient.commentSource.create({
                data: {
                    desc: 'express_created',
                    externalId: body.id,
                    userId: id,
                },
            });
        }
        const newComment = yield prismaClient.comment.create({
            data: {
                sourceId: findRes.id,
                userId: id,
                content: body.content,
            },
        });
        res.json(newComment);
    }
    catch (err) {
        next(err);
    }
}));
commentRouter.get('/list', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { externalId, pageSize, lastCommentId } = req.query;
    // 处理分页大小
    let pageSizeNum = Number(pageSize);
    if (!pageSizeNum) {
        pageSizeNum = 20;
    }
    // 处理游标
    let lastCommentIdNum = Number(lastCommentId);
    if (Number.isNaN(lastCommentIdNum)) {
        lastCommentIdNum = -1;
    }
    const queryUser = {
        select: {
            id: true,
            name: true,
        },
    };
    const commentArrCursor = lastCommentIdNum == -1
        ? undefined
        : {
            id: lastCommentIdNum,
        };
    try {
        const findRes = yield prismaClient.commentSource.findFirst({
            where: {
                externalId,
            },
            include: {
                commentArr: {
                    include: {
                        replyArr: {
                            include: {
                                user: queryUser,
                                reply: queryUser,
                            },
                        },
                        user: queryUser,
                    },
                    take: pageSizeNum,
                    skip: commentArrCursor ? 1 : undefined,
                    cursor: commentArrCursor,
                },
            },
        });
        res.json({
            msg: '',
            code: 0,
            data: findRes || [],
        });
    }
    catch (err) {
        next(err);
    }
}));
commentRouter.post('/replyComment', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, replyCommentId, replyUserId } = req.body;
    try {
        const { id: userId } = res.locals.userInfo;
        const newComment = yield prismaClient.commentReply.create({
            data: {
                sourceId: replyCommentId,
                userId: userId,
                content: content,
                replyUserId,
            },
        });
        res.json(newComment);
    }
    catch (err) {
        next(err);
    }
}));

var ErrCode;
(function (ErrCode) {
    ErrCode[ErrCode["NoError"] = 0] = "NoError";
    ErrCode[ErrCode["OpenCasSystemErr"] = 1] = "OpenCasSystemErr";
    ErrCode[ErrCode["GetCasSysCaptchaErr"] = 2] = "GetCasSysCaptchaErr";
    ErrCode[ErrCode["CasSysUnstable"] = 3] = "CasSysUnstable";
    ErrCode[ErrCode["AccPsdCpaMismatch"] = 4] = "AccPsdCpaMismatch";
    ErrCode[ErrCode["UnexpectedErr"] = 5] = "UnexpectedErr";
    ErrCode[ErrCode["CasSysTGCExpired"] = 6] = "CasSysTGCExpired";
    ErrCode[ErrCode["CasRedirectUnexpected"] = 7] = "CasRedirectUnexpected";
    ErrCode[ErrCode["OpenLabSysErr"] = 8] = "OpenLabSysErr";
    ErrCode[ErrCode["LabCoursePageParseErr"] = 9] = "LabCoursePageParseErr";
    ErrCode[ErrCode["LabCourseRowParseErr"] = 10] = "LabCourseRowParseErr";
    ErrCode[ErrCode["LabSysCookieExpired"] = 11] = "LabSysCookieExpired";
    ErrCode[ErrCode["UserAuthErr"] = 12] = "UserAuthErr";
    ErrCode[ErrCode["BadReqParamErr"] = 13] = "BadReqParamErr";
    ErrCode[ErrCode["NoUserErr"] = 14] = "NoUserErr";
    ErrCode[ErrCode["UserPasswordErr"] = 15] = "UserPasswordErr";
})(ErrCode || (ErrCode = {}));

const filterInvalidText = (str) => {
    const result = str.match(/\w+=[-\w%.]+/g);
    return (result === null || result === void 0 ? void 0 : result.join(';')) || '';
};

const fetch = (url, init) => __awaiter(void 0, void 0, void 0, function* () {
    let res;
    // try {
    res = yield nodeFetch(url, init);
    // } catch (error) {
    //     console.log(error);
    //     throw error;
    // }
    const resContentType = res.headers.get('content-type');
    let jsonResult = null;
    if (resContentType === null || resContentType === void 0 ? void 0 : resContentType.includes('json')) {
        jsonResult = yield res.json();
    }
    let textResult = null;
    if (resContentType === null || resContentType === void 0 ? void 0 : resContentType.includes('text')) {
        textResult = yield res.text();
    }
    let dataUrlResult = null;
    if (resContentType === null || resContentType === void 0 ? void 0 : resContentType.includes('image')) {
        const buffer = yield res.arrayBuffer();
        const mimeType = resContentType.match(/image\/\w+/);
        if (mimeType === null || mimeType === void 0 ? void 0 : mimeType.length) {
            dataUrlResult = `data:${mimeType[0]};base64,` + bf.Buffer.from(buffer).toString('base64');
        }
    }
    const cookie = res.headers.get('set-cookie');
    let cookieText = '';
    if (cookie) {
        cookieText = filterInvalidText(cookie);
        res.headers.set('cookie', cookieText);
    }
    return {
        jsonResult,
        textResult,
        dataUrlResult,
        headers: res.headers,
        status: res.status,
        cookie: cookieText,
    };
});

/*
 * RSA, a suite of routines for performing RSA public-key computations in JavaScript.
 * Copyright 1998-2005 David Shapiro.
 * Dave Shapiro
 * dave@ohdave.com
 * changed by Fuchun, 2010-05-06
 * fcrpg2005@gmail.com
 */

const security = {};

(function ($w) {
  if (typeof $w.RSAUtils === 'undefined') var RSAUtils = ($w.RSAUtils = {});
  var biRadixBits = 16;
  var bitsPerDigit = biRadixBits;
  var biRadix = 1 << 16; // = 2^16 = 65536
  var biHalfRadix = biRadix >>> 1;
  var biRadixSquared = biRadix * biRadix;
  var maxDigitVal = biRadix - 1;

  //maxDigits:
  //Change this to accommodate your largest number size. Use setMaxDigits()
  //to change it!
  //
  //In general, if you're working with numbers of size N bits, you'll need 2*N
  //bits of storage. Each digit holds 16 bits. So, a 1024-bit key will need
  //
  //1024 * 2 / 16 = 128 digits of storage.
  //
  var maxDigits;
  var ZERO_ARRAY;
  var bigZero, bigOne;

  var BigInt = ($w.BigInt = function (flag) {
    if (typeof flag == 'boolean' && flag == true) {
      this.digits = null;
    } else {
      this.digits = ZERO_ARRAY.slice(0);
    }
    this.isNeg = false;
  });

  RSAUtils.setMaxDigits = function (value) {
    maxDigits = value;
    ZERO_ARRAY = new Array(maxDigits);
    for (var iza = 0; iza < ZERO_ARRAY.length; iza++) ZERO_ARRAY[iza] = 0;
    bigZero = new BigInt();
    bigOne = new BigInt();
    bigOne.digits[0] = 1;
  };
  RSAUtils.setMaxDigits(20);

  //The maximum number of digits in base 10 you can convert to an
  //integer without JavaScript throwing up on you.
  var dpl10 = 15;

  RSAUtils.biFromNumber = function (i) {
    var result = new BigInt();
    result.isNeg = i < 0;
    i = Math.abs(i);
    var j = 0;
    while (i > 0) {
      result.digits[j++] = i & maxDigitVal;
      i = Math.floor(i / biRadix);
    }
    return result;
  };

  //lr10 = 10 ^ dpl10
  var lr10 = RSAUtils.biFromNumber(1000000000000000);

  RSAUtils.biFromDecimal = function (s) {
    var isNeg = s.charAt(0) == '-';
    var i = isNeg ? 1 : 0;
    var result;
    // Skip leading zeros.
    while (i < s.length && s.charAt(i) == '0') ++i;
    if (i == s.length) {
      result = new BigInt();
    } else {
      var digitCount = s.length - i;
      var fgl = digitCount % dpl10;
      if (fgl == 0) fgl = dpl10;
      result = RSAUtils.biFromNumber(Number(s.substr(i, fgl)));
      i += fgl;
      while (i < s.length) {
        result = RSAUtils.biAdd(RSAUtils.biMultiply(result, lr10), RSAUtils.biFromNumber(Number(s.substr(i, dpl10))));
        i += dpl10;
      }
      result.isNeg = isNeg;
    }
    return result;
  };

  RSAUtils.biCopy = function (bi) {
    var result = new BigInt(true);
    result.digits = bi.digits.slice(0);
    result.isNeg = bi.isNeg;
    return result;
  };

  RSAUtils.reverseStr = function (s) {
    var result = '';
    for (var i = s.length - 1; i > -1; --i) {
      result += s.charAt(i);
    }
    return result;
  };

  var hexatrigesimalToChar = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
  ];

  RSAUtils.biToString = function (x, radix) {
    // 2 <= radix <= 36
    var b = new BigInt();
    b.digits[0] = radix;
    var qr = RSAUtils.biDivideModulo(x, b);
    var result = hexatrigesimalToChar[qr[1].digits[0]];
    while (RSAUtils.biCompare(qr[0], bigZero) == 1) {
      qr = RSAUtils.biDivideModulo(qr[0], b);
      digit = qr[1].digits[0];
      result += hexatrigesimalToChar[qr[1].digits[0]];
    }
    return (x.isNeg ? '-' : '') + RSAUtils.reverseStr(result);
  };

  RSAUtils.biToDecimal = function (x) {
    var b = new BigInt();
    b.digits[0] = 10;
    var qr = RSAUtils.biDivideModulo(x, b);
    var result = String(qr[1].digits[0]);
    while (RSAUtils.biCompare(qr[0], bigZero) == 1) {
      qr = RSAUtils.biDivideModulo(qr[0], b);
      result += String(qr[1].digits[0]);
    }
    return (x.isNeg ? '-' : '') + RSAUtils.reverseStr(result);
  };

  var hexToChar = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

  RSAUtils.digitToHex = function (n) {
    var mask = 0xf;
    var result = '';
    for (var i = 0; i < 4; ++i) {
      result += hexToChar[n & mask];
      n >>>= 4;
    }
    return RSAUtils.reverseStr(result);
  };

  RSAUtils.biToHex = function (x) {
    var result = '';
    RSAUtils.biHighIndex(x);
    for (var i = RSAUtils.biHighIndex(x); i > -1; --i) {
      result += RSAUtils.digitToHex(x.digits[i]);
    }
    return result;
  };

  RSAUtils.charToHex = function (c) {
    var ZERO = 48;
    var NINE = ZERO + 9;
    var littleA = 97;
    var littleZ = littleA + 25;
    var bigA = 65;
    var bigZ = 65 + 25;
    var result;

    if (c >= ZERO && c <= NINE) {
      result = c - ZERO;
    } else if (c >= bigA && c <= bigZ) {
      result = 10 + c - bigA;
    } else if (c >= littleA && c <= littleZ) {
      result = 10 + c - littleA;
    } else {
      result = 0;
    }
    return result;
  };

  RSAUtils.hexToDigit = function (s) {
    var result = 0;
    var sl = Math.min(s.length, 4);
    for (var i = 0; i < sl; ++i) {
      result <<= 4;
      result |= RSAUtils.charToHex(s.charCodeAt(i));
    }
    return result;
  };

  RSAUtils.biFromHex = function (s) {
    var result = new BigInt();
    var sl = s.length;
    for (var i = sl, j = 0; i > 0; i -= 4, ++j) {
      result.digits[j] = RSAUtils.hexToDigit(s.substr(Math.max(i - 4, 0), Math.min(i, 4)));
    }
    return result;
  };

  RSAUtils.biFromString = function (s, radix) {
    var isNeg = s.charAt(0) == '-';
    var istop = isNeg ? 1 : 0;
    var result = new BigInt();
    var place = new BigInt();
    place.digits[0] = 1; // radix^0
    for (var i = s.length - 1; i >= istop; i--) {
      var c = s.charCodeAt(i);
      var digit = RSAUtils.charToHex(c);
      var biDigit = RSAUtils.biMultiplyDigit(place, digit);
      result = RSAUtils.biAdd(result, biDigit);
      place = RSAUtils.biMultiplyDigit(place, radix);
    }
    result.isNeg = isNeg;
    return result;
  };

  RSAUtils.biDump = function (b) {
    return (b.isNeg ? '-' : '') + b.digits.join(' ');
  };

  RSAUtils.biAdd = function (x, y) {
    var result;

    if (x.isNeg != y.isNeg) {
      y.isNeg = !y.isNeg;
      result = RSAUtils.biSubtract(x, y);
      y.isNeg = !y.isNeg;
    } else {
      result = new BigInt();
      var c = 0;
      var n;
      for (var i = 0; i < x.digits.length; ++i) {
        n = x.digits[i] + y.digits[i] + c;
        result.digits[i] = n % biRadix;
        c = Number(n >= biRadix);
      }
      result.isNeg = x.isNeg;
    }
    return result;
  };

  RSAUtils.biSubtract = function (x, y) {
    var result;
    if (x.isNeg != y.isNeg) {
      y.isNeg = !y.isNeg;
      result = RSAUtils.biAdd(x, y);
      y.isNeg = !y.isNeg;
    } else {
      result = new BigInt();
      var n, c;
      c = 0;
      for (var i = 0; i < x.digits.length; ++i) {
        n = x.digits[i] - y.digits[i] + c;
        result.digits[i] = n % biRadix;
        // Stupid non-conforming modulus operation.
        if (result.digits[i] < 0) result.digits[i] += biRadix;
        c = 0 - Number(n < 0);
      }
      // Fix up the negative sign, if any.
      if (c == -1) {
        c = 0;
        for (var i = 0; i < x.digits.length; ++i) {
          n = 0 - result.digits[i] + c;
          result.digits[i] = n % biRadix;
          // Stupid non-conforming modulus operation.
          if (result.digits[i] < 0) result.digits[i] += biRadix;
          c = 0 - Number(n < 0);
        }
        // Result is opposite sign of arguments.
        result.isNeg = !x.isNeg;
      } else {
        // Result is same sign.
        result.isNeg = x.isNeg;
      }
    }
    return result;
  };

  RSAUtils.biHighIndex = function (x) {
    var result = x.digits.length - 1;
    while (result > 0 && x.digits[result] == 0) --result;
    return result;
  };

  RSAUtils.biNumBits = function (x) {
    var n = RSAUtils.biHighIndex(x);
    var d = x.digits[n];
    var m = (n + 1) * bitsPerDigit;
    var result;
    for (result = m; result > m - bitsPerDigit; --result) {
      if ((d & 0x8000) != 0) break;
      d <<= 1;
    }
    return result;
  };

  RSAUtils.biMultiply = function (x, y) {
    var result = new BigInt();
    var c;
    var n = RSAUtils.biHighIndex(x);
    var t = RSAUtils.biHighIndex(y);
    var uv, k;

    for (var i = 0; i <= t; ++i) {
      c = 0;
      k = i;
      for (var j = 0; j <= n; ++j, ++k) {
        uv = result.digits[k] + x.digits[j] * y.digits[i] + c;
        result.digits[k] = uv & maxDigitVal;
        c = uv >>> biRadixBits;
        //c = Math.floor(uv / biRadix);
      }
      result.digits[i + n + 1] = c;
    }
    // Someone give me a logical xor, please.
    result.isNeg = x.isNeg != y.isNeg;
    return result;
  };

  RSAUtils.biMultiplyDigit = function (x, y) {
    var n, c, uv;

    var result = new BigInt();
    n = RSAUtils.biHighIndex(x);
    c = 0;
    for (var j = 0; j <= n; ++j) {
      uv = result.digits[j] + x.digits[j] * y + c;
      result.digits[j] = uv & maxDigitVal;
      c = uv >>> biRadixBits;
      //c = Math.floor(uv / biRadix);
    }
    result.digits[1 + n] = c;
    return result;
  };

  RSAUtils.arrayCopy = function (src, srcStart, dest, destStart, n) {
    var m = Math.min(srcStart + n, src.length);
    for (var i = srcStart, j = destStart; i < m; ++i, ++j) {
      dest[j] = src[i];
    }
  };

  var highBitMasks = [
    0x0000, 0x8000, 0xc000, 0xe000, 0xf000, 0xf800, 0xfc00, 0xfe00, 0xff00, 0xff80, 0xffc0, 0xffe0, 0xfff0, 0xfff8,
    0xfffc, 0xfffe, 0xffff,
  ];

  RSAUtils.biShiftLeft = function (x, n) {
    var digitCount = Math.floor(n / bitsPerDigit);
    var result = new BigInt();
    RSAUtils.arrayCopy(x.digits, 0, result.digits, digitCount, result.digits.length - digitCount);
    var bits = n % bitsPerDigit;
    var rightBits = bitsPerDigit - bits;
    for (var i = result.digits.length - 1, i1 = i - 1; i > 0; --i, --i1) {
      result.digits[i] =
        ((result.digits[i] << bits) & maxDigitVal) | ((result.digits[i1] & highBitMasks[bits]) >>> rightBits);
    }
    result.digits[0] = (result.digits[i] << bits) & maxDigitVal;
    result.isNeg = x.isNeg;
    return result;
  };

  var lowBitMasks = [
    0x0000, 0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff, 0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff,
    0x3fff, 0x7fff, 0xffff,
  ];

  RSAUtils.biShiftRight = function (x, n) {
    var digitCount = Math.floor(n / bitsPerDigit);
    var result = new BigInt();
    RSAUtils.arrayCopy(x.digits, digitCount, result.digits, 0, x.digits.length - digitCount);
    var bits = n % bitsPerDigit;
    var leftBits = bitsPerDigit - bits;
    for (var i = 0, i1 = i + 1; i < result.digits.length - 1; ++i, ++i1) {
      result.digits[i] = (result.digits[i] >>> bits) | ((result.digits[i1] & lowBitMasks[bits]) << leftBits);
    }
    result.digits[result.digits.length - 1] >>>= bits;
    result.isNeg = x.isNeg;
    return result;
  };

  RSAUtils.biMultiplyByRadixPower = function (x, n) {
    var result = new BigInt();
    RSAUtils.arrayCopy(x.digits, 0, result.digits, n, result.digits.length - n);
    return result;
  };

  RSAUtils.biDivideByRadixPower = function (x, n) {
    var result = new BigInt();
    RSAUtils.arrayCopy(x.digits, n, result.digits, 0, result.digits.length - n);
    return result;
  };

  RSAUtils.biModuloByRadixPower = function (x, n) {
    var result = new BigInt();
    RSAUtils.arrayCopy(x.digits, 0, result.digits, 0, n);
    return result;
  };

  RSAUtils.biCompare = function (x, y) {
    if (x.isNeg != y.isNeg) {
      return 1 - 2 * Number(x.isNeg);
    }
    for (var i = x.digits.length - 1; i >= 0; --i) {
      if (x.digits[i] != y.digits[i]) {
        if (x.isNeg) {
          return 1 - 2 * Number(x.digits[i] > y.digits[i]);
        } else {
          return 1 - 2 * Number(x.digits[i] < y.digits[i]);
        }
      }
    }
    return 0;
  };

  RSAUtils.biDivideModulo = function (x, y) {
    var nb = RSAUtils.biNumBits(x);
    var tb = RSAUtils.biNumBits(y);
    var origYIsNeg = y.isNeg;
    var q, r;
    if (nb < tb) {
      // |x| < |y|
      if (x.isNeg) {
        q = RSAUtils.biCopy(bigOne);
        q.isNeg = !y.isNeg;
        x.isNeg = false;
        y.isNeg = false;
        r = biSubtract(y, x);
        // Restore signs, 'cause they're references.
        x.isNeg = true;
        y.isNeg = origYIsNeg;
      } else {
        q = new BigInt();
        r = RSAUtils.biCopy(x);
      }
      return [q, r];
    }

    q = new BigInt();
    r = x;

    // Normalize Y.
    var t = Math.ceil(tb / bitsPerDigit) - 1;
    var lambda = 0;
    while (y.digits[t] < biHalfRadix) {
      y = RSAUtils.biShiftLeft(y, 1);
      ++lambda;
      ++tb;
      t = Math.ceil(tb / bitsPerDigit) - 1;
    }
    // Shift r over to keep the quotient constant. We'll shift the
    // remainder back at the end.
    r = RSAUtils.biShiftLeft(r, lambda);
    nb += lambda; // Update the bit count for x.
    var n = Math.ceil(nb / bitsPerDigit) - 1;

    var b = RSAUtils.biMultiplyByRadixPower(y, n - t);
    while (RSAUtils.biCompare(r, b) != -1) {
      ++q.digits[n - t];
      r = RSAUtils.biSubtract(r, b);
    }
    for (var i = n; i > t; --i) {
      var ri = i >= r.digits.length ? 0 : r.digits[i];
      var ri1 = i - 1 >= r.digits.length ? 0 : r.digits[i - 1];
      var ri2 = i - 2 >= r.digits.length ? 0 : r.digits[i - 2];
      var yt = t >= y.digits.length ? 0 : y.digits[t];
      var yt1 = t - 1 >= y.digits.length ? 0 : y.digits[t - 1];
      if (ri == yt) {
        q.digits[i - t - 1] = maxDigitVal;
      } else {
        q.digits[i - t - 1] = Math.floor((ri * biRadix + ri1) / yt);
      }

      var c1 = q.digits[i - t - 1] * (yt * biRadix + yt1);
      var c2 = ri * biRadixSquared + (ri1 * biRadix + ri2);
      while (c1 > c2) {
        --q.digits[i - t - 1];
        c1 = q.digits[i - t - 1] * ((yt * biRadix) | yt1);
        c2 = ri * biRadix * biRadix + (ri1 * biRadix + ri2);
      }

      b = RSAUtils.biMultiplyByRadixPower(y, i - t - 1);
      r = RSAUtils.biSubtract(r, RSAUtils.biMultiplyDigit(b, q.digits[i - t - 1]));
      if (r.isNeg) {
        r = RSAUtils.biAdd(r, b);
        --q.digits[i - t - 1];
      }
    }
    r = RSAUtils.biShiftRight(r, lambda);
    // Fiddle with the signs and stuff to make sure that 0 <= r < y.
    q.isNeg = x.isNeg != origYIsNeg;
    if (x.isNeg) {
      if (origYIsNeg) {
        q = RSAUtils.biAdd(q, bigOne);
      } else {
        q = RSAUtils.biSubtract(q, bigOne);
      }
      y = RSAUtils.biShiftRight(y, lambda);
      r = RSAUtils.biSubtract(y, r);
    }
    // Check for the unbelievably stupid degenerate case of r == -0.
    if (r.digits[0] == 0 && RSAUtils.biHighIndex(r) == 0) r.isNeg = false;

    return [q, r];
  };

  RSAUtils.biDivide = function (x, y) {
    return RSAUtils.biDivideModulo(x, y)[0];
  };

  RSAUtils.biModulo = function (x, y) {
    return RSAUtils.biDivideModulo(x, y)[1];
  };

  RSAUtils.biMultiplyMod = function (x, y, m) {
    return RSAUtils.biModulo(RSAUtils.biMultiply(x, y), m);
  };

  RSAUtils.biPow = function (x, y) {
    var result = bigOne;
    var a = x;
    while (true) {
      if ((y & 1) != 0) result = RSAUtils.biMultiply(result, a);
      y >>= 1;
      if (y == 0) break;
      a = RSAUtils.biMultiply(a, a);
    }
    return result;
  };

  RSAUtils.biPowMod = function (x, y, m) {
    var result = bigOne;
    var a = x;
    var k = y;
    while (true) {
      if ((k.digits[0] & 1) != 0) result = RSAUtils.biMultiplyMod(result, a, m);
      k = RSAUtils.biShiftRight(k, 1);
      if (k.digits[0] == 0 && RSAUtils.biHighIndex(k) == 0) break;
      a = RSAUtils.biMultiplyMod(a, a, m);
    }
    return result;
  };

  $w.BarrettMu = function (m) {
    this.modulus = RSAUtils.biCopy(m);
    this.k = RSAUtils.biHighIndex(this.modulus) + 1;
    var b2k = new BigInt();
    b2k.digits[2 * this.k] = 1; // b2k = b^(2k)
    this.mu = RSAUtils.biDivide(b2k, this.modulus);
    this.bkplus1 = new BigInt();
    this.bkplus1.digits[this.k + 1] = 1; // bkplus1 = b^(k+1)
    this.modulo = BarrettMu_modulo;
    this.multiplyMod = BarrettMu_multiplyMod;
    this.powMod = BarrettMu_powMod;
  };

  function BarrettMu_modulo(x) {
    var $dmath = RSAUtils;
    var q1 = $dmath.biDivideByRadixPower(x, this.k - 1);
    var q2 = $dmath.biMultiply(q1, this.mu);
    var q3 = $dmath.biDivideByRadixPower(q2, this.k + 1);
    var r1 = $dmath.biModuloByRadixPower(x, this.k + 1);
    var r2term = $dmath.biMultiply(q3, this.modulus);
    var r2 = $dmath.biModuloByRadixPower(r2term, this.k + 1);
    var r = $dmath.biSubtract(r1, r2);
    if (r.isNeg) {
      r = $dmath.biAdd(r, this.bkplus1);
    }
    var rgtem = $dmath.biCompare(r, this.modulus) >= 0;
    while (rgtem) {
      r = $dmath.biSubtract(r, this.modulus);
      rgtem = $dmath.biCompare(r, this.modulus) >= 0;
    }
    return r;
  }

  function BarrettMu_multiplyMod(x, y) {
    /*
	x = this.modulo(x);
	y = this.modulo(y);
	*/
    var xy = RSAUtils.biMultiply(x, y);
    return this.modulo(xy);
  }

  function BarrettMu_powMod(x, y) {
    var result = new BigInt();
    result.digits[0] = 1;
    var a = x;
    var k = y;
    while (true) {
      if ((k.digits[0] & 1) != 0) result = this.multiplyMod(result, a);
      k = RSAUtils.biShiftRight(k, 1);
      if (k.digits[0] == 0 && RSAUtils.biHighIndex(k) == 0) break;
      a = this.multiplyMod(a, a);
    }
    return result;
  }

  var RSAKeyPair = function (encryptionExponent, decryptionExponent, modulus) {
    var $dmath = RSAUtils;
    this.e = $dmath.biFromHex(encryptionExponent);
    this.d = $dmath.biFromHex(decryptionExponent);
    this.m = $dmath.biFromHex(modulus);
    // We can do two bytes per digit, so
    // chunkSize = 2 * (number of digits in modulus - 1).
    // Since biHighIndex returns the high index, not the number of digits, 1 has
    // already been subtracted.
    this.chunkSize = 2 * $dmath.biHighIndex(this.m);
    this.radix = 16;
    this.barrett = new $w.BarrettMu(this.m);
  };

  RSAUtils.getKeyPair = function (encryptionExponent, decryptionExponent, modulus) {
    return new RSAKeyPair(encryptionExponent, decryptionExponent, modulus);
  };

  if (typeof $w.twoDigit === 'undefined') {
    $w.twoDigit = function (n) {
      return (n < 10 ? '0' : '') + String(n);
    };
  }

  // Altered by Rob Saunders (rob@robsaunders.net). New routine pads the
  // string after it has been converted to an array. This fixes an
  // incompatibility with Flash MX's ActionScript.
  RSAUtils.encryptedString = function (key, s) {
    var a = [];
    var sl = s.length;
    var i = 0;
    while (i < sl) {
      a[i] = s.charCodeAt(i);
      i++;
    }

    while (a.length % key.chunkSize != 0) {
      a[i++] = 0;
    }

    var al = a.length;
    var result = '';
    var j, k, block;
    for (i = 0; i < al; i += key.chunkSize) {
      block = new BigInt();
      j = 0;
      for (k = i; k < i + key.chunkSize; ++j) {
        block.digits[j] = a[k++];
        block.digits[j] += a[k++] << 8;
      }
      var crypt = key.barrett.powMod(block, key.e);
      var text = key.radix == 16 ? RSAUtils.biToHex(crypt) : RSAUtils.biToString(crypt, key.radix);
      result += text + ' ';
    }
    return result.substring(0, result.length - 1); // Remove last space.
  };

  RSAUtils.decryptedString = function (key, s) {
    var blocks = s.split(' ');
    var result = '';
    var i, j, block;
    for (i = 0; i < blocks.length; ++i) {
      var bi;
      if (key.radix == 16) {
        bi = RSAUtils.biFromHex(blocks[i]);
      } else {
        bi = RSAUtils.biFromString(blocks[i], key.radix);
      }
      block = key.barrett.powMod(bi, key.d);
      for (j = 0; j <= RSAUtils.biHighIndex(block); ++j) {
        result += String.fromCharCode(block.digits[j] & 255, block.digits[j] >> 8);
      }
    }
    // Remove trailing null, if any.
    if (result.charCodeAt(result.length - 1) == 0) {
      result = result.substring(0, result.length - 1);
    }
    return result;
  };

  RSAUtils.setMaxDigits(130);
})(security);

const securityJs = security.RSAUtils;

// module.exports.securityJs=security.RSAUtils;

const casUrl = '//cas.swust.edu.cn/authserver/login?service=http%3A%2F%2Fsoa.swust.edu.cn%2F';
class CasLogin {
    constructor() {
        this.errorCode = ErrCode.UnexpectedErr;
        this.errorMsg = '';
        this.url = casUrl;
        this.session = '';
        this.httpProtocol = 'https:';
        this.captcha = '';
        this.tgcCookie = '';
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield fetch(this.httpProtocol + this.url);
                if (res.status < 300 && res.status > 199) {
                    this.url = this.httpProtocol + this.url;
                    return;
                }
            }
            catch (error) {
                logger.info('尝试cas系统使用https失败');
            }
            try {
                this.httpProtocol = 'http:';
                const res = yield fetch(this.httpProtocol + this.url);
                if (res.status < 300 && res.status > 199) {
                    this.url = this.httpProtocol + this.url;
                    return;
                }
            }
            catch (error) {
                logger.info('尝试cas系统使用http失败');
            }
            this.errorCode = ErrCode.OpenCasSystemErr;
            this.errorMsg = `尝试判断cas系统协议失败`;
            throw new Error(this.errorMsg);
        });
    }
    initSession() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(this.url);
            if (res.status === 200 && res.cookie) {
                this.session = res.cookie;
                return;
            }
            this.errorCode = ErrCode.OpenCasSystemErr;
            this.errorMsg = `响应状态码${res.status}，cookie为${res.cookie}`;
            throw new Error(this.errorMsg);
        });
    }
    loadCaptcha() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(this.httpProtocol + '//cas.swust.edu.cn/authserver/captcha', {
                headers: {
                    cookie: this.session,
                },
            });
            if (res.dataUrlResult && !res.cookie && res.status < 300 && res.status > 199) {
                this.captcha = res.dataUrlResult;
                this.errorCode = ErrCode.NoError;
                return;
            }
            this.errorCode = ErrCode.OpenCasSystemErr;
            this.errorMsg = `响应状态码${res.status}，cookie为${res.cookie}`;
            throw new Error(this.errorMsg);
        });
    }
    loadRSAPublicKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(this.httpProtocol + '//cas.swust.edu.cn/authserver/getKey', {
                headers: {
                    cookie: this.session,
                },
            });
            if (!res.jsonResult || res.status > 299 || res.status < 200) {
                this.errorCode = ErrCode.OpenCasSystemErr;
                this.errorMsg = '预期获得ras参数，实际为空';
            }
            if (res.cookie) {
                this.errorCode = ErrCode.OpenCasSystemErr;
                this.errorMsg = `请求携带${this.session}，被重新设置为${res.cookie}`;
                throw new Error(this.errorMsg);
            }
            this.rasPublicKey = securityJs.getKeyPair(res.jsonResult.exponent, '', res.jsonResult.modulus);
        });
    }
    tryLoginIn(acc, psd, captcha) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const encryptedPsd = securityJs.encryptedString(this.rasPublicKey, Array.from(psd).reverse().join(''));
            const res = yield fetch(this.url, {
                method: 'post',
                redirect: 'manual',
                headers: {
                    cookie: this.session,
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: `execution=e1s1&_eventId=submit&geolocation=` +
                    `&username=${acc}&lm=usernameLogin&password=${encryptedPsd}&captcha=${captcha}`,
            });
            if (res.cookie.includes('TGC')) {
                this.tgcCookie = res.cookie;
                this.errorCode = ErrCode.NoError;
                return;
            }
            if (!((_a = res.textResult) === null || _a === void 0 ? void 0 : _a.includes('pwdError')) || (res.status > 299 && res.status < 309)) {
                this.errorCode = ErrCode.CasSysUnstable;
                this.errorMsg = `session可能已失效，响应状态码${res.status}，页面内容为${res.textResult}`;
                throw new Error(this.errorMsg);
            }
            if (res.status === 401) {
                this.errorCode = ErrCode.AccPsdCpaMismatch;
                console.log(res.textResult);
                if (res.textResult.includes('密码错误')) {
                    this.errorMsg = '用户名或密码错误';
                }
                else {
                    this.errorMsg = '验证码错误';
                }
                throw new Error(this.errorMsg);
            }
            this.errorCode = ErrCode.UnexpectedErr;
            this.errorMsg = `未知错误，请联系开发者排查错误`;
            throw new Error(this.errorMsg);
        });
    }
    renewBySession(session, httpProtocol) {
        return __awaiter(this, void 0, void 0, function* () {
            this.session = session;
            this.httpProtocol = httpProtocol;
            this.url = this.httpProtocol + this.url;
            yield this.loadRSAPublicKey();
        });
    }
    tryLoginServiceByTGC(tgcCookie, service, httpProtocol) {
        return __awaiter(this, void 0, void 0, function* () {
            this.tgcCookie = tgcCookie;
            this.httpProtocol = httpProtocol;
            this.url = `${httpProtocol}//cas.swust.edu.cn/authserver/login?service=${encodeURIComponent(service)}`;
            let res = yield fetch(this.url, {
                redirect: 'manual',
                headers: {
                    cookie: tgcCookie,
                },
            });
            let location = res.headers.get('location');
            if (!location) {
                this.errorCode = ErrCode.CasSysTGCExpired;
                this.errorMsg = 'cas系统登录过期，需要重新登陆';
                throw new Error(this.errorMsg);
            }
            if (!location.includes(service)) {
                this.errorCode = ErrCode.CasRedirectUnexpected;
                this.errorMsg = `cas系统重定向为${location}，预期是${service}`;
                throw new Error(this.errorMsg);
            }
            res = yield fetch(location, {
                redirect: 'manual',
            });
            // 二次重定向
            location = res.headers.get('location');
            if (location === null || location === void 0 ? void 0 : location.includes(service)) {
                logger.info(`${service}重定向到${location}`);
                res = yield fetch(location, {
                    headers: {
                        cookie: res.cookie,
                    },
                });
            }
            location = res.headers.get('location');
            if (res.cookie && !location) {
                this.errorCode = ErrCode.NoError;
                return res.cookie;
            }
            this.errorCode = ErrCode.CasSysUnstable;
            this.errorMsg = `响应状态码${res.status}，cas系统跳转目标系统未被设置cookie`;
            throw new Error(this.errorMsg);
        });
    }
    parseErrorText(html) {
        return __awaiter(this, void 0, void 0, function* () {
            const { window } = new JSDOM(html);
            const { document } = window;
            console.log(html);
            const ele = document.querySelector('.pwdError');
            console.log(ele);
            const textContent = ele === null || ele === void 0 ? void 0 : ele.textContent;
            return textContent;
        });
    }
}

const swustServices = [
    'http://sjjx.swust.edu.cn/swust/',
    'http://soa.swust.edu.cn/',
    'https://matrix.dean.swust.edu.cn/acadmicManager/index.cfm?event=studentPortal:DEFAULT_EVENT',
];

const loginCasRouter = Router();
loginCasRouter.get('/loginCas', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const crawler = new CasLogin();
    try {
        logger.info('开始获取cas系统凭证');
        yield crawler.init();
        logger.info('初始化crawler成功');
        yield crawler.initSession();
        logger.info('获取session成功');
        yield crawler.loadCaptcha();
        logger.info('获取验证码成功');
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg,
            data: {
                session: crawler.session,
                captcha: crawler.captcha,
                casHttpProtocol: crawler.httpProtocol,
            },
        });
    }
    catch (error) {
        logError(error);
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg,
        });
    }
}));
loginCasRouter.post('/loginCas', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const crawler = new CasLogin();
    try {
        logger.info('开始登录cas系统');
        yield crawler.renewBySession(req.body.session, req.body.casHttpProtocol);
        logger.info('恢复crawler成功');
        yield crawler.tryLoginIn(req.body.account, req.body.password, req.body.captcha);
        logger.info('登录cas系统成功');
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg,
            data: {
                tgcCookie: crawler.tgcCookie,
            },
        });
    }
    catch (error) {
        logError(error);
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg,
        });
    }
}));
loginCasRouter.post('/loginService', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const crawler = new CasLogin();
    try {
        const service = swustServices[req.body.serviceIndex];
        const tgc = req.body.tgcCookie;
        logger.info(`开始登录${service}系统`);
        const setCookie = yield crawler.tryLoginServiceByTGC(tgc, service, req.body.casHttpProtocol);
        logger.info('登录系统成功');
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg,
            data: {
                serviceCookie: setCookie,
            },
        });
    }
    catch (error) {
        logError(error);
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg,
        });
    }
}));

const labSysUrl = 'http://sjjx.swust.edu.cn';
class LabSysCrawler {
    constructor() {
        this.cookie = '';
        this.jd = {};
        this.errorCode = ErrCode.UnexpectedErr;
        this.errorMsg = '';
    }
    loadPage(url, referrer) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(`加载${url}`);
            const ckJar = new CookieJar();
            ckJar.setCookieSync(this.cookie, labSysUrl);
            this.jd = yield JSDOM.fromURL(url, {
                cookieJar: ckJar,
                referrer,
            });
            this.checkJdUrlIsInclude(labSysUrl);
        });
    }
    loadLabSysHomePage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadPage(labSysUrl + '/swust/');
        });
    }
    loadLabCoursePage(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const pageUrl = 'http://sjjx.swust.edu.cn/teachn/teachnAction/index.action';
            const referrer = 'http://sjjx.swust.edu.cn/aexp/stuLeft.jsp';
            yield this.loadPage(url || pageUrl, referrer);
        });
    }
    checkJdUrlIsInclude(url) {
        const curUrl = this.jd.window.location.href;
        if (curUrl.includes('login') || !this.jd.window.location.href.includes(url)) {
            this.errorCode = ErrCode.OpenLabSysErr;
            this.errorMsg = `被重定向至${this.jd.window.location.href}`;
            throw new Error(this.errorMsg);
        }
        if (this.jd.serialize().includes(`self.location='/aexp'`)) {
            this.errorCode = ErrCode.LabSysCookieExpired;
            this.errorMsg = `实验系统打开失败，cookie过期`;
        }
    }
    parseLabCourseRow(rowEl) {
        const tdElArr = rowEl.querySelectorAll('td');
        if (tdElArr.length !== 11) {
            this.errorCode = ErrCode.LabCourseRowParseErr;
            this.errorMsg = `解析实验课表格行出差, ${rowEl.outerText}`;
            throw new Error(this.errorMsg);
        }
        return Array.from(tdElArr).map(td => { var _a; return ((_a = td.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''; });
    }
    parseLabCourse() {
        return __awaiter(this, void 0, void 0, function* () {
            const document = this.jd.window.document;
            const pageElArr = document.querySelectorAll('#myPage a');
            let maxPageNum = 1, endPageUrl = pageElArr[3].href || '';
            const regResult = endPageUrl.match(/page.pageNum=(\d+)/);
            if (!regResult || regResult.length !== 2) {
                this.errorCode = ErrCode.LabCoursePageParseErr;
                this.errorMsg = `实验课翻页解析错误，${endPageUrl}`;
                throw new Error(this.errorMsg);
            }
            maxPageNum = Number(regResult[1]) || 1;
            if (maxPageNum > 10) {
                maxPageNum = 10; // 页数太多暂时不遍历
            }
            const resultArr = [];
            for (let i = 1; i <= maxPageNum; i++) {
                if (i > 1) {
                    const curPageUrl = endPageUrl.replace(/page.pageNum=\d+/, `page.pageNum=${i}`);
                    yield this.loadLabCoursePage(curPageUrl);
                }
                const tableEl = document.querySelectorAll('#tab2 > .tablelist > tbody > tr');
                for (let j = 1; j < tableEl.length; j++) {
                    resultArr.push(this.parseLabCourseRow(tableEl[j]));
                }
            }
            this.errorCode = ErrCode.NoError;
            return resultArr;
        });
    }
}

const labSysRouter = Router();
labSysRouter.post('/allCourse', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const crawler = new LabSysCrawler();
    crawler.cookie = req.body.cookie || 'foo=1';
    try {
        yield crawler.loadLabCoursePage();
        const arr = yield crawler.parseLabCourse();
        res.json({
            code: crawler.errorCode,
            msg: '',
            data: arr,
        });
    }
    catch (error) {
        logError(error);
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg,
        });
    }
}));

const swustRouter = Router();
swustRouter.use(loginCasRouter);
swustRouter.use(labSysRouter);
swustRouter.use((req, res) => {
    if (!res.writableEnded) {
        res.json({
            code: -1,
            msg: '抓取出错或接口不存在，请联系开发者',
        });
        logger.error(`${req.method} ${req.path}接口失败`);
    }
});

let jwtSecret = process.env.jwt_secret || 'xVXPDzlvCDbRzkzNSiljlUkIagZMgUGo';
if (!process.env.jwt_secret && process.env.NODE_ENV === 'production') {
    logger.error('JWT SECRET未配置');
}
const jwtSign = (payload) => {
    return jwt.sign(JSON.stringify(payload), jwtSecret, {
        algorithm: 'HS256',
    });
};
const jwtDecode = (token) => {
    const payload = jwt.verify(token, jwtSecret, {
        complete: false,
    });
    if (typeof payload === 'object') {
        return payload;
    }
    return null;
};
const jwtMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    const decodedToken = token && jwtDecode(token);
    if (token && decodedToken) {
        res.locals.userInfo = decodedToken;
        next();
    }
    else {
        res.json({
            code: ErrCode.UnexpectedErr,
            msg: 'http请求头authorization无效，身份认证失败',
        });
    }
};
/** 生成哈希密码 */
const hashPassword = (password) => {
    return require$$3.pbkdf2Sync(password, hashSalt, 10000, 32, 'sha512').toString('hex');
};
logger.info(`明文密码2333，hash结果：${hashPassword('2333')}`);

const userRouter = Router();
userRouter.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body.email || !req.body.password) {
        res.json({
            code: ErrCode.BadReqParamErr,
            msg: '请求参数不正确',
        });
        return;
    }
    const user = yield prismaClient.user.findFirst({
        where: {
            email: req.body.email,
        },
    });
    if (!user) {
        res.json({
            code: ErrCode.NoUserErr,
            msg: '用户不存在',
        });
        return;
    }
    const hashPasswd = hashPassword(req.body.password);
    if (hashPasswd === user.password) {
        res.json({
            code: ErrCode.NoError,
            msg: '',
            data: jwtSign({
                id: user.id,
                email: user.email,
            }),
        });
    }
    else {
        res.json({
            code: ErrCode.UserPasswordErr,
            msg: '密码不正确',
        });
    }
}));
userRouter.post('/signout', jwtMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () { }));

// import { wxRouter } from './wechat';
const servicesRouter = Router();
servicesRouter.use('/swust', swustRouter);
servicesRouter.use('/comment', jwtMiddleware, commentRouter);
servicesRouter.use('/user', userRouter);
// servicesRouter.use('/wx', wxRouter);

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        res.setHeader('access-control-allow-origin', '*');
        res.setHeader('access-control-method', '*');
        res.setHeader('access-control-headers', '*');
    }
    next();
});
app.use('/api', servicesRouter);
app.use((req, res) => {
    if (!res.writableEnded) {
        res.json({
            code: 404,
            msg: '接口不存在',
        });
    }
});
app.listen(appPort, 'localhost', () => {
    logger.info('应用启动成功localhost:' + appPort);
});
process.on('uncaughtException', reason => {
    logError(reason);
});
// process.on('SIGINT', () => {
//   app.
// });

export { app as default };

import express, { Router } from 'express';
import winston from 'winston';
import bf from 'node:buffer';
import nodeFetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const appPort = 3000;

const logger = winston.createLogger({
    format: winston.format.timestamp({
        format: 'YYYY-MM-DD hh:mm:ss'
    }),
    transports: [
    // new winston.transports.File({ filename: "./logs/error.log", level: "error" }),
    // new winston.transports.File({ filename: "./logs/combined.log" }),
    ],
});
const logError = (err) => {
    if (err instanceof Error && err.stack) {
        logger.error(err.stack);
    }
    else {
        logger.error(JSON.stringify(err));
    }
};
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        format: winston.format.printf(info => {
            return `[${info.level} ${info.timestamp}] ${info.message}`;
        }),
    }));
}

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

var CrawlerError;
(function (CrawlerError) {
    CrawlerError[CrawlerError["NoError"] = 0] = "NoError";
    CrawlerError[CrawlerError["OpenCasSystemErr"] = 1] = "OpenCasSystemErr";
    CrawlerError[CrawlerError["GetCasSysCaptchaErr"] = 2] = "GetCasSysCaptchaErr";
    CrawlerError[CrawlerError["CasSysUnstable"] = 3] = "CasSysUnstable";
    CrawlerError[CrawlerError["AccPsdCpaMismatch"] = 4] = "AccPsdCpaMismatch";
    CrawlerError[CrawlerError["UnexpectedErr"] = 5] = "UnexpectedErr";
})(CrawlerError || (CrawlerError = {}));

const filterInvalidText = (str) => {
    const result = str.match(/\w+=[-\w]+/g);
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
    const resContentType = res.headers.get("content-type");
    let jsonResult = null;
    if (resContentType === null || resContentType === void 0 ? void 0 : resContentType.includes("json")) {
        jsonResult = yield res.json();
    }
    let textResult = null;
    if (resContentType === null || resContentType === void 0 ? void 0 : resContentType.includes("text")) {
        textResult = yield res.text();
    }
    let dataUrlResult = null;
    if (resContentType === null || resContentType === void 0 ? void 0 : resContentType.includes("image")) {
        const buffer = yield res.arrayBuffer();
        const mimeType = resContentType.match(/image\/\w+/);
        if (mimeType === null || mimeType === void 0 ? void 0 : mimeType.length) {
            dataUrlResult = `data:${mimeType[0]};base64,` + bf.Buffer.from(buffer).toString("base64");
        }
    }
    const cookie = res.headers.get("set-cookie");
    let cookieText = "";
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
        cookie: cookieText
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

const security={};

(function($w) {

if(typeof $w.RSAUtils === 'undefined')
	var RSAUtils = $w.RSAUtils = {};
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

var BigInt = $w.BigInt = function(flag) {
	if (typeof flag == "boolean" && flag == true) {
		this.digits = null;
	} else {
		this.digits = ZERO_ARRAY.slice(0);
	}
	this.isNeg = false;
};

RSAUtils.setMaxDigits = function(value) {
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

RSAUtils.biFromNumber = function(i) {
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

RSAUtils.biFromDecimal = function(s) {
	var isNeg = s.charAt(0) == '-';
	var i = isNeg ? 1 : 0;
	var result;
	// Skip leading zeros.
	while (i < s.length && s.charAt(i) == '0') ++i;
	if (i == s.length) {
		result = new BigInt();
	}
	else {
		var digitCount = s.length - i;
		var fgl = digitCount % dpl10;
		if (fgl == 0) fgl = dpl10;
		result = RSAUtils.biFromNumber(Number(s.substr(i, fgl)));
		i += fgl;
		while (i < s.length) {
			result = RSAUtils.biAdd(RSAUtils.biMultiply(result, lr10),
					RSAUtils.biFromNumber(Number(s.substr(i, dpl10))));
			i += dpl10;
		}
		result.isNeg = isNeg;
	}
	return result;
};

RSAUtils.biCopy = function(bi) {
	var result = new BigInt(true);
	result.digits = bi.digits.slice(0);
	result.isNeg = bi.isNeg;
	return result;
};

RSAUtils.reverseStr = function(s) {
	var result = "";
	for (var i = s.length - 1; i > -1; --i) {
		result += s.charAt(i);
	}
	return result;
};

var hexatrigesimalToChar = [
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
	'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
	'u', 'v', 'w', 'x', 'y', 'z'
];

RSAUtils.biToString = function(x, radix) { // 2 <= radix <= 36
	var b = new BigInt();
	b.digits[0] = radix;
	var qr = RSAUtils.biDivideModulo(x, b);
	var result = hexatrigesimalToChar[qr[1].digits[0]];
	while (RSAUtils.biCompare(qr[0], bigZero) == 1) {
		qr = RSAUtils.biDivideModulo(qr[0], b);
		digit = qr[1].digits[0];
		result += hexatrigesimalToChar[qr[1].digits[0]];
	}
	return (x.isNeg ? "-" : "") + RSAUtils.reverseStr(result);
};

RSAUtils.biToDecimal = function(x) {
	var b = new BigInt();
	b.digits[0] = 10;
	var qr = RSAUtils.biDivideModulo(x, b);
	var result = String(qr[1].digits[0]);
	while (RSAUtils.biCompare(qr[0], bigZero) == 1) {
		qr = RSAUtils.biDivideModulo(qr[0], b);
		result += String(qr[1].digits[0]);
	}
	return (x.isNeg ? "-" : "") + RSAUtils.reverseStr(result);
};

var hexToChar = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'b', 'c', 'd', 'e', 'f'];

RSAUtils.digitToHex = function(n) {
	var mask = 0xf;
	var result = "";
	for (var i = 0; i < 4; ++i) {
		result += hexToChar[n & mask];
		n >>>= 4;
	}
	return RSAUtils.reverseStr(result);
};

RSAUtils.biToHex = function(x) {
	var result = "";
	RSAUtils.biHighIndex(x);
	for (var i = RSAUtils.biHighIndex(x); i > -1; --i) {
		result += RSAUtils.digitToHex(x.digits[i]);
	}
	return result;
};

RSAUtils.charToHex = function(c) {
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

RSAUtils.hexToDigit = function(s) {
	var result = 0;
	var sl = Math.min(s.length, 4);
	for (var i = 0; i < sl; ++i) {
		result <<= 4;
		result |= RSAUtils.charToHex(s.charCodeAt(i));
	}
	return result;
};

RSAUtils.biFromHex = function(s) {
	var result = new BigInt();
	var sl = s.length;
	for (var i = sl, j = 0; i > 0; i -= 4, ++j) {
		result.digits[j] = RSAUtils.hexToDigit(s.substr(Math.max(i - 4, 0), Math.min(i, 4)));
	}
	return result;
};

RSAUtils.biFromString = function(s, radix) {
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

RSAUtils.biDump = function(b) {
	return (b.isNeg ? "-" : "") + b.digits.join(" ");
};

RSAUtils.biAdd = function(x, y) {
	var result;

	if (x.isNeg != y.isNeg) {
		y.isNeg = !y.isNeg;
		result = RSAUtils.biSubtract(x, y);
		y.isNeg = !y.isNeg;
	}
	else {
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

RSAUtils.biSubtract = function(x, y) {
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

RSAUtils.biHighIndex = function(x) {
	var result = x.digits.length - 1;
	while (result > 0 && x.digits[result] == 0) --result;
	return result;
};

RSAUtils.biNumBits = function(x) {
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

RSAUtils.biMultiply = function(x, y) {
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

RSAUtils.biMultiplyDigit = function(x, y) {
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

RSAUtils.arrayCopy = function(src, srcStart, dest, destStart, n) {
	var m = Math.min(srcStart + n, src.length);
	for (var i = srcStart, j = destStart; i < m; ++i, ++j) {
		dest[j] = src[i];
	}
};

var highBitMasks = [0x0000, 0x8000, 0xC000, 0xE000, 0xF000, 0xF800,
        0xFC00, 0xFE00, 0xFF00, 0xFF80, 0xFFC0, 0xFFE0,
        0xFFF0, 0xFFF8, 0xFFFC, 0xFFFE, 0xFFFF];

RSAUtils.biShiftLeft = function(x, n) {
	var digitCount = Math.floor(n / bitsPerDigit);
	var result = new BigInt();
	RSAUtils.arrayCopy(x.digits, 0, result.digits, digitCount,
	          result.digits.length - digitCount);
	var bits = n % bitsPerDigit;
	var rightBits = bitsPerDigit - bits;
	for (var i = result.digits.length - 1, i1 = i - 1; i > 0; --i, --i1) {
		result.digits[i] = ((result.digits[i] << bits) & maxDigitVal) |
		                   ((result.digits[i1] & highBitMasks[bits]) >>>
		                    (rightBits));
	}
	result.digits[0] = ((result.digits[i] << bits) & maxDigitVal);
	result.isNeg = x.isNeg;
	return result;
};

var lowBitMasks = [0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F,
        0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF,
        0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF];

RSAUtils.biShiftRight = function(x, n) {
	var digitCount = Math.floor(n / bitsPerDigit);
	var result = new BigInt();
	RSAUtils.arrayCopy(x.digits, digitCount, result.digits, 0,
	          x.digits.length - digitCount);
	var bits = n % bitsPerDigit;
	var leftBits = bitsPerDigit - bits;
	for (var i = 0, i1 = i + 1; i < result.digits.length - 1; ++i, ++i1) {
		result.digits[i] = (result.digits[i] >>> bits) |
		                   ((result.digits[i1] & lowBitMasks[bits]) << leftBits);
	}
	result.digits[result.digits.length - 1] >>>= bits;
	result.isNeg = x.isNeg;
	return result;
};

RSAUtils.biMultiplyByRadixPower = function(x, n) {
	var result = new BigInt();
	RSAUtils.arrayCopy(x.digits, 0, result.digits, n, result.digits.length - n);
	return result;
};

RSAUtils.biDivideByRadixPower = function(x, n) {
	var result = new BigInt();
	RSAUtils.arrayCopy(x.digits, n, result.digits, 0, result.digits.length - n);
	return result;
};

RSAUtils.biModuloByRadixPower = function(x, n) {
	var result = new BigInt();
	RSAUtils.arrayCopy(x.digits, 0, result.digits, 0, n);
	return result;
};

RSAUtils.biCompare = function(x, y) {
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

RSAUtils.biDivideModulo = function(x, y) {
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
    var ri = (i >= r.digits.length) ? 0 : r.digits[i];
    var ri1 = (i - 1 >= r.digits.length) ? 0 : r.digits[i - 1];
    var ri2 = (i - 2 >= r.digits.length) ? 0 : r.digits[i - 2];
    var yt = (t >= y.digits.length) ? 0 : y.digits[t];
    var yt1 = (t - 1 >= y.digits.length) ? 0 : y.digits[t - 1];
		if (ri == yt) {
			q.digits[i - t - 1] = maxDigitVal;
		} else {
			q.digits[i - t - 1] = Math.floor((ri * biRadix + ri1) / yt);
		}

		var c1 = q.digits[i - t - 1] * ((yt * biRadix) + yt1);
		var c2 = (ri * biRadixSquared) + ((ri1 * biRadix) + ri2);
		while (c1 > c2) {
			--q.digits[i - t - 1];
			c1 = q.digits[i - t - 1] * ((yt * biRadix) | yt1);
			c2 = (ri * biRadix * biRadix) + ((ri1 * biRadix) + ri2);
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

RSAUtils.biDivide = function(x, y) {
	return RSAUtils.biDivideModulo(x, y)[0];
};

RSAUtils.biModulo = function(x, y) {
	return RSAUtils.biDivideModulo(x, y)[1];
};

RSAUtils.biMultiplyMod = function(x, y, m) {
	return RSAUtils.biModulo(RSAUtils.biMultiply(x, y), m);
};

RSAUtils.biPow = function(x, y) {
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

RSAUtils.biPowMod = function(x, y, m) {
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


$w.BarrettMu = function(m) {
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

var RSAKeyPair = function(encryptionExponent, decryptionExponent, modulus) {
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

RSAUtils.getKeyPair = function(encryptionExponent, decryptionExponent, modulus) {
	return new RSAKeyPair(encryptionExponent, decryptionExponent, modulus);
};

if(typeof $w.twoDigit === 'undefined') {
	$w.twoDigit = function(n) {
		return (n < 10 ? "0" : "") + String(n);
	};
}

// Altered by Rob Saunders (rob@robsaunders.net). New routine pads the
// string after it has been converted to an array. This fixes an
// incompatibility with Flash MX's ActionScript.
RSAUtils.encryptedString = function(key, s) {
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
	var result = "";
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
		result += text + " ";
	}
	return result.substring(0, result.length - 1); // Remove last space.
};

RSAUtils.decryptedString = function(key, s) {
	var blocks = s.split(" ");
	var result = "";
	var i, j, block;
	for (i = 0; i < blocks.length; ++i) {
		var bi;
		if (key.radix == 16) {
			bi = RSAUtils.biFromHex(blocks[i]);
		}
		else {
			bi = RSAUtils.biFromString(blocks[i], key.radix);
		}
		block = key.barrett.powMod(bi, key.d);
		for (j = 0; j <= RSAUtils.biHighIndex(block); ++j) {
			result += String.fromCharCode(block.digits[j] & 255,
			                              block.digits[j] >> 8);
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

const securityJs=security.RSAUtils;

// module.exports.securityJs=security.RSAUtils;

const casUrl = "//cas.swust.edu.cn/authserver/login?service=http%3A%2F%2Fsoa.swust.edu.cn%2F";
class CasLogin {
    constructor() {
        this.errorCode = CrawlerError.NoError;
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
            this.errorCode = CrawlerError.OpenCasSystemErr;
            this.errorMsg = `尝试判断cas系统协议失败`;
            throw new Error(this.errorMsg);
        });
    }
    initSession() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield fetch(this.url);
            if (res.status === 200 && res.cookie) {
                this.session = res.cookie;
                return;
            }
            this.errorCode = CrawlerError.OpenCasSystemErr;
            this.errorMsg = `响应状态码${res.status}，cookie为${res.cookie}`;
            throw new Error(this.errorMsg);
        });
    }
    loadCaptcha() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield fetch(this.httpProtocol + '//cas.swust.edu.cn/authserver/captcha', {
                headers: {
                    cookie: this.session
                }
            });
            if (res.dataUrlResult && !res.cookie && res.status < 300 && res.status > 199) {
                this.captcha = res.dataUrlResult;
                return;
            }
            this.errorCode = CrawlerError.OpenCasSystemErr;
            this.errorMsg = `响应状态码${res.status}，cookie为${res.cookie}`;
            throw new Error(this.errorMsg);
        });
    }
    loadRSAPublicKey() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield fetch(this.httpProtocol + '//cas.swust.edu.cn/authserver/getKey', {
                headers: {
                    cookie: this.session
                }
            });
            if (!res.jsonResult || res.status > 299 || res.status < 200) {
                this.errorCode = CrawlerError.OpenCasSystemErr;
                this.errorMsg = '预期获得ras参数，实际为空';
            }
            if (res.cookie) {
                this.errorCode = CrawlerError.OpenCasSystemErr;
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
                    "content-type": "application/x-www-form-urlencoded"
                },
                body: `execution=e1s1&_eventId=submit&geolocation=` +
                    `&username=${acc}&lm=usernameLogin&password=${encryptedPsd}&captcha=${captcha}`
            });
            if (res.cookie.includes('TGC')) {
                this.tgcCookie = res.cookie;
                return;
            }
            if (!((_a = res.textResult) === null || _a === void 0 ? void 0 : _a.includes('pwdError')) || (res.status > 299 && res.status < 309)) {
                this.errorCode = CrawlerError.CasSysUnstable;
                this.errorMsg = `session可能已失效，响应状态码${res.status}，页面内容为${res.textResult}`;
                throw new Error(this.errorMsg);
            }
            if (res.status === 401) {
                this.errorCode = CrawlerError.AccPsdCpaMismatch;
                console.log(res.textResult);
                if (res.textResult.includes('密码错误')) {
                    this.errorMsg = '用户名或密码错误';
                }
                else {
                    this.errorMsg = '验证码错误';
                }
                throw new Error(this.errorMsg);
            }
            this.errorCode = CrawlerError.UnexpectedErr;
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
                casHttpProtocol: crawler.httpProtocol
            }
        });
    }
    catch (error) {
        logError(error);
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg
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
                tgcCookie: crawler.tgcCookie
            }
        });
    }
    catch (error) {
        logError(error);
        res.json({
            code: crawler.errorCode,
            msg: crawler.errorMsg,
            data: {
                tgcCookie: crawler.tgcCookie
            }
        });
    }
}));

const swustRouter = Router();
swustRouter.use(loginCasRouter);
swustRouter.use((req, res) => {
    if (!res.writableEnded) {
        res.json({
            code: -1,
            msg: "抓取出错，请联系开发者"
        });
        logger.error(`${req.method} ${req.path}接口失败`);
    }
});

const servicesRouter = Router();
servicesRouter.use('/swust', swustRouter);

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-method', '*');
    res.setHeader('access-control-headers', '*');
    next();
});
app.use('/api', servicesRouter);
app.use((req, res) => {
    if (!res.writableEnded) {
        res.json({
            code: 404,
            msg: '接口不存在'
        });
    }
});
app.listen(appPort, 'localhost', () => {
    logger.info('应用启动成功localhost:' + appPort);
});
process.on('uncaughtException', (reason) => {
    logError(reason);
});

export { app as default };

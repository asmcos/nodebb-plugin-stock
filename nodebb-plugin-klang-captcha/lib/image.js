'use strict';

const zlib = require('zlib');

const GLYPHS = {
	0: [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
	1: [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
	2: [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
	3: [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
	4: [0b10001, 0b10001, 0b10001, 0b11111, 0b00001, 0b00001, 0b00001],
	5: [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
	6: [0b00111, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
	7: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
	8: [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
	9: [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b11100],
};

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n += 1) {
		let c = n;
		for (let k = 0; k < 8; k += 1) {
			c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
		}
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(buf) {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i += 1) {
		c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	}
	return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length, 0);
	const name = Buffer.from(type);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
	return Buffer.concat([length, name, data, crc]);
}

function renderPng(code, randomInt) {
	const rand = randomInt || ((max) => Math.floor(Math.random() * max));
	const scale = 4;
	const glyphW = 5 * scale;
	const gap = 14;
	const width = 168;
	const height = 64;
	const pixels = Buffer.alloc(width * height * 3);
	for (let i = 0; i < pixels.length; i += 3) {
		pixels[i] = 255;
		pixels[i + 1] = 241;
		pixels[i + 2] = 242;
	}

	function set(x, y, r, g, b) {
		const px = x | 0;
		const py = y | 0;
		if (px < 0 || py < 0 || px >= width || py >= height) {
			return;
		}
		const offset = (py * width + px) * 3;
		pixels[offset] = r;
		pixels[offset + 1] = g;
		pixels[offset + 2] = b;
	}

	for (let n = 0; n < 48; n += 1) {
		set(rand(width), rand(height), 210, 170, 174);
	}

	const textWidth = code.length * glyphW + (code.length - 1) * gap;
	let cursor = Math.max(8, Math.floor((width - textWidth) / 2));
	for (let d = 0; d < code.length; d += 1) {
		const glyph = GLYPHS[code[d]];
		const ox = cursor + rand(5) - 2;
		const oy = 14 + rand(8);
		cursor += glyphW + gap;
		for (let row = 0; row < 7; row += 1) {
			for (let col = 0; col < 5; col += 1) {
				if ((glyph[row] >> (4 - col)) & 1) {
					for (let sy = 0; sy < scale; sy += 1) {
						for (let sx = 0; sx < scale; sx += 1) {
							set(ox + col * scale + sx, oy + row * scale + sy, 24, 24, 27);
						}
					}
				}
			}
		}
	}

	const raw = Buffer.alloc(height * (width * 3 + 1));
	for (let y = 0; y < height; y += 1) {
		const start = y * (width * 3 + 1);
		raw[start] = 0;
		pixels.copy(raw, start + 1, y * width * 3, (y + 1) * width * 3);
	}

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 2;
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	return Buffer.concat([
		signature,
		chunk('IHDR', ihdr),
		chunk('IDAT', zlib.deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

module.exports = { renderPng, GLYPHS };

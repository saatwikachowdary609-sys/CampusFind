import zlib
import struct
import os

def load_png(filename):
    with open(filename, 'rb') as f:
        data = f.read()
    
    pos = 8
    width, height = 0, 0
    idat = b''
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        chunk_type = data[pos+4:pos+8]
        chunk_data = data[pos+8:pos+8+length]
        if chunk_type == b'IHDR':
            width, height = struct.unpack('>II', chunk_data[:8])
        elif chunk_type == b'IDAT':
            idat += chunk_data
        pos += 8 + length + 4

    raw = zlib.decompress(idat)
    stride = 1 + width * 4
    pixels = [] # list of [r, g, b, a] for each row
    for y in range(height):
        row = raw[y*stride+1 : (y+1)*stride]
        row_pixels = []
        for x in range(width):
            r, g, b, a = row[x*4 : x*4+4]
            row_pixels.append([r, g, b, a])
        pixels.append(row_pixels)
    return width, height, pixels

def save_png(filename, width, height, pixels):
    raw_bytes = bytearray()
    for y in range(height):
        raw_bytes.append(0) # None filter
        for x in range(width):
            r, g, b, a = pixels[y][x]
            raw_bytes.extend([r, g, b, a])
    
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = struct.pack('>I', len(ihdr)) + b'IHDR' + ihdr + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr) & 0xffffffff)
    
    idat = zlib.compress(bytes(raw_bytes), 9)
    idat_chunk = struct.pack('>I', len(idat)) + b'IDAT' + idat + struct.pack('>I', zlib.crc32(b'IDAT' + idat) & 0xffffffff)
    
    iend = b'\x00\x00\x00\x00IEND\xaeB`\x82'
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(ihdr_chunk)
        f.write(idat_chunk)
        f.write(iend)

def main():
    w, h, src = load_png('/tmp/sahe-white-logo.png')
    print(f'Loaded logo: {w}x{h}')

    # Target blue for Siddhartha typography: Royal Blue #0022C8
    BLUE_R, BLUE_G, BLUE_B = 0, 34, 200

    out = []
    for y in range(h):
        row = []
        for x in range(w):
            r, g, b, a = src[y][x]
            if x < 77:
                # Left side: Official hand & lotus emblem
                # Blend onto pure white
                alpha = a / 255.0
                out_r = int(r * alpha + 255 * (1 - alpha))
                out_g = int(g * alpha + 255 * (1 - alpha))
                out_b = int(b * alpha + 255 * (1 - alpha))
                row.append([out_r, out_g, out_b, 255])
            else:
                # Right side: Text
                # Check if this pixel is part of divider line (y == 40 or 41) between x=80 and x=292
                if (y == 40 or y == 41) and (80 <= x <= 292):
                    row.append([BLUE_R, BLUE_G, BLUE_B, 255])
                else:
                    # Antialiased text pixel: recolor to royal blue
                    alpha = a / 255.0
                    out_r = int(BLUE_R * alpha + 255 * (1 - alpha))
                    out_g = int(BLUE_G * alpha + 255 * (1 - alpha))
                    out_b = int(BLUE_B * alpha + 255 * (1 - alpha))
                    row.append([out_r, out_g, out_b, 255])
        out.append(row)

    # 2x Bilinear Upscale to make it high definition (600x172)
    SCALE = 2
    new_w = w * SCALE
    new_h = h * SCALE
    upscaled = []

    for y2 in range(new_h):
        row2 = []
        src_y = y2 / SCALE
        y0 = int(src_y)
        y1 = min(y0 + 1, h - 1)
        fy = src_y - y0

        for x2 in range(new_w):
            src_x = x2 / SCALE
            x0 = int(src_x)
            x1 = min(x0 + 1, w - 1)
            fx = src_x - x0

            p00 = out[y0][x0]
            p10 = out[y0][x1]
            p01 = out[y1][x0]
            p11 = out[y1][x1]

            pixel = []
            for c in range(4):
                top = p00[c] * (1 - fx) + p10[c] * fx
                bot = p01[c] * (1 - fx) + p11[c] * fx
                val = int(top * (1 - fy) + bot * fy)
                pixel.append(min(255, max(0, val)))
            row2.append(pixel)
        upscaled.append(row2)

    target_paths = [
        '/app/applet/public/assets/siddhartha_logo.png',
        '/app/applet/src/assets/siddhartha_logo.png',
    ]
    for p in target_paths:
        save_png(p, new_w, new_h, upscaled)
        print(f'Saved {p}: {new_w}x{new_h}, size {os.path.getsize(p)} bytes')

if __name__ == '__main__':
    main()

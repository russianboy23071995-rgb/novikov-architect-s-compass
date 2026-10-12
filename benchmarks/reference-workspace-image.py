"""Generate deterministic RGB noise PNG for workspace acceptance; no external dependencies."""
import random
import struct
import sys
import zlib
from pathlib import Path
size = 1550
rng = random.Random(253)
raw = b"".join(b"\0" + rng.randbytes(size * 3) for _ in range(size))
def chunk(kind, body):
    return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body) & 0xffffffff)
png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
Path(sys.argv[1]).write_bytes(png)

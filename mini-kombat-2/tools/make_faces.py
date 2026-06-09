from pathlib import Path
from collections import deque

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "akypchan.png"
SENSEI_SRC = ROOT / "assets" / "fighter-3-original.png"
PINO_SRC = ROOT / "assets" / "fighter-4-original.png"


def is_checker_pixel(pixel):
    r, g, b, _ = pixel
    return max(r, g, b) - min(r, g, b) <= 12 and min(r, g, b) >= 184


def is_bright_checker_pixel(pixel):
    r, g, b, _ = pixel
    average = (r + g + b) / 3
    return max(r, g, b) - min(r, g, b) <= 24 and average >= 150


def remove_checker_background(image):
    width, height = image.size
    pixels = image.load()
    background = Image.new("L", image.size, 0)
    bg_pixels = background.load()
    queue = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        if bg_pixels[x, y] or not is_checker_pixel(pixels[x, y]):
            continue

        bg_pixels[x, y] = 255
        queue.append((x + 1, y))
        queue.append((x - 1, y))
        queue.append((x, y + 1))
        queue.append((x, y - 1))

    alpha = Image.eval(background.filter(ImageFilter.GaussianBlur(1.2)), lambda v: 255 - v)
    cleaned = image.copy()
    cleaned.putalpha(alpha)
    return cleaned


def remove_bright_checker_background(image):
    width, height = image.size
    pixels = image.load()
    background = Image.new("L", image.size, 0)
    bg_pixels = background.load()
    queue = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        if bg_pixels[x, y] or not is_bright_checker_pixel(pixels[x, y]):
            continue

        bg_pixels[x, y] = 255
        queue.append((x + 1, y))
        queue.append((x - 1, y))
        queue.append((x, y + 1))
        queue.append((x, y - 1))

    background = background.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MinFilter(15))
    alpha = Image.eval(background.filter(ImageFilter.GaussianBlur(1.4)), lambda v: 255 - v)
    cleaned = image.copy()
    cleaned.putalpha(alpha)
    return cleaned


def make_face(name, box, output_size, brightness=1.02, contrast=1.04):
    image = Image.open(SRC).convert("RGBA")
    face = remove_checker_background(image.crop(box))
    face = ImageEnhance.Brightness(face).enhance(brightness)
    face = ImageEnhance.Contrast(face).enhance(contrast)
    face.thumbnail((output_size, output_size), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (output_size, output_size), (0, 0, 0, 0))
    x = (output_size - face.width) // 2
    y = (output_size - face.height) // 2
    canvas.alpha_composite(face, (x, y))
    canvas.save(ROOT / "assets" / name)


def make_sensei_face():
    image = Image.open(SENSEI_SRC).convert("RGBA")
    face = remove_bright_checker_background(image.crop((475, 70, 1605, 1725)))
    face = ImageEnhance.Brightness(face).enhance(1.03)
    face = ImageEnhance.Contrast(face).enhance(1.05)
    face.thumbnail((520, 520), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (520, 520), (0, 0, 0, 0))
    x = (520 - face.width) // 2
    y = (520 - face.height) // 2
    canvas.alpha_composite(face, (x, y))
    canvas.save(ROOT / "assets" / "fighter-3-face.png")


def make_pino_face():
    image = Image.open(PINO_SRC).convert("RGBA")
    face = remove_bright_checker_background(image.crop((205, 70, 800, 945)))
    face = ImageEnhance.Brightness(face).enhance(1.04)
    face = ImageEnhance.Contrast(face).enhance(1.04)
    face.thumbnail((520, 520), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (520, 520), (0, 0, 0, 0))
    x = (520 - face.width) // 2
    y = (520 - face.height) // 2
    canvas.alpha_composite(face, (x, y))
    canvas.save(ROOT / "assets" / "fighter-4-face.png")


make_face("fighter-1-face.png", (65, 90, 1118, 1658), 520)
make_face("fighter-2-face.png", (1330, 112, 2195, 1720), 520, brightness=1.04)
if SENSEI_SRC.exists():
    make_sensei_face()
if PINO_SRC.exists():
    make_pino_face()

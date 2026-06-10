from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "apps" / "mobile"
NAVY = "#002853"
NAVY_DARK = "#00172F"
GOLD = "#F0D980"
WHITE = "#FFFFFF"
FONT_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")
FONT_REGULAR = Path("C:/Windows/Fonts/segoeui.ttf")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def centered_text(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    text_font: ImageFont.FreeTypeFont,
    fill: str,
) -> None:
    bounds = draw.textbbox((0, 0), text, font=text_font)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    x = box[0] + (box[2] - box[0] - width) / 2
    y = box[1] + (box[3] - box[1] - height) / 2 - bounds[1]
    draw.text((x, y), text, font=text_font, fill=fill)


def draw_mark(image: Image.Image, scale: float = 0.58, with_name: bool = False) -> None:
    draw = ImageDraw.Draw(image)
    width, height = image.size
    size = int(min(width, height) * scale)
    cx, cy = width // 2, height // 2
    if with_name:
        cy -= int(size * 0.10)

    left = cx - size // 2
    top = cy - size // 2
    right = cx + size // 2
    bottom = cy + size // 2
    stroke = max(5, int(size * 0.045))

    shield = [
        (cx, top),
        (right, top + int(size * 0.16)),
        (right - int(size * 0.08), bottom - int(size * 0.25)),
        (cx, bottom),
        (left + int(size * 0.08), bottom - int(size * 0.25)),
        (left, top + int(size * 0.16)),
    ]
    draw.polygon(shield, fill=NAVY_DARK, outline=GOLD, width=stroke)
    inner = int(size * 0.10)
    draw.rounded_rectangle(
        (left + inner, top + inner, right - inner, bottom - inner),
        radius=int(size * 0.08),
        outline=GOLD,
        width=max(3, stroke // 2),
    )
    centered_text(
        draw,
        (left, top - int(size * 0.01), right, bottom - int(size * 0.02)),
        "CUB",
        font(FONT_BOLD, int(size * 0.25)),
        WHITE,
    )

    if with_name:
        label_top = bottom + int(size * 0.10)
        centered_text(
            draw,
            (0, label_top, width, label_top + int(size * 0.18)),
            "CAMEROON UNION BANK",
            font(FONT_BOLD, max(13, int(size * 0.055))),
            GOLD,
        )


def save_icon(path: Path, size: tuple[int, int], transparent: bool, scale: float) -> None:
    background = (0, 0, 0, 0) if transparent else NAVY
    image = Image.new("RGBA", size, background)
    draw_mark(image, scale=scale)
    image.save(path)


def main() -> None:
    assets = MOBILE / "assets"
    save_icon(assets / "icon.png", (1024, 1024), transparent=False, scale=0.62)
    save_icon(assets / "adaptive-icon.png", (1024, 1024), transparent=True, scale=0.48)
    save_icon(assets / "favicon.png", (64, 64), transparent=False, scale=0.72)

    splash = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_mark(splash, scale=0.50, with_name=True)
    splash.save(assets / "splash-icon.png")

    res = MOBILE / "android" / "app" / "src" / "main" / "res"
    splash_sizes = {
        "drawable-mdpi": 288,
        "drawable-hdpi": 432,
        "drawable-xhdpi": 576,
        "drawable-xxhdpi": 864,
        "drawable-xxxhdpi": 1152,
    }
    for folder, size in splash_sizes.items():
        image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw_mark(image, scale=0.46, with_name=True)
        image.save(res / folder / "splashscreen_logo.png")

    launcher_sizes = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }
    for folder, (icon_size, foreground_size) in launcher_sizes.items():
        for filename in ("ic_launcher.webp", "ic_launcher_round.webp"):
            image = Image.new("RGBA", (icon_size, icon_size), NAVY)
            draw_mark(image, scale=0.68)
            image.save(res / folder / filename, "WEBP", lossless=True)

        foreground = Image.new("RGBA", (foreground_size, foreground_size), (0, 0, 0, 0))
        draw_mark(foreground, scale=0.43)
        foreground.save(
            res / folder / "ic_launcher_foreground.webp",
            "WEBP",
            lossless=True,
        )


if __name__ == "__main__":
    main()

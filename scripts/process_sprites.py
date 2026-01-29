#!/usr/bin/env python3
"""
Sprite Processing Script for Project Meepo

This script processes PNG images for use as game sprites:
1. Removes backgrounds (makes them transparent)
2. Trims transparent space around the sprite
3. Optionally resizes to a target size

Usage:
    python scripts/process_sprites.py <input_path> [--output <output_path>] [--size <width>x<height>]
    python scripts/process_sprites.py assets/sprites/toad/toad.png --output assets/sprites/toad/toad_processed.png
    python scripts/process_sprites.py assets/sprites/ --batch  # Process all PNGs in directory

Requirements:
    pip install Pillow
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


def remove_background(image: Image.Image, threshold: int = 240) -> Image.Image:
    """
    Remove white/light background from an image.

    Args:
        image: PIL Image to process
        threshold: Pixels with all RGB values above this become transparent (0-255)

    Returns:
        Image with transparent background
    """
    # Convert to RGBA if not already
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    # Get pixel data
    pixels = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # If pixel is very light (close to white), make it transparent
            if r > threshold and g > threshold and b > threshold:
                pixels[x, y] = (r, g, b, 0)

    return image


def remove_background_by_corner(image: Image.Image, tolerance: int = 30) -> Image.Image:
    """
    Remove background by sampling the corner color and removing similar colors.
    This works better for non-white backgrounds.

    Args:
        image: PIL Image to process
        tolerance: How different a pixel can be from the corner and still be removed

    Returns:
        Image with transparent background
    """
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    pixels = image.load()
    width, height = image.size

    # Sample corner pixel (top-left)
    corner_r, corner_g, corner_b, _ = pixels[0, 0]

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Check if pixel is similar to corner color
            if (abs(r - corner_r) < tolerance and
                abs(g - corner_g) < tolerance and
                abs(b - corner_b) < tolerance):
                pixels[x, y] = (r, g, b, 0)

    return image


def trim_transparent(image: Image.Image, padding: int = 0) -> Image.Image:
    """
    Trim transparent pixels from around the sprite.

    Args:
        image: PIL Image with transparency
        padding: Extra pixels to keep around the sprite

    Returns:
        Cropped image with minimal transparent border
    """
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    # Get the bounding box of non-transparent pixels
    bbox = image.getbbox()

    if bbox is None:
        # Image is fully transparent
        return image

    # Add padding
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)

    return image.crop((left, top, right, bottom))


def resize_sprite(image: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    """
    Resize sprite while maintaining aspect ratio.

    Args:
        image: PIL Image to resize
        target_size: (width, height) tuple

    Returns:
        Resized image fitting within target_size
    """
    # Use LANCZOS for high-quality downsampling
    image.thumbnail(target_size, Image.Resampling.LANCZOS)
    return image


def process_sprite(
    input_path: Path,
    output_path: Path | None = None,
    remove_bg: bool = True,
    bg_method: str = 'white',
    threshold: int = 240,
    tolerance: int = 30,
    trim: bool = True,
    padding: int = 2,
    resize: tuple[int, int] | None = None
) -> Path:
    """
    Process a sprite image with all transformations.

    Args:
        input_path: Path to input PNG
        output_path: Path for output (default: input_processed.png)
        remove_bg: Whether to remove background
        bg_method: 'white' for white backgrounds, 'corner' for colored backgrounds
        threshold: Threshold for white background removal
        tolerance: Tolerance for corner-based background removal
        trim: Whether to trim transparent space
        padding: Padding to keep when trimming
        resize: Optional (width, height) to resize to

    Returns:
        Path to processed image
    """
    # Load image
    image = Image.open(input_path)
    original_size = image.size
    print(f"Processing: {input_path} ({original_size[0]}x{original_size[1]})")

    # Remove background
    if remove_bg:
        if bg_method == 'white':
            image = remove_background(image, threshold)
            print(f"  - Removed white background (threshold={threshold})")
        else:
            image = remove_background_by_corner(image, tolerance)
            print(f"  - Removed background by corner color (tolerance={tolerance})")

    # Trim transparent space
    if trim:
        old_size = image.size
        image = trim_transparent(image, padding)
        new_size = image.size
        print(f"  - Trimmed: {old_size[0]}x{old_size[1]} -> {new_size[0]}x{new_size[1]}")

    # Resize if requested
    if resize:
        image = resize_sprite(image, resize)
        print(f"  - Resized to fit within: {resize[0]}x{resize[1]}")

    # Determine output path
    if output_path is None:
        stem = input_path.stem
        output_path = input_path.parent / f"{stem}_processed.png"

    # Save
    image.save(output_path, 'PNG')
    print(f"  - Saved: {output_path} ({image.size[0]}x{image.size[1]})")

    return output_path


def process_directory(
    directory: Path,
    output_dir: Path | None = None,
    **kwargs
) -> list[Path]:
    """
    Process all PNG files in a directory.

    Args:
        directory: Directory containing PNG files
        output_dir: Output directory (default: same as input)
        **kwargs: Arguments passed to process_sprite

    Returns:
        List of output paths
    """
    outputs = []
    png_files = list(directory.glob('**/*.png'))

    if not png_files:
        print(f"No PNG files found in {directory}")
        return outputs

    print(f"Found {len(png_files)} PNG files to process")

    for png_path in png_files:
        # Skip already processed files
        if '_processed' in png_path.stem:
            continue

        # Determine output path
        if output_dir:
            relative = png_path.relative_to(directory)
            out_path = output_dir / relative.parent / f"{png_path.stem}_processed.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
        else:
            out_path = None

        try:
            result = process_sprite(png_path, out_path, **kwargs)
            outputs.append(result)
        except Exception as e:
            print(f"  Error processing {png_path}: {e}")

    return outputs


def main():
    parser = argparse.ArgumentParser(
        description='Process sprite images for Project Meepo',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process single image with white background removal
  python process_sprites.py toad.png

  # Process with corner-based background removal (for colored backgrounds)
  python process_sprites.py toad.png --bg-method corner --tolerance 50

  # Process and resize to fit within 128x128
  python process_sprites.py toad.png --size 128x128

  # Process all PNGs in a directory
  python process_sprites.py assets/sprites/ --batch

  # Process without background removal (just trim)
  python process_sprites.py toad.png --no-remove-bg
        """
    )

    parser.add_argument('input', type=Path, help='Input PNG file or directory')
    parser.add_argument('--output', '-o', type=Path, help='Output path')
    parser.add_argument('--batch', action='store_true', help='Process all PNGs in directory')
    parser.add_argument('--no-remove-bg', action='store_true', help='Skip background removal')
    parser.add_argument('--bg-method', choices=['white', 'corner'], default='white',
                        help='Background removal method (default: white)')
    parser.add_argument('--threshold', type=int, default=240,
                        help='Threshold for white background removal (0-255, default: 240)')
    parser.add_argument('--tolerance', type=int, default=30,
                        help='Tolerance for corner background removal (default: 30)')
    parser.add_argument('--no-trim', action='store_true', help='Skip trimming transparent space')
    parser.add_argument('--padding', type=int, default=2,
                        help='Padding to keep when trimming (default: 2)')
    parser.add_argument('--size', type=str, help='Resize to fit within WIDTHxHEIGHT (e.g., 128x128)')

    args = parser.parse_args()

    # Parse size argument
    resize = None
    if args.size:
        try:
            w, h = args.size.lower().split('x')
            resize = (int(w), int(h))
        except ValueError:
            print(f"Error: Invalid size format '{args.size}'. Use WIDTHxHEIGHT (e.g., 128x128)")
            sys.exit(1)

    # Common arguments
    kwargs = {
        'remove_bg': not args.no_remove_bg,
        'bg_method': args.bg_method,
        'threshold': args.threshold,
        'tolerance': args.tolerance,
        'trim': not args.no_trim,
        'padding': args.padding,
        'resize': resize,
    }

    if args.batch or args.input.is_dir():
        if not args.input.is_dir():
            print(f"Error: {args.input} is not a directory")
            sys.exit(1)
        outputs = process_directory(args.input, args.output, **kwargs)
        print(f"\nProcessed {len(outputs)} files")
    else:
        if not args.input.exists():
            print(f"Error: {args.input} does not exist")
            sys.exit(1)
        process_sprite(args.input, args.output, **kwargs)


if __name__ == '__main__':
    main()

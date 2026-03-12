from PIL import Image
import os

def generate_icons(source_path, res_dir):
    try:
        if not os.path.exists(source_path):
            print(f"Error: Source image not found at {source_path}")
            return

        img = Image.open(source_path)
        
        # Densities and their scaling factors relative to mdpi (1.0)
        # mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192
        densities = {
            "mipmap-mdpi": (48, 108),
            "mipmap-hdpi": (72, 162),
            "mipmap-xhdpi": (96, 216),
            "mipmap-xxhdpi": (144, 324),
            "mipmap-xxxhdpi": (192, 432)
        }

        for folder, (legacy_size, adaptive_size) in densities.items():
            target_folder = os.path.join(res_dir, folder)
            if not os.path.exists(target_folder):
                os.makedirs(target_folder)
            
            # 1. Legacy and Round Icons
            res_img = img.resize((legacy_size, legacy_size), Image.Resampling.LANCZOS)
            res_img.save(os.path.join(target_folder, "ic_launcher.png"))
            res_img.save(os.path.join(target_folder, "ic_launcher_round.png"))
            print(f"Generated legacy icons in {folder} ({legacy_size}x{legacy_size})")

            # 2. Adaptive Foreground Icon
            # Usually 108x108 dp. We use the full image as foreground since it has its own background.
            adapt_img = img.resize((adaptive_size, adaptive_size), Image.Resampling.LANCZOS)
            adapt_img.save(os.path.join(target_folder, "ic_launcher_foreground.png"))
            print(f"Generated adaptive foreground in {folder} ({adaptive_size}x{adaptive_size})")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    source = r"c:\Users\pablo\Documents\appgynsys\frontend\assets\icon.png"
    res = r"c:\Users\pablo\Documents\appgynsys\frontend\android\app\src\main\res"
    generate_icons(source, res)

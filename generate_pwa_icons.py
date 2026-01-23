from PIL import Image
import os

def generate_icons(source_path, output_dir):
    try:
        if not os.path.exists(source_path):
            print(f"Error: Source image not found at {source_path}")
            return

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        img = Image.open(source_path)
        
        # Define sizes
        sizes = {
            "pwa-192x192.png": (192, 192),
            "pwa-512x512.png": (512, 512),
            "apple-touch-icon.png": (180, 180),  # Standard apple touch icon
            "favicon.ico": (64, 64) # Just in case
        }

        for name, size in sizes.items():
            # Resize with Lanczos resampling for quality
            resized_img = img.resize(size, Image.Resampling.LANCZOS)
            output_path = os.path.join(output_dir, name)
            resized_img.save(output_path)
            print(f"Generated {name} at {output_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    source_image = r"C:/Users/pablo/.gemini/antigravity/brain/e9a1dbde-7fc4-426e-a511-b1a33b258607/uploaded_image_1766598195009.png"
    output_directory = r"c:/Users/pablo/Documents/appgynsys/frontend/public"
    generate_icons(source_image, output_directory)

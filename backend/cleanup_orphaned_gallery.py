#!/usr/bin/env python3
"""
Cleanup script to remove orphaned gallery image records
(records that reference files that don't exist on the file system)
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from app.db.base import SessionLocal
from app.db.models.gallery import GalleryImage
from app.core.config import settings

UPLOAD_DIR = Path(settings.UPLOAD_DIR).resolve()

def main():
    db = SessionLocal()
    
    try:
        # Get all gallery images
        all_gallery_images = db.query(GalleryImage).all()
        
        print(f'Total gallery images in database: {len(all_gallery_images)}')
        print()
        
        orphaned_images = []
        valid_images = []
        
        for img in all_gallery_images:
            # Convert URL to file path
            # URL format: /uploads/gallery/filename.jpg
            if img.image_url:
                # Remove leading /uploads/ to get relative path from UPLOAD_DIR
                relative_path = img.image_url.lstrip('/uploads/')
                file_path = UPLOAD_DIR / relative_path
                
                if not file_path.exists():
                    orphaned_images.append(img)
                    print(f'ORPHANED: ID {img.id}, Doctor {img.doctor_id}')
                    print(f'  URL: {img.image_url}')
                    print(f'  Expected path: {file_path}')
                    print(f'  File exists: NO')
                    print()
                else:
                    valid_images.append(img)
            else:
                orphaned_images.append(img)
                print(f'ORPHANED: ID {img.id}, Doctor {img.doctor_id}')
                print(f'  No image URL')
                print()
        
        print(f'Valid images: {len(valid_images)}')
        print(f'Orphaned images: {len(orphaned_images)}')
        print()
        
        if orphaned_images:
            response = input(f'Delete {len(orphaned_images)} orphaned records? (yes/no): ')
            if response.lower() == 'yes':
                for img in orphaned_images:
                    db.delete(img)
                db.commit()
                print(f'Successfully deleted {len(orphaned_images)} orphaned gallery records')
            else:
                print('Cleanup cancelled')
        else:
            print('No orphaned images found - database is clean!')
            
    except Exception as e:
        print(f'Error: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Check dataset structure and count images
"""

import os
from pathlib import Path

DATA_DIR = "../data"

def count_images(folder):
    """Count image files in a folder"""
    if not os.path.exists(folder):
        return 0
    
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
    count = 0
    for f in os.listdir(folder):
        if Path(f).suffix.lower() in image_extensions:
            count += 1
    return count

def check_dataset():
    """Check and report dataset status"""
    print("=" * 50)
    print("📁 Bird Classifier Dataset Check")
    print("=" * 50)
    
    splits = ['train', 'val', 'test']
    classes = ['myna', 'crows']
    
    total_images = 0
    
    for split in splits:
        print(f"\n📂 {split.upper()}/")
        split_total = 0
        
        for cls in classes:
            path = os.path.join(DATA_DIR, split, cls)
            count = count_images(path)
            split_total += count
            status = "✅" if count > 0 else "❌"
            print(f"  {status} {cls:10s}: {count:3d} images")
        
        print(f"     {'─'*25}")
        print(f"     Total:    {split_total:3d} images")
        total_images += split_total
    
    print("\n" + "=" * 50)
    print(f"📊 Total dataset size: {total_images} images")
    print("=" * 50)
    
    # Recommendations
    train_count = sum(count_images(os.path.join(DATA_DIR, 'train', cls)) for cls in classes)
    
    if train_count == 0:
        print("\n⚠️  WARNING: No training images found!")
        print("   Add images to data/train/myna/ and data/train/crows/")
    elif train_count < 50:
        print("\n⚠️  NOTE: Small dataset (<50 training images)")
        print("   For better results, aim for 100+ images per class")
    else:
        print("\n✅ Dataset looks good! Ready to train.")

if __name__ == "__main__":
    check_dataset()

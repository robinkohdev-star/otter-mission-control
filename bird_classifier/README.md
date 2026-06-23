# 🐦 Bird Classifier: Myna vs Crow

A PyTorch-based image classifier to distinguish between Myna birds and Crows using transfer learning with ResNet50.

## Folder Structure

```
bird_classifier/
├── data/
│   ├── train/
│   │   ├── myna/          ← Put training myna images here
│   │   └── crows/         ← Put training crow images here
│   ├── val/
│   │   ├── myna/          ← Put validation myna images here
│   │   └── crows/         ← Put validation crow images here
│   └── test/
│       ├── myna/          ← Put test myna images here
│       └── crows/         ← Put test crow images here
├── models/                ← Trained models saved here
├── scripts/
│   ├── train.py          ← Training script
│   └── predict.py        ← Prediction script
└── requirements.txt
```

## Setup

### 1. Install Dependencies

```bash
cd bird_classifier
pip install -r requirements.txt
```

### 2. Add Your Images

Put your images in the appropriate folders:
- **Training**: At least 50-100 images per class (more is better)
- **Validation**: 20-30 images per class
- **Test**: 10-20 images per class

> 💡 **Tip**: Images can be any format (jpg, png, etc.). The script handles all standard formats.

### 3. Train the Model

```bash
cd scripts
python train.py
```

Optional arguments:
```bash
python train.py --epochs 30 --lr 0.0005 --batch-size 16
```

Training outputs:
- `models/best_model.pth` - Best model based on validation accuracy
- `models/final_model.pth` - Model from final epoch
- `models/training_history.json` - Training metrics

### 4. Make Predictions

```bash
python predict.py /path/to/image.jpg
```

Example output:
```
🐦 Prediction: MYNA
📊 Confidence: 94.2%

All probabilities:
  myna      :  94.2% ███████████████████
  crows     :   5.8% █
```

## Expected Results

With ~100+ images per class, you should see:
- **Training accuracy**: 90-99%
- **Validation accuracy**: 85-95%

If validation accuracy is much lower than training accuracy, you may need more training data or data augmentation.

## Tips for Better Results

1. **Image variety**: Use photos from different angles, lighting, distances
2. **Balanced dataset**: Similar number of images for each class
3. **Clear subjects**: Images where the bird is clearly visible
4. **No other birds**: Try to avoid images with both myna and crow in same shot
5. **Background variety**: Different backgrounds help generalization

## GPU Acceleration

The script automatically uses GPU if available. Check with:
```python
import torch
print(torch.cuda.is_available())
```

## Troubleshooting

**"No images found"**
→ Check that images are in the correct subfolders (data/train/myna/, data/train/crows/)

**"CUDA out of memory"**
→ Reduce batch size: `python train.py --batch-size 8`

**Low accuracy**
→ Add more training images or increase epochs: `python train.py --epochs 50`

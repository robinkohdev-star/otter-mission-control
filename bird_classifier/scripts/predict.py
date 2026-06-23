#!/usr/bin/env python3
"""
Bird Classifier Prediction Script
Predict if an image is Myna or Crow
"""

import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from torchvision.models import ResNet50_Weights
from PIL import Image
import argparse

MODEL_PATH = "../models/best_model.pth"
IMAGE_SIZE = 224

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def load_model(model_path):
    """Load the trained model"""
    checkpoint = torch.load(model_path, map_location=device)
    classes = checkpoint['classes']
    
    # Recreate model architecture
    model = models.resnet50(weights=ResNet50_Weights.DEFAULT)
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(num_features, len(classes))
    )
    
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    
    return model, classes

def predict_image(image_path, model, classes):
    """Predict single image"""
    image = Image.open(image_path).convert('RGB')
    image_tensor = transform(image).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
    
    predicted_class = classes[predicted.item()]
    confidence_pct = confidence.item() * 100
    
    # Get all class probabilities
    all_probs = {cls: prob.item() * 100 for cls, prob in zip(classes, probabilities[0])}
    
    return predicted_class, confidence_pct, all_probs

def main():
    parser = argparse.ArgumentParser(description='Predict bird class from image')
    parser.add_argument('image', help='Path to image file')
    parser.add_argument('--model', default=MODEL_PATH, help='Path to model file')
    args = parser.parse_args()
    
    if not os.path.exists(args.model):
        print(f"Error: Model not found at {args.model}")
        print("Please train the model first using train.py")
        return
    
    if not os.path.exists(args.image):
        print(f"Error: Image not found at {args.image}")
        return
    
    print("Loading model...")
    model, classes = load_model(args.model)
    
    print(f"\nAnalyzing: {args.image}")
    print("-" * 40)
    
    predicted_class, confidence, all_probs = predict_image(args.image, model, classes)
    
    print(f"\n🐦 Prediction: {predicted_class.upper()}")
    print(f"📊 Confidence: {confidence:.1f}%")
    print(f"\nAll probabilities:")
    for cls, prob in sorted(all_probs.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * int(prob / 5)
        print(f"  {cls:10s}: {prob:5.1f}% {bar}")

if __name__ == "__main__":
    main()

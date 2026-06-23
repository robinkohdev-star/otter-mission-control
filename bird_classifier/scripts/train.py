#!/usr/bin/env python3
"""
Bird Classifier Training Script
Detects Myna vs Crows using transfer learning with ResNet50
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from torchvision.models import ResNet50_Weights
import json
from datetime import datetime
import argparse

# Configuration
DATA_DIR = "../data"
MODELS_DIR = "../models"
BATCH_SIZE = 32
EPOCHS = 20
LEARNING_RATE = 0.001
IMAGE_SIZE = 224

# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Data transforms with augmentation for training
train_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def load_data():
    """Load training and validation datasets"""
    train_dataset = datasets.ImageFolder(
        os.path.join(DATA_DIR, 'train'),
        transform=train_transforms
    )
    
    val_dataset = datasets.ImageFolder(
        os.path.join(DATA_DIR, 'val'),
        transform=val_transforms
    )
    
    train_loader = DataLoader(
        train_dataset, 
        batch_size=BATCH_SIZE, 
        shuffle=True, 
        num_workers=2
    )
    
    val_loader = DataLoader(
        val_dataset, 
        batch_size=BATCH_SIZE, 
        shuffle=False, 
        num_workers=2
    )
    
    print(f"Classes: {train_dataset.classes}")
    print(f"Training samples: {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")
    
    return train_loader, val_loader, train_dataset.classes

def create_model(num_classes):
    """Create ResNet50 model with custom classifier"""
    # Load pre-trained ResNet50
    model = models.resnet50(weights=ResNet50_Weights.DEFAULT)
    
    # Freeze early layers (optional - speeds up training)
    for param in list(model.parameters())[:-20]:
        param.requires_grad = False
    
    # Replace final layer for our classes
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(num_features, num_classes)
    )
    
    return model.to(device)

def train_epoch(model, loader, criterion, optimizer):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for inputs, labels in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(loader), 100. * correct / total

def validate(model, loader, criterion):
    """Validate the model"""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(loader), 100. * correct / total

def train(args):
    """Main training loop"""
    # Load data
    train_loader, val_loader, classes = load_data()
    
    # Create model
    model = create_model(len(classes))
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', patience=3, factor=0.5
    )
    
    # Training history
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': [],
        'epochs': []
    }
    
    best_acc = 0.0
    
    print("\n" + "="*50)
    print("Starting Training")
    print("="*50)
    
    for epoch in range(EPOCHS):
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = validate(model, val_loader, criterion)
        
        scheduler.step(val_acc)
        
        # Save history
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        history['epochs'].append(epoch + 1)
        
        print(f"Epoch {epoch+1:2d}/{EPOCHS} | "
              f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")
        
        # Save best model
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'classes': classes,
                'accuracy': val_acc,
            }, os.path.join(MODELS_DIR, 'best_model.pth'))
            print(f"  ✓ Saved best model (Val Acc: {val_acc:.2f}%)")
    
    # Save final model
    torch.save({
        'model_state_dict': model.state_dict(),
        'classes': classes,
        'history': history
    }, os.path.join(MODELS_DIR, 'final_model.pth'))
    
    # Save training history
    with open(os.path.join(MODELS_DIR, 'training_history.json'), 'w') as f:
        json.dump(history, f, indent=2)
    
    print("\n" + "="*50)
    print(f"Training Complete! Best Val Accuracy: {best_acc:.2f}%")
    print(f"Models saved to: {MODELS_DIR}")
    print("="*50)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train bird classifier')
    parser.add_argument('--epochs', type=int, default=EPOCHS, help='Number of epochs')
    parser.add_argument('--lr', type=float, default=LEARNING_RATE, help='Learning rate')
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE, help='Batch size')
    args = parser.parse_args()
    
    EPOCHS = args.epochs
    LEARNING_RATE = args.lr
    BATCH_SIZE = args.batch_size
    
    train(args)

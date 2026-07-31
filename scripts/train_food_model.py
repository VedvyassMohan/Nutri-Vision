"""
train_food_model.py
-------------------
Trains a real Indian food image classifier using MobileNetV2 transfer learning
on the 2,400 image dataset. Exports to TF.js format for use in the browser.

Usage:
  python scripts/train_food_model.py
"""

import os
import sys
import json
import numpy as np

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DATASET_DIR  = r"C:\Users\Vedvyass M\Music\Nutri-vision\FINAL FOOD DATASET\Indian Food Images\Indian Food Images"
OUTPUT_DIR   = r"C:\Users\Vedvyass M\Music\Nutri-vision\public\food_model"
CLASS_MAP_OUT = r"C:\Users\Vedvyass M\Music\Nutri-vision\src\data\foodModelClasses.json"

IMAGE_SIZE   = (224, 224)
BATCH_SIZE   = 16
EPOCHS_HEAD  = 10   # Phase 1: train only the classification head
EPOCHS_FINE  = 5    # Phase 2: fine-tune last 30 layers of MobileNetV2

# ─── CREATE OUTPUT DIR ────────────────────────────────────────────────────────
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=" * 60)
print("  NUTRI-VISION INDIAN FOOD CLASSIFIER TRAINING")
print("=" * 60)
print(f"Dataset: {DATASET_DIR}")
print(f"Output:  {OUTPUT_DIR}")
print()

# ─── DATA GENERATORS ─────────────────────────────────────────────────────────
train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.15,
    rotation_range=25,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.8, 1.2],
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.15
)

print("Loading training images...")
train_gen = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True,
    seed=42
)

print("Loading validation images...")
val_gen = val_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False,
    seed=42
)

num_classes = len(train_gen.class_indices)
print(f"\nFound {num_classes} food categories")
print(f"Training samples : {train_gen.samples}")
print(f"Validation samples: {val_gen.samples}")
print()

# ─── SAVE CLASS INDEX MAP ─────────────────────────────────────────────────────
# Map index -> class folder name
idx_to_class = {str(v): k for k, v in train_gen.class_indices.items()}
with open(CLASS_MAP_OUT, 'w') as f:
    json.dump(idx_to_class, f, indent=2)
print(f"Saved class map to {CLASS_MAP_OUT}")

# ─── BUILD MODEL ──────────────────────────────────────────────────────────────
print("\nBuilding MobileNetV2 transfer learning model...")

base_model = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(*IMAGE_SIZE, 3)
)
base_model.trainable = False  # Freeze base for phase 1

inputs  = keras.Input(shape=(*IMAGE_SIZE, 3))
x       = base_model(inputs, training=False)
x       = layers.GlobalAveragePooling2D()(x)
x       = layers.BatchNormalization()(x)
x       = layers.Dense(512, activation='relu')(x)
x       = layers.Dropout(0.4)(x)
x       = layers.Dense(256, activation='relu')(x)
x       = layers.Dropout(0.3)(x)
outputs = layers.Dense(num_classes, activation='softmax')(x)

model = keras.Model(inputs, outputs)

# ─── PHASE 1: TRAIN HEAD ──────────────────────────────────────────────────────
print(f"\n[Phase 1] Training classification head for {EPOCHS_HEAD} epochs...")
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks_p1 = [
    keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True, monitor='val_accuracy'),
    keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2, min_lr=1e-6, monitor='val_loss')
]

history1 = model.fit(
    train_gen,
    epochs=EPOCHS_HEAD,
    validation_data=val_gen,
    callbacks=callbacks_p1,
    verbose=1
)

print(f"\nPhase 1 best val_accuracy: {max(history1.history['val_accuracy']):.3f}")

# ─── PHASE 2: FINE-TUNE ───────────────────────────────────────────────────────
print(f"\n[Phase 2] Fine-tuning last 30 layers for {EPOCHS_FINE} epochs...")
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-5),  # much lower LR
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks_p2 = [
    keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True, monitor='val_accuracy'),
    keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2, min_lr=1e-7, monitor='val_loss')
]

history2 = model.fit(
    train_gen,
    epochs=EPOCHS_FINE,
    validation_data=val_gen,
    callbacks=callbacks_p2,
    verbose=1
)

best_val_acc = max(history2.history['val_accuracy'])
print(f"\nPhase 2 best val_accuracy: {best_val_acc:.3f}")

# ─── SAVE AS KERAS H5 (compatible with all numpy versions) ───────────────────
import pathlib
h5_path = str(pathlib.Path(OUTPUT_DIR).parent / 'food_model.h5')
print(f"\nSaving trained Keras model to H5: {h5_path}")
model.save(h5_path)
print("Model saved successfully!")

# ─── CONVERT TO TF.JS VIA CLI ────────────────────────────────────────────────
print(f"\nConverting to TF.js format via tensorflowjs_converter CLI...")
print(f"Output directory: {OUTPUT_DIR}")

import subprocess
result = subprocess.run(
    ['tensorflowjs_converter', '--input_format', 'keras', h5_path, OUTPUT_DIR],
    capture_output=True, text=True
)
if result.returncode == 0:
    print("TF.js conversion successful!")
else:
    # Fallback: try python -m tensorflowjs.converters.converter
    print(f"CLI failed, trying python module approach...")
    result2 = subprocess.run(
        ['python', '-m', 'tensorflowjs.converters.converter',
         '--input_format', 'keras', h5_path, OUTPUT_DIR],
        capture_output=True, text=True
    )
    if result2.returncode == 0:
        print("TF.js conversion successful via python module!")
    else:
        print(f"Conversion stderr: {result.stderr[:500]}")
        print(f"\nModel saved as H5 at: {h5_path}")
        print("You can manually convert later with:")
        print(f"  tensorflowjs_converter --input_format keras {h5_path} {OUTPUT_DIR}")

print("\n" + "=" * 60)
print(f"  TRAINING COMPLETE!")
print(f"  Final validation accuracy: {best_val_acc:.1%}")
print(f"  Model saved to: {OUTPUT_DIR}")
print(f"  Class map saved to: {CLASS_MAP_OUT}")
print("=" * 60)

# Meme Model Training Playbook — September 2025

Run these commands to export meme images, prep the LoRA dataset, fine-tune SDXL on an OCI GPU, and load the adapter into LM Suite. Paths assume `/Users/Jason/Development/GugoDash`.

---

## 0. Local Prep
- `cd /Users/Jason/Development/GugoDash`
- `mkdir -p data/db_exports data/dataset/raw_cache data/dataset/processed loras`
- `export PROJECT_ROOT=$(pwd)`
- `export DB_URL=$(grep -m1 '^ *DATABASE_URL' .env | sed -E 's/^ *DATABASE_URL="?([^" ]*)"?/\1/')`
- `python3 -m venv .venv-dataset && source .venv-dataset/bin/activate`
- `pip install --upgrade pip pandas==2.2.3 pillow==10.4.0 requests==2.32.3 tqdm==4.66.5`

---

## 1. Export Meme Records
```bash
psql "$DB_URL" --csv -c "SELECT id AS meme_id, filename, path, tags, description AS meme_description, \"uploadedAt\" AS uploaded_at FROM memes ORDER BY \"uploadedAt\";" > data/db_exports/memes.csv
```
- `wc -l data/db_exports/memes.csv`
- `head -n 5 data/db_exports/memes.csv`

---

## 2. Build Dataset (Download, Clean, Resize)
- `mkdir -p scripts/dataset`
- Create helper script:
```bash
cat <<'PY' > scripts/dataset/build_lora_dataset.py
import argparse
from pathlib import Path

import pandas as pd
import requests
from PIL import Image
from tqdm import tqdm

FALLBACK_DIRS = [
    "storage/memes",
    "storage/generated_images",
    "storage/base_images",
]


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True)
    parser.add_argument("--root", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--resolution", type=int, default=1024)
    parser.add_argument("--train_ratio", type=float, default=0.9)
    return parser.parse_args()


def to_path(ref: str, root: Path) -> Path | None:
    if not ref:
        return None
    candidate = Path(ref)
    if candidate.is_absolute() and candidate.exists():
        return candidate
    candidate = (root / ref.lstrip("./")).resolve()
    return candidate if candidate.exists() else None


def resolve_local(path_ref: str, filename: str, root: Path) -> Path | None:
    hit = to_path(path_ref, root)
    if hit:
        return hit
    for folder in FALLBACK_DIRS:
        hit = to_path(f"{folder}/{filename}", root)
        if hit:
            return hit
    return None


def fetch_remote(url: str, cache_dir: Path) -> Path | None:
    target = cache_dir / Path(url).name
    if target.exists():
        return target
    try:
        with requests.get(url, timeout=20, stream=True) as resp:
            resp.raise_for_status()
            with open(target, "wb") as fh:
                for chunk in resp.iter_content(8192):
                    fh.write(chunk)
        return target
    except Exception as exc:
        print(f"FAILED {url}: {exc}")
        return None


def sanitize(text: str | None, limit: int = 280) -> str:
    if not isinstance(text, str):
        return ""
    text = text.replace("\n", " ").replace("\r", " ")
    return " ".join(text.split())[:limit]


def format_tags(raw: str | None) -> str:
    if not isinstance(raw, str):
        return ""
    stripped = raw.strip('{}')
    if not stripped:
        return ""
    tags = [part.strip().strip('"') for part in stripped.split(',') if part.strip()]
    return ", ".join(tags[:6])


def build_caption(row: pd.Series) -> str:
    description = sanitize(row.get("meme_description"))
    tags = format_tags(row.get("tags"))
    parts = []
    if description:
        parts.append(f"Description: {description}")
    if tags:
        parts.append(f"Tags: {tags}")
    return " ".join(parts) or "Meme image"


def main():
    args = parse_args()
    csv_path = Path(args.csv)
    root = Path(args.root)
    out_dir = Path(args.out)
    train_dir = out_dir / "train"
    val_dir = out_dir / "val"
    train_dir.mkdir(parents=True, exist_ok=True)
    val_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = (out_dir / ".." / "raw_cache").resolve()
    cache_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(csv_path, parse_dates=["uploaded_at"], infer_datetime_format=True)
    df = df.sort_values("uploaded_at").reset_index(drop=True)

    split_index = int(len(df) * args.train_ratio)
    stats = {"kept": 0, "skipped": 0}

    for idx, row in tqdm(df.iterrows(), total=len(df), desc="prepare"):
        path_ref = str(row.get("path") or "").strip()
        filename = str(row.get("filename") or "").strip()

        if path_ref.lower().startswith("http"):
            image_path = fetch_remote(path_ref, cache_dir)
        else:
            image_path = resolve_local(path_ref, filename, root)

        if not image_path and filename:
            image_path = resolve_local("", filename, root)

        if not image_path:
            stats["skipped"] += 1
            continue

        try:
            img = Image.open(image_path).convert("RGB")
        except Exception as exc:
            print(f"FAILED to open {image_path}: {exc}")
            stats["skipped"] += 1
            continue

        side = min(img.width, img.height)
        left = (img.width - side) // 2
        top = (img.height - side) // 2
        img = img.crop((left, top, left + side, top + side)).resize((args.resolution, args.resolution), Image.Resampling.LANCZOS)

        caption = build_caption(row)
        subset_dir = train_dir if idx < split_index else val_dir
        stem = str(row.get("meme_id") or filename or f"row{idx}")

        img.save(subset_dir / f"{stem}.png", optimize=True)
        (subset_dir / f"{stem}.txt").write_text(caption + "\n", encoding="utf-8")
        stats["kept"] += 1

    (out_dir / "dataset_stats.txt").write_text(f"kept={stats['kept']}\nskipped={stats['skipped']}\n", encoding="utf-8")
    print(stats)


if __name__ == "__main__":
    main()
PY
```
- `python scripts/dataset/build_lora_dataset.py --csv data/db_exports/memes.csv --root "$PROJECT_ROOT" --out data/dataset/processed`
- `cat data/dataset/processed/dataset_stats.txt`

---

## 3. Package Dataset for Transfer
- `tar -czf data/meme-dataset.tar.gz -C data/dataset processed`
- `ls -lh data/meme-dataset.tar.gz`

---

## 4. Copy Dataset to OCI GPU (scp)
- `export OCI_HOST=ubuntu@YOUR_OCI_PUBLIC_IP`
- `scp -i ~/.ssh/id_rsa data/meme-dataset.tar.gz $OCI_HOST:~/`

---

## 5. Prepare OCI Instance
- `ssh -i ~/.ssh/id_rsa $OCI_HOST`
- `sudo apt update && sudo apt upgrade -y`
- `sudo ubuntu-drivers autoinstall`
- `sudo reboot`
- `sudo apt install -y build-essential git-lfs tmux htop nvtop`
- `git lfs install`
- `curl -fsSL https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -o miniconda.sh`
- `bash miniconda.sh -b -p $HOME/miniconda`
- `echo "source ~/miniconda/etc/profile.d/conda.sh" >> ~/.bashrc`
- `source ~/.bashrc`
- `mkdir -p ~/datasets && tar -xzf ~/meme-dataset.tar.gz -C ~/datasets`

---

## 6. Create Training Environment (OCI)
- `conda create -n meme-lora python=3.11 -y`
- `conda activate meme-lora`
- `pip install --upgrade pip`
- `pip install torch==2.4.1+cu124 torchvision==0.19.1+cu124 torchaudio==2.4.1+cu124 --index-url https://download.pytorch.org/whl/cu124`
- `pip install --force-reinstall torchvision==0.19.1+cu124 --index-url https://download.pytorch.org/whl/cu124`
- `pip install tokenizers==0.20.1 --no-deps`
- `pip install huggingface_hub==0.25.2 --no-deps`
- `pip install transformers==4.45.0 --no-deps`
- `pip install diffusers==0.33.0 --no-deps`
- `pip install accelerate==0.30.1 --no-deps`
- `pip install peft==0.11.1 --no-deps`
- `pip install datasets==3.1.0 --no-deps`
- `pip install bitsandbytes==0.43.1 --no-deps`
- `pip install safetensors==0.4.5 --no-deps`
- `pip install wandb==0.18.1 --no-deps`
- `pip install xformers==0.0.28.post2 --no-deps`
- `pip cache purge  # optional if torch/vision wheels mismatch`
- `accelerate config`
- `huggingface-cli login`

---

## 7. Train SDXL LoRA
- `git clone https://github.com/huggingface/diffusers.git`
- `cd diffusers`
- `pip install -e .`
- `export MODEL_NAME=stabilityai/stable-diffusion-xl-base-1.0`
- `export DATA_ROOT=~/datasets/processed`
- `export OUTPUT_DIR=~/runs/meme-lora-sdxl`
- `export VAL_PROMPT="Description: sarcastic product launch meme Tags: satire, tech"`
- `find examples -name 'train_text_to_image*_sdxl*.py'`
- Launch once you confirm the path (usually `examples/training/sdxl/train_text_to_image_lora_sdxl.py`):
```bash
accelerate launch examples/training/sdxl/train_text_to_image_lora_sdxl.py \
  --pretrained_model_name_or_path "$MODEL_NAME" \
  --train_data_dir "$DATA_ROOT/train" \
  --validation_prompt "$VAL_PROMPT" \
  --resolution 1024 \
  --train_batch_size 1 \
  --gradient_accumulation_steps 8 \
  --rank 16 \
  --scale_lr \
  --learning_rate 1.5e-4 \
  --lr_scheduler cosine \
  --lr_warmup_steps 0 \
  --max_train_steps 6000 \
  --checkpointing_steps 500 \
  --mixed_precision bf16 \
  --enable_xformers_memory_efficient_attention \
  --report_to wandb
```

---

## 8. Evaluate Checkpoints
- `find "$DATA_ROOT/val" -name '*.txt' -exec sed -n '1p' {} \; | head -n 64 > ~/val_prompts.txt`
- `python examples/text_to_image/validation/sdxl_lora_eval.py --model_name "$MODEL_NAME" --lora_path "$OUTPUT_DIR/checkpoint-5000" --prompts_file ~/val_prompts.txt --output_dir "$OUTPUT_DIR/eval"`
- `python examples/text_to_image/metrics/compute_clip.py --images "$OUTPUT_DIR/eval" --prompts ~/val_prompts.txt`

---

## 9. Bring LoRA Home
- `cd "$OUTPUT_DIR"`
- `zip -r meme-lora-sdxl-5000.zip checkpoint-5000`
- Exit OCI shell
- `scp -i ~/.ssh/id_rsa $OCI_HOST:~/runs/meme-lora-sdxl/meme-lora-sdxl-5000.zip ./loras/`

---

## 10. Configure LM Suite
- `mkdir -p ~/LM-Suite/adapters/meme-lora-sdxl-5000`
- `unzip ./loras/meme-lora-sdxl-5000.zip -d ~/LM-Suite/adapters/meme-lora-sdxl-5000`
- Append model entry:
```bash
cat <<'YAML' >> ~/LM-Suite/config/models.yaml
- id: sdxl-meme
  base: stabilityai/stable-diffusion-xl-base-1.0
  device: auto
  precision: fp16
  adapters:
    - path: adapters/meme-lora-sdxl-5000/checkpoint-5000
      type: lora
      weight: 1.0
YAML
```
- `lm-suite restart`
- `lm-suite generate --model sdxl-meme --prompt "Description: last-minute launch meme Tags: chaos, devops"`

---

## 11. Cleanup
- `deactivate`
- `conda deactivate`
- `rm data/meme-dataset.tar.gz`
- `ssh -i ~/.ssh/id_rsa $OCI_HOST 'rm ~/meme-dataset.tar.gz'`
- Archive the LoRA zip and `dataset_stats.txt` for experiment tracking.


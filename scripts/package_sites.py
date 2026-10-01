#!/usr/bin/env python3
"""把两份站点产物打包为可直接上传的 zip。

用法：
    python scripts/package_sites.py

产出（zip 内根即为站点根，解压后可直接丢到 nginx / OSS 根目录）：
    release/ui.codedog.tech.zip       <- dist/build/h5   （品牌官网）
    release/doc.ui.codedog.tech.zip   <- docs-dist       （文档中心）
"""
import os
import sys
import time
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TARGETS = [
    ("dist/build/h5", "ui.codedog.tech.zip", "CodeDogUI 品牌官网"),
    ("docs-dist", "doc.ui.codedog.tech.zip", "CodeDogUI 文档中心"),
]

SKIP_DIRS = {".git", "node_modules", "__pycache__"}
SKIP_FILES = {".DS_Store", "Thumbs.db"}


def human(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.1f} {unit}" if unit != "B" else f"{n} B"
        n /= 1024
    return f"{n:.1f} GB"


def pack(src_rel: str, zip_name: str, label: str) -> tuple:
    src = os.path.join(ROOT, src_rel)
    if not os.path.isdir(src):
        print(f"[跳过] {label}: 源目录不存在 -> {src}")
        print("       先执行 npm run build:h5 / npm run docs:build 生成产物")
        return (None, 0, 0)

    out_dir = os.path.join(ROOT, "release")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, zip_name)
    # 目标存在时先改名挪走，避免直接删除（沙箱对删除敏感）
    if os.path.exists(out):
        os.replace(out, os.path.join(out_dir, f"_{zip_name}.old.{int(time.time())}"))

    count = 0
    total = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for dirpath, dirnames, filenames in os.walk(src):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for name in filenames:
                if name in SKIP_FILES or name.endswith(".map"):
                    continue
                abs_path = os.path.join(dirpath, name)
                arc_name = os.path.relpath(abs_path, src).replace("\\", "/")
                zf.write(abs_path, arc_name)
                count += 1
                total += os.path.getsize(abs_path)

    packed = os.path.getsize(out)
    print(f"[完成] {label}")
    print(f"       源:   {src_rel}/  ({count} 个文件, {human(total)})")
    print(f"       产出: release/{zip_name}  ({human(packed)})")
    return (out, count, packed)


def main() -> int:
    print("=" * 62)
    print("CodeDogUI 站点打包 -> release/")
    print("=" * 62)
    results = [pack(*t) for t in TARGETS]
    ok = [r for r in results if r[0]]
    print("-" * 62)
    if ok:
        print(f"共 {len(ok)} 个站点已打包：")
        for path, count, size in ok:
            print(f"  {path}   ({count} 文件, {human(size)})")
        print("\n部署方式：解压后整体上传到域名根目录即可（index.html 在包内根层）。")
    else:
        print("没有产物被打包，请检查是否已构建。")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
